import { exec } from "child_process";

export default async function handler(req, res) {
  const { postUrl, comment, coords } = req.body;

  if (!postUrl || !comment)
    return res.status(400).json({ error: "URL Instagram tidak boleh kosong" });

  // 1. Open Instagram post
  exec(`adb shell am start -a android.intent.action.VIEW -d "${postUrl}"`, (err) => {
    if (err) console.log("Error open IG:", err);
  });

  await new Promise((r) => setTimeout(r, 2500));

  // 2. Tap comment button
  exec(`adb shell input tap ${coords.commentButton.x} ${coords.commentButton.y}`);

  await new Promise((r) => setTimeout(r, 1000));

  // 3. Tap input field
  exec(`adb shell input tap ${coords.inputField.x} ${coords.inputField.y}`);

  await new Promise((r) => setTimeout(r, 700));

  // 4. Input comment
  exec(`adb shell input text "${comment.replace(/ /g, "%s")}"`);

  await new Promise((r) => setTimeout(r, 600));

  // 5. Tap send
  exec(`adb shell input tap ${coords.sendButton.x} ${coords.sendButton.y}`);

  return res.json({ message: "Komentar IG sukses" });
}
