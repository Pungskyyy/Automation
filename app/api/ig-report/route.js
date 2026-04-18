import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay() {
  return delay(1000 + Math.random() * 2000);
}

async function adbShell(serial, command) {
  try {
    const { stdout } = await execAsync(`adb -s ${serial} shell "${command}"`);
    return stdout.trim();
  } catch (error) {
    console.error(`ADB Error [${serial}]:`, error.message);
    return "";
  }
}

async function dumpUI(serial) {
  await adbShell(serial, "uiautomator dump /sdcard/window_dump.xml");
  await delay(500);
  return await adbShell(serial, `cat /sdcard/window_dump.xml`);
}

function extractBounds(match) {
  const [, x1, y1, x2, y2] = match.map(Number);
  return {
    x: Math.floor((x1 + x2) / 2),
    y: Math.floor((y1 + y2) / 2)
  };
}

async function findByText(serial, text) {
  const xml = await dumpUI(serial);
  const regex = new RegExp(`text="${text}"[^>]*bounds="\\[([0-9]+),([0-9]+)\\]\\[([0-9]+),([0-9]+)\\]"`);
  const match = xml.match(regex);
  return match ? extractBounds(match) : null;
}

async function findByDesc(serial, desc) {
  const xml = await dumpUI(serial);
  const regex = new RegExp(`content-desc="${desc}"[^>]*bounds="\\[([0-9]+),([0-9]+)\\]\\[([0-9]+),([0-9]+)\\]"`);
  const match = xml.match(regex);
  return match ? extractBounds(match) : null;
}

async function safeFind(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fn();
    if (res) return res;
    await delay(1000);
  }
  return null;
}

async function tap(serial, coords) {
  if (!coords) return false;
  await adbShell(serial, `input tap ${coords.x} ${coords.y}`);
  console.log(`👉 Tap [${coords.x}, ${coords.y}]`);
  return true;
}

