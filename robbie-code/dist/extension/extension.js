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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const prompts_1 = require("../personality/prompts");
const api_client_1 = require("./api-client");
const autocomplete_provider_1 = require("./autocomplete-provider");
const ollama_client_1 = require("./ollama-client");
let chatPanel;
let robbieBarProvider;
let ollamaClient;
let apiClient;
function activate(context) {
    console.log('🚀 Robbie@Code activating with Smart Memory...');
    // Initialize Ollama (for autocomplete only)
    const config = vscode.workspace.getConfiguration('robbie');
    const ollamaUrl = config.get('ollamaUrl', 'http://localhost:11435');
    ollamaClient = new ollama_client_1.OllamaClient(ollamaUrl);
    // Initialize Smart Robbie API (for chat with memory)
    const apiUrl = config.get('apiUrl', 'http://localhost:3001');
    apiClient = new api_client_1.RobbiverseAPIClient(apiUrl);
    // Register RobbieBar sidebar
    robbieBarProvider = new RobbieBarProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('robbie.robbieBar', robbieBarProvider));
    // Register autocomplete
    const autocompleteModel = config.get('autocompleteModel', 'qwen2.5-coder:7b');
    const autocomplete = new autocomplete_provider_1.AutocompleteProvider(ollamaClient, autocompleteModel);
    context.subscriptions.push(vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, autocomplete));
    // Command: Open Chat (Cmd+L)
    context.subscriptions.push(vscode.commands.registerCommand('robbie.openChat', () => {
        if (chatPanel) {
            chatPanel.reveal(vscode.ViewColumn.Two);
        }
        else {
            chatPanel = vscode.window.createWebviewPanel('robbieChat', 'Robbie@Code', vscode.ViewColumn.Two, {
                enableScripts: true,
                retainContextWhenHidden: true
            });
            chatPanel.webview.html = getWebviewContent(context, chatPanel.webview);
            // Handle messages from webview
            chatPanel.webview.onDidReceiveMessage(async (message) => {
                if (message.type === 'chat') {
                    await handleChatRequest(message, chatPanel.webview);
                }
            }, undefined, context.subscriptions);
            chatPanel.onDidDispose(() => {
                chatPanel = undefined;
            });
        }
    }));
    // Command: Inline Edit (Cmd+I)
    context.subscriptions.push(vscode.commands.registerCommand('robbie.inlineEdit', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        const instruction = await vscode.window.showInputBox({
            prompt: 'What should Robbie do?',
            placeHolder: 'Add error handling, refactor, etc.'
        });
        if (!instruction)
            return;
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: '🤖 Robbie is editing...',
            cancellable: false
        }, async () => {
            const chatModel = config.get('chatModel', 'qwen2.5-coder:7b');
            const result = await ollamaClient.chat(chatModel, [
                { role: 'system', content: (0, prompts_1.getRobbiePrompt)() },
                { role: 'user', content: `${instruction}\n\n\`\`\`\n${selectedText}\n\`\`\`` }
            ]);
            const code = extractCode(result);
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, code);
            });
            vscode.window.showInformationMessage('✅ Robbie applied changes');
        });
    }));
    // Command: Explain Code
    context.subscriptions.push(vscode.commands.registerCommand('robbie.explain', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        vscode.commands.executeCommand('robbie.openChat');
        // Wait for panel to open, then send explanation request
        setTimeout(() => {
            if (chatPanel) {
                chatPanel.webview.postMessage({
                    type: 'autoSend',
                    text: `Explain this code:\n\n\`\`\`\n${selectedText}\n\`\`\``
                });
            }
        }, 500);
    }));
}
async function handleChatRequest(message, webview) {
    const config = vscode.workspace.getConfiguration('robbie');
    const chatModel = config.get('chatModel', 'qwen2.5-coder:7b');
    try {
        // Create conversation if this is the first message
        if (!apiClient.getCurrentConversationId()) {
            const editor = vscode.window.activeTextEditor;
            const fileName = editor?.document.fileName.split('/').pop() || 'Coding Session';
            await apiClient.createConversation(`Robbie@Code: ${fileName}`);
        }
        const conversationId = apiClient.getCurrentConversationId();
        // Get user's latest message
        const userMessage = message.messages[message.messages.length - 1];
        // Save user message to memory
        await apiClient.addMessage(conversationId, 'user', userMessage.content);
        // Build enriched messages with context from past conversations and patterns
        const enrichedMessages = await apiClient.buildEnrichedMessages(userMessage.content, (0, prompts_1.getRobbiePrompt)());
        // Stream response from Ollama via API
        let fullResponse = '';
        await apiClient.chatStream(chatModel, enrichedMessages, (token) => {
            fullResponse += token;
            webview.postMessage({ type: 'token', token });
        });
        // Save assistant response to memory
        await apiClient.addMessage(conversationId, 'assistant', fullResponse);
        // Save any code blocks shown in the conversation
        const editor = vscode.window.activeTextEditor;
        if (editor && fullResponse.includes('```')) {
            const filePath = editor.document.fileName;
            const language = editor.document.languageId;
            const selectedText = editor.document.getText(editor.selection);
            if (selectedText) {
                await apiClient.saveCodeBlock(filePath, language, selectedText, conversationId);
            }
        }
        webview.postMessage({ type: 'done' });
    }
    catch (error) {
        webview.postMessage({
            type: 'error',
            error: error.message
        });
    }
}
function extractCode(response) {
    const match = /```[\w]*\n([\s\S]*?)```/.exec(response);
    return match ? match[1].trim() : response.trim();
}
function getWebviewContent(context, webview) {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview.js'));
    return `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                margin: 0; 
                padding: 0; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
        </style>
    </head>
    <body>
        <div id="root"></div>
        <script src="${scriptUri}"></script>
    </body>
    </html>`;
}
// RobbieBar Sidebar Provider
class RobbieBarProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.type) {
                case 'openChat':
                    vscode.commands.executeCommand('robbie.openChat');
                    break;
                case 'openConversation':
                    // TODO: Load specific conversation
                    vscode.commands.executeCommand('robbie.openChat');
                    break;
            }
        });
    }
    _getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'robbie-bar.js'));
        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src http://localhost:3001; style-src 'unsafe-inline'; script-src 'unsafe-inline' ${webview.cspSource};">
        </head>
        <body>
            <div id="root"></div>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}
function deactivate() { }
//# sourceMappingURL=extension.js.map