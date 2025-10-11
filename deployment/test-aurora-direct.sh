#!/bin/bash
# Test direct Aurora GPU access without SSH

echo "🔍 Testing Aurora GPU Access (No SSH Required)"
echo "==============================================="
echo ""

# Test different Ollama ports
PORTS=(11434 8080 8000 10002 10003)
HOST="aurora-u44170.vm.elestio.app"

for PORT in "${PORTS[@]}"; do
    echo "Testing ${HOST}:${PORT}/api/tags ..."
    RESPONSE=$(curl -s --connect-timeout 3 "http://${HOST}:${PORT}/api/tags" 2>&1)
    
    if echo "$RESPONSE" | grep -q "models"; then
        echo "✅ FOUND IT! Ollama is accessible at port ${PORT}"
        echo ""
        echo "Models available:"
        echo "$RESPONSE" | jq -r '.models[].name' 2>/dev/null || echo "$RESPONSE"
        echo ""
        echo "🎯 Use this endpoint: http://${HOST}:${PORT}"
        exit 0
    fi
done

echo ""
echo "❌ Ollama not accessible on any tested port"
echo ""
echo "Manual option: Add SSH key via web terminal"
echo "1. Go to: https://aurora-u44170.vm.elestio.app:10004/"
echo "2. Login: root / quB7SC-7bM5-KW3O9U"
echo "3. Paste:"
echo ""
cat << 'EOF'
mkdir -p /root/.ssh && echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIKtYaAt1pjSiHpFJbktjN8JfzJ8SLhiMnpf1QsZnJIQ robbiebook@aurora-empire" >> /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys && echo "✅ Done!"
EOF
echo ""
echo "Then test SSH: ssh -p 10001 root@aurora-u44170.vm.elestio.app 'hostname'"

