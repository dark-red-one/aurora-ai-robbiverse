"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const client_1 = require("react-dom/client");
const vscode = acquireVsCodeApi();
function RobbieBar() {
    const [robbieState, setRobbieState] = (0, react_1.useState)({
        mood: 'focused',
        gandhiGenghis: 7,
        attraction: 8
    });
    const [conversations, setConversations] = (0, react_1.useState)([]);
    const [stats, setStats] = (0, react_1.useState)({
        conversations: 0,
        messages: 0,
        patterns: 0,
        codeBlocks: 0
    });
    const [isConnected, setIsConnected] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
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
        }
        catch (error) {
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
        }
        catch (error) {
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
    const changeMood = async (newMood) => {
        try {
            await fetch('http://localhost:3001/api/personality/allan', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_mood: newMood })
            });
            loadRobbieState();
        }
        catch (error) {
            console.error('Failed to change mood', error);
        }
    };
    const openChat = () => {
        vscode.postMessage({ type: 'openChat' });
    };
    const openConversation = (convId) => {
        vscode.postMessage({ type: 'openConversation', conversationId: convId });
    };
    const getMoodEmoji = (mood) => {
        const moods = {
            'friendly': '😊',
            'focused': '🎯',
            'playful': '😜',
            'bossy': '💪',
            'surprised': '😲',
            'blushing': '😊'
        };
        return moods[mood] || '🤖';
    };
    return (react_1.default.createElement("div", { style: {
            padding: '16px',
            background: '#1e1e1e',
            color: '#d4d4d4',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            height: '100vh',
            overflowY: 'auto'
        } },
        react_1.default.createElement("div", { style: {
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid #333'
            } },
            react_1.default.createElement("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                } },
                react_1.default.createElement("span", { style: { fontSize: '32px' } }, getMoodEmoji(robbieState.mood)),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { style: { fontSize: '18px', fontWeight: 600 } }, "Robbie"),
                    react_1.default.createElement("div", { style: {
                            fontSize: '11px',
                            color: isConnected ? '#4ade80' : '#ef4444'
                        } }, isConnected ? '● Connected' : '● Disconnected')))),
        react_1.default.createElement("div", { style: { marginBottom: '24px' } },
            react_1.default.createElement("div", { style: {
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: '#888'
                } }, "PERSONALITY"),
            react_1.default.createElement("div", { style: { marginBottom: '12px' } },
                react_1.default.createElement("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        marginBottom: '4px'
                    } },
                    react_1.default.createElement("span", null, "Mood"),
                    react_1.default.createElement("span", { style: { color: '#4ade80' } }, robbieState.mood)),
                react_1.default.createElement("div", { style: {
                        display: 'flex',
                        gap: '4px',
                        marginTop: '8px',
                        flexWrap: 'wrap'
                    } }, ['friendly', 'focused', 'playful', 'bossy'].map(mood => (react_1.default.createElement("button", { key: mood, onClick: () => changeMood(mood), style: {
                        padding: '4px 8px',
                        fontSize: '10px',
                        background: robbieState.mood === mood ? '#2563eb' : '#2d2d2d',
                        color: '#fff',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    } }, mood))))),
            react_1.default.createElement("div", { style: { marginBottom: '8px' } },
                react_1.default.createElement("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        marginBottom: '4px'
                    } },
                    react_1.default.createElement("span", null, "Gandhi-Genghis"),
                    react_1.default.createElement("span", null,
                        robbieState.gandhiGenghis,
                        "/10")),
                react_1.default.createElement("div", { style: {
                        height: '4px',
                        background: '#2d2d2d',
                        borderRadius: '2px',
                        overflow: 'hidden'
                    } },
                    react_1.default.createElement("div", { style: {
                            width: `${robbieState.gandhiGenghis * 10}%`,
                            height: '100%',
                            background: `linear-gradient(to right, #4ade80, #ef4444)`,
                            transition: 'width 0.3s'
                        } }))),
            react_1.default.createElement("div", null,
                react_1.default.createElement("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        marginBottom: '4px'
                    } },
                    react_1.default.createElement("span", null, "Attraction"),
                    react_1.default.createElement("span", null,
                        robbieState.attraction,
                        "/11")),
                react_1.default.createElement("div", { style: {
                        height: '4px',
                        background: '#2d2d2d',
                        borderRadius: '2px',
                        overflow: 'hidden'
                    } },
                    react_1.default.createElement("div", { style: {
                            width: `${(robbieState.attraction / 11) * 100}%`,
                            height: '100%',
                            background: '#ec4899',
                            transition: 'width 0.3s'
                        } })))),
        react_1.default.createElement("div", { style: { marginBottom: '24px' } },
            react_1.default.createElement("div", { style: {
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: '#888'
                } }, "QUICK ACTIONS"),
            react_1.default.createElement("button", { onClick: openChat, style: {
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
                } }, "\uD83D\uDCAC Open Chat (Cmd+L)")),
        react_1.default.createElement("div", { style: { marginBottom: '24px' } },
            react_1.default.createElement("div", { style: {
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: '#888'
                } }, "MEMORY STATS"),
            react_1.default.createElement("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                } },
                react_1.default.createElement("div", { style: {
                        padding: '12px',
                        background: '#2d2d2d',
                        borderRadius: '6px',
                        textAlign: 'center'
                    } },
                    react_1.default.createElement("div", { style: { fontSize: '24px', fontWeight: 600 } }, conversations.length),
                    react_1.default.createElement("div", { style: { fontSize: '11px', color: '#888' } }, "Conversations")),
                react_1.default.createElement("div", { style: {
                        padding: '12px',
                        background: '#2d2d2d',
                        borderRadius: '6px',
                        textAlign: 'center'
                    } },
                    react_1.default.createElement("div", { style: { fontSize: '24px', fontWeight: 600 } }, stats.messages),
                    react_1.default.createElement("div", { style: { fontSize: '11px', color: '#888' } }, "Messages")))),
        react_1.default.createElement("div", null,
            react_1.default.createElement("div", { style: {
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    color: '#888'
                } }, "RECENT SESSIONS"),
            conversations.length === 0 ? (react_1.default.createElement("div", { style: {
                    padding: '16px',
                    background: '#2d2d2d',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#888',
                    textAlign: 'center'
                } },
                "No conversations yet.",
                react_1.default.createElement("br", null),
                "Press Cmd+L to start!")) : (conversations.map(conv => (react_1.default.createElement("div", { key: conv.id, onClick: () => openConversation(conv.id), style: {
                    padding: '12px',
                    background: '#2d2d2d',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    border: '1px solid transparent',
                    transition: 'all 0.2s'
                }, onMouseEnter: (e) => {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.background = '#2a2a2a';
                }, onMouseLeave: (e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.background = '#2d2d2d';
                } },
                react_1.default.createElement("div", { style: {
                        fontWeight: 600,
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    } }, conv.title || 'Untitled'),
                react_1.default.createElement("div", { style: {
                        fontSize: '10px',
                        color: '#888',
                        display: 'flex',
                        justifyContent: 'space-between'
                    } },
                    react_1.default.createElement("span", null, conv.context_type),
                    react_1.default.createElement("span", null,
                        conv.message_count || 0,
                        " msgs")))))))));
}
const root = (0, client_1.createRoot)(document.getElementById('root'));
root.render(react_1.default.createElement(RobbieBar, null));
//# sourceMappingURL=RobbieBar.js.map