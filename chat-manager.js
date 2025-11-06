// chat-manager.js

import { CONFIG } from './config.js';

export class ChatManager {
    constructor(sermonManager) {
        this.sermonManager = sermonManager;
        this.editor = null;
    }

    setEditor(editor) {
        this.editor = editor;
    }

    createNewChat(currentSermonId) {
        const sermon = this.sermonManager.getSermon(currentSermonId);
        if (!sermon) return null;

        const chatCount = Object.keys(sermon.preparation)
            .filter(k => k.startsWith('chat_')).length;
        const chatId = `chat_${Date.now()}`;
        const name = `Чат ${chatCount + 1}`;

        sermon.preparation[chatId] = {
            type: 'chat',
            name,
            messages: [],
            ai_generated: false,
            date_generated: new Date().toISOString()
        };

        if (!sermon.metadata.customTabOrder) {
            sermon.metadata.customTabOrder = [];
        }
        sermon.metadata.customTabOrder.push(chatId);
        this.sermonManager.updateModified(currentSermonId);
        return { chatId, name };
    }

    async sendChatMessage(chatId, userMessage, currentSermonId) {
        const sermon = this.sermonManager.getSermon(currentSermonId);
        if (!sermon?.preparation[chatId]) return;

        sermon.preparation[chatId].messages.push({ role: 'user', content: userMessage });
        this.sermonManager.updateModified(currentSermonId);

        const passage = sermon.metadata.passage || '';
        const mainIdea = this.editor?.getText() || '';

        const messages = [
            {
                role: 'system',
                content: `Ты помощник проповедника. Отрывок: ${passage}. Главная идея: ${mainIdea}. Отвечай кратко и по делу.`
            },
            ...sermon.preparation[chatId].messages
        ];

        const response = await fetch(CONFIG.API.URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.API.KEY}`
            },
            body: JSON.stringify({
                model: CONFIG.API.MODEL,
                messages,
                temperature: 0.7,
                max_tokens: 600
            })
        });

        if (!response.ok) throw new Error(`API ${response.status}`);
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'Нет ответа';

        sermon.preparation[chatId].messages.push({ role: 'assistant', content: reply });
        this.sermonManager.updateModified(currentSermonId);
        return reply;
    }

    deleteChat(chatId, currentSermonId) {
        const sermon = this.sermonManager.getSermon(currentSermonId);
        if (!sermon) return;

        delete sermon.preparation[chatId];
        if (sermon.metadata.customTabOrder) {
            sermon.metadata.customTabOrder = sermon.metadata.customTabOrder.filter(id => id !== chatId);
        }
        this.sermonManager.updateModified(currentSermonId);
    }

    renderMessages(chatId, currentSermonId) {
        const sermon = this.sermonManager.getSermon(currentSermonId);
        if (!sermon?.preparation[chatId]) return [];

        return sermon.preparation[chatId].messages.map(m => ({
            role: m.role,
            content: m.content
        }));
    }

    addChatTab(chatId, name) {
        // UI-логика вынесена в UIController
    }
}