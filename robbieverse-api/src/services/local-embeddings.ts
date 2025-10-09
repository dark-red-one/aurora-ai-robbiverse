// Local Embedding Service using Ollama
// Uses nomic-embed-text for vector embeddings (no OpenAI needed)

export class LocalEmbeddingService {
    private baseUrl: string;
    private model: string;

    constructor(baseUrl: string = 'http://localhost:11435', model: string = 'nomic-embed-text') {
        this.baseUrl = baseUrl;
        this.model = model;
    }

    /**
     * Generate embeddings locally using Ollama
     * nomic-embed-text produces 768-dimensional vectors
     */
    async generateEmbedding(text: string): Promise<number[]> {
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

            const data: any = await response.json();

            // Pad or truncate to 1536 dimensions to match our schema
            // (nomic-embed-text produces 768, we'll pad with zeros)
            const embedding = data.embedding || [];
            const paddedEmbedding = new Array(1536).fill(0);

            for (let i = 0; i < Math.min(embedding.length, 1536); i++) {
                paddedEmbedding[i] = embedding[i];
            }

            return paddedEmbedding;
        } catch (error: any) {
            console.error('Local embedding error:', error.message);
            return [];
        }
    }

    /**
     * Generate embeddings for multiple texts (batch processing)
     */
    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        const embeddings: number[][] = [];

        for (const text of texts) {
            const embedding = await this.generateEmbedding(text);
            embeddings.push(embedding);
        }

        return embeddings;
    }

    /**
     * Check if embedding model is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) return false;

            const data: any = await response.json();
            const models = data.models || [];

            return models.some((m: any) => m.name.includes(this.model));
        } catch (error) {
            return false;
        }
    }
}

// Alternative: Use all-MiniLM-L6-v2 (smaller, faster, 384 dimensions)
export class MiniEmbeddingService extends LocalEmbeddingService {
    constructor(baseUrl: string = 'http://localhost:11435') {
        super(baseUrl, 'all-minilm');
    }
}

