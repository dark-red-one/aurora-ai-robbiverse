import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();

function App() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Handle messages from extension
        const handler = (event: MessageEvent) => {
            const { type, token, error } = event.data;

            if (type === 'token') {
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last?.role === 'assistant') {
                        return [...prev.slice(0, -1), {
                            ...last,
                            content: last.content + token
                        }];
                    }
                    return [...prev, { role: 'assistant', content: token }];
                });
            }

            if (type === 'done') {
                setIsGenerating(false);
            }

            if (type === 'error') {
                setIsGenerating(false);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `❌ Error: ${error}`
                }]);
            }

            if (type === 'autoSend') {
                setInput(event.data.text);
                setTimeout(() => handleSend(event.data.text), 100);
            }
        };

        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (text?: string) => {
        const content = text || input;
        if (!content.trim() || isGenerating) return;

        const userMessage: Message = { role: 'user', content };
        const newMessages = [...messages, userMessage];

        setMessages(newMessages);
        setInput('');
        setIsGenerating(true);

        vscode.postMessage({
            type: 'chat',
            messages: newMessages.map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            }))
        });
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            background: '#1e1e1e',
            color: '#d4d4d4'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <span style={{ fontSize: '24px' }}>🤖</span>
                <div>
                    <div style={{ fontWeight: 600, fontSize: '16px' }}>Robbie@Code</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                        Your AI coding partner • TestPilot CPG
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px'
            }}>
                {messages.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        color: '#888',
                        marginTop: '40px'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
                        <div style={{ fontSize: '18px', marginBottom: '8px' }}>
                            Hey Allan, ready to code?
                        </div>
                        <div style={{ fontSize: '14px' }}>
                            Ask me anything about your code
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} style={{
                        marginBottom: '16px',
                        padding: '12px',
                        background: msg.role === 'user' ? '#2563eb' : '#2d2d2d',
                        borderRadius: '8px',
                        maxWidth: '80%',
                        marginLeft: msg.role === 'user' ? 'auto' : '0'
                    }}>
                        <div style={{
                            fontSize: '12px',
                            marginBottom: '4px',
                            color: msg.role === 'user' ? '#fff' : '#888'
                        }}>
                            {msg.role === 'user' ? 'You' : 'Robbie'}
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap' }}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isGenerating && (
                    <div style={{ color: '#888', fontSize: '14px' }}>
                        ⚡ Thinking...
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
                padding: '16px',
                borderTop: '1px solid #333'
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Ask Robbie anything..."
                        disabled={isGenerating}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: '#2d2d2d',
                            border: '1px solid #444',
                            borderRadius: '6px',
                            color: '#d4d4d4',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={isGenerating || !input.trim()}
                        style={{
                            padding: '12px 24px',
                            background: isGenerating ? '#444' : '#2563eb',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isGenerating ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: 600
                        }}
                    >
                        {isGenerating ? '...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

