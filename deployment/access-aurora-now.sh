#!/bin/bash
# Immediate access to Aurora chat

echo "🚀 IMMEDIATE ACCESS TO AURORA CHAT"
echo "================================="

AURORA_IP="45.32.194.172"

echo "🔧 Option 1: Use IP directly"
echo "• http://${AURORA_IP}/chat/"
echo ""

echo "🔧 Option 2: Add to /etc/hosts"
echo "• Add this line to /etc/hosts:"
echo "  ${AURORA_IP} aurora.askrobbie.ai"
echo ""

echo "🔧 Option 3: Deploy to working domain"
echo "• Use existing domain that works"
echo "• Deploy to aurora.testpilot.ai/chat"
echo ""

echo "📋 DNS Configuration needed:"
echo "• Domain: aurora.askrobbie.ai"
echo "• IP: ${AURORA_IP}"
echo "• Type: A record"
echo "• Wait for propagation: 5-15 minutes"
echo ""

echo "🌐 IMMEDIATE ACCESS:"
echo "• http://${AURORA_IP}/chat/"
echo "• Add to hosts file for domain access"
echo "• Or use existing working domain"
