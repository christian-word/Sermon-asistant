// js/app.js
const App = {
    sermons: null,
    currentSermonId: null,
    autoSaveTimer: null,
    quill: null,

    // Инициализация
    async init() {
        console.log('Инициализация App...');
        if (!StorageManager.isAvailable()) {
            alert('localStorage недоступен!');
            return;
        }

        this.sermons = await StorageManager.load();
        await UIManager.renderSermonsList();
        UIManager.showWelcomeScreen();

        if (this.sermons.settings.auto_save) {
            this.startAutoSave();
        }

        await Editor.init();
        await BibleModal.init();
        await HelpModal.init();

        console.log('App инициализирован');
    },

    startAutoSave() {
        if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
        this.autoSaveTimer = setInterval(() => {
            StorageManager.save(this.sermons);
        }, CONFIG.STORAGE.AUTO_SAVE_INTERVAL);
    },

    // === Проповеди ===
    createNewSermon() {
        const sermon = SermonFactory.create();
        this.sermons.sermons.unshift(sermon);
        this.currentSermonId = sermon.id;
        StorageManager.save(this.sermons);
        UIManager.renderSermonsList();
        this.loadSermon(sermon.id);
    },

    loadSermon(id) {
        this.currentSermonId = id;
        const sermon = this.sermons.sermons.find(s => s.id === id);
        if (!sermon) return;

        UIManager.showSermonWorkspace();
        SermonForm.populate(sermon);
        Editor.setContent(sermon.preparation.main_idea);
        AIAssistant.displaySections(sermon.preparation);
        UIManager.highlightActiveSermon(id);
    },

    updateSermonMetadata() {
        if (!this.currentSermonId) return;
        const sermon = this.sermons.sermons.find(s => s.id === this.currentSermonId);
        if (!sermon) return;

        const isValid = SermonForm.validate();
        if (!isValid) return;

        Object.assign(sermon.metadata, SermonForm.getValues());
        sermon.preparation.main_idea = Editor.getHTML();
        sermon.metadata.date_modified = Utils.getCurrentISODate();

        StorageManager.save(this.sermons);
        UIManager.renderSermonsList();
        UIManager.updateSubtitle(sermon.metadata.passage);
    },

    saveCurrentSermon() {
        this.updateSermonMetadata();
        UIManager.flashSaveButton();
    },

    deleteCurrentSermon() {
        if (!this.currentSermonId || !confirm('Удалить проповедь?')) return;

        this.sermons.sermons = this.sermons.sermons.filter(s => s.id !== this.currentSermonId);
        this.currentSermonId = null;
        StorageManager.save(this.sermons);
        UIManager.renderSermonsList();

        if (this.sermons.sermons.length === 0) {
            UIManager.showWelcomeScreen();
        } else {
            this.loadSermon(this.sermons.sermons[0].id);
        }
    },

    // === Экспорт ===
    exportToJSON() {
        ExportManager.toJSON(this.sermons);
    },

    importFromJSON(event) {
        ExportManager.fromJSON(event).then(imported => {
            if (confirm('Импортировать? Текущие данные будут заменены.')) {
                this.sermons = imported;
                StorageManager.save(this.sermons);
                UIManager.renderSermonsList();
                if (this.sermons.sermons.length) {
                    this.loadSermon(this.sermons.sermons[0].id);
                }
                alert('Импорт успешен');
            }
        }).catch(err => {
            alert('Ошибка импорта: ' + err.message);
        });
    },

    exportToDocx() {
        ExportManager.toDocx(this.currentSermonId, this.sermons);
    },

    // === AI ===
    async getAssistance(type) {
        await AIAssistant.generate(type, this.currentSermonId, this.sermons);
    },

    insertToEditor(type) {
        AIAssistant.insertToEditor(type);
    },

    // === Модальные окна ===
    openBibleModal() { BibleModal.open(); },
    closeBibleModal() { BibleModalideModal.close(); },
    fetchBibleVerse() { BibleModal.fetchAndInsert(); },

    openHelpModal() { HelpModal.open(); },
    closeHelpModal() { HelpModal.close(); },
    switchHelpTab(tab) { HelpModal.switchTab(tab); },
};