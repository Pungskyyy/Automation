import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const run = util.promisify(exec);

export async function POST(request) {
  try {
    const { serial } = await request.json();

    if (!serial) {
      return NextResponse.json(
        { success: false, error: "Serial number required" },
        { status: 400 }
      );
    }

    // Cek apakah device sudah dalam mode TCP/IP
    if (serial.match(/^\d+\.\d+\.\d+\.\d+:\d+$/)) {
      return NextResponse.json({
        success: true,
        message: `Device ${serial} already in TCP/IP mode`,
        alreadyTcpip: true,
        tcpAddress: serial
      });
    }

    // Cek status device
    const { stdout: stateOutput } = await run(`adb -s "${serial}" get-state`);
    const state = stateOutput.trim();

    if (state !== "device") {
      return NextResponse.json(
        { success: false, error: `Device ${serial} is ${state}, not ready` },
        { status: 400 }
      );
    }

    // Enable TCP/IP mode
    await run(`adb -s "${serial}" tcpip 5555`);
    
    // Tunggu sebentar
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Deteksi IP address
    let ip = "";
    
    // Method 1: dumpsys connectivity
    try {
      const { stdout } = await run(`adb -s "${serial}" shell dumpsys connectivity | grep "wlan0" | grep -oE "([0-9]{1,3}\\.){3}[0-9]{1,3}/" | head -n1`);
      ip = stdout.trim().replace(/\/$/, '');
    } catch (e) {}

    // Method 2: wlan0 (fallback)
    if (!ip || !ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      try {
        const { stdout } = await run(`adb -s "${serial}" shell ip -f inet addr show wlan0 | awk '/inet /{print $2}' | cut -d'/' -f1`);
        ip = stdout.trim();
      } catch (e) {}
    }

    // Method 3: ip route (fallback)
    if (!ip || !ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      try {
        const { stdout } = await run(`adb -s "${serial}" shell ip route get 8.8.8.8 | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}'`);
        ip = stdout.trim();
      } catch (e) {}
    }

    if (!ip || !ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return NextResponse.json(
        { success: false, error: "Could not detect device IP address" },
        { status: 500 }
      );
    }

    const tcpAddress = `${ip}:5555`;

    // Tunggu sebentar sebelum connect
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Connect via TCP/IP
    const { stdout: connectOutput } = await run(`adb connect ${tcpAddress}`);

    if (connectOutput.includes("connected")) {
      return NextResponse.json({
        success: true,
        message: `Successfully enabled TCP/IP for ${serial}`,
        tcpAddress,
        originalSerial: serial,
        ip
      });
    } else {
      return NextResponse.json(
        { success: false, error: `Failed to connect to ${tcpAddress}: ${connectOutput}` },
        { status: 500 }
      );
    }

  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
