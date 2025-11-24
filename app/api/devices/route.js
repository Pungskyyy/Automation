// app/api/devices/route.js
import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync("adb devices");
    // parsing stdout
    const lines = stdout.split("\n").slice(1); // skip header
    const devices = lines
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const [serial, status] = line.split(/\s+/);
        return { serial, status };
      });

    return NextResponse.json({ devices }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Gagal menjalankan adb devices" },
      { status: 500 }
    );
  }
}