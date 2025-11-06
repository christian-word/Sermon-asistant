// ui-controller.js

import { Utils } from './utils.js';

export class UIController {
    constructor(sermonManager, aiService, chatManager) {
        this.sermonManager = sermonManager;
        this.aiService = aiService;
        this.chatManager = chatManager;
        this.editor = null;
        this.customPrompts = [];
        this.currentSermonId = null;
    }

    setEditor(editor) {
        this.editor = editor;
    }

    loadCustomPrompts() {
        const saved = localStorage.getItem('customPrompts');
        this.customPrompts = saved ? JSON.parse(saved) : [];
    }

    saveCustomPrompts() {
        localStorage.setItem('customPrompts', JSON.stringify(this.customPrompts));
    }

    showWelcomeScreen() {
        document.getElementById('welcome-screen').classList.remove('hidden');
        document.getElementById('sermon-workspace').classList.add('hidden');
        document.getElementById('sermon-actions').classList.add('hidden');
        document.getElementById('main-subtitle').textContent = 'Выберите проповедь или создайте новую';
    }

    showSermonWorkspace() {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('sermon-workspace').classList.remove('hidden');
        document.getElementById('sermon-actions').classList.remove('hidden');
    }

    renderSermonsList() {
        const list = document.getElementById('sermons-list');
        if (!list) return;
        list.innerHTML = this.sermonManager.sermons.length === 0
            ? '<p class="text-gray-500 text-xs text-center py-6">Нет проповедей</p>'
            : this.sermonManager.sermons.map(s => {
                const statusText = Utils.getStatusText(s.metadata.status);
                const dateText = Utils.formatDisplayDate(s.metadata.date_created);
                return `
                <div class="sermon-item p-2 mb-1.5 rounded-md border border-gray-200 ${s.id === this.currentSermonId ? 'active' : ''}"
                     data-id="${s.id}" onclick="App.loadSermon('${s.id}')">
                    <div class="flex items-start justify-between mb-0.5">
                        <h4 class="font-semibold text-gray-800 text-xs flex-1">${Utils.escapeHtml(s.metadata.title)}</h4>
                        <span class="status-badge status-${s.metadata.status} ml-1.5">${statusText}</span>
                    </div>
                    <p class="text-xs text-gray-600 mb-0.5">${Utils.escapeHtml(s.metadata.passage || 'Без отрывка')}</p>
                    <p class="text-xs text-gray-500">${dateText}</p>
                </div>`;
            }).join('');
    }

    loadSermon(id) {
        this.currentSermonId = id;
        const s = this.sermonManager.getSermon(id);
        if (!s) return;

        this.showSermonWorkspace();
        this.fillForm(s);
        this.editor.setHTML(s.preparation.main_idea || '');
        this.renderNotes(s.metadata.notes || '');

        // Очистка старых пользовательских вкладок
        document.querySelectorAll('[id^="ai-tab-custom_"]').forEach(t => t.remove());
        document.querySelectorAll('[id^="ai-content-custom_"]').forEach(p => p.remove());

        // Стандартные секции
        this.displayPreparationSection('exegesis', s.preparation.exegesis);
        this.displayPreparationSection('illustration', s.preparation.illustrations);
        this.displayPreparationSection('structure', s.preparation.structure);

        // Пользовательские промпты и чаты — будут добавлены через chatManager и aiService
        this.rebuildTabs(s);

        // Активная вкладка
        const lastTab = s.metadata.lastActiveTab || 'exegesis';
        if (s.preparation[lastTab]?.content || lastTab.startsWith('chat_')) {
            this.switchAITab(lastTab);
        }

        document.querySelectorAll('.sermon-item').forEach(i => 
            i.classList.toggle('active', i.dataset.id === id)
        );
    }

    fillForm(sermon) {
        const { metadata } = sermon;
        const el = {
            title: document.getElementById('sermon-title'),
            date: document.getElementById('sermon-date'),
            status: document.getElementById('sermon-status'),
            duration: document.getElementById('sermon-duration'),
            passage: document.getElementById('passage'),
            audience: document.getElementById('audience'),
            subtitle: document.getElementById('main-subtitle')
        };
        el.subtitle.textContent = metadata.passage || 'Укажите отрывок';
        el.title.value = metadata.title || '';
        el.date.value = Utils.formatInputDate(metadata.date_preached) || '';
        el.status.value = metadata.status || 'draft';
        el.duration.value = metadata.duration_planned || 30;
        el.passage.value = metadata.passage || '';
        el.audience.value = metadata.audience || 'общая аудитория';
    }

