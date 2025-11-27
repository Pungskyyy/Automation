import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
const run = util.promisify(exec);

// ========================
// ANTI DOUBLE EXECUTE LOCK
// ========================
let running = false;

// =============================================
// ROUTE
// =============================================
export async function POST(req) {
  // Cegah route dipanggil 2x oleh Next.js
  if (running) {
    console.log("BLOCKED: Route already running");
    return NextResponse.json({ blocked: true });
  }
  running = true;

  try {
    const { videoUrl, comment, serial } = await req.json();
    const prefix = serial ? `adb -s ${serial}` : "adb";

    if (serial) {
      await run(`adb connect ${serial}`);
      await delay(1500);
    }

    // =============================
    // 1. FORCE STOP — sekali saja
    // =============================
    log("1) FORCE STOP");
    await run(`${prefix} shell am force-stop com.ss.android.ugc.trill`);
    await delay(1500);

    // =============================
    // 2. OPEN URL
    // =============================
    log("2) OPEN URL");
    await run(`${prefix} shell am start -a android.intent.action.VIEW -d "${videoUrl}"`);
    await delay(15000);

    // =============================
    // 3. CLOSE POPUP
    // =============================
    log("3) CLOSE POPUP TAP");
    await tap(prefix, 540, 900);
    await delay(6000);

    // =============================
    // 4. TAP COMMENT BUTTON
    // =============================
    log("4) TAP COMMENT BUTTON");
    await tap(prefix, 992, 1310);
    await delay(12000);

    // =============================
    // 5. TAP ADD COMMENT
    // =============================
    log("5) TAP ADD COMMENT");
    await tap(prefix, 452, 1930);
    await delay(9000);

    // =============================
    // 6. TYPE COMMENT (manual slow)
    // =============================
    log("6) TYPE COMMENT");
    await typeSlow(prefix, comment);
    await delay(2500);

    // =============================
    // 7. TAP SEND BUTTON
    // =============================
    log("7) TAP SEND BUTTON");
    await tap(prefix, 984, 1158);
    await delay(8000);

    // =============================
    // 8. SELESAI — STOP TOTAL
    // =============================
    log("DONE — Komentar terkirim tanpa retry");

    running = false; // unlock
    return NextResponse.json({ message: "SUKSES — 1x EXECUTE" });

  } catch (err) {
    console.log("ERR:", err);
    running = false; // pastikan unlock
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


// =====================================================
// UTILITIES
// =====================================================

async function tap(prefix, x, y) {
  log(`TAP ${x}, ${y}`);
  await run(`${prefix} shell input tap ${x} ${y}`);
}

async function typeSlow(prefix, text) {
  for (let c of text) {
    await run(`${prefix} shell input text "${c === " " ? "%s" : c}"`);
    await delay(120 + Math.random() * 100);
  }
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function log(...msg) {
  console.log(">>", ...msg);
}
