// ai-service.js

import { CONFIG } from './config.js';
import { Utils } from './utils.js';

export class AIService {
    constructor() {
        this.editor = null;
    }

    setEditor(editor) {
        this.editor = editor;
    }

    /**
     * Запускает базовый AI-ассистент (экзегеза, иллюстрации, структура)
     */
    async getAssistance(mode, passage, mainIdea, audience, sermonManager, currentSermonId) {
        if (!passage || !mainIdea) throw new Error('Заполните отрывок и главную идею');

        let query = '';
        let section = '';

        switch (mode) {
            case 'exegesis':
                section = 'exegesis';
                query = CONFIG.PROMPTS.EXEGESIS(passage, mainIdea);
                break;
            case 'illustration':
                section = 'illustrations';
                query = CONFIG.PROMPTS.ILLUSTRATION(passage, mainIdea, audience);
                break;
            case 'structure':
                section = 'structure';
                query = CONFIG.PROMPTS.STRUCTURE(passage, mainIdea, audience);
                break;
            default:
                throw new Error('Неизвестный режим помощи');
        }

        const payload = {
            model: CONFIG.API.MODEL,
            messages: [
                { role: "system", content: CONFIG.PROMPTS.SYSTEM },
                { role: "user", content: query }
            ],
            temperature: CONFIG.API.TEMPERATURE,
            max_tokens: CONFIG.API.MAX_TOKENS
        };

        for (let i = 0; i < CONFIG.API.MAX_RETRIES; i++) {
            try {
                const response = await fetch(CONFIG.API.URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${CONFIG.API.KEY}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    if (response.status === 429 && i < CONFIG.API.MAX_RETRIES - 1) {
                        await new Promise(res => setTimeout(res, Utils.getRetryDelay(i)));
                        continue;
                    }
                    throw new Error(`API ${response.status}`);
                }

                const data = await response.json();
                if (!data.choices?.[0]?.message?.content) {
                    throw new Error('Нет ответа от AI');
                }

                const content = data.choices[0].message.content;
                const sermon = sermonManager.getSermon(currentSermonId);
                if (sermon) {
                    sermonManager.updatePreparationSection(currentSermonId, section, content);
                }
                return content;

            } catch (error) {
                if (i === CONFIG.API.MAX_RETRIES - 1) {
                    throw error;
                }
            }
        }
    }

    /**
     * Выполняет пользовательский промпт
     */
    async runCustomPrompt(prompt, passage, mainIdea, audience, sermonManager, currentSermonId) {
        let finalPrompt = prompt.promptText
            .replace(/{passage}/g, passage)
            .replace(/{main_idea}/g, mainIdea)
            .replace(/{audience}/g, audience);

        const messages = prompt.systemRole
            ? [{ role: 'system', content: prompt.systemRole }, { role: 'user', content: finalPrompt }]
            : [{ role: 'user', content: finalPrompt }];

        const payload = {
            model: CONFIG.API.MODEL,
            messages,
            temperature: prompt.temperature || 0.7,
            max_tokens: prompt.maxTokens || 2000
        };

        const response = await fetch(CONFIG.API.URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.API.KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`API ${response.status}`);
        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) throw new Error('Нет ответа от AI');

        const result = data.choices[0].message.content;
        const sectionKey = `custom_${prompt.id}`;
        sermonManager.updatePreparationSection(currentSermonId, sectionKey, result);
        return result;
    }

    /**
     * Валидация библейского отрывка (вынесена из UI)
     */
    validatePassage(input, bookMap) {
        const val = input.value.trim();
        const errorId = input.id === 'bible-reference' ? 'bible-reference-error' : 'passage-error';
        const errorEl = document.getElementById(errorId);

        if (!val) {
            input.setAttribute('aria-invalid', 'true');
            if (errorEl) {
                errorEl.textContent = 'Поле пусто';
                errorEl.classList.remove('hidden');
            }
            return false;
        }

        const chapterMatch = val.match(/(\d+[:]\d*)/);
        if (!chapterMatch) {
            input.setAttribute('aria-invalid', 'true');
            if (errorEl) {
                errorEl.textContent = 'Укажите главу/стих';
                errorEl.classList.remove('hidden');
            }
            return false;
        }

        const chapterPos = chapterMatch.index;
        const rawBook = val.substring(0, chapterPos).trim();
        const rest = val.substring(chapterPos).trim();

        let bookName = Object.keys(bookMap).find(k =>
            k.toLowerCase() === rawBook.toLowerCase()
        ) || Utils.findClosestBook(rawBook, bookMap);

        if (!bookName) {
            input.setAttribute('aria-invalid', 'true');
            if (errorEl) {
                errorEl.textContent = 'Книга не найдена';
                errorEl.classList.remove('hidden');
            }
            return false;
        }

        input.value = `${bookName} ${rest}`;
        const m = rest.match(/^(\d+)(?::(\d+)(?:-(\d+))?)?$/);
        if (!m) {
            input.setAttribute('aria-invalid', 'true');
            if (errorEl) {
                errorEl.textContent = 'Неверный формат главы/стиха';
                errorEl.classList.remove('hidden');
            }
            return false;
        }

        const [, c, s, e] = m;
        if (s && e && +e < +s) {
            input.setAttribute('aria-invalid', 'true');
            if (errorEl) {
                errorEl.textContent = 'Конечный стих меньше начального';
                errorEl.classList.remove('hidden');
            }
            return false;
        }

        input.setAttribute('aria-invalid', 'false');
        if (errorEl) errorEl.classList.add('hidden');
        return true;
    }
}