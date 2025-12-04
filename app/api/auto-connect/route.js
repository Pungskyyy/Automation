import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import path from "path";

const run = util.promisify(exec);

export async function POST() {
  try {
    // Path ke skrip bash
    const scriptPath = path.join(process.cwd(), "scripts", "adb_tcpip_multi.sh");

    // Pastikan skrip memiliki izin eksekusi
    await run(`chmod +x ${scriptPath}`);

    // Jalankan skrip
    const { stdout, stderr } = await run(`bash ${scriptPath}`);

    const output = stdout || stderr || "Skrip selesai dijalankan";

    return NextResponse.json({
      success: true,
      message: "ADB TCP/IP multi-device berhasil dijalankan",
      output: output.trim(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        output: err.stdout || err.stderr || "",
      },
      { status: 500 }
    );
  }
}
