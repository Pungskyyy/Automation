import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Delay configuration (in milliseconds)
const DELAYS = {
  afterAppLaunch: 10000,        // Wait after opening TikTok app (6 detik)
  afterVideoOpen: 8000,         // Wait after opening video link (8 detik)
  afterCommentOpen: 5000,       // Wait after opening comment section (5 detik)
  afterInputClick: 4000,        // Wait after clicking input field (3 detik)
  afterTyping: 5000,            // Wait after typing comment (4 detik - tunggu tombol Post muncul)
  afterPostClick: 8000,         // Wait after clicking Post button (8 detik - lihat comment muncul)
  beforeClose: 6000,            // Wait before closing comment section (3 detik)
  afterClose: 6000,             // Wait after closing comment section (2 detik)
  beforeUICheck: 2000,          // Wait before checking UI elements (2 detik)
};

// TikTok Resource IDs (UPDATED - CORRECT!)
const TIKTOK_IDS = {
  // Comment section (when opened)
  commentInput: "com.ss.android.ugc.trill:id/dm4",        // Input field "Add comment..."
  commentClose: "com.ss.android.ugc.trill:id/b7v",        // Close button
  postButton: "com.ss.android.ugc.trill:id/ca4",          // Post comment button (appears after typing)
  
  // Video page (before opening comment)
  commentButton: "com.ss.android.ugc.trill:id/dq6",       // Comment button on video
  likeButton: "com.ss.android.ugc.trill:id/f04",          // Like button
  shareButton: "com.ss.android.ugc.trill:id/sp5",         // Share button
};

// Fallback coordinates
const TIKTOK_COORDS = {
  commentButton: { x: 992, y: 1165 },    // Button to open comment section
  commentInput: { x: 399, y: 1930 },     // Input field when comment section is open
  postButton: { x: 983, y: 1157 }        // Post button after typing text
};

const TIKTOK_PACKAGES = [
  "com.ss.android.ugc.trill",
  "com.zhiliaoapp.musically",
];

async function detectTikTokPackage(serial) {
  for (const pkg of TIKTOK_PACKAGES) {
    try {
      const { stdout } = await execAsync(`adb -s ${serial} shell pm list packages ${pkg}`);
      if (stdout.includes(pkg)) {
        console.log(`[${serial}] Found TikTok package: ${pkg}`);
        return pkg;
      }
    } catch (error) {
      continue;
    }
  }
  return TIKTOK_PACKAGES[0];
}

async function openTikTokLink(serial, videoUrl) {
  if (!videoUrl) {
    return false;
  }

  try {
    console.log(`[${serial}] Opening TikTok link: ${videoUrl}`);
    await execAsync(`adb -s ${serial} shell am start -a android.intent.action.VIEW -d "${videoUrl}"`);
    console.log(`[${serial}] Waiting ${DELAYS.afterVideoOpen}ms for video to load...`);
    await sleep(DELAYS.afterVideoOpen);
    console.log(`[${serial}] Video opened`);
    return true;
  } catch (error) {
    console.error(`[${serial}] Error opening link:`, error.message);
    return false;
  }
}

async function findElementById(serial, resourceId) {
  try {
    // Add small delay before UI check
    await sleep(DELAYS.beforeUICheck);
    const { stdout } = await execAsync(`adb -s ${serial} shell uiautomator dump /dev/tty`);
    
    if (!stdout.includes(resourceId)) {
      return null;
    }

    const pattern = new RegExp(
      `resource-id="${resourceId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`
    );
    const match = stdout.match(pattern);

    if (match) {
      const x1 = parseInt(match[1]);
      const y1 = parseInt(match[2]);
      const x2 = parseInt(match[3]);
      const y2 = parseInt(match[4]);
      const centerX = Math.floor((x1 + x2) / 2);
      const centerY = Math.floor((y1 + y2) / 2);

      console.log(`[${serial}] Found ${resourceId} at (${centerX}, ${centerY})`);
      return { x: centerX, y: centerY };
    }

    return null;
  } catch (error) {
    console.error(`[${serial}] Error finding element:`, error.message);
    return null;
  }
}

/**
 * Check if comment section is already open
 */
async function isCommentSectionOpen(serial) {
  const inputField = await findElementById(serial, TIKTOK_IDS.commentInput);
  return inputField !== null;
}

/**
 * TikTok automation with smart detection
 */
