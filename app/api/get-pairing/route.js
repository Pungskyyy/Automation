import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const run = util.promisify(exec);

export async function GET() {
  try {
    // ambil ip
    const { stdout: ipRaw } = await run(`adb shell ip -f inet addr show wlan0`);
    const ip = ipRaw.match(/inet ([0-9.]+)/)?.[1];

    if (!ip) {
      return NextResponse.json(
        { success: false, error: "IP tidak ditemukan (wlan0 tidak aktif?)" },
        { status: 500 }
      );
    }

    // ambil dumpsys pairing tanpa GREP (VERSI AMAN)
    const { stdout: dump } = await run(`adb shell dumpsys activity service com.android.adbd`);

    // cari port & pairing code secara manual
    const port = dump.match(/pairingPort=(\d+)/)?.[1] ||
                 dump.match(/port=(\d+)/)?.[1];

    const code = dump.match(/pairingCode=(\d+)/)?.[1] ||
                 dump.match(/code=(\d+)/)?.[1];

    if (!port || !code) {
      return NextResponse.json(
        { success: false, error: "Pairing mode belum aktif di device" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ip,
      port,
      pairCode: code
    });

  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
