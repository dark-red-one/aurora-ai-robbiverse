import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import OpenAI from 'openai';
import { Pool } from 'pg';
import { LocalEmbeddingService } from './services/local-embeddings';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// PostgreSQL connection pool
const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'robbieverse',
    user: process.env.POSTGRES_USER || 'robbie',
    password: process.env.POSTGRES_PASSWORD || 'robbie_dev_2025',
});

// Ollama base URL
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11435';

// Embedding service (local or OpenAI)
const USE_LOCAL_EMBEDDINGS = process.env.USE_LOCAL_EMBEDDINGS !== 'false';
const localEmbeddings = new LocalEmbeddingService(OLLAMA_BASE_URL);
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (req: Request, res: Response) => {
    try {
        const dbResult = await pool.query('SELECT NOW()');
        res.json({
            status: 'healthy',
            timestamp: dbResult.rows[0].now,
            postgres: 'connected',
            ollama: OLLAMA_BASE_URL,
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
        });
    }
});

// ============================================
// EMBEDDING UTILITY
// ============================================

async function getEmbedding(text: string): Promise<number[]> {
    // Try local embeddings first
    if (USE_LOCAL_EMBEDDINGS) {
        try {
            const embedding = await localEmbeddings.generateEmbedding(text);
            if (embedding.length > 0) {
                return embedding;
            }
        } catch (error: any) {
            console.warn('⚠️ Local embedding failed, trying OpenAI:', error.message);
        }
    }

    // Fallback to OpenAI if available
    if (process.env.OPENAI_API_KEY) {
        try {
            const response = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text,
            });
            return response.data[0].embedding;
        } catch (error: any) {
            console.error('OpenAI embedding error:', error.message);
        }
    }

    console.warn('⚠️ No embeddings available - install nomic-embed-text or set OPENAI_API_KEY');
    return [];
}

// ============================================
// CONVERSATION ENDPOINTS
// ============================================

