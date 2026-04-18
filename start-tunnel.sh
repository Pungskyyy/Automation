#!/bin/bash

echo "🚀 Starting Permanent Cloudflare Tunnel"
echo "========================================"
echo ""

# Check if server is running
if ! lsof -i :3000 > /dev/null 2>&1; then
  echo "❌ Server not running on port 3000!"
  echo "   Please run 'npm run dev' in another terminal first"
  exit 1
fi

echo "✅ Server is running on port 3000"
echo ""

# Check if tunnel exists
if ! cloudflared tunnel list 2>/dev/null | grep -q "autocomment-app"; then
  echo "⚙️  First time setup - Creating permanent tunnel..."
  echo ""
  
  # Login to Cloudflare
  echo "1️⃣  Opening browser for Cloudflare login..."
  cloudflared tunnel login
  
  if [ $? -ne 0 ]; then
    echo "❌ Login failed. Please try again."
    exit 1
  fi
  
  echo ""
  echo "2️⃣  Creating named tunnel 'autocomment-app'..."
  cloudflared tunnel create autocomment-app
  
  if [ $? -ne 0 ]; then
    echo "❌ Failed to create tunnel. Please try again."
    exit 1
  fi
  
  # Get tunnel ID
  TUNNEL_ID=$(cloudflared tunnel list | grep autocomment-app | awk '{print $1}')
  
  # Create config directory
  mkdir -p ~/.cloudflared
  
  # Create config file
  echo ""
  echo "3️⃣  Creating config file..."
  cat > ~/.cloudflared/config.yml << CONFIG
tunnel: autocomment-app
credentials-file: ~/.cloudflared/${TUNNEL_ID}.json

ingress:
  - service: http://localhost:3000
CONFIG
  
  echo ""
  echo "✅ Setup complete!"
  echo ""
fi

# Get tunnel info
TUNNEL_ID=$(cloudflared tunnel list | grep autocomment-app | awk '{print $1}')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "�� PERMANENT URL (share this - will NOT change!):"
echo ""
echo "   https://${TUNNEL_ID}.cfargotunnel.com"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Starting tunnel..."
echo ""

# Run the tunnel
cloudflared tunnel run autocomment-app
