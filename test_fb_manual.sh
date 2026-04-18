#!/bin/bash

SERIAL=$(adb devices | grep -v "List" | grep "device$" | awk '{print $1}' | head -1)
CLEAN_URL="https://www.facebook.com/story.php?story_fbid=1554918396634127&id=100063479446067"
COMMENT="Test comment 123"

echo "📘 Testing Facebook Comment Automation"
echo "Device: $SERIAL"
echo "URL: $CLEAN_URL"
echo ""

echo "1️⃣ Opening Facebook story..."
adb -s $SERIAL shell "am start -a android.intent.action.VIEW -d '$CLEAN_URL'"
sleep 10
echo "✅ Waited 10 seconds"
echo ""

echo "2️⃣ Dumping UI to find comment field..."
adb -s $SERIAL shell "uiautomator dump /sdcard/ui.xml" > /dev/null 2>&1
sleep 1

echo "3️⃣ Finding comment field coordinates..."
BOUNDS=$(adb -s $SERIAL shell "cat /sdcard/ui.xml" | grep -o 'content-desc="Write a comment[^"]*"[^>]*bounds="\[[^]]*\]" ' | grep -o 'bounds="\[[^]]*\]"' | sed 's/bounds="//;s/"$//')

if [ -z "$BOUNDS" ]; then
  echo "❌ Comment field not found!"
  exit 1
fi

echo "Found bounds: $BOUNDS"

# Parse coordinates: [x1,y1][x2,y2]
X1=$(echo $BOUNDS | sed 's/\[//g;s/\].*//;s/,.*$//')
Y1=$(echo $BOUNDS | sed 's/\[//g;s/\].*//;s/^[^,]*,//')
X2=$(echo $BOUNDS | sed 's/.*\]\[//;s/,.*$//')
Y2=$(echo $BOUNDS | sed 's/.*,//;s/\].*$//')

CENTER_X=$(( (X1 + X2) / 2 ))
CENTER_Y=$(( (Y1 + Y2) / 2 ))

echo "Center coordinates: [$CENTER_X, $CENTER_Y]"
echo ""

echo "4️⃣ Tapping comment field..."
adb -s $SERIAL shell "input tap $CENTER_X $CENTER_Y"
sleep 3
echo "✅ Tapped and waited 3 seconds"
echo ""

echo "5️⃣ Typing comment: '$COMMENT'"
ESCAPED_COMMENT=$(echo "$COMMENT" | sed 's/ /%s/g')
adb -s $SERIAL shell "input text '$ESCAPED_COMMENT'"
sleep 2
echo "✅ Typed and waited 2 seconds"
echo ""

echo "6️⃣ Trying to send with ENTER key..."
adb -s $SERIAL shell "input keyevent 66"
sleep 3
echo "✅ Pressed ENTER and waited 3 seconds"
echo ""

echo "🎉 Test completed! Check device to see if comment posted."
