import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Execute adb devices -l to get detailed info
    const { stdout } = await execAsync("adb devices -l");
    
    console.log("[API /devices] Raw ADB output:", stdout);

    const lines = stdout.trim().split("\n").slice(1); // Skip header
    const devices = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const parts = line.trim().split(/\s+/);
      const serial = parts[0];
      const state = parts[1];

      // ✅ HANYA TAMPILKAN DEVICE YANG STATE = "device" (benar-benar terhubung)
      if (state !== "device") {
        console.log(`[API /devices] Skipping device ${serial} with state: ${state}`);
        continue;
      }

      // Extract model from device info
      let model = "Unknown";
      const modelMatch = line.match(/model:([^\s]+)/);
      if (modelMatch) {
        model = modelMatch[1].replace(/_/g, " ");
      }

      // Determine type (USB or TCP/IP)
      const type = serial.includes(":") ? "tcpip" : "usb";

      devices.push({
        serial,
        state,
        model,
        type,
      });
    }

    console.log("[API /devices] Connected devices:", devices);

    return NextResponse.json({ 
      devices,
      count: devices.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[API /devices] Error:", error);
    return NextResponse.json(
      { error: error.message, devices: [], count: 0 },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { serial } = await request.json();

    if (!serial) {
      return NextResponse.json(
        { error: "Serial number required" },
        { status: 400 }
      );
    }

    console.log(`[API /disconnect] Disconnecting device: ${serial}`);

    // Execute adb disconnect
    const { stdout, stderr } = await execAsync(`adb disconnect ${serial}`);

    console.log("[API /disconnect] stdout:", stdout);
    if (stderr) console.log("[API /disconnect] stderr:", stderr);

    // Check if disconnect was successful
    const success = stdout.includes("disconnected") || !stderr;

    if (!success) {
      throw new Error(stderr || "Failed to disconnect device");
    }

    return NextResponse.json({
      success: true,
      message: `Device ${serial} disconnected successfully`,
      output: stdout,
    });
  } catch (error) {
    console.error("[API /disconnect] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
