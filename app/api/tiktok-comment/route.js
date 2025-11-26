import { exec } from "child_process";

function runADB(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || err);
      resolve(stdout);
    });
  });
}

export async function POST(req) {
  try {
    const { videoUrl, comment, coords } = await req.json();

    await runADB(`
      adb shell input keyevent 3;
      adb shell am start -a android.intent.action.VIEW -d "${videoUrl}";
      adb shell sleep 3;

      adb shell input tap ${coords.commentButton.x} ${coords.commentButton.y};
      adb shell sleep 1;

      adb shell input tap ${coords.inputField.x} ${coords.inputField.y};
      adb shell sleep 1;

      adb shell input text "${comment.replace(/ /g, "%s")}";
      adb shell sleep 1;

      adb shell input tap ${coords.sendButton.x} ${coords.sendButton.y};
      adb shell sleep 1;
    `);

    return Response.json({ message: "Komentar TikTok terkirim" });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
