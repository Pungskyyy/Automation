import { NextResponse } from "next/server";
import { exec } from "child_process";
import { humanLikeTyping } from "../human-typing-helper.js";
import util from "util";

const execAsync = util.promisify(exec);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const DELAYS = {
  afterOpenLink: 8000,        // Tunggu video load dengan baik (DITAMBAH)
  afterCommentClick: 4000,    // Tunggu panel comment muncul sempurna (DITAMBAH)
  beforeTyping: 2500,         // Tunggu keyboard muncul + input field fokus (DITAMBAH)
  afterTyping: 3500,          // Tunggu text tersimpan + post button muncul (DITAMBAH)
  beforePostClick: 1500,      // Delay sebelum klik post (DITAMBAH)
  afterPostClick: 4000,       // Tunggu comment terkirim (DITAMBAH)
  beforeClose: 2000,          // Tunggu sebelum close (DITAMBAH)
};

// Helper: ADB shell command
async function adbShell(serial, command) {
  try {
    const { stdout } = await execAsync(`adb -s ${serial} shell ${command}`);
    return stdout.trim();
  } catch (error) {
    console.error(`ADB Error [${serial}]:`, error.message);
    return "";
  }
}

// Helper: Find element by resource-id
async function findElementById(serial, resourceId) {
  await adbShell(serial, `uiautomator dump /sdcard/ui.xml`);
  await sleep(500);
  const xml = await adbShell(serial, `cat /sdcard/ui.xml`);
  
  const regex = new RegExp(`resource-id="${resourceId}"[^>]*bounds="\\[([0-9]+),([0-9]+)\\]\\[([0-9]+),([0-9]+)\\]"`);
  const match = xml.match(regex);
  
  if (match) {
    const [, x1, y1, x2, y2] = match.map(Number);
    return {
      x: Math.floor((x1 + x2) / 2),
      y: Math.floor((y1 + y2) / 2)
    };
  }
  return null;
}

// Helper: Try multiple resource IDs for post button
async function findPostButton(serial) {
  const postButtonIds = [
    "com.ss.android.ugc.trill:id/k09",  // Post button (main)
    "com.ss.android.ugc.trill:id/ckm",  // Alternative post button
  ];
  
  for (const id of postButtonIds) {
    const btn = await findElementById(serial, id);
    if (btn) {
      console.log(`[${serial}] ✅ Found post button with ID: ${id}`);
      return btn;
    }
  }
  
  console.log(`[${serial}] ⚠️ Post button not found, using fallback coordinates`);
  return null;
}

// TIKTOK COMMENT - IMPROVED with better delays and double-tap post button
async function tiktokComment(serial, comment, url) {
  console.log(`[${serial}] ========== TikTok Comment ==========`);

  // 1. Open URL
  console.log(`[${serial}] Opening: ${url}`);
  await adbShell(serial, `am start -a android.intent.action.VIEW -d "${url}"`);
  await sleep(DELAYS.afterOpenLink);

  // 2. Check if comment panel is already open
  console.log(`[${serial}] Checking UI state...`);
  await adbShell(serial, `uiautomator dump /sdcard/ui.xml`);
  await sleep(500);
  let xml = await adbShell(serial, `cat /sdcard/ui.xml`);
  
  const commentButtonId = "com.ss.android.ugc.trill:id/e60";  // Comment button
  const commentInputId = "com.ss.android.ugc.trill:id/e1k";  // EditText "Add comment..."
  
  const inputAlreadyVisible = xml.includes(commentInputId);
  
  if (!inputAlreadyVisible) {
    console.log(`[${serial}] Comment panel closed - opening it...`);
    let commentBtn = await findElementById(serial, commentButtonId);
    if (!commentBtn) commentBtn = { x: 992, y: 1210 };
    
    console.log(`[${serial}] Tap comment button at [${commentBtn.x}, ${commentBtn.y}]`);
    await adbShell(serial, `input tap ${commentBtn.x} ${commentBtn.y}`);
    await sleep(DELAYS.afterCommentClick);
    
    await adbShell(serial, `uiautomator dump /sdcard/ui.xml`);
    await sleep(500);
  } else {
    console.log(`[${serial}] ✅ Comment panel already open!`);
  }

  // 3. Tap input field
  console.log(`[${serial}] Finding input field...`);
  let input = await findElementById(serial, commentInputId);
  if (!input) input = { x: 399, y: 1930 };
  
  console.log(`[${serial}] Tap input at [${input.x}, ${input.y}]`);
  await adbShell(serial, `input tap ${input.x} ${input.y}`);
  await sleep(DELAYS.beforeTyping);

  // 4. Type comment - HUMAN-LIKE TYPING
  console.log(`[${serial}] Typing like human: "${comment}"`);
  await humanLikeTyping(serial, comment, adbShell, sleep);
  await sleep(DELAYS.afterTyping);

  // 5. Re-dump UI after typing to find post button
  console.log(`[${serial}] Re-dumping UI to find post button...`);
  await adbShell(serial, `uiautomator dump /sdcard/ui.xml`);
  await sleep(800);

  // 6. Tap post button (DOUBLE TAP untuk memastikan)
  await sleep(DELAYS.beforePostClick);

  console.log(`[${serial}] Finding post button...`);
  let postBtn = await findPostButton(serial);
  if (!postBtn) postBtn = { x: 976, y: 1158 };
  
  console.log(`[${serial}] Tap post at [${postBtn.x}, ${postBtn.y}]`);
  await adbShell(serial, `input tap ${postBtn.x} ${postBtn.y}`);
  await sleep(800); // Small delay
  
  // DOUBLE TAP POST BUTTON untuk memastikan comment terkirim
  console.log(`[${serial}] Double-tap post button...`);
  await adbShell(serial, `input tap ${postBtn.x} ${postBtn.y}`);
  await sleep(DELAYS.afterPostClick);

  // 7. Close
  await sleep(DELAYS.beforeClose);
  await adbShell(serial, `input keyevent 4`);
  console.log(`[${serial}] ✅ Comment sent!`);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { videoUrl, comment, serials } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: "videoUrl required" }, { status: 400 });
    }

    if (!comment) {
      return NextResponse.json({ error: "comment required" }, { status: 400 });
    }

    if (serials && Array.isArray(serials) && serials.length > 0) {
      const results = [];
      for (const deviceSerial of serials) {
        try {
          await tiktokComment(deviceSerial, comment, videoUrl);
          results.push({ serial: deviceSerial, success: true });
        } catch (err) {
          console.error(`[${deviceSerial}] Error:`, err.message);
          results.push({ serial: deviceSerial, success: false, error: err.message });
        }
      }
      const successCount = results.filter(r => r.success).length;
      return NextResponse.json({ 
        success: true, 
        total: serials.length, 
        successCount, 
        failCount: serials.length - successCount, 
        results 
      });
    }

    return NextResponse.json({ error: "serials required" }, { status: 400 });

  } catch (error) {
    console.error("[Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
