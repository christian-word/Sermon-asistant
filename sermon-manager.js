// sermon-manager.js

import { CONFIG } from './config.js';

export class SermonManager {
    constructor(data) {
        this.sermons = data.sermons || [];
        this.settings = {
            default_audience: data.settings?.default_audience || CONFIG.DEFAULTS.AUDIENCE,
            default_duration: data.settings?.default_duration || CONFIG.DEFAULTS.DURATION,
            auto_save: data.settings?.auto_save ?? true
        };
        this.bookMap = {
            "Бытие":1,"Исход":2,"Левит":3,"Числа":4,"Второзаконие":5,
            "Иисус Навин":6,"Книга Судей":7,"Руфь":8,
            "1-я Царств":9,"2-я Царств":10,"3-я Царств":11,"4-я Царств":12,
            "1-я Паралипоменон":13,"2-я Паралипоменон":14,"Ездра":15,"Неемия":16,"Есфирь":17,
            "Иов":18,"Псалтирь":19,"Притчи":20,"Екклесиаст":21,"Песни Песней":22,
            "Исаия":23,"Иеремия":24,"Плач Иеремии":25,"Иезекииль":26,"Даниил":27,
            "Осия":28,"Иоиль":29,"Амос":30,"Авдий":31,"Иона":32,"Михей":33,"Наум":34,
            "Аввакум":35,"Софония":36,"Аггей":37,"Захария":38,"Малахия":39,
            "От Матфея":40,"Матфей":40,"От Марка":41,"Марк":41,"От Луки":42,"Лука":42,
            "От Иоанна":43,"Иоанна":43,"Деяния":44,"К Римлянам":45,"Римлянам":45,
            "1-е Коринфянам":46,"2-е Коринфянам":47,"К Галатам":48,"К Ефесянам":49,
            "К Филиппийцам":50,"Филиппийцам":50,"К Колоссянам":51,"Колоссянам":51,
            "1-е Фессалоникийцам":52,"2-е Фессалоникийцам":53,"1-е Тимофею":54,
            "2-е Тимофею":55,"К Титу":56,"К Филимону":57,"К Евреям":58,"Иакова":59,
            "1-е Петра":60,"2-е Петра":61,"1-е Иоанна":62,"2-е Иоанна":63,"3-е Иоанна":64,
            "Иуда":65,"Откровение":66,
            "2 кн. Ездры":67,"Товит":68,"Иудифь":69,"Премудрость Соломона":70,"Сирах":71,
            "Послание Иеремии":72,"Варух":73,"1 кн. Маккавейская":74,"2 кн. Маккавейская":75,
            "3 кн. Маккавейская":76,"3 кн. Ездры":77
        };
    }

    getData() {
        return {
            sermons: this.sermons,
            settings: this.settings
        };
    }

    createSermon() {
        const now = new Date().toISOString();
        return {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            metadata: {
                title: "Новая проповедь",
                passage: "",
                audience: this.settings.default_audience,
                date_created: now,
                date_modified: now,
                date_preached: "",
                status: CONFIG.DEFAULTS.STATUS,
                tags: [],
                duration_planned: this.settings.default_duration,
                notes: ""
            },
            preparation: {
                main_idea: "",
                exegesis: { content: "", ai_generated: false, date_generated: null },
                illustrations: { content: "", ai_generated: false, date_generated: null },
                structure: { content: "", ai_generated: false, date_generated: null }
            },
            sermon_text: { introduction: "", main_body: "", conclusion: "", full_text: "" },
            notes: [],
            resources: []
        };
    }

    addSermon(sermon) {
        this.sermons.unshift(sermon);
        this.updateModified(sermon.id);
    }

    getSermon(id) {
        return this.sermons.find(s => s.id === id);
    }

    updateSermonMetadata(id, metadata) {
        const sermon = this.getSermon(id);
        if (sermon) {
            Object.assign(sermon.metadata, metadata);
            this.updateModified(id);
        }
    }

    updateMainIdea(id, html) {
        const sermon = this.getSermon(id);
        if (sermon) {
            sermon.preparation.main_idea = html;
            this.updateModified(id);
        }
    }

    updatePreparationSection(id, sectionKey, content) {
        const sermon = this.getSermon(id);
        if (sermon) {
            if (!sermon.preparation[sectionKey]) {
                sermon.preparation[sectionKey] = { content: "", ai_generated: false, date_generated: null };
            }
            sermon.preparation[sectionKey].content = content;
            sermon.preparation[sectionKey].ai_generated = true;
            sermon.preparation[sectionKey].date_generated = new Date().toISOString();
            this.updateModified(id);
        }
    }

    updateModified(id) {
        const sermon = this.getSermon(id);
        if (sermon) {
            sermon.metadata.date_modified = new Date().toISOString();
        }
    }

    deleteSermon(id) {
        this.sermons = this.sermons.filter(s => s.id !== id);
    }
}