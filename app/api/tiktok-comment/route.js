import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function POST(req) {
  const { comment, videoUrl } = await req.json();

  if (!comment || !videoUrl)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  return new Promise((resolve) => {
    exec("adb devices", (err, stdout) => {
      if (err) return resolve(NextResponse.json({ error: "ADB error" }, { status: 500 }));

      const devices = stdout
        .split("\n")
        .slice(1)
        .filter((l) => l.includes("device"))
        .map((l) => l.split("\t")[0]);

      devices.forEach((serial) => {
        // buka tiktok
        exec(`adb -s ${serial} shell am start -a android.intent.action.VIEW -d "${videoUrl}"`, () => {});

        // tunggu app kebuka → klik kolom komentar
        setTimeout(() => {
          exec(`adb -s ${serial} shell input tap 540 1650`, () => {});
        }, 4000);

        // isi komentar
        setTimeout(() => {
          exec(`adb -s ${serial} shell input text "${comment.replace(/ /g, "%s")}"`, () => {});
        }, 5500);

        // kirim
        setTimeout(() => {
          exec(`adb -s ${serial} shell input tap 980 1650`, () => {});
        }, 7000);
      });

      resolve(
        NextResponse.json({
          message: `Komentar dikirim ke ${devices.length} device`,
        })
      );
    });
  });
}
