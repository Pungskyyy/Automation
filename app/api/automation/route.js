// app/api/automation/route.js
import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export async function POST() {
  try {
    // Contoh: jalankan python multi-device
    const cmd = "python3 scripts/run_all_devices.py";
    const { stdout, stderr } = await execAsync(cmd);

    const message =
      (stdout && stdout.trim()) ||
      (stderr && stderr.trim()) ||
      "Automation script dijalankan";

    return NextResponse.json(
      {
        message,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Gagal menjalankan automation" },
      { status: 500 }
    );
  }
}
