import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

declare function acquireVsCodeApi(): any;

interface RobbieState {
    mood: string;
    gandhiGenghis: number;
    attraction: number;
}

interface Conversation {
    id: string;
    title: string;
    context_type: string;
    updated_at: string;
    message_count: number;
}

interface Stats {
    conversations: number;
    messages: number;
    patterns: number;
    codeBlocks: number;
}

const vscode = acquireVsCodeApi();

function RobbieBar() {
    const [robbieState, setRobbieState] = useState<RobbieState>({
        mood: 'focused',
        gandhiGenghis: 7,
        attraction: 8
    });
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [stats, setStats] = useState<Stats>({
        conversations: 0,
        messages: 0,
        patterns: 0,
        codeBlocks: 0
    });
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Load initial data
        loadRobbieState();
        loadConversations();
        loadStats();

        // Refresh every 30 seconds
        const interval = setInterval(() => {
            loadRobbieState();
            loadConversations();
            loadStats();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const loadRobbieState = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/personality/allan');
            const data = await response.json();
            if (data.success) {
                setRobbieState({
                    mood: data.personality.current_mood,
                    gandhiGenghis: data.personality.gandhi_genghis_level,
                    attraction: data.personality.attraction_level
                });
                setIsConnected(true);
            }
        } catch (error) {
            setIsConnected(false);
        }
    };

    const loadConversations = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/conversations?user_id=allan&limit=5');
            const data = await response.json();
            if (data.success) {
                setConversations(data.conversations);
            }
        } catch (error) {
            console.error('Failed to load conversations', error);
        }
    };

    const loadStats = async () => {
        // In production, add a /api/stats endpoint
        // For now, use conversation count
        setStats({
            conversations: conversations.length,
            messages: 0,
            patterns: 0,
            codeBlocks: 0
        });
    };

    const changeMood = async (newMood: string) => {
        try {
            await fetch('http://localhost:3001/api/personality/allan', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_mood: newMood })
            });
            loadRobbieState();
        } catch (error) {
            console.error('Failed to change mood', error);
        }
    };

    const openChat = () => {
        vscode.postMessage({ type: 'openChat' });
    };

    const openConversation = (convId: string) => {
        vscode.postMessage({ type: 'openConversation', conversationId: convId });
    };

    const getMoodEmoji = (mood: string) => {
        const moods: Record<string, string> = {
            'friendly': '😊',
            'focused': '🎯',
            'playful': '😜',
            'bossy': '💪',
            'surprised': '😲',
            'blushing': '😊'
        };
        return moods[mood] || '🤖';
    };

    return (
        <div style={{
            padding: '16px',
            background: '#1e1e1e',
            color: '#d4d4d4',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            height: '100vh',
            overflowY: 'auto'
        }}>
            {/* Header */}
            <div style={{
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid #333'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                }}>
                    <span style={{ fontSize: '32px' }}>{getMoodEmoji(robbieState.mood)}</span>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 600 }}>Robbie</div>
                        <div style={{
                            fontSize: '11px',
                            color: isConnected ? '#4ade80' : '#ef4444'
                        }}>
                            {isConnected ? '● Connected' : '● Disconnected'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Personality State */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: '#888'
                }}>
                    PERSONALITY
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        marginBottom: '4px'
                    }}>
                        <span>Mood</span>
                        <span style={{ color: '#4ade80' }}>{robbieState.mood}</span>
                    </div>

                    {/* Mood Selector */}
                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        marginTop: '8px',
                        flexWrap: 'wrap'
                    }}>
                        {['friendly', 'focused', 'playful', 'bossy'].map(mood => (
                            <button
                                key={mood}
                                onClick={() => changeMood(mood)}
                                style={{
                                    padding: '4px 8px',
                                    fontSize: '10px',
                                    background: robbieState.mood === mood ? '#2563eb' : '#2d2d2d',
                                    color: '#fff',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {mood}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        marginBottom: '4px'
                    }}>
                        <span>Gandhi-Genghis</span>
                        <span>{robbieState.gandhiGenghis}/10</span>
                    </div>
                    <div style={{
                        height: '4px',
                        background: '#2d2d2d',
                        borderRadius: '2px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${robbieState.gandhiGenghis * 10}%`,
                            height: '100%',
                            background: `linear-gradient(to right, #4ade80, #ef4444)`,
                            transition: 'width 0.3s'
                        }} />
                    </div>
                </div>

                <div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        marginBottom: '4px'
                    }}>
                        <span>Attraction</span>
                        <span>{robbieState.attraction}/11</span>
                    </div>
                    <div style={{
                        height: '4px',
                        background: '#2d2d2d',
                        borderRadius: '2px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${(robbieState.attraction / 11) * 100}%`,
                            height: '100%',
                            background: '#ec4899',
                            transition: 'width 0.3s'
                        }} />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: '#888'
                }}>
                    QUICK ACTIONS
                </div>

                <button
                    onClick={openChat}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 600,
                        marginBottom: '8px'
                    }}
                >
                    💬 Open Chat (Cmd+L)
                </button>
            </div>

            {/* Stats */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: '#888'
                }}>
                    MEMORY STATS
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                }}>
                    <div style={{
                        padding: '12px',
                        background: '#2d2d2d',
                        borderRadius: '6px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 600 }}>
                            {conversations.length}
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>
                            Conversations
                        </div>
                    </div>
                    <div style={{
                        padding: '12px',
                        background: '#2d2d2d',
                        borderRadius: '6px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 600 }}>
                            {stats.messages}
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>
                            Messages
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Conversations */}
            <div>
                <div style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: '#888'
                }}>
                    RECENT SESSIONS
                </div>

                {conversations.length === 0 ? (
                    <div style={{
                        padding: '16px',
                        background: '#2d2d2d',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#888',
                        textAlign: 'center'
                    }}>
                        No conversations yet.
                        <br />
                        Press Cmd+L to start!
                    </div>
                ) : (
                    conversations.map(conv => (
                        <div
                            key={conv.id}
                            onClick={() => openConversation(conv.id)}
                            style={{
                                padding: '12px',
                                background: '#2d2d2d',
                                borderRadius: '6px',
                                marginBottom: '8px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                border: '1px solid transparent',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#2563eb';
                                e.currentTarget.style.background = '#2a2a2a';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'transparent';
                                e.currentTarget.style.background = '#2d2d2d';
                            }}
                        >
                            <div style={{
                                fontWeight: 600,
                                marginBottom: '4px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {conv.title || 'Untitled'}
                            </div>
                            <div style={{
                                fontSize: '10px',
                                color: '#888',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span>{conv.context_type}</span>
                                <span>{conv.message_count || 0} msgs</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const root = createRoot(document.getElementById('root')!);
root.render(<RobbieBar />);

