// config.js — УМНЫЕ ПРОМПТЫ v2
// Коротко, точно, с примерами, без воды

const CONFIG = {
    API: {
        KEY: atob("Z3NrX1NUelQyS1FFQko3MGNDb1hDSllaV0dkeWIzRlk5OHJHN2xvWXUxSmc1SnV0VFZOSzIyVHY="),
        URL: "https://api.groq.com/openai/v1/chat/completions",
        MODEL: "meta-llama/llama-4-maverick-17b-128e-instruct",
        TEMPERATURE: 0.7,
        MAX_TOKENS: 2048,
        MAX_RETRIES: 3
    },

    DEFAULTS: {
        AUDIENCE: "общая аудитория",
        DURATION: 30,
        STATUS: "draft"
    },

    STORAGE: {
        KEY: "theological_assistant_sermons",
        EXPORT_FILENAME_PREFIX: "sermons_backup_",
        AUTO_SAVE_INTERVAL: 30000
    },

    ASSISTANCE_TYPES: {
        EXEGESIS: "exegesis",
        ILLUSTRATION: "illustration",
        STRUCTURE: "structure"
    },

    HINT_TYPES: {
        INTRODUCTION: "introduction",
        APPLICATION: "application",
        ILLUSTRATION: "illustration",
        CONCLUSION: "conclusion"
    },

    // ========================================
    // ПРОМПТЫ — УМНЫЕ, КОРОТКИЕ, С ФОРМАТОМ
    // ========================================
    PROMPTS: {
        // Системный — коуч, библейский, без воды
        SYSTEM: `Ты — теологический коуч. 
Отвечай кратко, точно, по-библейски. 
Формат: Markdown. 
Ссылайся на отрывок и мою идею. 
Без воды.`.trim(),

        // === ПОЛНЫЕ АНАЛИЗЫ ===
        EXEGESIS: (passage, draft) => `
**Отрывок:** ${passage}  
**Моя идея:** ${draft}

1. **Контекст (1-2 предложения):**  
2. **Ключевые слова (греч/ивр + значение):**  
3. **Связь с моей идеей:**  
4. **Вопрос для размышления:**  
`.trim(),

        ILLUSTRATION: (passage, draft, audience) => `
**Отрывок:** ${passage}  
**Идея:** ${draft}  
**Аудитория:** ${audience}

Дай **3 идеи-семени** (не истории!):  
1. **Метафора из природы**  
2. **Пример из жизни**  
3. **Аналогия из культуры**  
`.trim(),

        STRUCTURE: (passage, draft, audience) => `
**Отрывок:** ${passage}  
**Идея:** ${draft}  
**Аудитория:** ${audience}

**Оценка:** (да/нет + 1 предложение)  
**План (3 пункта):**  
1.  
2.  
3.  
**Совет:** (1 предложение)  
`.trim(),

        // === ПОДСКАЗКИ (HINTS) ===
        HINT_INTRODUCTION: (passage, draft, audience) => `
**Отрывок:** ${passage}  
**Идея:** ${draft}

Дай **3 зацепки** (по 1 предложению):  
1. **Вопрос**  
2. **Образ**  
3. **Ситуация**  
`.trim(),

        HINT_APPLICATION: (passage, draft, audience) => `
**Отрывок:** ${passage}  
**Идея:** ${draft}

**3 действия:**  
1.  
2.  
3.  
`.trim(),

        HINT_ILLUSTRATION: (passage, draft, audience) => `
**Отрывок:** ${passage}  
**Идея:** ${draft}

**3 семени:**  
1. **Природа**  
2. **Жизнь**  
3. **Культура**  
`.trim(),

        HINT_CONCLUSION: (passage, draft, audience) => `
**Отрывок:** ${passage}  
**Идея:** ${draft}

**3 финала:**  
1. **Призыв**  
2. **Образ**  
3. **Вопрос**  
`.trim(),

        // === ПЕРЕФРАЗИРОВАТЬ ===
        REPHRASE: (text) => `
Перефразируй **короче и ярче**, сохранив смысл и библейский тон:

> ${text}

`.trim()
    }
};

// Экспорт в глобальную область
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}