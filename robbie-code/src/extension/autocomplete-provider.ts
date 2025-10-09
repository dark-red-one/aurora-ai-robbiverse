import * as vscode from 'vscode';
import { OllamaClient } from './ollama-client';

export class AutocompleteProvider implements vscode.InlineCompletionItemProvider {
    private lastRequest = 0;
    private debounceMs = 250;

    constructor(
        private ollama: OllamaClient,
        private model: string
    ) { }

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[]> {
        // Debounce
        const now = Date.now();
        if (now - this.lastRequest < this.debounceMs) {
            return [];
        }
        this.lastRequest = now;

        try {
            // Get context
            const linePrefix = document.lineAt(position.line).text.substring(0, position.character);

            // Skip if just whitespace
            if (!linePrefix.trim()) return [];

            // Get surrounding code
            const startLine = Math.max(0, position.line - 20);
            const endLine = Math.min(document.lineCount - 1, position.line + 5);

            const prefix = document.getText(new vscode.Range(
                new vscode.Position(startLine, 0),
                position
            ));

            const suffix = document.getText(new vscode.Range(
                position,
                new vscode.Position(endLine, document.lineAt(endLine).text.length)
            ));

            // Get completion
            const completion = await this.ollama.complete(this.model, prefix, suffix);

            if (!completion || token.isCancellationRequested) {
                return [];
            }

            return [{
                insertText: completion,
                range: new vscode.Range(position, position)
            }];

        } catch (error) {
            console.error('Autocomplete error:', error);
            return [];
        }
    }
}

