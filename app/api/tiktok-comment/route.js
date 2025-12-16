import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Delays untuk smooth operation
const DELAYS = {
  afterOpenLink: 3000,
  afterCommentIconClick: 2000,
  beforeTyping: 1000,
  afterTyping: 1500,
  afterPostClick: 2000,
  beforeClose: 1000,
  afterClose: 1000,
};

// Resource IDs untuk TikTok
const TIKTOK_IDS = {
  commentIcon: "com.zhiliaoapp.musically:id/a9j",
  commentInput: "com.zhiliaoapp.musically:id/eek",
  postButton: "com.zhiliaoapp.musically:id/eel",
};

// Function untuk TikTok Video Comment dengan Resource ID
async function tiktokCommentById(serial, comment, videoUrl) {
  console.log(`[${serial}] Starting TikTok comment (Resource ID method)`);

  // Open TikTok link
  console.log(`[${serial}] Opening TikTok link: ${videoUrl}`);
  try {
    await execAsync(`adb -s ${serial} shell am start -a android.intent.action.VIEW -d "${videoUrl}"`);
  } catch (err) {
    console.error(`[${serial}] Error opening link:`, err.message);
    throw new Error(`Failed to open TikTok link: ${err.message}`);
  }

  console.log(`[${serial}] Waiting ${DELAYS.afterOpenLink}ms for video to load...`);
  await sleep(DELAYS.afterOpenLink);

  // Click comment icon
  console.log(`[${serial}] Clicking comment icon...`);
  try {
    await execAsync(`adb -s ${serial} shell input tap $(adb -s ${serial} shell uiautomator dump /dev/tty | grep -oP 'resource-id="${TIKTOK_IDS.commentIcon}"[^>]*bounds="\\[\\d+,\\d+\\]\\[\\d+,\\d+\\]"' | grep -oP '\\d+,\\d+' | head -1 | awk -F',' '{print ($1+$3)/2, ($2+$4)/2}')`);
  } catch (err) {
    // Fallback: Try direct resource-id click
    try {
      await execAsync(`adb -s ${serial} shell input tap 900 1800`);
    } catch (e) {
      console.error(`[${serial}] Failed to click comment icon`);
    }
  }

  console.log(`[${serial}] Waiting ${DELAYS.afterCommentIconClick}ms...`);
  await sleep(DELAYS.afterCommentIconClick);

  // Click comment input field
  console.log(`[${serial}] Clicking comment input field...`);
  try {
    await execAsync(`adb -s ${serial} shell input tap $(adb -s ${serial} shell uiautomator dump /dev/tty | grep -oP 'resource-id="${TIKTOK_IDS.commentInput}"[^>]*bounds="\\[\\d+,\\d+\\]\\[\\d+,\\d+\\]"' | grep -oP '\\d+,\\d+' | head -1 | awk -F',' '{print ($1+$3)/2, ($2+$4)/2}')`);
  } catch (err) {
    // Fallback
    await execAsync(`adb -s ${serial} shell input tap 540 2100`);
  }

  console.log(`[${serial}] Waiting ${DELAYS.beforeTyping}ms...`);
  await sleep(DELAYS.beforeTyping);

  // Type comment
  console.log(`[${serial}] Typing comment...`);
  const escapedComment = comment.replace(/ /g, "%s").replace(/'/g, "\\'").replace(/"/g, '\\"');
  await execAsync(`adb -s ${serial} shell input text "${escapedComment}"`);

  console.log(`[${serial}] Waiting ${DELAYS.afterTyping}ms...`);
  await sleep(DELAYS.afterTyping);

  // Click Post button
  console.log(`[${serial}] Clicking Post button...`);
  try {
    await execAsync(`adb -s ${serial} shell input tap $(adb -s ${serial} shell uiautomator dump /dev/tty | grep -oP 'resource-id="${TIKTOK_IDS.postButton}"[^>]*bounds="\\[\\d+,\\d+\\]\\[\\d+,\\d+\\]"' | grep -oP '\\d+,\\d+' | head -1 | awk -F',' '{print ($1+$3)/2, ($2+$4)/2}')`);
  } catch (err) {
    // Fallback
    await execAsync(`adb -s ${serial} shell input tap 950 2100`);
  }

  console.log(`[${serial}] Waiting ${DELAYS.afterPostClick}ms...`);
  await sleep(DELAYS.afterPostClick);

  // Close comment section
  console.log(`[${serial}] Closing comment section...`);
  await sleep(DELAYS.beforeClose);
  await execAsync(`adb -s ${serial} shell input keyevent 4`);
  await sleep(DELAYS.afterClose);

  console.log(`[${serial}] ✅ Comment sent successfully`);
}

