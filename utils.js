// utils.js

export const Utils = {
    generateSermonId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    getCurrentISODate() {
        return new Date().toISOString();
    },
    formatDisplayDate(isoDate) {
        return isoDate ? new Date(isoDate).toLocaleDateString('ru-RU') : '';
    },
    formatInputDate(isoDate) {
        return isoDate ? isoDate.split('T')[0] : '';
    },
    getStatusText(status) {
        const map = { draft: 'Черновик', ready: 'Готова', preached: 'Проповедана', archived: 'Архив' };
        return map[status] || 'Неизвестно';
    },
    formatMarkdown(text) {
        text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/_(.*?)_/g, '<em>$1</em>');
        text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        text = text.replace(/^\* (.*$)/gm, '<li>$1</li>');
        const blocks = text.split(/\n{2,}/);
        let html = '';
        blocks.forEach(block => {
            if (!block.trim()) return;
            if (block.startsWith('<h')) {
                html += block;
            } else if (block.startsWith('<li>')) {
                html += '<ul>' + block.trim() + '</ul>';
            } else {
                let p = block.trim().replace(/\n/g, '<br>');
                html += `<p>${p}</p>`;
            }
        });
        html = html.replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>');
        html = html.replace(/^\s*<br>/, '').replace(/<br>\s*$/, '');
        return html;
    },
    prettyJSON(obj) {
        return JSON.stringify(obj, null, 2);
    },
    safeJSONParse(str) {
        try { return JSON.parse(str); } catch { return null; }
    },
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },
    getRetryDelay(attempt) {
        return Math.pow(2, attempt) * 1000;
    },
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    findClosestBook(input, bookMap) {
        const clean = input.toLowerCase().replace(/[^а-яa-z0-9]/g, '');
        let best = null, minDist = Infinity;
        for (const book of Object.keys(bookMap)) {
            const bookClean = book.toLowerCase().replace(/[^а-яa-z0-9]/g, '');
            const dist = this.levenshteinDistance(clean, bookClean);
            if (dist < minDist && dist <= 3) {
                minDist = dist;
                best = book;
            }
        }
        return best;
    },
    levenshteinDistance(a, b) {
        const m = [];
        for (let i = 0; i <= b.length; i++) m[i] = [i];
        for (let j = 0; j <= a.length; j++) m[0][j] = j;
        for (let i = 1; i <= b.length; i++)
            for (let j = 1; j <= a.length; j++) {
                m[i][j] = b[i - 1] === a[j - 1]
                    ? m[i - 1][j - 1]
                    : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
            }
        return m[b.length][a.length];
    }
};