async function reportInstagramAccount(serial, targetUrl, reason) {
  try {
    console.log(`\n🚨 [${serial}] OPEN: ${targetUrl}`);

    const isReels = targetUrl.includes("/reel/");
    console.log(`📍 Type: ${isReels ? "REELS" : "POST"}`);

    await adbShell(serial, `am start -a android.intent.action.VIEW -d "${targetUrl}"`);
    await delay(isReels ? 6000 : 5000);

    // 2. Find and tap more menu
    let more;
    
    if (isReels) {
      console.log(`🎬 Finding Reels more menu...`);
      
      more = await safeFind(() => findByDesc(serial, "More"));
      
      if (!more) {
        more = await safeFind(() => findByDesc(serial, "More options"));
      }
      
      if (!more) {
        console.log(`⚠️ Using Reels manual tap (right side)...`);
        await adbShell(serial, `input tap 1000 200`);
        await randomDelay();
        more = true;
      }
    } else {
      console.log(`📸 Finding Post more menu...`);
      
      more = await safeFind(() => findByDesc(serial, "More actions for this post"));
      
      if (!more) {
        more = await safeFind(() => findByDesc(serial, "More options"));
      }
      
      if (!more) {
        console.log(`⚠️ Using Post manual tap (top right)...`);
        await adbShell(serial, `input tap 1050 150`);
        await randomDelay();
        more = true;
      }
    }

    if (!more) throw new Error("More menu not found");
    
    if (typeof more === 'object') {
      await tap(serial, more);
      await randomDelay();
    }

    // 3. Find Report button - WITH DEBUGGING
    if (isReels) {
      console.log(`📜 Scrolling Reels menu...`);
      
      // Scroll 1
      await adbShell(serial, `input swipe 540 1000 540 500 300`);
      await delay(1500);
      
      let xml = await dumpUI(serial);
      let menuItems = xml.match(/text="([^"]+)"/g) || [];
      console.log(`📋 Menu visible (scroll 1):`, menuItems.slice(0, 15));
      
      let checkReport = menuItems.some(item => item.includes("Report") || item.includes("Lapor"));
      
      if (!checkReport) {
        console.log(`📜 Scroll 2...`);
        await adbShell(serial, `input swipe 540 1000 540 400 400`);
        await delay(1500);
        
        xml = await dumpUI(serial);
        menuItems = xml.match(/text="([^"]+)"/g) || [];
        console.log(`📋 Menu visible (scroll 2):`, menuItems.slice(0, 15));
      }
      
      checkReport = menuItems.some(item => item.includes("Report") || item.includes("Lapor"));
      
      if (!checkReport) {
        console.log(`📜 Scroll 3...`);
        await adbShell(serial, `input swipe 540 1100 540 300 400`);
        await delay(1500);
        
        xml = await dumpUI(serial);
        menuItems = xml.match(/text="([^"]+)"/g) || [];
        console.log(`📋 Menu visible (scroll 3):`, menuItems.slice(0, 15));
      }
    }
    
    console.log(`🚩 Finding Report button...`);
    let reportBtn = await safeFind(() => findByText(serial, "Report"));

    if (!reportBtn) {
      console.log(`⚠️ Trying 'Laporkan'...`);
      reportBtn = await safeFind(() => findByText(serial, "Laporkan"));
    }

    if (!reportBtn) {
      console.log(`⚠️ Regex search...`);
      const xml = await dumpUI(serial);
      const reportRegex = /text="([^"]*(?:[Rr]eport|[Ll]apor)[^"]*)"\s+[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/;
      const match = xml.match(reportRegex);
      
      if (match) {
        const [, text, x1, y1, x2, y2] = match;
        reportBtn = extractBounds([null, x1, y1, x2, y2]);
        console.log(`✅ Found "${text}"`);
      }
    }

    if (!reportBtn) {
      console.log(`⚠️ Content-desc search...`);
      reportBtn = await safeFind(() => findByDesc(serial, "Report"));
    }

    if (!reportBtn) {
      console.log(`⚠️ Trying positions...`);
      const positions = [
        { x: 540, y: 600 },
        { x: 540, y: 750 },
        { x: 540, y: 900 },
        { x: 540, y: 1050 },
        { x: 540, y: 1200 },
      ];
      
      for (const pos of positions) {
        console.log(`⚠️ Tap [${pos.x}, ${pos.y}]`);
        await adbShell(serial, `input tap ${pos.x} ${pos.y}`);
        await delay(2500);
        
        const xml = await dumpUI(serial);
        const isReportDialog = xml.includes("It's spam") || 
                              xml.includes("Violence") || 
                              xml.includes("I just don't like it") ||
                              xml.includes("Bullying");
        
        if (isReportDialog) {
          console.log(`✅ Report dialog opened!`);
          reportBtn = true;
          break;
        }
        
        console.log(`❌ Wrong dialog, back...`);
        await adbShell(serial, `input keyevent 4`); // Back button
        await delay(1000);
      }
      
      if (!reportBtn) {
        throw new Error("Report button not found");
      }
    } else {
      await tap(serial, reportBtn);
    }
    
    await randomDelay();

    // 4. Select reason
    const reasonMap = {
      "dont-like": "I just don't like it",
      "bullying": "Bullying or unwanted contact",
      "suicide": "Suicide, self-injury or eating disorders",
      "violence": "Violence, hate or exploitation",
      "restricted": "Selling or promoting restricted items",
      "nudity": "Nudity or sexual activity",
      "spam": "Scam, fraud or spam",
      "false": "False information"
    };

    const reasonText = reasonMap[reason] || reasonMap["dont-like"];
    console.log(`📋 Selecting: ${reasonText}`);

    let reasonBtn = await safeFind(() => findByDesc(serial, reasonText));

    if (!reasonBtn) {
      reasonBtn = await safeFind(() => findByText(serial, reasonText));
    }

    if (!reasonBtn) throw new Error(`Reason not found: ${reasonText}`);

    await tap(serial, reasonBtn);
    await randomDelay();

    // 5. Submit
    console.log(`✅ Submitting...`);
    const nextTexts = ["Next", "Continue", "Submit", "Kirim", "Lanjut"];

    let submitted = false;
    for (const txt of nextTexts) {
      const btn = await safeFind(() => findByText(serial, txt));

      if (btn) {
        await tap(serial, btn);
        await randomDelay();
        submitted = true;
        break;
      }
    }

    if (!submitted) {
      console.log(`⚠️ Manual submit tap...`);
      await adbShell(serial, `input tap 540 1850`);
      await delay(2000);
    }

    console.log(`✅ [${serial}] SUCCESS`);
    return { success: true };

  } catch (err) {
    console.error(`❌ [${serial}]`, err.message);
    return { success: false, error: err.message };
  }
}

export async function POST(request) {
  try {
    const { targetUsername, profileUrl, postUrl, reportReason, serials } = await request.json();

    let targetUrl = postUrl || profileUrl;
    if (!targetUrl && targetUsername) {
      targetUrl = `https://www.instagram.com/${targetUsername}/`;
    }

    if (!targetUrl) {
      return Response.json({ success: false, error: "Target kosong" }, { status: 400 });
    }

    if (!serials || serials.length === 0) {
      return Response.json({ success: false, error: "Device kosong" }, { status: 400 });
    }

    const results = [];
    let successCount = 0;

    for (const serial of serials) {
      const result = await reportInstagramAccount(
        serial,
        targetUrl,
        reportReason || "dont-like"
      );

      results.push({ serial, ...result });

      if (result.success) successCount++;

      await delay(3000);
    }

    return Response.json({
      success: true,
      total: serials.length,
      successCount,
      results
    });

  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}