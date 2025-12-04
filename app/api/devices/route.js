// app/api/devices/route.js
import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const run = util.promisify(exec);

export async function GET() {
  try {
    // Jalankan perintah adb untuk mendeteksi perangkat yang terhubung
    const { stdout } = await run("adb devices -l");

    // Parsing output adb untuk mendapatkan daftar perangkat
    const devices = stdout
      .split("\n")
      .slice(1) // Abaikan header
      .filter((line) => line.trim() !== "") // Abaikan baris kosong
      .map((line) => {
        // Split by tab atau whitespace dan ambil hanya serial (kolom pertama) dan status (kolom kedua)
        const parts = line.trim().split(/\s+/);
        const serial = parts[0]; // Serial number saja
        const status = parts[1]; // Status (device, unauthorized, dll)
        return { serial, status };
      });

    return NextResponse.json({ devices });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { serial } = await req.json();

    if (!serial) {
      return NextResponse.json({ error: "Serial perangkat tidak diberikan" }, { status: 400 });
    }

    // Jalankan perintah adb tcpip untuk mengaktifkan mode TCP/IP
    await run(`adb -s ${serial} tcpip 5555`);

    return NextResponse.json({ message: `Perangkat ${serial} sekarang dalam mode TCP/IP` });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}