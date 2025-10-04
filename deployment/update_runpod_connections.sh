#!/bin/bash
# Update RunPod connection details based on actual console info

echo "🔍 Updating RunPod connection details..."

# From the RunPod console screenshot, I can see:
# 1. allied_ivory_gerbil (ID: 2tbwzatlrjdy7i) - RTX 4090 x2 - $1.19/hr (Aurora Primary)
# 2. collaboration (ID: 7k1b1gn8pa3k43) - RTX 4090 x1 - $0.60/hr (Collaboration Secondary)  
# 3. fluenti-marketing-001 (ID: n4zcnj47dy7q05) - RTX 4090 x1 - $0.60/hr (Fluenti Marketing)

# We need to get the actual SSH connection details for each pod
# The IP addresses and ports shown in our script might be outdated

echo "📋 Current RunPod Status:"
echo "✅ allied_ivory_gerbil (Aurora Primary) - RTX 4090 x2 - $1.19/hr"
echo "✅ collaboration (Collaboration Secondary) - RTX 4090 x1 - $0.60/hr"  
echo "✅ fluenti-marketing-001 (Fluenti Marketing) - RTX 4090 x1 - $0.60/hr"

echo ""
echo "🔧 To get correct connection details:"
echo "1. Click on each pod in RunPod console"
echo "2. Go to 'Connect' tab"
echo "3. Copy the SSH connection string"
echo "4. Update the NODES array in deploy-to-nodes.sh"

echo ""
echo "📝 Example SSH connection format:"
echo "ssh root@[IP_ADDRESS] -p [PORT]"

echo ""
echo "💡 Or we can test the current connections:"
echo "Testing current Aurora connection..."
ssh -o ConnectTimeout=10 -p 24505 root@82.221.170.242 "echo 'Aurora connection test'" 2>/dev/null && echo "✅ Aurora connection works!" || echo "❌ Aurora connection failed"

echo "Testing current Collaboration connection..."
ssh -o ConnectTimeout=10 -p 43540 root@213.181.111.2 "echo 'Collaboration connection test'" 2>/dev/null && echo "✅ Collaboration connection works!" || echo "❌ Collaboration connection failed"

echo "Testing current Fluenti connection..."
ssh -o ConnectTimeout=10 -p 19777 root@103.196.86.56 "echo 'Fluenti connection test'" 2>/dev/null && echo "✅ Fluenti connection works!" || echo "❌ Fluenti connection failed"



