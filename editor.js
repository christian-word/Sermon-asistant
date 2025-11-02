// editor.js
class EditorManager {
    constructor(containerId, onChange) {
        this.quill = null;
        this.containerId = containerId;
        this.onChange = onChange;
        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`[Editor] #${this.containerId} не найден`);
            return;
        }

        this.quill = new Quill(container, {
            theme: 'snow',
            modules: {
                toolbar: {
                    container: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link', 'clean', 'bible']
                    ],
                    handlers: {
                         'bible': () => App.openBibleFullModal()   // ← НОВЫЙ вызов
                    }
                }
            }
        });

        this.customizeBibleButton();

        this.quill.on('text-change', () => {
            if (this.onChange) this.onChange();
        });
    }

    customizeBibleButton() {
        const btn = document.querySelector('.ql-bible');
        if (!btn) return;
        btn.innerHTML = `
            <svg class="w-4 h-4 inline-block align-middle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
            <span class="text-xs ml-1 align-middle">(Библия)</span>`;
        btn.title = 'Вставить стих из Писания';
    }

    getHTML() { return this.quill?.root?.innerHTML || ''; }
    setHTML(html = '') { if (this.quill) this.quill.root.innerHTML = html; }
    getText() { return this.quill?.getText()?.trim() || ''; }
    insertHTML(html, atEnd = true) {
        if (!this.quill) return;
        const range = atEnd ? { index: this.quill.getLength() } : this.quill.getSelection(true);
        this.quill.clipboard.dangerouslyPasteHTML(range.index, html);
    }
    focus() { this.quill?.focus(); }
}