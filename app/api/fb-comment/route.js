import { exec } from "child_process";
import { promisify } from "util";
import { humanLikeTyping } from "../human-typing-helper.js";

const execAsync = promisify(exec);

// DELAYS - optimized untuk Facebook
const DELAYS = {
  afterKillApp: 2000,       // Tunggu setelah kill app
  afterOpenPost: 12000,     // Tunggu post load (diperpanjang)
  afterCommentClick: 3000,  // Tunggu comment panel muncul
  beforeTyping: 2000,       // Tunggu keyboard + input fokus
  afterTyping: 2000,        // Pause sebelum send
  beforeSend: 1500,         // Delay sebelum klik send
  afterSend: 4000,          // Tunggu comment terposting
  betweenDevices: 5000,     // Delay antar device
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function adbShell(serial, command) {
  try {
    const { stdout } = await execAsync(`adb -s ${serial} shell "${command}"`);
    return stdout.trim();
  } catch (error) {
    console.error(`ADB Error on ${serial}:`, error.message);
    return "";
  }
}

async function findElementBounds(serial, resourceId) {
  try {
    await adbShell(serial, "uiautomator dump /sdcard/window_dump.xml");
    await delay(500);

    const dumpContent = await adbShell(serial, `cat /sdcard/window_dump.xml`);
    const regex = new RegExp(`resource-id="${resourceId}"[^>]*bounds="\\[([0-9]+),([0-9]+)\\]\\[([0-9]+),([0-9]+)\\]"`);
    const match = dumpContent.match(regex);

    if (match) {
      const [, x1, y1, x2, y2] = match.map(Number);
      const centerX = Math.floor((x1 + x2) / 2);
      const centerY = Math.floor((y1 + y2) / 2);
      console.log(`✅ Found ${resourceId} at [${centerX}, ${centerY}]`);
      return { x: centerX, y: centerY };
    }

    return null;
  } catch (error) {
    console.error(`Error finding element:`, error.message);
    return null;
  }
}

async function findElementByText(serial, text) {
  try {
    await adbShell(serial, "uiautomator dump /sdcard/window_dump.xml");
    await delay(500);

    const dumpContent = await adbShell(serial, `cat /sdcard/window_dump.xml`);
    const regex = new RegExp(`text="${text}"[^>]*bounds="\\[([0-9]+),([0-9]+)\\]\\[([0-9]+),([0-9]+)\\]"`);
    const match = dumpContent.match(regex);

    if (match) {
      const [, x1, y1, x2, y2] = match.map(Number);
      const centerX = Math.floor((x1 + x2) / 2);
      const centerY = Math.floor((y1 + y2) / 2);
      console.log(`✅ Found text "${text}" at [${centerX}, ${centerY}]`);
      return { x: centerX, y: centerY };
    }

    return null;
  } catch (error) {
    console.error(`Error finding text:`, error.message);
    return null;
  }
}

async function findElementByContentDesc(serial, contentDesc) {
  try {
    await adbShell(serial, "uiautomator dump /sdcard/window_dump.xml");
    await delay(500);

    const dumpContent = await adbShell(serial, `cat /sdcard/window_dump.xml`);
    const regex = new RegExp(`content-desc="${contentDesc}"[^>]*bounds="\\[([0-9]+),([0-9]+)\\]\\[([0-9]+),([0-9]+)\\]"`);
    const match = dumpContent.match(regex);

    if (match) {
      const [, x1, y1, x2, y2] = match.map(Number);
      const centerX = Math.floor((x1 + x2) / 2);
      const centerY = Math.floor((y1 + y2) / 2);
      console.log(`✅ Found content-desc "${contentDesc}" at [${centerX}, ${centerY}]`);
      return { x: centerX, y: centerY };
    }

    return null;
  } catch (error) {
    console.error(`Error finding content-desc:`, error.message);
    return null;
  }
}

async function commentOnFacebookPost(serial, postUrl, comment) {
  try {
    console.log(`\n📘 [${serial}] ========== FACEBOOK POST/STORY ==========`);
    console.log(`[${serial}] Original URL: ${postUrl}`);
    
    // 0. KILL FACEBOOK APP FIRST (CRITICAL!)
    console.log(`[${serial}] 🔴 Killing Facebook app for fresh start...`);
    await adbShell(serial, "am force-stop com.facebook.katana");
    await delay(DELAYS.afterKillApp);
    console.log(`[${serial}] ✅ Facebook app killed`);
    
    // 1. Clean URL - remove fragment (#) and tracking params
    let cleanUrl = postUrl.split('#')[0];
    
    // Remove tracking parameters that cause redirect
    if (cleanUrl.includes('mibextid') || cleanUrl.includes('rdid')) {
      console.log(`[${serial}] 🧹 Removing tracking parameters...`);
      
      try {
        const url = new URL(cleanUrl);
        const storyFbid = url.searchParams.get('story_fbid');
        const id = url.searchParams.get('id');
        
        if (storyFbid && id) {
          cleanUrl = `https://www.facebook.com/story.php?story_fbid=${storyFbid}&id=${id}`;
          console.log(`[${serial}] ✅ Cleaned URL: ${cleanUrl}`);
        }
      } catch (e) {
        console.log(`[${serial}] ⚠️ URL parsing error, using original`);
      }
    }
    
    console.log(`[${serial}] 🔗 Final URL: ${cleanUrl}`);
    
    // 2. Open URL with SIMPLE VIEW INTENT (no activity specification!)
    console.log(`[${serial}] 🚀 Opening Facebook with VIEW intent...`);
        await adbShell(serial, `am start -a android.intent.action.VIEW -d '${cleanUrl}'`);
    
    console.log(`[${serial}] ⏳ Waiting ${DELAYS.afterOpenPost/1000} seconds for page load...`);
    await delay(DELAYS.afterOpenPost);

    // 3. Find comment input field
    console.log(`[${serial}] 🔍 Finding comment input field...`);
    
    let coords = await findElementByContentDesc(serial, "Write a comment…");
    
    if (!coords) {
      console.log(`[${serial}] Trying text method...`);
      coords = await findElementByText(serial, "Write a comment…");
    }
    
    if (!coords) {
      console.log(`[${serial}] Trying alternative texts...`);
      const alternatives = ["Write a comment", "Tulis komentar"];
      for (const alt of alternatives) {
        coords = await findElementByText(serial, alt);
        if (coords) break;
      }
    }
    
    if (!coords) {
      console.log(`[${serial}] Using fallback coordinates...`);
      coords = { x: 540, y: 1959 };
    }
    
    console.log(`[${serial}] 👆 Tapping input at [${coords.x}, ${coords.y}]`);
    await adbShell(serial, `input tap ${coords.x} ${coords.y}`);
    await delay(DELAYS.afterCommentClick);

    // 4. Wait for keyboard
    console.log(`[${serial}] ⌨️ Waiting for keyboard...`);
    await delay(DELAYS.beforeTyping);

    // 5. Type comment with human-like typing
    console.log(`[${serial}] ✍️ Typing like human: "${comment}"`);
    await humanLikeTyping(serial, comment, adbShell, delay);
    await delay(DELAYS.afterTyping);

    // 6. Re-dump UI to find Send button
    console.log(`[${serial}] 🔄 Re-dumping UI for Send button...`);
    await delay(DELAYS.beforeSend);

    // 7. Find Send button
    console.log(`[${serial}] 🔍 Finding Send button...`);
    
    coords = await findElementByContentDesc(serial, "Send");
    
    if (!coords) {
      console.log(`[${serial}] Trying text "Send"...`);
      coords = await findElementByText(serial, "Send");
    }
    
    if (!coords) {
      console.log(`[${serial}] Trying text "Kirim"...`);
      coords = await findElementByText(serial, "Kirim");
    }
    
    if (!coords) {
      console.log(`[${serial}] ⚠️ Send button not found, trying ENTER key...`);
      await adbShell(serial, `input keyevent 66`);
      await delay(DELAYS.afterSend);
      console.log(`✅ [${serial}] Comment posted with ENTER key!`);
      return { success: true };
    }
    
    console.log(`[${serial}] 👆 Tapping Send at [${coords.x}, ${coords.y}]`);
    await adbShell(serial, `input tap ${coords.x} ${coords.y}`);
    await delay(DELAYS.afterSend);

    console.log(`✅ [${serial}] Comment posted successfully!`);
    return { success: true };

  } catch (error) {
    console.error(`❌ [${serial}] Error:`, error.message);
    return { success: false, error: error.message };
  }
}

export async function POST(request) {
  try {
    const { postUrl, comment, serials } = await request.json();

    console.log("\n📥 ========== NEW FACEBOOK COMMENT REQUEST ==========");
    console.log("URL:", postUrl);
    console.log("Comment:", comment);
    console.log("Devices:", serials);

    if (!postUrl || !comment) {
      return Response.json(
        { success: false, error: "Post URL dan Comment required" },
        { status: 400 }
      );
    }

    if (!serials || serials.length === 0) {
      return Response.json(
        { success: false, error: "Minimal 1 device harus dipilih" },
        { status: 400 }
      );
    }

    const results = [];
    let successCount = 0;

    for (const serial of serials) {
      const result = await commentOnFacebookPost(serial, postUrl, comment);
      results.push({ serial, ...result });

      if (result.success) {
        successCount++;
      }
      
      if (serials.indexOf(serial) < serials.length - 1) {
        console.log(`\n⏳ Waiting ${DELAYS.betweenDevices/1000} seconds before next device...\n`);
        await delay(DELAYS.betweenDevices);
      }
    }

    console.log(`\n========== SUMMARY ==========`);
    console.log(`✅ Success: ${successCount}/${serials.length}`);
    console.log(`❌ Failed: ${serials.length - successCount}/${serials.length}\n`);

    return Response.json({
      success: true,
      total: serials.length,
      successCount,
      results
    });

  } catch (error) {
    console.error("❌ API Error:", error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
