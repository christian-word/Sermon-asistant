// ==========================================
// УПРАВЛЕНИЕ ХРАНЕНИЕМ ДАННЫХ
// localStorage, импорт/экспорт JSON, backup
// Стабильная версия v1.0
// ==========================================

const StorageManager = {
    /**
     * Сохраняет данные в localStorage
     */
    save(data) {
        try {
            const jsonString = Utils.prettyJSON(data);
            localStorage.setItem(CONFIG.STORAGE.KEY, jsonString);
            console.log('✓ Данные сохранены в localStorage');
            return true;
        } catch (e) {
            console.error('✗ Ошибка сохранения в localStorage:', e);
            
            // Проверка на переполнение хранилища
            if (e.name === 'QuotaExceededError') {
                alert('Хранилище переполнено! Экспортируйте данные и очистите старые проповеди.');
            }
            return false;
        }
    },

    /**
     * Загружает данные из localStorage
     */
    load() {
        try {
            const jsonString = localStorage.getItem(CONFIG.STORAGE.KEY);
            
            if (!jsonString) {
                console.log('ℹ Данные не найдены, создаём новую структуру');
                return this.createEmptyStructure();
            }

            const data = Utils.safeJSONParse(jsonString);
            console.log(`✓ Загружено проповедей: ${data.sermons?.length || 0}`);
            
            // Валидация структуры
            if (!data.sermons || !Array.isArray(data.sermons)) {
                console.warn('⚠ Неверная структура данных, создаём новую');
                return this.createEmptyStructure();
            }

            return data;
        } catch (e) {
            console.error('✗ Ошибка загрузки из localStorage:', e);
            return this.createEmptyStructure();
        }
    },

    /**
     * Создаёт пустую структуру данных
     */
    createEmptyStructure() {
        return {
            sermons: [],
            settings: {
                default_audience: CONFIG.DEFAULTS.AUDIENCE,
                default_duration: CONFIG.DEFAULTS.DURATION,
                auto_save: true
            }
        };
    },

    /**
     * Очищает все данные из localStorage
     */
    clear() {
        try {
            localStorage.removeItem(CONFIG.STORAGE.KEY);
            console.log('✓ localStorage очищен');
            return true;
        } catch (e) {
            console.error('✗ Ошибка очистки localStorage:', e);
            return false;
        }
    },

    /**
     * Экспортирует данные в JSON файл
     */
    exportToJSON(data) {
        try {
            const filename = `${CONFIG.STORAGE.EXPORT_FILENAME_PREFIX}${new Date().toISOString().split('T')[0]}.json`;
            const content = Utils.prettyJSON(data);
            Utils.downloadFile(content, filename, 'application/json');
            console.log(`✓ Экспорт выполнен: ${filename}`);
            return true;
        } catch (e) {
            console.error('✗ Ошибка экспорта:', e);
            alert('Ошибка при экспорте данных');
            return false;
        }
    },

    /**
     * Импортирует данные из JSON файла
     */
    importFromJSON(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('Файл не выбран'));
                return;
            }

            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const imported = Utils.safeJSONParse(e.target.result);
                    
                    if (!imported) {
                        throw new Error('Не удалось прочитать JSON');
                    }

                    // Валидация структуры
                    if (!imported.sermons || !Array.isArray(imported.sermons)) {
                        throw new Error('Неверный формат файла');
                    }

                    console.log(`✓ Импортировано проповедей: ${imported.sermons.length}`);
                    resolve(imported);
                } catch (error) {
                    console.error('✗ Ошибка импорта:', error);
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Ошибка чтения файла'));
            };

            reader.readAsText(file);
        });
    },

    /**
     * Получает размер данных в localStorage (в KB)
     */
    getStorageSize() {
        try {
            const data = localStorage.getItem(CONFIG.STORAGE.KEY);
            if (!data) return 0;
            
            // Размер в байтах, конвертируем в KB
            const sizeInBytes = new Blob([data]).size;
            const sizeInKB = (sizeInBytes / 1024).toFixed(2);
            
            return parseFloat(sizeInKB);
        } catch (e) {
            console.error('Ошибка получения размера:', e);
            return 0;
        }
    },

    /**
     * Проверяет доступность localStorage
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.error('localStorage недоступен:', e);
            return false;
        }
    },

    /**
     * Создаёт резервную копию перед импортом
     */
    createBackup(data) {
        try {
            const backupKey = `${CONFIG.STORAGE.KEY}_backup_${Date.now()}`;
            localStorage.setItem(backupKey, Utils.prettyJSON(data));
            console.log(`✓ Создана резервная копия: ${backupKey}`);
            return backupKey;
        } catch (e) {
            console.error('✗ Ошибка создания резервной копии:', e);
            return null;
        }
    },

    /**
     * Восстанавливает из резервной копии
     */
    restoreBackup(backupKey) {
        try {
            const backupData = localStorage.getItem(backupKey);
            if (!backupData) {
                throw new Error('Резервная копия не найдена');
            }

            localStorage.setItem(CONFIG.STORAGE.KEY, backupData);
            console.log('✓ Данные восстановлены из резервной копии');
            return true;
        } catch (e) {
            console.error('✗ Ошибка восстановления:', e);
            return false;
        }
    }
};

// Экспорт в глобальную область
if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
}