import { exec } from "child_process";

export default async function handler(req, res) {
  const { videoUrl, comment, coords } = req.body;

  if (!videoUrl || !comment)
    return res.status(400).json({ error: "URL TikTok tidak boleh kosong" });

  // 1. Open TikTok using link
  exec(`adb shell am start -a android.intent.action.VIEW -d "${videoUrl}"`, (err) => {
    if (err) console.log("Error open TikTok:", err);
  });

  // Delay 2s biar aplikasi kebuka
  await new Promise((r) => setTimeout(r, 2000));

  // 2. Tap comment button
  exec(`adb shell input tap ${coords.commentButton.x} ${coords.commentButton.y}`);

  await new Promise((r) => setTimeout(r, 1000));

  // 3. Tap input field
  exec(`adb shell input tap ${coords.inputField.x} ${coords.inputField.y}`);

  await new Promise((r) => setTimeout(r, 800));

  // 4. Input comment
  exec(`adb shell input text "${comment.replace(/ /g, "%s")}"`);

  await new Promise((r) => setTimeout(r, 600));

  // 5. Tap send
  exec(`adb shell input tap ${coords.sendButton.x} ${coords.sendButton.y}`);

  return res.json({ message: "Komentar TikTok sukses" });
}
