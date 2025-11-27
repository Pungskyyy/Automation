import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
const run = util.promisify(exec);

export async function POST(req) {
  try {
    const { videoUrl, comment, serial } = await req.json();
    const prefix = serial ? `adb -s ${serial}` : "adb";

    // ============================
    // 0. Jaga koneksi agar nggak putus
    // ============================
    await ensureDevice(prefix, serial);
    console.log("[ADB] Device connected");

    // ============================
    // 1. FORCE STOP
    // ============================
    console.log("[1] FORCE CLOSE TIKTOK");
    await run(`${prefix} shell am force-stop com.ss.android.ugc.trill`);
    await delay(1000);

    // ============================
    // 2. OPEN URL
    // ============================
    console.log("[2] OPEN LINK (12s)");
    await run(`${prefix} shell am start -a android.intent.action.VIEW -d "${videoUrl}"`);
    await delay(12000);

    // ============================
    // 3. TAP KOSONG (close popup)
    // ============================
    console.log("[3] Close popup");
    await tap(prefix, 540, 900);
    await delay(5000);

    // ============================
    // 4. COMMENT BUTTON
    // ============================
    console.log("[4] Comment button");
    await tap(prefix, 972, 1372);
    await delay(8000);

    // ============================
    // 5. INPUT FIELD
    // ============================
    console.log("[5] Input field");
    await tap(prefix, 540, 2013);
    await delay(6000);

    // ============================
    // 6. TYPE COMMENT
    // ============================
    console.log("[6] Type comment…");
    const safe = comment.replace(/"/g, "'").replace(/ /g, "%s");
    await run(`${prefix} shell input text "${safe}"`);
    await delay(5000);

    // ============================
    // 7. SEND COMMENT
    // ============================
    console.log("[7] Send comment");
    await tap(prefix, 1012, 2013);
    await delay(4000);

    // ============================
    // 8. FORCE CLOSE TIKTOK (FINAL)
    // ============================
    console.log("[8] FINAL FORCE CLOSE + RECONNECT");

    await ensureDevice(prefix, serial);

    await run(`${prefix} shell am force-stop com.ss.android.ugc.trill`);

    return NextResponse.json({ message: "Komentar TikTok sukses" });

  } catch (err) {
    console.log("ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


// ===================================================================
// UTIL
// ===================================================================

async function ensureDevice(prefix, serial) {
  if (!serial) return;

  console.log(`[ADB CHECK] Trying reconnect ${serial}...`);

  try {
    await run(`adb connect ${serial}`);
    await delay(500);
  } catch (err) {
    console.log("Reconnect error:", err);
  }
}

async function tap(prefix, x, y) {
  console.log(`TAP → ${x}, ${y}`);
  try {
    await run(`${prefix} shell input tap ${x} ${y}`);
  } catch (err) {
    console.log("Tap error:", err);
  }
}

async function dumpUI(prefix) {
  const { stdout } = await run(`${prefix} exec-out uiautomator dump /dev/tty`);
  return stdout.toString();
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