async function tiktokCommentById(serial, comment, videoUrl) {
  console.log(`[${serial}] Starting TikTok comment (Smart Detection with Delays)`);

  const tiktokPackage = await detectTikTokPackage(serial);

  // 1. Buka TikTok / Link video
  if (videoUrl) {
    const opened = await openTikTokLink(serial, videoUrl);
    if (!opened) {
      console.log(`[${serial}] Opening TikTok app (${tiktokPackage})...`);
      await execAsync(`adb -s ${serial} shell monkey -p ${tiktokPackage} 1`);
      console.log(`[${serial}] Waiting ${DELAYS.afterAppLaunch}ms for app to launch...`);
      await sleep(DELAYS.afterAppLaunch);
    }
  } else {
    console.log(`[${serial}] Opening TikTok app (${tiktokPackage})...`);
    await execAsync(`adb -s ${serial} shell monkey -p ${tiktokPackage} 1`);
    console.log(`[${serial}] Waiting ${DELAYS.afterAppLaunch}ms for app to launch...`);
    await sleep(DELAYS.afterAppLaunch);
  }

  // 2. Check if comment section already open
  console.log(`[${serial}] Checking if comment section is open...`);
  const alreadyOpen = await isCommentSectionOpen(serial);
  
  if (!alreadyOpen) {
    // Comment section belum terbuka, klik tombol comment
    console.log(`[${serial}] Opening comment section...`);
    let element = await findElementById(serial, TIKTOK_IDS.commentButton);
    if (element) {
      console.log(`[${serial}] Found comment button at (${element.x}, ${element.y})`);
      await execAsync(`adb -s ${serial} shell input tap ${element.x} ${element.y}`);
    } else {
      console.log(`[${serial}] Using fallback coordinates for comment button`);
      await execAsync(`adb -s ${serial} shell input tap ${TIKTOK_COORDS.commentButton.x} ${TIKTOK_COORDS.commentButton.y}`);
    }
    console.log(`[${serial}] Waiting ${DELAYS.afterCommentOpen}ms for comment section to open...`);
    await sleep(DELAYS.afterCommentOpen);
  } else {
    console.log(`[${serial}] Comment section already open!`);
  }

  // 3. Click comment input field
  console.log(`[${serial}] Clicking comment input field...`);
  let inputField = await findElementById(serial, TIKTOK_IDS.commentInput);
  if (inputField) {
    console.log(`[${serial}] Found input field at (${inputField.x}, ${inputField.y})`);
    await execAsync(`adb -s ${serial} shell input tap ${inputField.x} ${inputField.y}`);
  } else {
    console.log(`[${serial}] Using fallback coordinates for input field`);
    await execAsync(`adb -s ${serial} shell input tap ${TIKTOK_COORDS.commentInput.x} ${TIKTOK_COORDS.commentInput.y}`);
  }
  console.log(`[${serial}] Waiting ${DELAYS.afterInputClick}ms for keyboard to appear...`);
  await sleep(DELAYS.afterInputClick);

  // 4. Type comment
  console.log(`[${serial}] Typing comment: "${comment}"`);
  const escapedComment = comment.replace(/ /g, "%s").replace(/'/g, "\\'").replace(/"/g, '\\"');
  await execAsync(`adb -s ${serial} shell input text "${escapedComment}"`);
  console.log(`[${serial}] Waiting ${DELAYS.afterTyping}ms for Post button to appear...`);
  await sleep(DELAYS.afterTyping);

  // 5. Click Post button (ca4) - appears after typing
  console.log(`[${serial}] Looking for Post button...`);
  let postButton = await findElementById(serial, TIKTOK_IDS.postButton);
  if (postButton) {
    console.log(`[${serial}] Found Post button at (${postButton.x}, ${postButton.y})`);
    await execAsync(`adb -s ${serial} shell input tap ${postButton.x} ${postButton.y}`);
  } else {
    console.log(`[${serial}] Using fallback coordinates for Post button`);
    await execAsync(`adb -s ${serial} shell input tap ${TIKTOK_COORDS.postButton.x} ${TIKTOK_COORDS.postButton.y}`);
  }
  console.log(`[${serial}] Waiting ${DELAYS.afterPostClick}ms for comment to be posted...`);
  await sleep(DELAYS.afterPostClick);

  // 6. Close comment section
  console.log(`[${serial}] Closing comment section...`);
  await sleep(DELAYS.beforeClose);
  let closeButton = await findElementById(serial, TIKTOK_IDS.commentClose);
  if (closeButton) {
    console.log(`[${serial}] Found close button at (${closeButton.x}, ${closeButton.y})`);
    await execAsync(`adb -s ${serial} shell input tap ${closeButton.x} ${closeButton.y}`);
  } else {
    console.log(`[${serial}] Closing with back button`);
    await execAsync(`adb -s ${serial} shell input keyevent 4`);
  }
  console.log(`[${serial}] Waiting ${DELAYS.afterClose}ms...`);
  await sleep(DELAYS.afterClose);

  console.log(`[${serial}] ✅ Comment sent successfully!`);
}

