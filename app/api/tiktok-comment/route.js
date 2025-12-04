import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
const run = util.promisify(exec);

// ========================
// ANTI DOUBLE EXECUTE LOCK
// ========================
let running = false;

export async function POST(req) {
  // Cegah double trigger Next.js
  if (running) {
    console.log("BLOCKED: Already running");
    return NextResponse.json({ blocked: true });
  }
  running = true;

  try {
    const { videoUrl, comment, serial } = await req.json();
    const prefix = serial ? `adb -s ${serial}` : "adb";

    if (!videoUrl || !comment) {
      running = false;
      return NextResponse.json({ error: "URL atau komentar kosong!" }, { status: 400 });
    }

    // Connect WiFi ADB jika pakai IP
    if (serial) {
      await run(`adb connect ${serial}`);
      await delay(1500);
    }

    // =======================================================
    // 1) FORCE STOP
    // =======================================================
    log("1) FORCE STOP");
    await run(`${prefix} shell am force-stop com.ss.android.ugc.trill`);
    await delay(1500);

    // =======================================================
    // 2) OPEN URL
    // =======================================================
    log("2) OPEN URL");
    await run(`${prefix} shell am start -a android.intent.action.VIEW -d "${videoUrl}"`);
    await delay(15000);

    // =======================================================
    // 3) CLOSE POPUP
    // =======================================================
    log("3) CLOSE POPUP TAP");
    await tap(prefix, 540, 900);
    await delay(6000);

    // =======================================================
    // 4) TAP COMMENT BUTTON
    // =======================================================
    log("4) TAP COMMENT BUTTON");
    await tap(prefix, 992, 1310);
    await delay(12000);

    // =======================================================
    // 5) TAP ADD COMMENT
    // =======================================================
    log("5) TAP ADD COMMENT");
    await tap(prefix, 452, 1930);
    await delay(9000);

    // =======================================================
    // 6) TYPE COMMENT (manual slow)
    // =======================================================
    log("6) TYPE COMMENT");
    await typeSlow(prefix, comment);
    await delay(2500);

    // =======================================================
    // 7) TAP SEND BUTTON
    // =======================================================
    log("7) TAP SEND BUTTON");
    await tap(prefix, 984, 1158);
    await delay(8000);

    // =======================================================
    // DONE
    // =======================================================
    log("DONE — Komentar TikTok terkirim tanpa retry");

    running = false;
    return NextResponse.json({ message: "SUKSES — komentar terkirim" });

  } catch (err) {
    console.log("ERR:", err);
    running = false;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


// =======================
// UTILITIES
// =======================

async function tap(prefix, x, y) {
  log(`TAP ${x}, ${y}`);
  await run(`${prefix} shell input tap ${x} ${y}`);
}

async function typeSlow(prefix, text) {
  for (let c of text) {
    let key = c === " " ? "%s" : c;
    await run(`${prefix} shell input text "${key}"`);
    await delay(120 + Math.random() * 100);
  }
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function log(...msg) {
  console.log(">>", ...msg);
}
