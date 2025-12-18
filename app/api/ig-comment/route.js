import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import util from "util";
import path from "path";

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
  
  // Instagram Reels
  reelsCommentButton: "com.instagram.android:id/comment_button",
  reelsInputField: "com.instagram.android:id/comment_composer_text_view",
  reelsPostButton: "com.instagram.android:id/layout_comment_thread_post_button",
};

export async function POST(req) {
  console.log("\n═══════════════════════════════════════════");
  console.log("   IG COMMENT API - START");
  console.log("═══════════════════════════════════════════\n");

  // Temp file paths
  const tmpDir = process.cwd();
  const xml1Path = path.join(tmpDir, "ig1.xml");
  const xml2Path = path.join(tmpDir, "ig2.xml");

  try {
    const body = await req.json();
    const { comment, postUrl, serial, type } = body;

    console.log("📝 Request Data:");
    console.log("   Comment:", comment);
    console.log("   Post URL:", postUrl);
    console.log("   Serial:", serial);
    console.log("   Type:", type || "post");

    // Validation
    if (!comment || comment.trim() === "") {
      console.error("❌ Comment kosong");
      return NextResponse.json({ error: "Comment harus diisi" }, { status: 400 });
    }

    if (!postUrl || postUrl.trim() === "") {
      console.error("❌ Post URL kosong");
      return NextResponse.json({ error: "Post URL harus diisi" }, { status: 400 });
    }

    if (!serial || serial.trim() === "") {
      console.error("❌ Device serial kosong");
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

    console.log(`\n🔧 Mode: ${isReels ? "REELS" : "POST"}`);

    // Check device
    console.log("\n1️⃣ Checking device...");
    try {
      const { stdout: devices } = await run("adb devices");
      console.log("   Connected devices:", devices.trim());
      
      if (!devices.includes(serial)) {
        throw new Error(`Device ${serial} tidak ditemukan`);
      }

      const { stdout: state } = await run(`adb -s ${serial} get-state`);
      if (state.trim() !== "device") {
        throw new Error(`Device tidak ready: ${state.trim()}`);
      }
      
      console.log("   ✅ Device ready");
    } catch (err) {
      console.error("   ❌ Device check failed:", err.message);
      return NextResponse.json({ 
        error: `Device error: ${err.message}`,
        needReconnect: true 
      }, { status: 400 });
    }

    // Force stop Instagram
    console.log("\n2️⃣ Force stopping Instagram...");
    await run(`${prefix} shell am force-stop com.instagram.android`);
    await delay(1000);
    console.log("   ✅ Instagram stopped");

    // Open URL
    console.log("\n3️⃣ Opening Instagram URL...");
    await run(`${prefix} shell am start -a android.intent.action.VIEW -d "${postUrl}"`);
    console.log("   ✅ URL opened");
    await delay(5000);

    // UI Dump 1 - Find comment button
    console.log("\n4️⃣ Finding comment button...");
    await run(`${prefix} shell uiautomator dump /sdcard/ig1.xml`);
    await run(`${prefix} pull /sdcard/ig1.xml ${xml1Path}`);
    
    let commentTap = FB.comment;
    if (fs.existsSync(xml1Path)) {
      const xml1 = fs.readFileSync(xml1Path, "utf8");
      const commentNode = findNode(xml1, [IDS.commentButton]);
      
      if (commentNode?.bounds) {
        commentTap = getCenter(commentNode.bounds);
        console.log(`   ✅ Found at (${Math.round(commentTap.x)}, ${Math.round(commentTap.y)})`);
      } else {
        console.log(`   ⚠️ Using fallback (${commentTap.x}, ${commentTap.y})`);
      }
    }

    // Tap comment button
    console.log("\n5️⃣ Tapping comment button...");
    await run(`${prefix} shell input tap ${Math.round(commentTap.x)} ${Math.round(commentTap.y)}`);
    await delay(3000);
    console.log("   ✅ Comment button tapped");

    // UI Dump 2 - Find input field
    console.log("\n6️⃣ Finding input field & send button...");
    await run(`${prefix} shell uiautomator dump /sdcard/ig2.xml`);
    await run(`${prefix} pull /sdcard/ig2.xml ${xml2Path}`);
    
    let inputTap = FB.input;
    let sendTap = FB.send;
    
    if (fs.existsSync(xml2Path)) {
      const xml2 = fs.readFileSync(xml2Path, "utf8");
      
      const inputNode = findNode(xml2, [IDS.inputField]);
      if (inputNode?.bounds) {
        inputTap = getCenter(inputNode.bounds);
        console.log(`   ✅ Input found at (${Math.round(inputTap.x)}, ${Math.round(inputTap.y)})`);
      } else {
        console.log(`   ⚠️ Using fallback input (${inputTap.x}, ${inputTap.y})`);
      }
      
      const sendNode = findNode(xml2, [IDS.postButton]);
      if (sendNode?.bounds) {
        sendTap = getCenter(sendNode.bounds);
        console.log(`   ✅ Send found at (${Math.round(sendTap.x)}, ${Math.round(sendTap.y)})`);
      } else {
        console.log(`   ⚠️ Using fallback send (${sendTap.x}, ${sendTap.y})`);
      }
    }

    // Tap input field
    console.log("\n7️⃣ Tapping input field...");
    await run(`${prefix} shell input tap ${Math.round(inputTap.x)} ${Math.round(inputTap.y)}`);
    await delay(1500);
    console.log("   ✅ Input field tapped");

    // Clear input
    console.log("\n8️⃣ Clearing input...");
    await run(`${prefix} shell input keyevent KEYCODE_MOVE_END`);
    for (let i = 0; i < 50; i++) {
      await run(`${prefix} shell input keyevent KEYCODE_DEL`);
    }
    await delay(500);
    console.log("   ✅ Input cleared");

    // Type comment
    console.log("\n9️⃣ Typing comment...");
    const escapedComment = comment.replace(/ /g, "%s");
    await run(`${prefix} shell input text "${escapedComment}"`);
    await delay(1500);
    console.log("   ✅ Comment typed");

    // Tap send button
    console.log("\n🔟 Tapping send button...");
    await run(`${prefix} shell input tap ${Math.round(sendTap.x)} ${Math.round(sendTap.y)}`);
    await delay(2500);
    console.log("   ✅ Send button tapped");

    // Close keyboard
    await run(`${prefix} shell input keyevent KEYCODE_BACK`);
    await delay(500);

    // Cleanup
    try {
      if (fs.existsSync(xml1Path)) fs.unlinkSync(xml1Path);
      if (fs.existsSync(xml2Path)) fs.unlinkSync(xml2Path);
    } catch (cleanupErr) {
      console.error("⚠️ Cleanup error:", cleanupErr.message);
    }

    console.log("\n═══════════════════════════════════════════");
    console.log("   ✅ COMMENT SENT SUCCESSFULLY");
    console.log("═══════════════════════════════════════════\n");

    return NextResponse.json({
      success: true,
      message: "Instagram comment berhasil dikirim",
      serial,
      postUrl,
      type: isReels ? "reels" : "post",
      coordinates: {
        commentButton: commentTap,
        inputField: inputTap,
        sendButton: sendTap
      }
    });

  } catch (err) {
    console.error("\n❌ ERROR:", err.message);
    console.error("Stack:", err.stack);
    
    // Cleanup on error
    try {
      if (fs.existsSync(xml1Path)) fs.unlinkSync(xml1Path);
      if (fs.existsSync(xml2Path)) fs.unlinkSync(xml2Path);
    } catch (cleanupErr) {
      console.error("⚠️ Cleanup error:", cleanupErr.message);
    }

    return NextResponse.json({ 
      error: err.message || "Unknown error occurred",
      details: err.stack
    }, { status: 500 });
  }
}

/* UTILITY FUNCTIONS */

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCenter(bounds) {
  const nums = bounds.match(/\d+/g).map(Number);
  return { 
    x: Math.round((nums[0] + nums[2]) / 2), 
    y: Math.round((nums[1] + nums[3]) / 2) 
  };
}

function findNode(xml, keys) {
  if (!xml) return null;

  const nodeRegex = /<node(.*?)\/>/g;
  let match;

  while ((match = nodeRegex.exec(xml)) !== null) {
    const nodeContent = match[1].toLowerCase();
    
    if (keys.some(key => nodeContent.includes(key.toLowerCase()))) {
      const boundsMatch = nodeContent.match(/bounds="(.*?)"/);
      return { 
        raw: match[1], 
        bounds: boundsMatch ? boundsMatch[1] : null 
      };
    }
  }
  
  return null;
}