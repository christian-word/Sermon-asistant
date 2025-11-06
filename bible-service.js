// bible-service.js

/**
 * Сервис для загрузки и вставки библейских стихов
 * Использует API: https://bolls.life
 */
export class BibleService {
    static API_BASE = 'https://bolls.life/get-text';
    static TRANSLATION = 'SYNOD'; // Синодальный перевод

    /**
     * Парсит строку вида "К Римлянам 8:28" → { bookId, chapter, startVerse, endVerse }
     * @param {string} reference — строка от пользователя
     * @param {Object} bookMap — маппинг названий книг в ID (из App)
     * @returns {Object} распарсенные данные
     */
    static parseReference(reference, bookMap) {
        const trimmed = reference.trim();
        if (!trimmed) throw new Error('Пустая ссылка');

        const chapterMatch = trimmed.match(/(\d+[:]\d*-*\d*)/);
        if (!chapterMatch) throw new Error('Укажите главу/стих');

        const chapterPos = chapterMatch.index;
        const rawBook = trimmed.substring(0, chapterPos).trim();
        const rest = trimmed.substring(chapterPos).trim();

        // Найдём точное совпадение или ближайшее по Левенштейну
        const bookName = Object.keys(bookMap).find(k =>
            k.toLowerCase() === rawBook.toLowerCase()
        ) || Utils.findClosestBook(rawBook, bookMap);

        if (!bookName) throw new Error('Книга не найдена');

        const bookId = bookMap[bookName];
        const m = rest.match(/^(\d+)(?::(\d+)(?:-(\d+))?)?$/);
        if (!m) throw new Error('Неверный формат главы/стиха');

        const [, chapterStr, startVerseStr, endVerseStr] = m;
        const chapter = parseInt(chapterStr, 10);
        const startVerse = startVerseStr ? parseInt(startVerseStr, 10) : null;
        const endVerse = endVerseStr ? parseInt(endVerseStr, 10) : startVerse;

        if (startVerse !== null && endVerse !== null && endVerse < startVerse) {
            throw new Error('Конечный стих меньше начального');
        }

        return { bookId, chapter, startVerse, endVerse, bookName };
    }

    /**
     * Загружает текст главы или диапазона стихов
     * @param {number} bookId
     * @param {number} chapter
     * @param {number|null} startVerse
     * @param {number|null} endVerse
     * @returns {Promise<string>} HTML-строка с форматированными стихами
     */
    static async fetchVerses(bookId, chapter, startVerse = null, endVerse = null) {
        const url = `${this.API_BASE}/${this.TRANSLATION}/${bookId}/${chapter}/`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Ошибка загрузки главы: ${res.status}`);

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Глава пуста или не найдена');
        }

        let versesToInclude;
        if (startVerse === null) {
            // Запрошена целая глава
            versesToInclude = data;
        } else {
            // Фильтруем по диапазону
            const min = startVerse;
            const max = endVerse || startVerse;
            versesToInclude = data.filter(v => v.verse >= min && v.verse <= max);
            if (versesToInclude.length === 0) {
                throw new Error('Стихи не найдены');
            }
        }

        return versesToInclude.map(v =>
            `<p><strong>${this.getBookName(bookId, App.bookMap)} ${chapter}:${v.verse}:</strong> ${Utils.escapeHtml(v.text)}</p>`
        ).join('');
    }

    /**
     * Вспомогательная: получает название книги по ID
     */
    static getBookName(bookId, bookMap) {
        return Object.keys(bookMap).find(k => bookMap[k] === bookId) || 'Книга';
    }

    /**
     * Основной метод: вставить стихи в редактор
     * @param {string} reference — строка от пользователя
     * @param {EditorManager} editor — экземпляр редактора
     * @param {Object} bookMap — маппинг книг
     */
    static async insertPassage(reference, editor, bookMap) {
        try {
            const { bookId, chapter, startVerse, endVerse } = this.parseReference(reference, bookMap);
            const html = await this.fetchVerses(bookId, chapter, startVerse, endVerse);
            editor.insertHTML(html);
            return true;
        } catch (err) {
            throw new Error(`Ошибка Библии: ${err.message}`);
        }
    }

    /**
     * Показать модальное окно
     */
    static showModal() {
        document.getElementById('bible-modal')?.classList.remove('hidden');
        document.getElementById('bible-reference')?.focus();
    }

    /**
     * Скрыть модальное окно
     */
    static hideModal() {
        const modal = document.getElementById('bible-modal');
        const input = document.getElementById('bible-reference');
        const error = document.getElementById('bible-reference-error');

        if (modal) modal.classList.add('hidden');
        if (input) {
            input.value = '';
            input.setAttribute('aria-invalid', 'false');
        }
        if (error) error.classList.add('hidden');
    }

    /**
     * Обработать нажатие "Вставить" в модалке
     * @param {EditorManager} editor
     * @param {Object} bookMap
     */
    static async handleInsert(editor, bookMap) {
        const input = document.getElementById('bible-reference');
        const value = input?.value.trim();
        const errorEl = document.getElementById('bible-reference-error');

        if (!value) {
            this._showError(input, errorEl, 'Пусто');
            return;
        }

        try {
            await this.insertPassage(value, editor, bookMap);
            this.hideModal();
        } catch (err) {
            this._showError(input, errorEl, err.message);
        }
    }

    /**
     * Внутренняя: показать ошибку в UI
     */
    static _showError(input, errorEl, message) {
        if (input) input.setAttribute('aria-invalid', 'true');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }
}

// Для совместимости с будущими утилитами:
Utils.findClosestBook = function(input, bookMap) {
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
};

Utils.levenshteinDistance = function(a, b) {
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
};