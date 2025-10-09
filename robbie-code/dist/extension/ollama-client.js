"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaClient = void 0;
class OllamaClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async chat(model, messages) {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,
                stream: false
            })
        });
        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
        }
        const data = await response.json();
        return data.message.content;
    }
    async chatStream(model, messages, onToken) {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,
                stream: true
            })
        });
        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
        }
        const reader = response.body?.getReader();
        if (!reader)
            throw new Error('No response body');
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(Boolean);
            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    if (json.message?.content) {
                        onToken(json.message.content);
                    }
                }
                catch (e) {
                    // Skip invalid JSON
                }
            }
        }
    }
    async complete(model, prompt, suffix = '') {
        const response = await fetch(`${this.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                suffix,
                stream: false,
                options: {
                    temperature: 0.2,
                    num_predict: 50,
                    stop: ['\n\n', '```']
                }
            })
        });
        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
        }
        const data = await response.json();
        return data.response.trim();
    }
}
exports.OllamaClient = OllamaClient;
//# sourceMappingURL=ollama-client.js.map