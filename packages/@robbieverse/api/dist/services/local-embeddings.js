"use strict";
// Local Embedding Service using Ollama
// Uses nomic-embed-text for vector embeddings (no OpenAI needed)
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniEmbeddingService = exports.LocalEmbeddingService = void 0;
class LocalEmbeddingService {
    constructor(baseUrl = 'http://localhost:11435', model = 'nomic-embed-text') {
        this.baseUrl = baseUrl;
        this.model = model;
    }
    /**
     * Generate embeddings locally using Ollama
     * nomic-embed-text produces 768-dimensional vectors
     */
    async generateEmbedding(text) {
        try {
            const response = await fetch(`${this.baseUrl}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: text,
                }),
            });
            if (!response.ok) {
                throw new Error(`Ollama embedding error: ${response.status}`);
            }
            const data = await response.json();
            // Pad or truncate to 1536 dimensions to match our schema
            // (nomic-embed-text produces 768, we'll pad with zeros)
            const embedding = data.embedding || [];
            const paddedEmbedding = new Array(1536).fill(0);
            for (let i = 0; i < Math.min(embedding.length, 1536); i++) {
                paddedEmbedding[i] = embedding[i];
            }
            return paddedEmbedding;
        }
        catch (error) {
            console.error('Local embedding error:', error.message);
            return [];
        }
    }
    /**
     * Generate embeddings for multiple texts (batch processing)
     */
    async generateEmbeddings(texts) {
        const embeddings = [];
        for (const text of texts) {
            const embedding = await this.generateEmbedding(text);
            embeddings.push(embedding);
        }
        return embeddings;
    }
    /**
     * Check if embedding model is available
     */
    async isAvailable() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok)
                return false;
            const data = await response.json();
            const models = data.models || [];
            return models.some((m) => m.name.includes(this.model));
        }
        catch (error) {
            return false;
        }
    }
}
exports.LocalEmbeddingService = LocalEmbeddingService;
// Alternative: Use all-MiniLM-L6-v2 (smaller, faster, 384 dimensions)
class MiniEmbeddingService extends LocalEmbeddingService {
    constructor(baseUrl = 'http://localhost:11435') {
        super(baseUrl, 'all-minilm');
    }
}
exports.MiniEmbeddingService = MiniEmbeddingService;