// Create new conversation
app.post('/api/conversations', async (req: Request, res: Response) => {
    const { user_id = 'allan', session_id, title, context_type = 'code' } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO code_conversations (user_id, session_id, title, context_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [user_id, session_id, title, context_type]
        );

        res.json({ success: true, conversation: result.rows[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get conversation by ID
app.get('/api/conversations/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const convResult = await pool.query(
            'SELECT * FROM code_conversations WHERE id = $1',
            [id]
        );

        if (convResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Conversation not found' });
        }

        const messagesResult = await pool.query(
            'SELECT id, role, content, created_at, metadata FROM code_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
            [id]
        );

        res.json({
            success: true,
            conversation: convResult.rows[0],
            messages: messagesResult.rows,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get recent conversations
app.get('/api/conversations', async (req: Request, res: Response) => {
    const { user_id = 'allan', limit = 10 } = req.query;

    try {
        const result = await pool.query(
            `SELECT * FROM code_conversations 
       WHERE user_id = $1 
       ORDER BY updated_at DESC 
       LIMIT $2`,
            [user_id, limit]
        );

        res.json({ success: true, conversations: result.rows });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// MESSAGE ENDPOINTS
// ============================================

// Add message to conversation (with embedding)
app.post('/api/messages', async (req: Request, res: Response) => {
    const { conversation_id, role, content, metadata = {} } = req.body;

    try {
        // Generate embedding for the message
        const embedding = await getEmbedding(content);
        const embeddingArray = embedding.length > 0 ? `[${embedding.join(',')}]` : null;

        const result = await pool.query(
            `INSERT INTO code_messages (conversation_id, role, content, embedding, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, conversation_id, role, content, created_at, metadata`,
            [conversation_id, role, content, embeddingArray, JSON.stringify(metadata)]
        );

        res.json({ success: true, message: result.rows[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// VECTOR SEARCH ENDPOINTS
// ============================================

// Search past conversations
app.post('/api/search/messages', async (req: Request, res: Response) => {
    const { query, user_id = 'allan', limit = 5, similarity_threshold = 0.7 } = req.body;

    try {
        // Generate embedding for search query
        const embedding = await getEmbedding(query);

        if (embedding.length === 0) {
            return res.json({ success: true, results: [] });
        }

        const embeddingArray = `[${embedding.join(',')}]`;

        const result = await pool.query(
            `SELECT * FROM search_code_messages($1::vector, $2, $3, $4)`,
            [embeddingArray, user_id, limit, similarity_threshold]
        );

        res.json({ success: true, results: result.rows });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Search code blocks
app.post('/api/search/code-blocks', async (req: Request, res: Response) => {
    const { query, limit = 5, similarity_threshold = 0.7 } = req.body;

    try {
        const embedding = await getEmbedding(query);

        if (embedding.length === 0) {
            return res.json({ success: true, results: [] });
        }

        const embeddingArray = `[${embedding.join(',')}]`;

        const result = await pool.query(
            `SELECT * FROM search_code_blocks($1::vector, $2, $3)`,
            [embeddingArray, limit, similarity_threshold]
        );

        res.json({ success: true, results: result.rows });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Search learned patterns
app.post('/api/search/patterns', async (req: Request, res: Response) => {
    const { query, user_id = 'allan', limit = 5, similarity_threshold = 0.7 } = req.body;

    try {
        const embedding = await getEmbedding(query);

        if (embedding.length === 0) {
            return res.json({ success: true, results: [] });
        }

        const embeddingArray = `[${embedding.join(',')}]`;

        const result = await pool.query(
            `SELECT * FROM search_learned_patterns($1::vector, $2, $3, $4)`,
            [embeddingArray, user_id, limit, similarity_threshold]
        );

        res.json({ success: true, results: result.rows });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// CODE BLOCK ENDPOINTS
// ============================================

// Save code block
app.post('/api/code-blocks', async (req: Request, res: Response) => {
    const { file_path, language, content, tags = [], session_id, conversation_id, metadata = {} } = req.body;

    try {
        const embedding = await getEmbedding(content);
        const embeddingArray = embedding.length > 0 ? `[${embedding.join(',')}]` : null;

        const result = await pool.query(
            `INSERT INTO code_blocks (file_path, language, content, embedding, tags, session_id, conversation_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, file_path, language, created_at`,
            [file_path, language, content, embeddingArray, tags, session_id, conversation_id, JSON.stringify(metadata)]
        );

        res.json({ success: true, code_block: result.rows[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// LEARNED PATTERNS ENDPOINTS
// ============================================

// Save learned pattern
app.post('/api/patterns', async (req: Request, res: Response) => {
    const { user_id = 'allan', pattern_type, pattern_name, example_code, explanation, metadata = {} } = req.body;

    try {
        const embedding = await getEmbedding(`${pattern_name}: ${explanation}\n\n${example_code}`);
        const embeddingArray = embedding.length > 0 ? `[${embedding.join(',')}]` : null;

        const result = await pool.query(
            `INSERT INTO learned_patterns (user_id, pattern_type, pattern_name, example_code, explanation, embedding, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, pattern_type, pattern_name, created_at`,
            [user_id, pattern_type, pattern_name, example_code, explanation, embeddingArray, JSON.stringify(metadata)]
        );

        res.json({ success: true, pattern: result.rows[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PERSONALITY STATE ENDPOINTS
// ============================================

// Get Robbie's current state
app.get('/api/personality/:user_id?', async (req: Request, res: Response) => {
    const { user_id = 'allan' } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM robbie_personality_state WHERE user_id = $1',
            [user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Personality state not found' });
        }

        res.json({ success: true, personality: result.rows[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update Robbie's state
app.put('/api/personality/:user_id?', async (req: Request, res: Response) => {
    const { user_id = 'allan' } = req.params;
    const { current_mood, gandhi_genghis_level, attraction_level, context = {} } = req.body;

    try {
        const result = await pool.query(
            `UPDATE robbie_personality_state 
       SET current_mood = COALESCE($2, current_mood),
           gandhi_genghis_level = COALESCE($3, gandhi_genghis_level),
           attraction_level = COALESCE($4, attraction_level),
           context = COALESCE($5, context),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING *`,
            [user_id, current_mood, gandhi_genghis_level, attraction_level, JSON.stringify(context)]
        );

        res.json({ success: true, personality: result.rows[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// OLLAMA PROXY (Streaming)
// ============================================

app.post('/api/chat', async (req: Request, res: Response) => {
    const { model, messages, stream = true } = req.body;

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages, stream }),
        });

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
        }

        if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                res.write(chunk);
            }

            res.end();
        } else {
            const data = await response.json();
            res.json(data);
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, async () => {
    console.log(`🚀 Robbieverse API running on http://localhost:${PORT}`);
    console.log(`📊 Postgres: ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}`);
    console.log(`🤖 Ollama: ${OLLAMA_BASE_URL}`);

    // Check embedding availability
    const localAvailable = await localEmbeddings.isAvailable();
    const openaiAvailable = !!process.env.OPENAI_API_KEY;

    if (localAvailable) {
        console.log(`🧠 Embeddings: Local (nomic-embed-text) ✅`);
    } else if (openaiAvailable) {
        console.log(`🧠 Embeddings: OpenAI (text-embedding-3-small) ✅`);
    } else {
        console.log(`🧠 Embeddings: ❌ DISABLED`);
        console.log(`   → Run: ollama pull nomic-embed-text`);
        console.log(`   → Or set: OPENAI_API_KEY=sk-...`);
    }
});

export default app;

