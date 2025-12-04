import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import util from "util";
const run = util.promisify(exec);

// ============================================================
// FALLBACK COORDS (KERJA PASTI, TANPA UI DUMP)
// ============================================================
const IG_COORDS = {
  reels: {
    comment: { x: 998, y: 1099 },
    input: { x: 488, y: 1949 },
    send: { x: 1005, y: 1949 }
  },
  post: {
    comment: { x: 187, y: 1518 },
    input: { x: 551, y: 1159 },
    send: { x: 973, y: 1165 }
  }
};

// Tambahkan palet komentar
const COMMENT_PALETTE = [
  "Keren banget!",
  "Mantap!",
  "Luar biasa!",
  "🔥🔥🔥",
  "Inspiratif!",
  "Suka banget kontennya!"
];

export async function POST(req) {
  try {
    const { postUrl, comment, serial } = await req.json();
    const prefix = serial ? `adb -s ${serial}` : "adb";

    if (!postUrl)
      return NextResponse.json({ error: "URL Instagram tidak boleh kosong" }, { status: 400 });

    // Pilih komentar secara acak jika tidak diberikan
    const selectedComment = comment || COMMENT_PALETTE[Math.floor(Math.random() * COMMENT_PALETTE.length)];

    // ============================================================
    // OPEN INSTAGRAM
    // ============================================================
    await adb(`${prefix} shell am force-stop com.instagram.android`);
    await delay(3000);

    await adb(`${prefix} shell am start -a android.intent.action.VIEW -d "${postUrl}"`);
    await delay(15000); // tunggu Reels/Post kebuka

    // ============================================================
    // DUMP UI
    // ============================================================
    await adb(`${prefix} shell uiautomator dump /sdcard/ig1.xml`);
    await adb(`${prefix} pull /sdcard/ig1.xml`);

    let xml = "";
    try {
      xml = fs.readFileSync("./ig1.xml", "utf8");
    } catch {
      xml = "";
    }

    const xmlIsEmpty = !xml || xml.includes("</hierarchy>");

    let isReels = false;

    // ============================================================
    // DETECT REELS VIA URL
    // ============================================================
    if (postUrl.includes("/reel/")) {
      isReels = true;
      console.log("Detected IG REELS via URL");
    }

    // ============================================================
    // DETECT REELS via XML if exist
    // ============================================================
    if (!xmlIsEmpty && xml.toLowerCase().includes("reel")) {
      isReels = true;
    }

    // ============================================================
    // FALLBACK JIKA XML GAGAL → langsung pakai koordinat
    // ============================================================
    if (xmlIsEmpty) {
      console.log("UI XML kosong → fallback langsung ke koordinat");
      await commentUsingFallback(prefix, selectedComment, isReels);
      return NextResponse.json({ success: true, fallback: true });
    }

    // ============================================================
    // UI-BASED TAP COMMENT UNTUK REELS
    // ============================================================
    if (isReels) {
      console.log("Detected IG REELS → langsung ke koordinat reels");

      // TAP COMMENT UNTUK REELS
      await tap(prefix, IG_COORDS.reels.comment.x, IG_COORDS.reels.comment.y);
      await delay(5000);

      // TAP INPUT UNTUK REELS
      await tap(prefix, IG_COORDS.reels.input.x, IG_COORDS.reels.input.y);
      await delay(1500);

      // CLEAR INPUT FIELD
      for (let i = 0; i < 40; i++) {
        await adb(`${prefix} shell input keyevent 67`);
        await delay(15);
      }

      // INPUT COMMENT UNTUK REELS
      await typeSlowHumanLike(prefix, selectedComment);
      await delay(800);

      // TAP SEND UNTUK REELS
      await tap(prefix, IG_COORDS.reels.send.x, IG_COORDS.reels.send.y);
      await delay(2500);

      return NextResponse.json({ success: true, reels: true });
    }

    // ============================================================
    // UI-BASED TAP COMMENT
    // ============================================================
    let commentNode = findNode(xml, ["comment", "respond", "glyph_comment"]);

    let commentTap;

    if (commentNode?.bounds) {
      commentTap = getCenter(commentNode.bounds);
    } else {
      console.log("UI gagal mendeteksi → fallback IG Reels/Post");

      await commentUsingFallback(prefix, selectedComment, isReels);
      return NextResponse.json({ success: true, fallback: true });
    }

    // ============================================================
    // DEBUGGING UNTUK POST COMMENT IG
    // ============================================================
    console.log("DEBUG: Memulai proses komentar di Instagram");
    console.log("DEBUG: URL Post -", postUrl);
    console.log("DEBUG: Komentar yang akan dikirim -", selectedComment);
    console.log("DEBUG: Apakah Reels -", isReels);

    // ============================================================
    // DEBUGGING UNTUK TAP COMMENT
    // ============================================================
    console.log("DEBUG: Mencoba TAP COMMENT di koordinat", commentTap);
    await tap(prefix, commentTap.x, commentTap.y);
    console.log("DEBUG: TAP COMMENT selesai");
    await delay(5000);

    // ============================================================
    // UI DUMP 2
    // ============================================================
    await adb(`${prefix} shell uiautomator dump /sdcard/ig2.xml`);
    await adb(`${prefix} pull /sdcard/ig2.xml`);
    let xml2 = fs.readFileSync("./ig2.xml", "utf8");

    let inputNode = findNode(xml2, ["add a comment", "Tambahkan komentar", "edittext"]);
    let inputTap;

    if (inputNode?.bounds) {
      inputTap = getCenter(inputNode.bounds);
    } else {
      inputTap = isReels ? IG_COORDS.reels.input : IG_COORDS.post.input;
    }

    // ============================================================
    // DEBUGGING UNTUK TAP INPUT
    // ============================================================
    console.log("DEBUG: Mencoba TAP INPUT di koordinat", inputTap);
    await tap(prefix, inputTap.x, inputTap.y);
    console.log("DEBUG: TAP INPUT selesai");
    await delay(1500);

    // clear anti "W"
    for (let i = 0; i < 40; i++) {
      await adb(`${prefix} shell input keyevent 67`);
      await delay(15);
    }

    // ============================================================
    // DEBUGGING UNTUK INPUT COMMENT
    // ============================================================
    console.log("DEBUG: Mencoba mengetik komentar", selectedComment);
    await typeSlowHumanLike(prefix, selectedComment);
    console.log("DEBUG: Komentar selesai diketik");
    await delay(800);

    let sendNode = findNode(xml2, ["send", "kirim", "glyph_send"]);
    let sendTap;

    if (sendNode?.bounds) {
      sendTap = getCenter(sendNode.bounds);
    } else {
      sendTap = isReels ? IG_COORDS.reels.send : IG_COORDS.post.send;
    }

    // ============================================================
    // DEBUGGING UNTUK SEND COMMENT
    // ============================================================
    console.log("DEBUG: Mencoba TAP SEND COMMENT di koordinat", sendTap);
    await tap(prefix, sendTap.x, sendTap.y);
    console.log("DEBUG: TAP SEND COMMENT selesai");
    await delay(2500);

    // ============================
    // 4. COMMENT BUTTON
    // ============================
    console.log("[4] Comment button");
    await tap(prefix, 187, 1518);
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
    const safe = selectedComment.replace(/"/g, "'").replace(/ /g, "%s");
    await adb(`${prefix} shell input text \"${safe}\"`);
    await delay(5000);

    // ============================
    // 7. SEND COMMENT
    // ============================
    console.log("[7] Send comment");
    await tap(prefix, 973, 2010);
    await delay(4000);

    return NextResponse.json({ success: true, fallback: false });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ============================================================
// FALLBACK COMMENT (PASTI JALAN)
// ============================================================
async function commentUsingFallback(prefix, comment, isReels) {
  const pos = isReels ? IG_COORDS.reels : IG_COORDS.post;

  console.log("FALLBACK MODE → direct coordinates");

  await tap(prefix, pos.comment.x, pos.comment.y);
  await delay(5000);

  await tap(prefix, pos.input.x, pos.input.y);
  await delay(1000);

  for (let i = 0; i < 40; i++) {
    await adb(`${prefix} shell input keyevent 67`);
  }

  await typeSlowHumanLike(prefix, comment);
  await delay(1000);

  await tap(prefix, pos.send.x, pos.send.y);
  await delay(2500);
}

// ============================================================
async function adb(cmd) {
  console.log("DEBUG: Menjalankan perintah ADB -", cmd);
  try {
    const result = await run(cmd);
    console.log("DEBUG: Hasil perintah ADB -", result);
    return result;
  } catch (error) {
    console.error("DEBUG: Error saat menjalankan perintah ADB -", error);
    throw error;
  }
}

async function tap(prefix, x, y) {
  console.log(`DEBUG: Mencoba TAP di koordinat (${x}, ${y})`);
  try {
    const result = await adb(`${prefix} shell input tap ${x} ${y}`);
    console.log(`DEBUG: TAP berhasil di koordinat (${x}, ${y})`);
    return result;
  } catch (error) {
    console.error(`DEBUG: TAP gagal di koordinat (${x}, ${y}) -`, error);
    throw error;
  }
}

async function typeSlow(prefix, t) {
  console.log("DEBUG: Memulai mengetik perlahan -", t);
  for (let c of t) {
    const charToType = c === " " ? "%s" : c;
    console.log(`DEBUG: Mengetik karakter - ${charToType}`);
    await adb(`${prefix} shell input text "${charToType}"`);
    await delay(40 + Math.random() * 40);
  }
}

async function typeSlowHumanLike(prefix, t) {
  console.log("DEBUG: Memulai mengetik dengan delay seperti manusia -", t);
  for (let c of t) {
    const charToType = c === " " ? "%s" : c;
    console.log(`DEBUG: Mengetik karakter - ${charToType}`);
    await adb(`${prefix} shell input text "${charToType}"`);
    await delay(100 + Math.random() * 200); // Delay acak antara 100ms hingga 300ms
  }
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
function getCenter(bounds) {
  const n = bounds.match(/\d+/g).map(Number);
  return { x: (n[0] + n[2]) / 2, y: (n[1] + n[3]) / 2 };
}
function findNode(xml, keys) {
  const re = /<node(.*?)\/>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const raw = m[1].toLowerCase();
    if (keys.some(k => raw.includes(k.toLowerCase()))) {
      const b = raw.match(/bounds="(.*?)"/)?.[1];
      return { bounds: b };
    }
  }
  return null;
}
