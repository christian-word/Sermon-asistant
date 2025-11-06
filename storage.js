// storage.js

import { CONFIG } from './config.js';
import { Utils } from './utils.js';

export class StorageManager {
    static save(data) {
        try {
            const jsonString = Utils.prettyJSON(data);
            localStorage.setItem(CONFIG.STORAGE.KEY, jsonString);
            console.log('✓ Данные сохранены в localStorage');
            return true;
        } catch (e) {
            console.error('✗ Ошибка сохранения в localStorage:', e);
            if (e.name === 'QuotaExceededError') {
                alert('Хранилище переполнено! Экспортируйте данные и очистите старые проповеди.');
            }
            return false;
        }
    }

    static load() {
        try {
            const jsonString = localStorage.getItem(CONFIG.STORAGE.KEY);
            if (!jsonString) {
                console.log('ℹ Данные не найдены, создаём новую структуру');
                return this.createEmptyStructure();
            }
            const data = Utils.safeJSONParse(jsonString);
            if (!data.sermons || !Array.isArray(data.sermons)) {
                console.warn('⚠ Неверная структура данных, создаём новую');
                return this.createEmptyStructure();
            }
            return data;
        } catch (e) {
            console.error('✗ Ошибка загрузки из localStorage:', e);
            return this.createEmptyStructure();
        }
    }

    static createEmptyStructure() {
        return {
            sermons: [],
            settings: {
                default_audience: CONFIG.DEFAULTS.AUDIENCE,
                default_duration: CONFIG.DEFAULTS.DURATION,
                auto_save: true
            }
        };
    }

    static exportToJSON(data) {
        try {
            const filename = `${CONFIG.STORAGE.EXPORT_FILENAME_PREFIX}${new Date().toISOString().split('T')[0]}.json`;
            const content = Utils.prettyJSON(data);
            Utils.downloadFile(content, filename, 'application/json');
            return true;
        } catch (e) {
            console.error('✗ Ошибка экспорта:', e);
            alert('Ошибка при экспорте данных');
            return false;
        }
    }

    static importFromJSON(file) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error('Файл не выбран'));
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = Utils.safeJSONParse(e.target.result);
                    if (!imported?.sermons || !Array.isArray(imported.sermons)) {
                        throw new Error('Неверный формат файла');
                    }
                    resolve(imported);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Ошибка чтения файла'));
            reader.readAsText(file);
        });
    }

    static isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
}