async function tiktokCommentByCoords(serial, comment, videoUrl) {
  console.log(`[${serial}] Starting TikTok comment (Coordinates method with Delays)`);

  const tiktokPackage = await detectTikTokPackage(serial);

  if (videoUrl) {
    const opened = await openTikTokLink(serial, videoUrl);
    if (!opened) {
      await execAsync(`adb -s ${serial} shell monkey -p ${tiktokPackage} 1`);
      console.log(`[${serial}] Waiting ${DELAYS.afterAppLaunch}ms...`);
      await sleep(DELAYS.afterAppLaunch);
    }
  } else {
    await execAsync(`adb -s ${serial} shell monkey -p ${tiktokPackage} 1`);
    console.log(`[${serial}] Waiting ${DELAYS.afterAppLaunch}ms...`);
    await sleep(DELAYS.afterAppLaunch);
  }

  // Check if already in comment section
  const alreadyOpen = await isCommentSectionOpen(serial);
  
  if (!alreadyOpen) {
    console.log(`[${serial}] Opening comment section...`);
    await execAsync(`adb -s ${serial} shell input tap ${TIKTOK_COORDS.commentButton.x} ${TIKTOK_COORDS.commentButton.y}`);
    console.log(`[${serial}] Waiting ${DELAYS.afterCommentOpen}ms...`);
    await sleep(DELAYS.afterCommentOpen);
  }

  console.log(`[${serial}] Clicking input field...`);
  await execAsync(`adb -s ${serial} shell input tap ${TIKTOK_COORDS.commentInput.x} ${TIKTOK_COORDS.commentInput.y}`);
  console.log(`[${serial}] Waiting ${DELAYS.afterInputClick}ms...`);
  await sleep(DELAYS.afterInputClick);

  console.log(`[${serial}] Typing comment...`);
  const escapedComment = comment.replace(/ /g, "%s").replace(/'/g, "\\'").replace(/"/g, '\\"');
  await execAsync(`adb -s ${serial} shell input text "${escapedComment}"`);
  console.log(`[${serial}] Waiting ${DELAYS.afterTyping}ms...`);
  await sleep(DELAYS.afterTyping);

  console.log(`[${serial}] Clicking Post button...`);
  await execAsync(`adb -s ${serial} shell input tap ${TIKTOK_COORDS.postButton.x} ${TIKTOK_COORDS.postButton.y}`);
  console.log(`[${serial}] Waiting ${DELAYS.afterPostClick}ms...`);
  await sleep(DELAYS.afterPostClick);

  // Close comment section
  console.log(`[${serial}] Closing comment section...`);
  await sleep(DELAYS.beforeClose);
  await execAsync(`adb -s ${serial} shell input keyevent 4`);
  console.log(`[${serial}] Waiting ${DELAYS.afterClose}ms...`);
  await sleep(DELAYS.afterClose);

  console.log(`[${serial}] ✅ Comment sent`);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { comment, videoUrl, serial, useResourceId = true } = body;

    console.log("[TikTok] Received data:", { comment, videoUrl, serial, useResourceId });

    if (!comment) {
      console.error("[TikTok] Comment harus diisi");
      return NextResponse.json(
        { error: "Comment harus diisi" },
        { status: 400 }
      );
    }

    if (!serial) {
      console.error("[TikTok] Device serial harus diisi");
      return NextResponse.json(
        { error: "Device serial harus diisi" },
        { status: 400 }
      );
    }

    console.log("[TikTok] Starting comment process...");
    if (useResourceId) {
      console.log("[TikTok] Using Resource ID method");
      await tiktokCommentById(serial, comment, videoUrl);
    } else {
      console.log("[TikTok] Using Coordinates method");
      await tiktokCommentByCoords(serial, comment, videoUrl);
    }

    console.log("[TikTok] Comment sent successfully");
    return NextResponse.json({
      success: true,
      message: "TikTok comment berhasil dikirim",
      method: useResourceId ? "Resource ID (Smart Detection)" : "Coordinates",
      serial: serial,
      videoUrl: videoUrl || "No URL provided",
      delays: DELAYS
    });

  } catch (error) {
    console.error("[TikTok] Error in POST handler:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengirim comment TikTok" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "TikTok Comment API - Smart Detection with Configurable Delays",
    correctIds: TIKTOK_IDS,
    coordinates: TIKTOK_COORDS,
    delays: DELAYS,
    supportedPackages: TIKTOK_PACKAGES,
    methods: ["POST"]
  });
}
