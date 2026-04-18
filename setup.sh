#!/bin/bash

echo "🚀 OPPA Panel Setup"
echo "===================="

# Check Node.js
if ! command -v node &> /dev/null
then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit
fi

echo "✅ Node.js found: $(node -v)"

# Check ADB
if ! command -v adb &> /dev/null
then
    echo "⚠️  ADB not found. Please install ADB"
    echo "   - macOS: brew install android-platform-tools"
    echo "   - Windows: Download from https://developer.android.com/tools/releases/platform-tools"
    echo "   - Linux: sudo apt-get install android-tools-adb"
else
    echo "✅ ADB found: $(adb version | head -n1)"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create screenshots directory
mkdir -p public/screenshots
echo "✅ Screenshots directory created"

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the server:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo "Login: admin / admin123"
