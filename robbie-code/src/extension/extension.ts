import * as vscode from 'vscode';
import { getRobbiePrompt } from '../personality/prompts';
import { RobbiverseAPIClient } from './api-client';
import { AutocompleteProvider } from './autocomplete-provider';
import { OllamaClient } from './ollama-client';

let chatPanel: vscode.WebviewPanel | undefined;
let robbieBarProvider: RobbieBarProvider | undefined;
let ollamaClient: OllamaClient;
let apiClient: RobbiverseAPIClient;

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 Robbie@Code activating with Smart Memory...');

    // Initialize Ollama (for autocomplete only)
    const config = vscode.workspace.getConfiguration('robbie');
    const ollamaUrl = config.get<string>('ollamaUrl', 'http://localhost:11435');
    ollamaClient = new OllamaClient(ollamaUrl);

    // Initialize Smart Robbie API (for chat with memory)
    const apiUrl = config.get<string>('apiUrl', 'http://localhost:3001');
    apiClient = new RobbiverseAPIClient(apiUrl);

    // Register RobbieBar sidebar
    robbieBarProvider = new RobbieBarProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'robbie.robbieBar',
            robbieBarProvider
        )
    );

    // Register autocomplete
    const autocompleteModel = config.get<string>('autocompleteModel', 'qwen2.5-coder:7b');
    const autocomplete = new AutocompleteProvider(ollamaClient, autocompleteModel);

    context.subscriptions.push(
        vscode.languages.registerInlineCompletionItemProvider(
            { pattern: '**' },
            autocomplete
        )
    );

    // Command: Open Chat (Cmd+L)
    context.subscriptions.push(
        vscode.commands.registerCommand('robbie.openChat', () => {
            if (chatPanel) {
                chatPanel.reveal(vscode.ViewColumn.Two);
            } else {
                chatPanel = vscode.window.createWebviewPanel(
                    'robbieChat',
                    'Robbie@Code',
                    vscode.ViewColumn.Two,
                    {
                        enableScripts: true,
                        retainContextWhenHidden: true
                    }
                );

                chatPanel.webview.html = getWebviewContent(context, chatPanel.webview);

                // Handle messages from webview
                chatPanel.webview.onDidReceiveMessage(
                    async (message) => {
                        if (message.type === 'chat') {
                            await handleChatRequest(message, chatPanel!.webview);
                        }
                    },
                    undefined,
                    context.subscriptions
                );

                chatPanel.onDidDispose(() => {
                    chatPanel = undefined;
                });
            }
        })
    );

    // Command: Inline Edit (Cmd+I)
    context.subscriptions.push(
        vscode.commands.registerCommand('robbie.inlineEdit', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);

            const instruction = await vscode.window.showInputBox({
                prompt: 'What should Robbie do?',
                placeHolder: 'Add error handling, refactor, etc.'
            });

            if (!instruction) return;

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: '🤖 Robbie is editing...',
                cancellable: false
            }, async () => {
                const chatModel = config.get<string>('chatModel', 'qwen2.5-coder:7b');
                const result = await ollamaClient.chat(chatModel, [
                    { role: 'system', content: getRobbiePrompt() },
                    { role: 'user', content: `${instruction}\n\n\`\`\`\n${selectedText}\n\`\`\`` }
                ]);

                const code = extractCode(result);
                await editor.edit(editBuilder => {
                    editBuilder.replace(selection, code);
                });

                vscode.window.showInformationMessage('✅ Robbie applied changes');
            });
        })
    );

    // Command: Explain Code
    context.subscriptions.push(
        vscode.commands.registerCommand('robbie.explain', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) return;

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
        })
    );
}

async function handleChatRequest(message: any, webview: vscode.Webview) {
    const config = vscode.workspace.getConfiguration('robbie');
    const chatModel = config.get<string>('chatModel', 'qwen2.5-coder:7b');

    try {
        // Create conversation if this is the first message
        if (!apiClient.getCurrentConversationId()) {
            const editor = vscode.window.activeTextEditor;
            const fileName = editor?.document.fileName.split('/').pop() || 'Coding Session';
            await apiClient.createConversation(`Robbie@Code: ${fileName}`);
        }

        const conversationId = apiClient.getCurrentConversationId()!;

        // Get user's latest message
        const userMessage = message.messages[message.messages.length - 1];

        // Save user message to memory
        await apiClient.addMessage(conversationId, 'user', userMessage.content);

        // Build enriched messages with context from past conversations and patterns
        const enrichedMessages = await apiClient.buildEnrichedMessages(
            userMessage.content,
            getRobbiePrompt()
        );

        // Stream response from Ollama via API
        let fullResponse = '';
        await apiClient.chatStream(
            chatModel,
            enrichedMessages,
            (token) => {
                fullResponse += token;
                webview.postMessage({ type: 'token', token });
            }
        );

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
    } catch (error: any) {
        webview.postMessage({
            type: 'error',
            error: error.message
        });
    }
}

function extractCode(response: string): string {
    const match = /```[\w]*\n([\s\S]*?)```/.exec(response);
    return match ? match[1].trim() : response.trim();
}

function getWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview.js')
    );

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
class RobbieBarProvider implements vscode.WebviewViewProvider {
    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'openChat':
                        vscode.commands.executeCommand('robbie.openChat');
                        break;
                    case 'openConversation':
                        // TODO: Load specific conversation
                        vscode.commands.executeCommand('robbie.openChat');
                        break;
                }
            }
        );
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'robbie-bar.js')
        );

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

export function deactivate() { }
