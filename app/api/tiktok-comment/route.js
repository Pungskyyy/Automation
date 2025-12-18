import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Get bounds dari resource-id
async function getBoundsFromResourceId(serial, resourceId) {
  try {
    await execAsync(`adb -s ${serial} shell uiautomator dump /sdcard/window_dump.xml`);
    const { stdout } = await execAsync(`adb -s ${serial} shell cat /sdcard/window_dump.xml`);
    
    const pattern = new RegExp(`resource-id="${resourceId}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`);
    const match = stdout.match(pattern);
    
    if (match) {
      const x1 = parseInt(match[1]);
      const y1 = parseInt(match[2]);
      const x2 = parseInt(match[3]);
      const y2 = parseInt(match[4]);
      const centerX = Math.floor((x1 + x2) / 2);
      const centerY = Math.floor((y1 + y2) / 2);
      
      console.log(`[${serial}] Found ${resourceId}: (${centerX}, ${centerY})`);
      return { x: centerX, y: centerY, found: true };
    }
    
    return { x: 0, y: 0, found: false };
  } catch (err) {
    console.error(`[${serial}] Error getting bounds:`, err.message);
    return { x: 0, y: 0, found: false };
  }
}

// TikTok Video Comment dengan AUTO-DETECT
async function tiktokVideoComment(serial, comment, videoUrl, customCoords) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[${serial}] 🎵 TikTok VIDEO Comment`);
  console.log(`[${serial}] URL: ${videoUrl}`);
  console.log(`[${serial}] Comment: ${comment}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  try {
    // 1. Open TikTok video
    console.log(`[${serial}] Step 1: Opening TikTok video...`);
    await execAsync(`adb -s ${serial} shell am start -a android.intent.action.VIEW -d "${videoUrl}"`);
    await sleep(5000);

    // 2. Auto-detect comment icon (dt5)
    console.log(`\n[${serial}] Step 2: Looking for comment icon...`);
    let commentIcon = await getBoundsFromResourceId(serial, "com.ss.android.ugc.trill:id/dt5");
    
    if (!commentIcon.found && customCoords?.commentButton) {
      console.log(`[${serial}] Using custom coords for comment icon`);
      commentIcon = customCoords.commentButton;
    } else if (!commentIcon.found) {
      throw new Error("Comment icon not found!");
    }
    
    console.log(`[${serial}] Tapping comment icon at (${commentIcon.x}, ${commentIcon.y})`);
    await execAsync(`adb -s ${serial} shell input tap ${commentIcon.x} ${commentIcon.y}`);
    await sleep(2000);

    // 3. Auto-detect input field (dow)
    console.log(`\n[${serial}] Step 3: Looking for input field...`);
    let inputField = await getBoundsFromResourceId(serial, "com.ss.android.ugc.trill:id/dow");
    
    if (!inputField.found && customCoords?.inputField) {
      console.log(`[${serial}] Using custom coords for input field`);
      inputField = customCoords.inputField;
    } else if (!inputField.found) {
      throw new Error("Input field not found!");
    }
    
    console.log(`[${serial}] Tapping input field at (${inputField.x}, ${inputField.y})`);
    await execAsync(`adb -s ${serial} shell input tap ${inputField.x} ${inputField.y}`);
    await sleep(1500);

    // 4. Type comment
    console.log(`\n[${serial}] Step 4: Typing comment...`);
    const escapedComment = comment.replace(/ /g, "%s");
    await execAsync(`adb -s ${serial} shell input text "${escapedComment}"`);
    await sleep(1500);

    // 5. Auto-detect post button (jcv)
    console.log(`\n[${serial}] Step 5: Looking for post button...`);
    let postBtn = await getBoundsFromResourceId(serial, "com.ss.android.ugc.trill:id/jcv");
    
    if (!postBtn.found && customCoords?.sendButton) {
      console.log(`[${serial}] Using custom coords for post button`);
      postBtn = customCoords.sendButton;
    } else if (!postBtn.found) {
      throw new Error("Post button not found!");
    }
    
    console.log(`[${serial}] Tapping post button at (${postBtn.x}, ${postBtn.y})`);
    await execAsync(`adb -s ${serial} shell input tap ${postBtn.x} ${postBtn.y}`);
    await sleep(2000);

    // 6. Close comment section
    console.log(`\n[${serial}] Step 6: Closing comment section...`);
    await execAsync(`adb -s ${serial} shell input keyevent 4`);
    await sleep(1000);

    console.log(`\n[${serial}] ✅ SUCCESS!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  } catch (err) {
    console.error(`\n❌ [${serial}] ERROR:`, err.message);
    throw err;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const videoUrl = body.videoUrl || body.url || body.link;
    const comment = body.comment || body.text;
    const serial = body.serial || body.deviceSerial;
    const serials = body.serials || body.deviceSerials;
    const coords = body.coords || null;

    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║          TIKTOK VIDEO COMMENT API                ║");
    console.log("╚══════════════════════════════════════════════════╝");

    // ============================================
    // MASS COMMENT MODE
    // ============================================
    if (serials && Array.isArray(serials) && serials.length > 0) {
      console.log(`\n🚀 MASS MODE: ${serials.length} devices\n`);

      const results = [];

      for (let i = 0; i < serials.length; i++) {
        const deviceSerial = serials[i];
        
        console.log(`\n[${i + 1}/${serials.length}] Processing: ${deviceSerial}`);

        try {
          const { stdout: deviceList } = await execAsync(`adb devices`);
          if (!deviceList.includes(deviceSerial)) {
            throw new Error("Device not found");
          }

          const { stdout: state } = await execAsync(`adb -s ${deviceSerial} get-state`);
          if (state.trim() !== "device") {
            throw new Error(`Device not ready (${state.trim()})`);
          }

          await tiktokVideoComment(deviceSerial, comment, videoUrl, coords);

          results.push({
            serial: deviceSerial,
            success: true,
            message: "Comment sent successfully"
          });

          if (i < serials.length - 1) {
            console.log(`⏳ Waiting 3s before next device...\n`);
            await sleep(3000);
          }

        } catch (err) {
          console.error(`❌ [${deviceSerial}] Failed:`, err.message);
          results.push({
            serial: deviceSerial,
            success: false,
            error: err.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      return NextResponse.json({
        success: true,
        mode: "mass",
        total: serials.length,
        successCount,
        failCount,
        results
      });
    }

    // ============================================
    // SINGLE DEVICE MODE
    // ============================================
    if (!videoUrl || !comment || !serial) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { stdout: deviceList } = await execAsync(`adb devices`);
    if (!deviceList.includes(serial)) {
      return NextResponse.json({ error: `Device ${serial} not found` }, { status: 400 });
    }

    await tiktokVideoComment(serial, comment, videoUrl, coords);

    return NextResponse.json({ 
      success: true,
      message: "Comment sent successfully"
    });

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}