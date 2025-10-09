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
exports.AutocompleteProvider = void 0;
const vscode = __importStar(require("vscode"));
class AutocompleteProvider {
    constructor(ollama, model) {
        this.ollama = ollama;
        this.model = model;
        this.lastRequest = 0;
        this.debounceMs = 250;
    }
    async provideInlineCompletionItems(document, position, context, token) {
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
            if (!linePrefix.trim())
                return [];
            // Get surrounding code
            const startLine = Math.max(0, position.line - 20);
            const endLine = Math.min(document.lineCount - 1, position.line + 5);
            const prefix = document.getText(new vscode.Range(new vscode.Position(startLine, 0), position));
            const suffix = document.getText(new vscode.Range(position, new vscode.Position(endLine, document.lineAt(endLine).text.length)));
            // Get completion
            const completion = await this.ollama.complete(this.model, prefix, suffix);
            if (!completion || token.isCancellationRequested) {
                return [];
            }
            return [{
                    insertText: completion,
                    range: new vscode.Range(position, position)
                }];
        }
        catch (error) {
            console.error('Autocomplete error:', error);
            return [];
        }
    }
}
exports.AutocompleteProvider = AutocompleteProvider;
//# sourceMappingURL=autocomplete-provider.js.map