import { exec } from "child_process";
import fs from "fs";
import { findNode } from "@/lib/findNode";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(stderr);
      else resolve(stdout);
    });
  });

export async function POST(req) {
  try {
    const { deviceId, link, comment } = await req.json();

    // 1 buka home
    await run(`adb -s ${deviceId} shell input keyevent 3`);
    await sleep(800);

    // 2 buka chrome
    await run(`adb -s ${deviceId} shell input tap 500 80`);
    await sleep(700);

    // 3 masukkan link
    const safeLink = link.replace(/:/g, "\\:").replace(/\//g, "\\/");
    await run(`adb -s ${deviceId} shell input text "${safeLink}"`);
    await sleep(500);

    await run(`adb -s ${deviceId} shell input keyevent 66`);
    await sleep(4500);

    // 4 dump XML
    await run(`adb -s ${deviceId} shell uiautomator dump /sdcard/view.xml`);
    await run(`adb -s ${deviceId} pull /sdcard/view.xml ./view-${deviceId}.xml`);

    const xml = fs.readFileSync(`./view-${deviceId}.xml`, "utf8");

    // 5 auto detect tombol comment
    const commentBtn = findNode(xml, "dq6");
    if (!commentBtn) {
      return Response.json({ error: "Button comment tidak ditemukan" });
    }

    await run(`adb -s ${deviceId} shell input tap ${commentBtn.x} ${commentBtn.y}`);
    await sleep(2500);

    // 6 dump ulang untuk cari input field
    await run(`adb -s ${deviceId} shell uiautomator dump /sdcard/comment.xml`);
    await run(`adb -s ${deviceId} pull /sdcard/comment.xml ./comment-${deviceId}.xml`);

    const xml2 = fs.readFileSync(`./comment-${deviceId}.xml`, "utf8");

    // cari input field TikTok
    const inputField = findNode(xml2, "edit_text");
    if (!inputField) {
      return Response.json({ error: "Input comment tidak ditemukan" });
    }

    await run(`adb -s ${deviceId} shell input tap ${inputField.x} ${inputField.y}`);
    await sleep(600);

    // isi comment
    const safeComment = comment.replace(/ /g, "%s");
    await run(`adb -s ${deviceId} shell input text "${safeComment}"`);
    await sleep(600);

    // cari tombol send
    const sendBtn = findNode(xml2, "send");
    if (!sendBtn) {
      return Response.json({ error: "Send button tidak ditemukan" });
    }

    await run(`adb -s ${deviceId} shell input tap ${sendBtn.x} ${sendBtn.y}`);

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
