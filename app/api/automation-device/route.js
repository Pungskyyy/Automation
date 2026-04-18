import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";

export async function POST(req) {
  try {
    const body = await req.json();
    const serial = body.serial;
    const comment = body.comment || "auto comment dashboard";

    if (!serial) {
      return NextResponse.json({ error: "serial harus diisi" }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "automation", "tiktok_ui_test.py");

    const output = await new Promise((resolve, reject) => {
      execFile(
        "python3",
        [scriptPath, serial, comment],
        { timeout: 60000 },
        (err, stdout, stderr) => {
          if (err) reject(stderr || err.message);
          else resolve(stdout);
        }
      );
    });

    return NextResponse.json({
      ok: true,
      message: "Automation XML berhasil dijalankan",
      output
    });

  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Gagal menjalankan automation XML" },
      { status: 500 }
    );
  }
}
