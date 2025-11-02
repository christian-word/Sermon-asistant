// ==========================================
// УТИЛИТАРНЫЕ ФУНКЦИИ
// Форматирование, даты, JSON, файлы
// Стабильная версия v1.0
// ==========================================

const Utils = {
    /**
     * Генерирует уникальный ID для проповеди
     */
    generateSermonId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Получает текущую дату в ISO формате
     */
    getCurrentISODate() {
        return new Date().toISOString();
    },

    /**
     * Форматирует дату для отображения (ru-RU)
     */
    formatDisplayDate(isoDate) {
        return isoDate ? new Date(isoDate).toLocaleDateString('ru-RU') : '';
    },

    /**
     * Форматирует дату для input[type=date] (YYYY-MM-DD)
     */
    formatInputDate(isoDate) {
        return isoDate ? isoDate.split('T')[0] : '';
    },

    /**
     * Получает текст статуса
     */
    getStatusText(status) {
        const statusText = {
            draft: 'Черновик',
            ready: 'Готова',
            preached: 'Проповедана',
            archived: 'Архив'
        };
        return statusText[status] || 'Неизвестно';
    },

    /**
     * Форматирует Markdown в HTML
     */
formatMarkdown(text) {
    text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    text = text.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    text = text.replace(/_(.*?)_/gim, '<em>$1</em>');
    // ↓↓↓ гиперссылки ↓↓↓
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    text = text.replace(/^\* (.*$)/gim, '<li>$1</li>');
        
        const blocks = text.split(/(\r\n|\r|\n){2,}/);
        let html = '';

        blocks.forEach(block => {
            if (block.trim() === '') return;

            if (block.startsWith('<h2>') || block.startsWith('<h3>')) {
                html += block;
            } else if (block.startsWith('<li>')) {
                html += '<ul>' + block.trim() + '</ul>';
            } else {
                let paragraph = block.trim().replace(/(\r\n|\r|\n)/g, '<br>');
                html += `<p>${paragraph}</p>`;
            }
        });

        html = html.replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>');
        html = html.replace(/^\s*<br>/g, '').replace(/<br>\s*$/g, '');

        return html;
    },

    /**
     * Преобразует объект в pretty JSON
     */
    prettyJSON(obj) {
        return JSON.stringify(obj, null, 2);
    },

    /**
     * Безопасный парсинг JSON
     */
    safeJSONParse(str) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return null;
        }
    },

    /**
     * Скачивает файл
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Получает задержку для ретрая (экспоненциальная)
     */
    getRetryDelay(attempt) {
        return Math.pow(2, attempt) * 1000;
    }
};

// Экспорт в глобальную область
if (typeof window !== 'undefined') {
    window.Utils = Utils;
}