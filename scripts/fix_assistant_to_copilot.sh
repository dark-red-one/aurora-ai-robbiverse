#!/bin/bash
# Fix "assistant" references to "copilot" across codebase

echo "🔧 Updating 'assistant' to 'copilot' across codebase..."

# Common patterns to replace
find . -type f \( -name "*.js" -o -name "*.py" -o -name "*.md" -o -name "*.json" -o -name "*.sql" -o -name "*.tsx" -o -name "*.ts" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/venv/*" \
  -not -path "*/.venv/*" \
  -not -path "*/robbiebook_cache/*" \
  -not -path "*/deployment/*" \
  -exec sed -i '' \
    -e "s/AI assistant/AI copilot/g" \
    -e "s/AI Assistant/AI Copilot/g" \
    -e "s/Allan's AI assistant/Allan's AI copilot/g" \
    -e "s/Allan's AI Assistant/Allan's AI Copilot/g" \
    -e "s/personal AI assistant/personal AI copilot/g" \
    -e "s/Personal AI Assistant/Personal AI Copilot/g" \
    -e "s/business assistant/business copilot/g" \
    -e "s/Business Assistant/Business Copilot/g" \
    -e "s/your assistant/your copilot/g" \
    -e "s/Your Assistant/Your Copilot/g" \
    -e "s/an assistant/a copilot/g" \
    -e "s/An Assistant/A Copilot/g" \
    {} \;

echo "✅ Replacement complete!"
echo ""
echo "📊 Checking remaining 'assistant' references..."
grep -r "assistant" --include="*.js" --include="*.py" --include="*.md" --include="*.json" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=venv --exclude-dir=.venv . | grep -i "robbie.*assistant\|AI.*assistant" | wc -l
