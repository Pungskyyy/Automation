import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import util from "util";

const run = util.promisify(exec);

const FALLBACK = {
  post: {
    comment: { x: 250, y: 1965 },
    input: { x: 500, y: 1145 },
    send: { x: 920, y: 1145 },
  },
  reels: {
    comment: { x: 1000, y: 1120 },
    input: { x: 500, y: 1950 },
    send: { x: 1000, y: 1950 },
  },
};

const IG_IDS = {
  // Instagram Post (Feed)
  commentButton: "com.instagram.android:id/row_feed_button_comment",
  inputField: "com.instagram.android:id/layout_comment_thread_edittext",
  postButton: "com.instagram.android:id/layout_comment_thread_post_button_icon",
  
  // Instagram Reels (UPDATED - CORRECT!)
  reelsCommentButton: "com.instagram.android:id/comment_button",           // Open kolom comment for reels
  reelsInputField: "com.instagram.android:id/comment_composer_text_view",  // Add comment field for reels
  reelsPostButton: "com.instagram.android:id/layout_comment_thread_post_button", // Post comment button for reels
  reelsLikeButton: "com.instagram.android:id/row_comment_like_button",     // Like button (optional)
};

export async function POST(req) {
  console.log("[IG] POST handler started");
  try {
    const { comment, postUrl, serial, type } = await req.json();
    console.log("[IG] Received data:", { comment, postUrl, serial, type });

    if (!comment) {
      console.error("[IG] Comment harus diisi");
      return NextResponse.json({ error: "Comment harus diisi" }, { status: 400 });
    }

    if (!postUrl) {
      console.error("[IG] Post URL harus diisi");
      return NextResponse.json({ error: "Post URL harus diisi" }, { status: 400 });
    }

    if (!serial) {
      console.error("[IG] Device serial harus diisi");
      return NextResponse.json({ error: "Device serial harus diisi" }, { status: 400 });
    }

    const prefix = `adb -s ${serial}`;
    const isReels = type === "reels";
    const FB = isReels ? FALLBACK.reels : FALLBACK.post;
    const IDS = isReels
      ? {
          commentButton: IG_IDS.reelsCommentButton,
          inputField: IG_IDS.reelsInputField,
          postButton: IG_IDS.reelsPostButton,
        }
      : {
          commentButton: IG_IDS.commentButton,
          inputField: IG_IDS.inputField,
          postButton: IG_IDS.postButton,
        };

    console.log(`[IG] Using device: ${serial}`);
    console.log("[IG] FORCE STOP IG");
    await adb(`${prefix} shell am force-stop com.instagram.android`);
    console.log("[IG] IG stopped successfully");

    console.log("[IG] OPEN URL:", postUrl);
    await adb(`${prefix} shell am start -a android.intent.action.VIEW -d "${postUrl}"`);
    console.log("[IG] URL opened successfully");

    // Wait for Instagram to load
    await delay(5000);

    console.log("[IG] DUMP UI 1");
    await adb(`${prefix} shell uiautomator dump /sdcard/ig1.xml`);
    await adb(`${prefix} pull /sdcard/ig1.xml`);
    console.log("[IG] UI dump 1 completed");

    let xml1 = "";
    try {
      xml1 = fs.readFileSync("ig1.xml", "utf8");
      console.log("[IG] XML 1 Loaded Successfully");
    } catch (err) {
      console.error("[IG] Failed to load ig1.xml:", err);
    }

    /* FIND COMMENT BUTTON */
    let commentNode = findNode(xml1, [IDS.commentButton]);
    let commentTap = commentNode?.bounds ? getCenter(commentNode.bounds) : FB.comment;

    console.log("[IG] TAP COMMENT BUTTON:", commentTap);
    await tap(prefix, commentTap.x, commentTap.y);
    console.log("[IG] Comment button tapped");

    await delay(6000);

    /* DUMP UI 2 (input field) */
    console.log("[IG] DUMP UI 2");
    await adb(`${prefix} shell uiautomator dump /sdcard/ig2.xml`);
    await adb(`${prefix} pull /sdcard/ig2.xml`);
    console.log("[IG] UI dump 2 completed");

    let xml2 = "";
    try {
      xml2 = fs.readFileSync("ig2.xml", "utf8");
      console.log("[IG] XML 2 Loaded Successfully");
    } catch (err) {
      console.error("[IG] Failed to load ig2.xml:", err);
    }

    /* FIND INPUT FIELD */
    let inputNode = findNode(xml2, [IDS.inputField]);
    let inputTap = inputNode?.bounds ? getCenter(inputNode.bounds) : FB.input;

    console.log("[IG] TAP INPUT FIELD:", inputTap);
    await tap(prefix, inputTap.x, inputTap.y);
    console.log("[IG] Input field tapped");

    await delay(1500);

    /* CLEAR INPUT */
    console.log("[IG] CLEAR INPUT FIELD");
    for (let i = 0; i < 30; i++) {
      await adb(`${prefix} shell input keyevent 67`);
    }
    console.log("[IG] Input field cleared");

    /* TYPE COMMENT */
    console.log("[IG] TYPING COMMENT:", comment);
    for (let c of comment) {
      await adb(`${prefix} shell input text "${c === " " ? "%s" : c}"`);
      await delay(60 + Math.random() * 60);
    }
    console.log("[IG] Comment typed");

    await delay(700);

    /* FIND SEND BUTTON */
    let sendNode = findNode(xml2, [IDS.postButton]);
    let sendTap = sendNode?.bounds ? getCenter(sendNode.bounds) : FB.send;

    console.log("[IG] TAP SEND BUTTON:", sendTap);
    await tap(prefix, sendTap.x, sendTap.y);
    console.log("[IG] Send button tapped");

    await delay(3000);

    console.log("[IG] COMMENT SENT SUCCESSFULLY");
    return NextResponse.json({
      success: true,
      message: "Instagram comment berhasil dikirim",
      serial: serial,
      postUrl: postUrl,
      action: "DONE",
      taps: { commentTap, inputTap, sendTap }
    });

  } catch (err) {
    console.error("[IG] Error in POST handler:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    console.log("[IG] POST handler finished");
  }
}

/* UTIL */
async function adb(c) {
  console.log("[ADB] Checking devices...");
  try {
    const devices = await run("adb devices");
    console.log("[ADB] Connected devices:", devices.stdout);
    if (!devices.stdout.includes("device")) {
      console.error("[ADB] No devices connected.");
      throw new Error("No devices connected.");
    }
  } catch (error) {
    console.error("[ADB] Failed to check devices:", error.message);
    throw error;
  }

  console.log("[ADB] Executing command:", c);
  try {
    const result = await run(c);
    console.log("[ADB] Command output:", result.stdout);
    if (result.stderr) {
      console.error("[ADB] Command error output:", result.stderr);
    }
    if (!result.stdout && !result.stderr) {
      console.warn("[ADB] Command executed but no output detected. Check if the device is responsive.");
    }
    return result;
  } catch (error) {
    console.error("[ADB] Command failed:", c);
    console.error("[ADB] Error:", error.message);
    throw error;
  }
}
async function tap(prefix, x, y) {
  return adb(`${prefix} shell input tap ${x} ${y}`);
}
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
function getCenter(bounds) {
  const n = bounds.match(/\d+/g).map(Number);
  return { x: (n[0] + n[2]) / 2, y: (n[1] + n[3]) / 2 };
}
function findNode(xml, keys) {
  if (!xml) return null;

  const re = /<node(.*?)\/>/g;
  let m;

  while ((m = re.exec(xml)) !== null) {
    const raw = m[1].toLowerCase();
    if (keys.some(k => raw.includes(k.toLowerCase()))) {
      const b = raw.match(/bounds="(.*?)"/)?.[1];
      return { raw, bounds: b };
    }
  }
  return null;
}
