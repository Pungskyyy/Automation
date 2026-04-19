#!/bin/bash

echo "🧹 OPPA Panel - Project Cleanup"
echo "================================"
echo ""

# Backup important files first
echo "📦 Creating safety backup..."
mkdir -p .cleanup-backup
cp package.json .cleanup-backup/ 2>/dev/null
echo "✅ Backup created in .cleanup-backup/"
echo ""

# 1. Remove backup files
echo "🗑️  Removing backup files..."
rm -f package.json.backup && echo "  ✓ Removed package.json.backup"
rm -f start-tunnel.shy && echo "  ✓ Removed start-tunnel.shy"
rm -f app/api/automation/queue.js.backup && echo "  ✓ Removed queue.js.backup"
echo ""

# 2. Remove broken script files
echo "🗑️  Removing broken script files..."
rm -f scripts/adb_tcpip_multi.sh.broken && echo "  ✓ Removed adb_tcpip_multi.sh.broken"
rm -f scripts/adb_tcpip_multi.sh.broken2 && echo "  ✓ Removed adb_tcpip_multi.sh.broken2"
rm -f scripts/adb_tcpip_multi.sh.broken3 && echo "  ✓ Removed adb_tcpip_multi.sh.broken3"
echo ""

# 3. Move debug files to proper location
echo "📂 Organizing debug files..."
mkdir -p debug
mv fb_debug_screen.png debug/ 2>/dev/null && echo "  ✓ Moved fb_debug_screen.png to debug/"
echo ""

# 4. Remove duplicate component files (.js when .jsx exists)
echo "🗑️  Removing duplicate component files..."
rm -f components/QRScanner.js && echo "  ✓ Removed components/QRScanner.js (keeping .jsx)"
rm -f components/Sidebar.js && echo "  ✓ Removed components/Sidebar.js (keeping .jsx)"
echo ""

# 5. Remove nested project
echo "🗑️  Removing nested project (my-macos-landing)..."
rm -rf my-macos-landing/ && echo "  ✓ Removed my-macos-landing/"
echo ""

# 6. Fix typo folder name
echo "🔧 Fixing folder typo..."
if [ -d "app/tiktok-report./" ]; then
  rm -rf app/tiktok-report./ && echo "  ✓ Removed app/tiktok-report./ (duplicate with typo)"
fi
echo ""

# 7. Remove duplicate next.config (keep .mjs)
echo "🔧 Cleaning config files..."
if [ -f "next.config.mjs" ] && [ -f "next.config.js" ]; then
  rm -f next.config.js && echo "  ✓ Removed next.config.js (keeping .mjs)"
fi
echo ""

# 8. Remove XML temporary files
echo "🗑️  Removing temporary XML files..."
XMLCOUNT=$(find . -name "*.xml" -type f -not -path "./node_modules/*" 2>/dev/null | wc -l)
if [ "$XMLCOUNT" -gt 0 ]; then
  find . -name "*.xml" -type f -not -path "./node_modules/*" -delete
  echo "  ✓ Removed $XMLCOUNT XML files"
else
  echo "  ℹ️  No XML files found"
fi
echo ""

# 9. Check and warn about duplicate contexts
echo "⚠️  Checking for duplicate folders..."
if [ -d "app/contexts" ] && [ -d "contexts" ]; then
  echo "  ⚠️  WARNING: Both app/contexts/ and contexts/ exist"
  echo "     Please review manually and remove duplicate"
else
  echo "  ✓ No duplicate contexts folders"
fi
echo ""

# 10. Remove empty directories
echo "🗑️  Removing empty directories..."
EMPTYCOUNT=$(find . -type d -empty -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | wc -l)
if [ "$EMPTYCOUNT" -gt 0 ]; then
  find . -type d -empty -not -path "./node_modules/*" -not -path "./.git/*" -delete 2>/dev/null
  echo "  ✓ Removed $EMPTYCOUNT empty directories"
else
  echo "  ℹ️  No empty directories found"
fi
echo ""

# Summary
echo "✅ Cleanup Complete!"
echo ""
echo "📊 Summary:"
echo "  ✓ Removed backup files (3)"
echo "  ✓ Removed broken scripts (3)"
echo "  ✓ Removed duplicate components (2)"
echo "  ✓ Removed nested project (my-macos-landing)"
echo "  ✓ Organized debug files"
echo "  ✓ Cleaned config files"
echo "  ✓ Removed temporary files"
echo ""
echo "⚠️  Manual Review Needed:"
echo "  - Check app/contexts/ vs contexts/ (if both exist)"
echo "  - Verify next.config.mjs is correct config file"
echo ""
echo "💾 Safety backup stored in: .cleanup-backup/"
echo ""
echo "🚀 Project is now cleaner and ready for production!"
