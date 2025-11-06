// app.js
import { CONFIG } from './config.js';
import { StorageManager } from './storage.js';
import { Utils } from './utils.js';
import { BibleService } from './bible-service.js';
import { EditorManager } from './editor-manager.js';
import { SermonManager } from './sermon-manager.js';
import { UIController } from './ui-controller.js';
import { AIService } from './ai-service.js';
import { ChatManager } from './chat-manager.js';

class App {
    constructor() {
        this.sermonManager = null;
        this.editor = null;
        this.ui = null;
        this.aiService = null;
        this.chatManager = null;
        this.autoSaveTimer = null;
    }

    init() {
        console.log('🚀 Инициализация AI Ассистента Проповедника...');

        if (!StorageManager.isAvailable()) {
            alert('localStorage недоступен! Приложение не сможет сохранять данные.');
            return;
        }

        const savedData = StorageManager.load();
        this.sermonManager = new SermonManager(savedData);
        this.aiService = new AIService();
        this.chatManager = new ChatManager(this.sermonManager);
        this.ui = new UIController(this.sermonManager, this.aiService, this.chatManager);

        // Инициализация редактора с коллбэком в BibleService
        this.editor = new EditorManager('editor', {
            onChange: () => this.ui.handleEditorChange(),
            onBibleClick: () => BibleService.showModal()
        });

        // Передаём редактор в контроллеры
        this.ui.setEditor(this.editor);
        this.aiService.setEditor(this.editor);
        this.chatManager.setEditor(this.editor);

        // Обработчики кнопок
        document.getElementById('btn-new-sermon')?.addEventListener('click', () => this.ui.createNewSermon());
        document.getElementById('btn-first-sermon')?.addEventListener('click', () => this.ui.createNewSermon());
        document.getElementById('btn-export-json')?.addEventListener('click', () => StorageManager.exportToJSON(this.sermonManager.getData()));
        document.getElementById('import-file')?.addEventListener('change', (e) => this.ui.handleImport(e));

        // Обработчики модального окна Библии
        document.getElementById('bible-reference')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                BibleService.handleInsert(this.editor, this.sermonManager.bookMap);
            }
        });
        document.getElementById('bible-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'bible-modal') BibleService.hideModal();
        });

        // Загрузка пользовательских промптов
        this.ui.loadCustomPrompts();

        // Отображение интерфейса
        if (this.sermonManager.sermons.length === 0) {
            this.ui.showWelcomeScreen();
        } else {
            this.ui.loadSermon(this.sermonManager.sermons[0].id);
        }

        // Автосохранение
        if (this.sermonManager.settings.auto_save) {
            this.autoSaveTimer = setInterval(() => {
                StorageManager.save(this.sermonManager.getData());
            }, CONFIG.STORAGE.AUTO_SAVE_INTERVAL);
        }

        console.log('✅ Приложение готово к работе.');
    }

    destroy() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        StorageManager.save(this.sermonManager.getData());
    }
}

// Запуск приложения
const app = new App();
window.addEventListener('DOMContentLoaded', () => app.init());
window.addEventListener('beforeunload', () => app.destroy());