// Function untuk send comment
async function sendTikTokCommentWithDelay(serial, videoUrl, comment, useResourceId = true) {
  await tiktokCommentById(serial, comment, videoUrl);
  return { message: `Comment sent to ${serial}` };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { videoUrl, comment, serial, serials, useResourceId = true } = body;

    console.log("[TikTok] Received request:", {
      comment,
      videoUrl,
      serial,
      serials,
      useResourceId,
    });

    // Mass comment mode (multiple devices)
    if (serials && Array.isArray(serials) && serials.length > 0) {
      console.log(`[TikTok] Mass comment mode: ${serials.length} devices`);

      const results = [];

      for (const deviceSerial of serials) {
        try {
          // Check if device is connected
          const { stdout: deviceCheck } = await execAsync(`adb devices`);
          if (!deviceCheck.includes(deviceSerial)) {
            results.push({
              serial: deviceSerial,
              success: false,
              error: `Device not found`,
            });
            continue;
          }

          // Verify device state
          const { stdout: state } = await execAsync(`adb -s ${deviceSerial} get-state`);
          if (state.trim() !== "device") {
            results.push({
              serial: deviceSerial,
              success: false,
              error: `Device not ready (state: ${state.trim()})`,
            });
            continue;
          }

          console.log(`[TikTok] Processing device: ${deviceSerial}`);

          await sendTikTokCommentWithDelay(deviceSerial, videoUrl, comment, useResourceId);

          results.push({
            serial: deviceSerial,
            success: true,
            message: `Comment sent successfully`,
          });
        } catch (err) {
          console.error(`[TikTok] Error on ${deviceSerial}:`, err);
          results.push({
            serial: deviceSerial,
            success: false,
            error: err.message,
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      return NextResponse.json({
        success: true,
        mode: "mass",
        total: serials.length,
        successCount,
        failCount,
        results,
      });
    }

    // Single device mode
    if (!videoUrl || !comment || !serial) {
      return NextResponse.json(
        { error: "Missing required fields: videoUrl, comment, or serial" },
        { status: 400 }
      );
    }

    // Check if device is connected
    try {
      const { stdout: deviceCheck } = await execAsync(`adb devices`);
      if (!deviceCheck.includes(serial)) {
        return NextResponse.json(
          {
            error: `Device ${serial} not found. Please reconnect the device.`,
            needReconnect: true,
            serial,
          },
          { status: 400 }
        );
      }

      // Verify device state
      const { stdout: state } = await execAsync(`adb -s ${serial} get-state`);
      if (state.trim() !== "device") {
        return NextResponse.json(
          {
            error: `Device ${serial} is not ready (state: ${state.trim()}). Please check connection.`,
            needReconnect: true,
            serial,
          },
          { status: 400 }
        );
      }
    } catch (err) {
      return NextResponse.json(
        {
          error: `Failed to verify device ${serial}: ${err.message}`,
          needReconnect: true,
          serial,
        },
        { status: 400 }
      );
    }

    console.log("[TikTok] Starting comment process...");
    console.log(`[TikTok] Using ${useResourceId ? "Resource ID" : "Coordinate"} method`);

    const result = await sendTikTokCommentWithDelay(serial, videoUrl, comment, useResourceId);

    return NextResponse.json({ success: true, mode: "single", ...result });
  } catch (error) {
    console.error("[TikTok] Error:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}
