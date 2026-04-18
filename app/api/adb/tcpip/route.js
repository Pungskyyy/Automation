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

// ✅ CUMA GET METHOD - untuk list devices
export async function GET() {
  try {
    console.log("📱 Fetching ADB devices...");
    
    const { stdout } = await execPromise("adb devices -l");
    
    console.log("ADB stdout:", stdout);

    const lines = stdout
      .split("\n")
      .slice(1)
      .filter((line) => line.trim() !== "");

    // ✅ Parse devices & fetch IP for each
    const devices = await Promise.all(
      lines.map(async (line) => {
        const parts = line.trim().split(/\s+/);
        const serial = parts[0];
        const state = parts[1];
        
        // Check if already connected via TCP/IP
        const ipMatch = serial.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+)/);
        
        let ip = null;
        
        if (ipMatch) {
          // Already connected via IP
          ip = ipMatch[1];
        } else if (state === "device") {
          // USB connection - fetch IP from device
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