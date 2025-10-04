#!/bin/bash
echo "🧪 Testing SSH connection to Aurora Town..."
echo ""
echo "Attempting: ssh root@aurora-town-u44170.vm.elestio.app -o ConnectTimeout=10 echo 'Connection OK'"
ssh root@aurora-town-u44170.vm.elestio.app -o ConnectTimeout=10 echo "✅ Connection OK" 2>&1
