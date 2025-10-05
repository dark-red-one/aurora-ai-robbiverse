/**
 * Aurora AI Empire - Test Utilities
 * Common testing helpers and utilities
 */

// Test database setup
export const setupTestDatabase = async () => {
    // Setup test database connection
    // Run migrations for test schema
    // Seed test data
};

// Test data factories
export const createTestUser = (overrides = {}) => ({
    id: 'test-user-123',
    username: 'testuser',
    email: 'test@example.com',
    password_hash: 'hashed_password',
    role: 'user',
    is_active: true,
    preferences: {},
    metadata: {},
    ...overrides
});

export const createTestConversation = (overrides = {}) => ({
    id: 'test-conversation-456',
    user_id: 'test-user-123',
    title: 'Test Conversation',
    type: 'chat',
    status: 'active',
    message_count: 0,
    metadata: {},
    tags: [],
    importance_score: 5,
    ...overrides
});

export const createTestMessage = (overrides = {}) => ({
    id: 'test-message-789',
    conversation_id: 'test-conversation-456',
    role: 'user',
    content: 'Hello, this is a test message',
    embedding: null,
    token_count: 8,
    model_used: 'llama3.1:8b',
    emotional_tone: 'neutral',
    confidence_score: 0.9,
    metadata: {},
    ...overrides
});

// Mock services
export const mockOpenAI = () => ({
    generateResponse: jest.fn().mockResolvedValue({
        content: 'Mock AI response',
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
    })
});

export const mockDatabase = () => ({
    query: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn()
});

export const mockWebSocket = () => ({
    send: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    emit: jest.fn()
});

// Test assertions
export const expectValidUser = (user) => {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('username');
    expect(user.email).toMatch(/@/);
};

export const expectValidConversation = (conversation) => {
    expect(conversation).toHaveProperty('id');
    expect(conversation).toHaveProperty('user_id');
    expect(conversation).toHaveProperty('created_at');
    expect(['chat', 'support', 'training', 'system']).toContain(conversation.type);
};

export const expectValidMessage = (message) => {
    expect(message).toHaveProperty('id');
    expect(message).toHaveProperty('conversation_id');
    expect(message).toHaveProperty('content');
    expect(message.content.length).toBeGreaterThan(0);
    expect(['user', 'assistant', 'system', 'gatekeeper']).toContain(message.role);
};

// Performance testing helpers
export const measurePerformance = async (fn, iterations = 100) => {
    const times = [];

    for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        await fn();
        const end = process.hrtime.bigint();
        times.push(Number(end - start) / 1000000); // Convert to milliseconds
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return { avg, min, max, times };
};

// Load testing helpers
export const simulateConcurrentUsers = async (userCount, action) => {
    const promises = [];

    for (let i = 0; i < userCount; i++) {
        promises.push(action(i));
    }

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return { successful, failed, total: userCount };
};

// Cleanup helpers
export const cleanupTestData = async () => {
    // Clean up test database
    // Close connections
    // Reset mocks
};

export const setupTestEnvironment = async () => {
    await setupTestDatabase();
    // Setup other test dependencies
};

export const teardownTestEnvironment = async () => {
    await cleanupTestData();
    // Teardown other test dependencies
};
