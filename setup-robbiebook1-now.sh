#!/bin/bash
# One-command VPN setup for RobbieBook1
brew install wireguard-tools 2>/dev/null
mkdir -p ~/.wireguard && wg genkey | tee ~/.wireguard/privatekey | wg pubkey | tee ~/.wireguard/publickey && chmod 600 ~/.wireguard/privatekey
echo "🔑 Your Public Key:" && cat ~/.wireguard/publickey && echo "" && echo "📋 Copy this key and send to Robbie!"

