import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// TikTok Resource IDs (CORRECT from UI dump)
const TIKTOK_IDS = {
  commentButton: "com.ss.android.ugc.trill:id/dq6",
  commentIcon: "com.ss.android.ugc.trill:id/dmm",
  likeButton: "com.ss.android.ugc.trill:id/f04",
  shareButton: "com.ss.android.ugc.trill:id/sp5",
};

// Coordinates from UI analysis
const TIKTOK_COORDS = {
  commentButton: { x: 992, y: 1165 },
  commentInput: { x: 540, y: 1850 },
  sendButton: { x: 980, y: 1850 }
};

// TikTok Package Names
const TIKTOK_PACKAGES = [
  "com.ss.android.ugc.trill",
  "com.zhiliaoapp.musically",
];

async function adbRun(serial, cmd, retry = 2) {
  return new Promise((resolve, reject) => {
    exec(`adb -s ${serial} ${cmd}`, async (err, stdout) => {
      if (err || stdout.includes("protocol fault")) {
        if (retry > 0) {
          console.log(`[${serial}] Retry…`);
          await sleep(1200);
          return resolve(adbRun(serial, cmd, retry - 1));
        }
        return reject(`[${serial}] ERROR: ${err}`);
      }
      resolve(stdout);
    });
  });
}

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
  console.log(`[${serial}] Using default package: ${TIKTOK_PACKAGES[0]}`);
  return TIKTOK_PACKAGES[0];
}

async function openTikTokLink(serial, videoUrl) {
  if (!videoUrl) {
    return false;
  }

  try {
    console.log(`[${serial}] Opening TikTok link: ${videoUrl}`);
    await execAsync(`adb -s ${serial} shell am start -a android.intent.action.VIEW -d "${videoUrl}"`);
    await sleep(5000);
    console.log(`[${serial}] Video opened`);
    return true;
  } catch (error) {
    console.error(`[${serial}] Error opening link:`, error.message);
    return false;
  }
}

async function findElementById(serial, resourceId) {
  try {
    const { stdout } = await execAsync(`adb -s ${serial} shell uiautomator dump /dev/tty`);
    
    if (!stdout.includes(resourceId)) {
      console.log(`[${serial}] Resource ID ${resourceId} not found`);
      return null;
    }

    const pattern = new RegExp(
      `resource-id="${resourceId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`
    );
    const match = stdout.match(pattern);

    if (match) {
      const [_, x1, y1, x2, y2] = match.map(Number);
      const centerX = Math.floor((x1 + x2) / 2);
      const centerY = Math.floor((y1 + y2) / 2);

      console.log(`[${serial}] Found ${resourceId} at (${centerX}, ${centerY})`);
      return { x: centerX, y: centerY, bounds: [x1, y1, x2, y2] };
    }

    return null;
  } catch (error) {
    console.error(`[${serial}] Error finding element:`, error.message);
    return null;
  }
}

async function clickById(serial, resourceId, fallbackX = null, fallbackY = null) {
  const element = await findElementById(serial, resourceId);
  
  if (element) {
    console.log(`[${serial}] Clicking ${resourceId} at (${element.x}, ${element.y})`);
    await adbRun(serial, `shell input tap ${element.x} ${element.y}`);
    return true;
  }

  if (fallbackX !== null && fallbackY !== null) {
    console.log(`[${serial}] Fallback to coordinates (${fallbackX}, ${fallbackY})`);
    await adbRun(serial, `shell input tap ${fallbackX} ${fallbackY}`);
    return true;
  }

  return false;
}

export async function runCommentFlowById(serial, comment, videoUrl = null) {
  try {
    console.log(`[${serial}] Start comment flow (Using Resource IDs)`);

    const tiktokPackage = await detectTikTokPackage(serial);

    // 1. Buka TikTok
    if (videoUrl) {
      const opened = await openTikTokLink(serial, videoUrl);
      if (!opened) {
        console.log(`[${serial}] Opening TikTok app (${tiktokPackage})...`);
        await adbRun(serial, `shell monkey -p ${tiktokPackage} 1`);
        await sleep(4000);
      }
    } else {
      console.log(`[${serial}] Opening TikTok app (${tiktokPackage})...`);
      await adbRun(serial, `shell monkey -p ${tiktokPackage} 1`);
      await sleep(4000);
    }

    // 2. Click comment button
    console.log(`[${serial}] Clicking comment button...`);
    await clickById(serial, TIKTOK_IDS.commentButton, TIKTOK_COORDS.commentButton.x, TIKTOK_COORDS.commentButton.y);
    await sleep(3000);

    // 3. Click comment input
    console.log(`[${serial}] Clicking comment input...`);
    await adbRun(serial, `shell input tap ${TIKTOK_COORDS.commentInput.x} ${TIKTOK_COORDS.commentInput.y}`);
    await sleep(1000);

    // 4. Type comment
    console.log(`[${serial}] Typing: ${comment}`);
    const escapedComment = comment.replace(/ /g, "%s").replace(/'/g, "\\'");
    await adbRun(serial, `shell input text "${escapedComment}"`);
    await sleep(1500);

    // 5. Send
    console.log(`[${serial}] Clicking send button...`);
    await adbRun(serial, `shell input tap ${TIKTOK_COORDS.sendButton.x} ${TIKTOK_COORDS.sendButton.y}`);
    await sleep(1500);

    console.log(`[${serial}] ✅ Comment sent successfully!`);
  } catch (e) {
    console.error(`[${serial}] ❌ Error:`, e);
  }
}

export async function runCommentFlow(serial, comment, videoUrl = null) {
  try {
    console.log(`[${serial}] Start comment flow (Using Coordinates)`);

    const tiktokPackage = await detectTikTokPackage(serial);

    if (videoUrl) {
      const opened = await openTikTokLink(serial, videoUrl);
      if (!opened) {
        await adbRun(serial, `shell monkey -p ${tiktokPackage} 1`);
        await sleep(4000);
      }
    } else {
      await adbRun(serial, `shell monkey -p ${tiktokPackage} 1`);
      await sleep(4000);
    }

    await adbRun(serial, `shell input tap ${TIKTOK_COORDS.commentButton.x} ${TIKTOK_COORDS.commentButton.y}`);
    await sleep(3000);

    await adbRun(serial, `shell input tap ${TIKTOK_COORDS.commentInput.x} ${TIKTOK_COORDS.commentInput.y}`);
    await sleep(1000);

    await adbRun(serial, `shell input text "${comment.replace(/ /g, "%s")}"`);
    await sleep(1400);

    await adbRun(serial, `shell input tap ${TIKTOK_COORDS.sendButton.x} ${TIKTOK_COORDS.sendButton.y}`);
    await sleep(1500);

    console.log(`[${serial}] Comment sent`);
  } catch (e) {
    console.log(e);
  }
}

export { clickById, findElementById, adbRun, TIKTOK_IDS, TIKTOK_COORDS, detectTikTokPackage, openTikTokLink };