    renderNotes(text) {
        document.getElementById('sermon-notes').value = text;
    }

    rebuildTabs(sermon) {
        // Восстановление чатов
        Object.keys(sermon.preparation)
            .filter(k => k.startsWith('chat_'))
            .forEach(chatId => {
                const chat = sermon.preparation[chatId];
                if (chat?.type === 'chat') {
                    this.chatManager.addChatTab(chatId, chat.name);
                    this.chatManager.renderMessages(chatId);
                }
            });

        // Восстановление пользовательских промптов
        (sermon.metadata.customTabOrder || []).forEach(promptId => {
            const prompt = this.customPrompts.find(p => p.id === promptId);
            if (prompt && sermon.preparation[`custom_${promptId}`]?.content) {
                this.aiService.addCustomPromptTab(promptId, prompt.name);
            }
        });
    }

    displayPreparationSection(type, data) {
        let contentId;
        if (['exegesis', 'illustration', 'structure'].includes(type)) {
            contentId = `${type}-content`;
        } else {
            contentId = `${type}-content`;
        }
        const cont = document.getElementById(contentId);
        if (!cont) return;

        if (!data || !data.content) {
            cont.innerHTML = '<p class="text-gray-500 italic">Нет данных. Нажмите соответствующую кнопку для генерации.</p>';
            return;
        }

        cont.innerHTML = Utils.formatMarkdown(data.content);
        this.showPreparationSections();
    }

    showPreparationSections() {
        const hasContent = this.sermonManager.sermons.some(s =>
            s.preparation.exegesis?.content ||
            s.preparation.illustrations?.content ||
            s.preparation.structure?.content ||
            Object.keys(s.preparation).some(k => k.startsWith('custom_') && s.preparation[k]?.content)
        );
        if (hasContent) {
            document.getElementById('preparation-sections').classList.remove('hidden');
        }
    }

    switchAITab(tab) {
        document.querySelectorAll('.ai-tab').forEach(t => {
            t.classList.remove('ai-tab-active');
            t.classList.add('text-gray-600');
        });
        const activeTab = document.getElementById(`ai-tab-${tab}`);
        if (activeTab) {
            activeTab.classList.add('ai-tab-active');
            activeTab.classList.remove('text-gray-600');
        }
        document.querySelectorAll('.ai-content-panel').forEach(p => p.classList.remove('active'));
        const activePanel = document.getElementById(`ai-content-${tab}`);
        if (activePanel) {
            activePanel.classList.add('active');
        }
        // Сохранить активную вкладку
        if (this.currentSermonId) {
            const sermon = this.sermonManager.getSermon(this.currentSermonId);
            if (sermon) sermon.metadata.lastActiveTab = tab;
        }
    }

    handleEditorChange() {
        if (this.currentSermonId) {
            this.sermonManager.updateMainIdea(this.currentSermonId, this.editor.getHTML());
        }
    }

    validateTitle(input) {
        const error = document.getElementById('sermon-title-error');
        if (input.value.trim().length < 3) {
            input.setAttribute('aria-invalid', 'true');
            error.textContent = 'Минимум 3 символа';
            error.classList.remove('hidden');
            return false;
        }
        input.setAttribute('aria-invalid', 'false');
        error.classList.add('hidden');
        return true;
    }

    validatePassage(input, bookMap) {
        return this.aiService.validatePassage(input, bookMap);
    }

    validateEditor() {
        const text = this.editor?.getText() || '';
        const error = document.getElementById('editor-error');
        if (text.length < 10) {
            error.textContent = 'Минимум 10 символов';
            error.classList.remove('hidden');
            return false;
        }
        error.classList.add('hidden');
        return true;
    }

    displayError(msg) {
        const el = document.getElementById('error-message');
        el.textContent = 'Ошибка: ' + msg;
        el.classList.remove('hidden');
    }

    setLoading(flag) {
        document.querySelectorAll('.btn-assist').forEach(b => b.disabled = flag);
        document.getElementById('loading-indicator').classList.toggle('hidden', !flag);
        document.getElementById('error-message').classList.add('hidden');
    }
}