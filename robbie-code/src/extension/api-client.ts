// Robbieverse API Client - Connects to Smart Robbie backend
interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface SearchResult {
    id: string;
    content: string;
    similarity: number;
    created_at: string;
}

interface Conversation {
    id: string;
    session_id: string;
    title?: string;
    context_type: string;
    created_at: string;
}

export class RobbiverseAPIClient {
    private baseUrl: string;
    private sessionId: string;
    private currentConversationId: string | null = null;

    constructor(baseUrl: string = 'http://localhost:3001') {
        this.baseUrl = baseUrl;
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Create new conversation
    async createConversation(title?: string, contextType: string = 'code'): Promise<string> {
        const response = await fetch(`${this.baseUrl}/api/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: 'allan',
                session_id: this.sessionId,
                title,
                context_type: contextType,
            }),
        });

        const data = await response.json();
        if (data.success) {
            this.currentConversationId = data.conversation.id;
            return data.conversation.id;
        }
        throw new Error(data.error || 'Failed to create conversation');
    }

    // Add message (with auto-embedding)
    async addMessage(conversationId: string, role: string, content: string, metadata: any = {}): Promise<void> {
        await fetch(`${this.baseUrl}/api/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversation_id: conversationId,
                role,
                content,
                metadata,
            }),
        });
    }

    // Search past conversations
    async searchMessages(query: string, limit: number = 5): Promise<SearchResult[]> {
        const response = await fetch(`${this.baseUrl}/api/search/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                user_id: 'allan',
                limit,
                similarity_threshold: 0.7,
            }),
        });

        const data = await response.json();
        return data.success ? data.results : [];
    }

    // Search code blocks
    async searchCodeBlocks(query: string, limit: number = 5): Promise<any[]> {
        const response = await fetch(`${this.baseUrl}/api/search/code-blocks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                limit,
                similarity_threshold: 0.7,
            }),
        });

        const data = await response.json();
        return data.success ? data.results : [];
    }

    // Search learned patterns
    async searchPatterns(query: string, limit: number = 3): Promise<any[]> {
        const response = await fetch(`${this.baseUrl}/api/search/patterns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                user_id: 'allan',
                limit,
                similarity_threshold: 0.75,
            }),
        });

        const data = await response.json();
        return data.success ? data.results : [];
    }

    // Save code block
    async saveCodeBlock(filePath: string, language: string, content: string, conversationId?: string): Promise<void> {
        await fetch(`${this.baseUrl}/api/code-blocks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file_path: filePath,
                language,
                content,
                tags: [language, 'testpilot'],
                session_id: this.sessionId,
                conversation_id: conversationId || this.currentConversationId,
            }),
        });
    }

    // Chat with Ollama (streaming) via API
    async chatStream(
        model: string,
        messages: Message[],
        onToken: (token: string) => void
    ): Promise<void> {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,
                stream: true,
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(Boolean);

            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    if (json.message?.content) {
                        onToken(json.message.content);
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        }
    }

    // Build context-enriched messages
    async buildEnrichedMessages(userQuery: string, systemPrompt: string): Promise<Message[]> {
        const messages: Message[] = [{ role: 'system', content: systemPrompt }];

        try {
            // Search for relevant past conversations
            const pastConversations = await this.searchMessages(userQuery, 3);

            // Search for relevant code patterns
            const patterns = await this.searchPatterns(userQuery, 2);

            // Build context string
            let contextParts: string[] = [];

            if (pastConversations.length > 0) {
                contextParts.push('📚 Relevant past context:');
                pastConversations.forEach((conv, i) => {
                    contextParts.push(`${i + 1}. ${conv.content.substring(0, 200)}... (${Math.round(conv.similarity * 100)}% relevant)`);
                });
            }

            if (patterns.length > 0) {
                contextParts.push('\n🎯 Your established patterns:');
                patterns.forEach((pattern, i) => {
                    contextParts.push(`${i + 1}. [${pattern.pattern_type}] ${pattern.pattern_name}: ${pattern.explanation}`);
                });
            }

            // Add context as system message if we found anything
            if (contextParts.length > 0) {
                messages.push({
                    role: 'system',
                    content: contextParts.join('\n'),
                });
            }
        } catch (error) {
            console.error('Failed to enrich context:', error);
            // Continue without enriched context
        }

        // Add user query
        messages.push({ role: 'user', content: userQuery });

        return messages;
    }

    // Get current conversation ID
    getCurrentConversationId(): string | null {
        return this.currentConversationId;
    }

    // Get personality state
    async getPersonality(): Promise<any> {
        const response = await fetch(`${this.baseUrl}/api/personality/allan`);
        const data = await response.json();
        return data.success ? data.personality : null;
    }
}


