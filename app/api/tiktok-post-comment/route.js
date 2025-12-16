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

// Resource IDs untuk TikTok Post
const TIKTOK_POST_IDS = {
  commentIcon: "com.zhiliaoapp.musically:id/comment_icon",
  commentInput: "com.zhiliaoapp.musically:id/comment_input",
  postButton: "com.zhiliaoapp.musically:id/post_button",
};

// Function untuk TikTok Post Comment
async function tiktokPostCommentById(serial, comment, postUrl) {
  console.log(`[${serial}] Starting TikTok POST comment`);

  // Open TikTok post link
  console.log(`[${serial}] Opening TikTok post: ${postUrl}`);
  try {
    await execAsync(`adb -s ${serial} shell am start -a android.intent.action.VIEW -d "${postUrl}"`);
  } catch (err) {
    console.error(`[${serial}] Error opening post:`, err.message);
    throw new Error(`Failed to open TikTok post: ${err.message}`);
  }

  console.log(`[${serial}] Waiting ${DELAYS.afterOpenLink}ms for post to load...`);
  await sleep(DELAYS.afterOpenLink);

  // Click comment icon
  console.log(`[${serial}] Clicking comment icon...`);
  await execAsync(`adb -s ${serial} shell input tap 900 1800`);
  await sleep(DELAYS.afterCommentIconClick);

  // Click comment input field
  console.log(`[${serial}] Clicking comment input field...`);
  await execAsync(`adb -s ${serial} shell input tap 540 2100`);
  await sleep(DELAYS.beforeTyping);

  // Type comment
  console.log(`[${serial}] Typing comment...`);
  const escapedComment = comment.replace(/ /g, "%s").replace(/'/g, "\\'").replace(/"/g, '\\"');
  await execAsync(`adb -s ${serial} shell input text "${escapedComment}"`);
  await sleep(DELAYS.afterTyping);

  // Click Post button
  console.log(`[${serial}] Clicking Post button...`);
  await execAsync(`adb -s ${serial} shell input tap 950 2100`);
  await sleep(DELAYS.afterPostClick);

  // Close comment section
  console.log(`[${serial}] Closing comment section...`);
  await sleep(DELAYS.beforeClose);
  await execAsync(`adb -s ${serial} shell input keyevent 4`);
  await sleep(DELAYS.afterClose);

  console.log(`[${serial}] ✅ Post comment sent successfully`);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { postUrl, comment, serial, serials } = body;

    console.log("[TikTok Post] Received request:", {
      comment,
      postUrl,
      serial,
      serials,
    });

    // Mass comment mode
    if (serials && Array.isArray(serials) && serials.length > 0) {
      console.log(`[TikTok Post] Mass comment mode: ${serials.length} devices`);

      const results = [];

      for (const deviceSerial of serials) {
        try {
          const { stdout: deviceCheck } = await execAsync(`adb devices`);
          if (!deviceCheck.includes(deviceSerial)) {
            results.push({
              serial: deviceSerial,
              success: false,
              error: `Device not found`,
            });
            continue;
          }

          const { stdout: state } = await execAsync(`adb -s ${deviceSerial} get-state`);
          if (state.trim() !== "device") {
            results.push({
              serial: deviceSerial,
              success: false,
              error: `Device not ready (state: ${state.trim()})`,
            });
            continue;
          }

          console.log(`[TikTok Post] Processing device: ${deviceSerial}`);
          await tiktokPostCommentById(deviceSerial, comment, postUrl);

          results.push({
            serial: deviceSerial,
            success: true,
            message: `Comment sent successfully`,
          });
        } catch (err) {
          console.error(`[TikTok Post] Error on ${deviceSerial}:`, err);
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
    if (!postUrl || !comment || !serial) {
      return NextResponse.json(
        { error: "Missing required fields: postUrl, comment, or serial" },
        { status: 400 }
      );
    }

    // Check device
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

      const { stdout: state } = await execAsync(`adb -s ${serial} get-state`);
      if (state.trim() !== "device") {
        return NextResponse.json(
          {
            error: `Device ${serial} is not ready (state: ${state.trim()}).`,
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

    console.log("[TikTok Post] Starting comment process...");
    await tiktokPostCommentById(serial, comment, postUrl);

    return NextResponse.json({ success: true, mode: "single", message: `Comment sent to ${serial}` });
  } catch (error) {
    console.error("[TikTok Post] Error:", error);
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}

// Update sendTikTokPost function
async function sendTikTokPostComment() {
  if (!tiktokPostUrl || !tiktokPostComment) {
    addLog("TikTok Post: URL atau komentar kosong");
    return;
  }

  const targetSerial = selectedDevices.length > 0
    ? selectedDevices[0]
    : devices.length > 0
    ? devices[0].serial
    : null;

  if (!targetSerial) {
    addLog("TikTok Post: Tidak ada device tersedia");
    return;
  }

  setTiktokPostLoading(true);

  try {
    const response = await fetch("/api/tiktok-post-comment", {  // ← API Route baru
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postUrl: tiktokPostUrl,
        comment: tiktokPostComment,
        serial: targetSerial,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send comment");
    }

    addLog(`✅ Komentar TikTok Post terkirim ke ${targetSerial}`);
    setTimeout(() => handleScanDevices(), 1000);
  } catch (err) {
    console.error("[DEBUG] Error:", err);
    addLog("❌ Error TikTok Post: " + err.message);
  } finally {
    setTiktokPostLoading(false);
  }
}

// Update massSendTikTokPost function
async function massSendTikTokPost() {
  if (!tiktokPostUrl || !tiktokPostComment) {
    addLog("TikTok Post: URL atau komentar kosong");
    return;
  }

  if (selectedDevices.length === 0) {
    addLog("❌ Tidak ada device yang dipilih");
    return;
  }

  setMassRunning(true);
  setMassProgress(0);
  addLog(`🚀 Mass Comment TikTok Post dimulai untuk ${selectedDevices.length} devices...`);

  try {
    const response = await fetch("/api/tiktok-post-comment", {  // ← API Route baru
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postUrl: tiktokPostUrl,
        comment: tiktokPostComment,
        serials: selectedDevices,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send mass comments");
    }

    addLog(`\n📊 Mass Comment Results:`);
    addLog(`✅ Success: ${data.successCount}`);
    addLog(`❌ Failed: ${data.failCount}`);
    addLog(`\nDetail:`);

    data.results.forEach((result) => {
      if (result.success) {
        addLog(`✅ ${result.serial}: ${result.message}`);
      } else {
        addLog(`❌ ${result.serial}: ${result.error}`);
      }
    });

    setMassProgress(100);
    setTimeout(() => {
      handleScanDevices();
      setMassProgress(0);
    }, 2000);
  } catch (err) {
    addLog(`❌ Mass Comment Error: ${err.message}`);
  } finally {
    setTimeout(() => {
      setMassRunning(false);
    }, 2000);
  }
}