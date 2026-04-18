import { exec } from "child_process";
import { promisify } from "util";
import { humanLikeTyping } from "../human-typing-helper.js";

const execAsync = promisify(exec);

// DELAYS - diperpanjang untuk lebih stabil
const DELAYS = {
  afterOpenPost: 8000,      // Tunggu post load
  afterOpenReels: 10000,    // Reels butuh waktu lebih lama
  afterCommentClick: 3500,  // Tunggu comment panel muncul
  beforeTyping: 2500,       // Tunggu keyboard + input fokus
  afterTyping: 3000,        // Tunggu text tersimpan
  beforePost: 2000,         // Delay sebelum klik post
  afterPost: 4000,          // Tunggu comment terposting
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

// Helper: Mencoba multiple resource IDs untuk post button
async function findPostButton(serial) {
  const postButtonIds = [
    "com.instagram.android:id/layout_comment_thread_post_button_click_area",
    "com.instagram.android:id/layout_comment_thread_post_button",
    "com.instagram.android:id/layout_comment_thread_post_button_icon",
    "com.instagram.android:id/row_thread_composer_button_send",
  ];

  for (const id of postButtonIds) {
    const coords = await findElementBounds(serial, id);
    if (coords) {
      console.log(`✅ Found post button with ID: ${id}`);
      return coords;
    }
  }

  return null;
}

async function commentOnInstagramPost(serial, postUrl, comment) {
  try {
    console.log(`\n📸 [${serial}] ========== INSTAGRAM POST ==========`);
    console.log(`[${serial}] Opening: ${postUrl}`);
    
    // 1. Open Instagram post URL
    await adbShell(serial, `am start -a android.intent.action.VIEW -d "${postUrl}"`);
    await delay(DELAYS.afterOpenPost);

    // 2. Tap comment button - MULTIPLE METHODS
    console.log(`[${serial}] Finding comment button...`);
    
    let coords = await findElementBounds(serial, "com.instagram.android:id/row_feed_button_comment");
    
    if (!coords) {
      console.log(`[${serial}] Trying content-desc...`);
      coords = await findElementByContentDesc(serial, "Comment");
    }
    
    if (!coords) {
      console.log(`[${serial}] Trying text search...`);
      coords = await findElementByText(serial, "Comment");
    }
    
    if (!coords) {
      console.log(`[${serial}] Using fallback coordinates...`);
      coords = { x: 200, y: 1850 };
    }
    
    console.log(`[${serial}] Tapping comment button at [${coords.x}, ${coords.y}]`);
    await adbShell(serial, `input tap ${coords.x} ${coords.y}`);
    await delay(DELAYS.afterCommentClick);

    // 3. Tap comment input field
    console.log(`[${serial}] Finding input field...`);
    
    coords = await findElementBounds(serial, "com.instagram.android:id/layout_comment_thread_edittext");
    
    if (!coords) {
      coords = await findElementBounds(serial, "com.instagram.android:id/comment_composer_text_view");
    }
    
    if (!coords) {
      coords = await findElementByText(serial, "Add a comment");
    }
    
    if (!coords) {
      console.log(`[${serial}] Using fallback input coordinates...`);
      coords = { x: 540, y: 1900 };
    }
    
    console.log(`[${serial}] Tapping input at [${coords.x}, ${coords.y}]`);
    await adbShell(serial, `input tap ${coords.x} ${coords.y}`);
    await delay(DELAYS.beforeTyping);

    // 4. Type comment - HUMAN-LIKE TYPING
    console.log(`[${serial}] Typing like human: "${comment}"`);
    await humanLikeTyping(serial, comment, adbShell, delay);


    // 5. Post comment - ROBUST METHOD
    console.log(`[${serial}] Finding post button...`);
    await delay(DELAYS.beforePost);
    
    coords = await findPostButton(serial);
    
    if (!coords) {
      console.log(`[${serial}] Trying text "Post"...`);
      coords = await findElementByText(serial, "Post");
    }
    
    if (!coords) {
      console.log(`[${serial}] Trying text "Kirim"...`);
      coords = await findElementByText(serial, "Kirim");
    }
    
    if (!coords) {
      console.log(`[${serial}] Trying content-desc "Post"...`);
      coords = await findElementByContentDesc(serial, "Post");
    }
    
    if (coords) {
      console.log(`[${serial}] Tapping post button at [${coords.x}, ${coords.y}]`);
      await adbShell(serial, `input tap ${coords.x} ${coords.y}`);
    } else {
      console.log(`[${serial}] Using ENTER key as fallback...`);
      await adbShell(serial, `input keyevent 66`);
    }
    
    await delay(DELAYS.afterPost);

    console.log(`✅ [${serial}] Comment posted successfully!`);
    return { success: true };

  } catch (error) {
    console.error(`❌ [${serial}] Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function commentOnInstagramReels(serial, reelsUrl, comment) {
  try {
    console.log(`\n🎬 [${serial}] ========== INSTAGRAM REELS ==========`);
    console.log(`[${serial}] Opening: ${reelsUrl}`);
    
    // 1. Open Instagram reels URL
    await adbShell(serial, `am start -a android.intent.action.VIEW -d "${reelsUrl}"`);
    await delay(DELAYS.afterOpenReels);

    // 2. Tap comment button
    console.log(`[${serial}] Finding comment button...`);
    
    let coords = await findElementBounds(serial, "com.instagram.android:id/comment_button");
    
    if (!coords) {
      coords = await findElementBounds(serial, "com.instagram.android:id/clips_comment_button");
    }
    
    if (!coords) {
      console.log(`[${serial}] Trying content-desc...`);
      coords = await findElementByContentDesc(serial, "Comment");
    }
    
    if (!coords) {
      console.log(`[${serial}] Using fallback (right side)...`);
      coords = { x: 998, y: 189 };  // From XML: [937,128][1058,249]
    }
    
    console.log(`[${serial}] Tapping comment button at [${coords.x}, ${coords.y}]`);
    await adbShell(serial, `input tap ${coords.x} ${coords.y}`);
    await delay(DELAYS.afterCommentClick);

    // 3. Tap input field
    console.log(`[${serial}] Finding input field...`);
    
    coords = await findElementBounds(serial, "com.instagram.android:id/comment_composer_text_view");
    
    if (!coords) {
      coords = await findElementBounds(serial, "com.instagram.android:id/layout_comment_thread_edittext");
    }
    
    if (!coords) {
      coords = await findElementByText(serial, "Add a comment");
    }
    
    if (!coords) {
      console.log(`[${serial}] Using fallback input coordinates...`);
      coords = { x: 529, y: 1139 };  // From XML: [154,1083][903,1194]
    }
    
    console.log(`[${serial}] Tapping input at [${coords.x}, ${coords.y}]`);
    await adbShell(serial, `input tap ${coords.x} ${coords.y}`);
    await delay(DELAYS.beforeTyping);

    // 4. Type comment - HUMAN-LIKE TYPING
    console.log(`[${serial}] Typing like human: "${comment}"`);
    await humanLikeTyping(serial, comment, adbShell, delay);


    // 5. Post comment
    console.log(`[${serial}] Finding post button...`);
    await delay(DELAYS.beforePost);
    
    coords = await findPostButton(serial);
    
    if (!coords) {
      console.log(`[${serial}] Trying text "Post"...`);
      coords = await findElementByText(serial, "Post");
    }
    
    if (!coords) {
      console.log(`[${serial}] Trying text "Kirim"...`);
      coords = await findElementByText(serial, "Kirim");
    }
    
    if (!coords) {
      console.log(`[${serial}] Trying content-desc "Post"...`);
      coords = await findElementByContentDesc(serial, "Post");
    }
    
    if (coords) {
      console.log(`[${serial}] Tapping post button at [${coords.x}, ${coords.y}]`);
      await adbShell(serial, `input tap ${coords.x} ${coords.y}`);
    } else {
      console.log(`[${serial}] Using EXACT fallback coordinates from XML...`);
      await adbShell(serial, `input tap 967 1139`);
    }
    
    await delay(DELAYS.afterPost);

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

    console.log("\n📥 ========== NEW REQUEST ==========");
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

    const isReels = postUrl.includes("/reel/");
    console.log(`🔍 Type: ${isReels ? "REELS" : "POST"}\n`);

    const results = [];
    let successCount = 0;

    for (const serial of serials) {
      let result;
      
      if (isReels) {
        result = await commentOnInstagramReels(serial, postUrl, comment);
      } else {
        result = await commentOnInstagramPost(serial, postUrl, comment);
      }

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