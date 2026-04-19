import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

// ✅ Helper function: Get device IP address
async function getDeviceIp(serial) {
  try {
    const { stdout } = await execPromise(`adb -s ${serial} shell ip addr show wlan0`);
    const match = stdout.match(/inet\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    return match ? match[1] : null;
  } catch (err) {
    console.error(`Failed to get IP for ${serial}:`, err.message);
    return null;
  }
}

// ✅ GET METHOD - List devices with IP info
export async function GET() {
  try {
    console.log("📱 Fetching ADB devices...");
    
    const { stdout } = await execPromise("adb devices -l");
    
    console.log("ADB stdout:", stdout);

    const lines = stdout
      .split("\n")
      .slice(1)
      .filter((line) => line.trim() !== "");

    const devices = await Promise.all(
      lines.map(async (line) => {
        const parts = line.trim().split(/\s+/);
        const serial = parts[0];
        const state = parts[1];
        
        const ipMatch = serial.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+)/);
        
        let ip = null;
        
        if (ipMatch) {
          ip = ipMatch[1];
        } else if (state === "device") {
          ip = await getDeviceIp(serial);
        }
        
        return { 
          serial, 
          state,
          ip,
          transport: ipMatch ? "tcpip" : "usb"
        };
      })
    );

    console.log("✅ Devices parsed:", devices);

    return NextResponse.json({ 
      success: true,
      devices 
    });
  } catch (err) {
    console.error("❌ Error:", err);
    return NextResponse.json({ 
      success: false,
      error: err.message, 
      devices: [] 
    }, { status: 500 });
  }
}

// ✅ POST METHOD - Enable TCP/IP on a device
export async function POST(req) {
  try {
    const { serial, port = 5555 } = await req.json();

    if (!serial) {
      return NextResponse.json(
        { success: false, error: "Device serial is required" },
        { status: 400 }
      );
    }

    console.log(`📱 [TCPIP] Enabling TCP/IP on ${serial} port ${port}...`);

    // Enable TCP/IP mode
    const { stdout, stderr } = await execPromise(`adb -s ${serial} tcpip ${port}`);
    const output = stdout + stderr;

    console.log(`[TCPIP] Output: ${output}`);

    // Check if successful
    if (output.includes("restarting") || output.includes(String(port))) {
      // Get device IP
      const ip = await getDeviceIp(serial);

      return NextResponse.json({
        success: true,
        message: `TCP/IP enabled on ${serial}`,
        serial,
        port,
        ip,
        output: output.trim(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to enable TCP/IP: ${output}`,
          serial,
        },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("[TCPIP] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}
