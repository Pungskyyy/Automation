import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// DELAYS - optimized untuk Facebook Report
const DELAYS = {
  afterKillApp: 2000,
  afterOpenUrl: 10000,
  afterTapMore: 2000,
  afterFindReport: 1000,
  afterSelectReason: 2000,
  afterSubmit: 3000,
  betweenSteps: 1500,
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

async function findElementContainingText(serial, text) {
  try {
    await adbShell(serial, "uiautomator dump /sdcard/window_dump.xml");
    await delay(500);

    const dumpContent = await adbShell(serial, `cat /sdcard/window_dump.xml`);
    const regex = new RegExp(`text="[^"]*${text}[^"]*"[^>]*bounds="\\[([0-9]+),([0-9]+)\\]\\[([0-9]+),([0-9]+)\\]"`);
    const match = dumpContent.match(regex);

    if (match) {
      const [, x1, y1, x2, y2] = match.map(Number);
      const centerX = Math.floor((x1 + x2) / 2);
      const centerY = Math.floor((y1 + y2) / 2);
      console.log(`✅ Found text containing "${text}" at [${centerX}, ${centerY}]`);
      return { x: centerX, y: centerY };
    }

    return null;
  } catch (error) {
    console.error(`Error finding text:`, error.message);
    return null;
  }
}

async function reportFacebook(serial, targetUrl, reportReason, reportType) {
  try {
    console.log(`\n🚨 [${serial}] ========== FACEBOOK REPORT ==========`);
    console.log(`[${serial}] Target: ${targetUrl}`);
    console.log(`[${serial}] Type: ${reportType}`);
    console.log(`[${serial}] Reason: ${reportReason}`);
    
    // 1. Kill Facebook app for fresh start
    console.log(`[${serial}] 🔴 Killing Facebook app...`);
    await adbShell(serial, "am force-stop com.facebook.katana");
    await delay(DELAYS.afterKillApp);
    console.log(`[${serial}] ✅ Facebook app killed`);
    
    // 2. Clean URL
    let cleanUrl = targetUrl.split('#')[0];
    
    if (cleanUrl.includes('mibextid') || cleanUrl.includes('rdid')) {
      console.log(`[${serial}] 🧹 Cleaning URL...`);
      try {
        const url = new URL(cleanUrl);
        if (reportType === 'post') {
          const storyFbid = url.searchParams.get('story_fbid');
          const id = url.searchParams.get('id');
          if (storyFbid && id) {
            cleanUrl = `https://www.facebook.com/story.php?story_fbid=${storyFbid}&id=${id}`;
          }
        }
        console.log(`[${serial}] ✅ Cleaned URL: ${cleanUrl}`);
      } catch (e) {
        console.log(`[${serial}] ⚠️ Using original URL`);
      }
    }
    
    // 3. Open URL
    console.log(`[${serial}] 🚀 Opening target URL...`);
    await adbShell(serial, `am start -a android.intent.action.VIEW -d '${cleanUrl}'`);
    await delay(DELAYS.afterOpenUrl);
    console.log(`[${serial}] ✅ Page loaded`);
    
    // 4. Find and tap "More" button (3 dots menu)
    console.log(`[${serial}] 🔍 Finding More button...`);
    let coords = await findElementByContentDesc(serial, "More options");
    
    if (!coords) {
      coords = await findElementByContentDesc(serial, "More");
    }
    
    if (!coords) {
      // Try finding by looking for common more button patterns
      console.log(`[${serial}] Trying alternative methods...`);
      // Fallback: tap common location for more button (top right)
      coords = { x: 1000, y: 250 };
    }
    
    console.log(`[${serial}] 👆 Tapping More button at [${coords.x}, ${coords.y}]`);
    await adbShell(serial, `input tap ${coords.x} ${coords.y}`);
    await delay(DELAYS.afterTapMore);
    
    // 5. Find and tap "Report" option
    console.log(`[${serial}] 🔍 Finding Report option...`);
    coords = await findElementByText(serial, "Report post");
    
    if (!coords) {
      coords = await findElementByText(serial, "Report");
    }
    
    if (!coords) {
      coords = await findElementByText(serial, "Laporkan");
    }
    
    if (!coords) {
      coords = await findElementContainingText(serial, "Report");
    }
    
    if (!coords) {
      console.log(`[${serial}] ❌ Report button not found`);
      return { success: false, error: "Report button not found" };
    }
    
    console.log(`[${serial}] 👆 Tapping Report option at [${coords.x}, ${coords.y}]`);
    await adbShell(serial, `input tap ${coords.x} ${coords.y}`);
    await delay(DELAYS.afterFindReport);
    
    // 6. Select report reason based on reportReason parameter
    console.log(`[${serial}] 🔍 Selecting report reason...`);
    
    const reasonMap = {
      spam: ["Spam", "Spam"],
      hate_speech: ["Hate speech", "Ujaran kebencian"],
      violence: ["Violence", "Kekerasan"],
      harassment: ["Harassment", "Pelecehan"],
      false_information: ["False information", "Informasi palsu"],
      nudity: ["Nudity", "Ketelanjangan"],
      scam: ["Scam", "Penipuan"],
      intellectual_property: ["Intellectual property", "Hak kekayaan intelektual"],
    };
    
    const reasonTexts = reasonMap[reportReason] || ["Spam", "Spam"];
    
    coords = null;
    for (const reasonText of reasonTexts) {
      coords = await findElementContainingText(serial, reasonText);
      if (coords) break;
    }
    
    if (coords) {
      console.log(`[${serial}] 👆 Selecting reason at [${coords.x}, ${coords.y}]`);
      await adbShell(serial, `input tap ${coords.x} ${coords.y}`);
      await delay(DELAYS.afterSelectReason);
    } else {
      console.log(`[${serial}] ⚠️ Reason not found, continuing...`);
    }
    
    // 7. Find and tap Submit/Next button
    console.log(`[${serial}] 🔍 Finding Submit button...`);
    coords = await findElementByText(serial, "Submit");
    
    if (!coords) {
      coords = await findElementByText(serial, "Next");
    }
    
    if (!coords) {
      coords = await findElementByText(serial, "Kirim");
    }
    
    if (!coords) {
      coords = await findElementByText(serial, "Lanjut");
    }
    
    if (!coords) {
      coords = await findElementByText(serial, "Done");
    }
    
    if (coords) {
      console.log(`[${serial}] 👆 Tapping Submit at [${coords.x}, ${coords.y}]`);
      await adbShell(serial, `input tap ${coords.x} ${coords.y}`);
      await delay(DELAYS.afterSubmit);
      
      // Try to tap submit again if there's another step
      await delay(1000);
      coords = await findElementByText(serial, "Submit");
      if (coords) {
        console.log(`[${serial}] 👆 Tapping final Submit at [${coords.x}, ${coords.y}]`);
        await adbShell(serial, `input tap ${coords.x} ${coords.y}`);
        await delay(DELAYS.afterSubmit);
      }
    }
    
    console.log(`✅ [${serial}] Report submitted successfully!`);
    return { success: true };

  } catch (error) {
    console.error(`❌ [${serial}] Error:`, error.message);
    return { success: false, error: error.message };
  }
}

export async function POST(request) {
  try {
    const { targetUrl, reportReason, reportType, serial } = await request.json();

    console.log("\n📥 ========== NEW FACEBOOK REPORT REQUEST ==========");
    console.log("Target URL:", targetUrl);
    console.log("Report Type:", reportType);
    console.log("Report Reason:", reportReason);
    console.log("Device:", serial);

    if (!targetUrl) {
      return Response.json(
        { success: false, error: "Target URL required" },
        { status: 400 }
      );
    }

    if (!serial) {
      return Response.json(
        { success: false, error: "Device serial required" },
        { status: 400 }
      );
    }

    const result = await reportFacebook(serial, targetUrl, reportReason, reportType);

    if (result.success) {
      console.log(`✅ Report submitted successfully on ${serial}`);
    } else {
      console.log(`❌ Report failed on ${serial}: ${result.error}`);
    }

    return Response.json(result);

  } catch (error) {
    console.error("❌ API Error:", error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
