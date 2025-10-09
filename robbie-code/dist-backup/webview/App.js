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
function App() {
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [input, setInput] = (0, react_1.useState)('');
    const [isGenerating, setIsGenerating] = (0, react_1.useState)(false);
    const messagesEndRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        // Handle messages from extension
        const handler = (event) => {
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
    (0, react_1.useEffect)(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    const handleSend = (text) => {
        const content = text || input;
        if (!content.trim() || isGenerating)
            return;
        const userMessage = { role: 'user', content };
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
    return (react_1.default.createElement("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            background: '#1e1e1e',
            color: '#d4d4d4'
        } },
        react_1.default.createElement("div", { style: {
                padding: '16px',
                borderBottom: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            } },
            react_1.default.createElement("span", { style: { fontSize: '24px' } }, "\uD83E\uDD16"),
            react_1.default.createElement("div", null,
                react_1.default.createElement("div", { style: { fontWeight: 600, fontSize: '16px' } }, "Robbie@Code"),
                react_1.default.createElement("div", { style: { fontSize: '12px', color: '#888' } }, "Your AI coding partner \u2022 TestPilot CPG"))),
        react_1.default.createElement("div", { style: {
                flex: 1,
                overflowY: 'auto',
                padding: '16px'
            } },
            messages.length === 0 && (react_1.default.createElement("div", { style: {
                    textAlign: 'center',
                    color: '#888',
                    marginTop: '40px'
                } },
                react_1.default.createElement("div", { style: { fontSize: '48px', marginBottom: '16px' } }, "\uD83D\uDC4B"),
                react_1.default.createElement("div", { style: { fontSize: '18px', marginBottom: '8px' } }, "Hey Allan, ready to code?"),
                react_1.default.createElement("div", { style: { fontSize: '14px' } }, "Ask me anything about your code"))),
            messages.map((msg, i) => (react_1.default.createElement("div", { key: i, style: {
                    marginBottom: '16px',
                    padding: '12px',
                    background: msg.role === 'user' ? '#2563eb' : '#2d2d2d',
                    borderRadius: '8px',
                    maxWidth: '80%',
                    marginLeft: msg.role === 'user' ? 'auto' : '0'
                } },
                react_1.default.createElement("div", { style: {
                        fontSize: '12px',
                        marginBottom: '4px',
                        color: msg.role === 'user' ? '#fff' : '#888'
                    } }, msg.role === 'user' ? 'You' : 'Robbie'),
                react_1.default.createElement("div", { style: { whiteSpace: 'pre-wrap' } }, msg.content)))),
            isGenerating && (react_1.default.createElement("div", { style: { color: '#888', fontSize: '14px' } }, "\u26A1 Thinking...")),
            react_1.default.createElement("div", { ref: messagesEndRef })),
        react_1.default.createElement("div", { style: {
                padding: '16px',
                borderTop: '1px solid #333'
            } },
            react_1.default.createElement("div", { style: { display: 'flex', gap: '8px' } },
                react_1.default.createElement("input", { type: "text", value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }, placeholder: "Ask Robbie anything...", disabled: isGenerating, style: {
                        flex: 1,
                        padding: '12px',
                        background: '#2d2d2d',
                        border: '1px solid #444',
                        borderRadius: '6px',
                        color: '#d4d4d4',
                        fontSize: '14px',
                        outline: 'none'
                    } }),
                react_1.default.createElement("button", { onClick: () => handleSend(), disabled: isGenerating || !input.trim(), style: {
                        padding: '12px 24px',
                        background: isGenerating ? '#444' : '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 600
                    } }, isGenerating ? '...' : 'Send')))));
}
const root = (0, client_1.createRoot)(document.getElementById('root'));
root.render(react_1.default.createElement(App, null));
//# sourceMappingURL=App.js.map