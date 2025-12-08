// app/api/automation/route.js
import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

// Helper function untuk mendapatkan IP address dari device
async function getDeviceIP(serial) {
  try {
    // Method 1: wlan0
    let { stdout } = await execAsync(`adb -s ${serial} shell ip -f inet addr show wlan0 2>/dev/null | awk '/inet /{print $2}' | cut -d'/' -f1`);
    let ip = stdout.trim();
    
    if (ip) return ip;
    
    // Method 2: ip route
    ({ stdout } = await execAsync(`adb -s ${serial} shell ip route get 8.8.8.8 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}'`));
    ip = stdout.trim();
    
    if (ip) return ip;
    
    // Method 3: getprop
    ({ stdout } = await execAsync(`adb -s ${serial} shell getprop dhcp.wlan0.ipaddress`));
    ip = stdout.trim().replace(/\r/g, '');
    
    return ip || null;
  } catch (error) {
    console.error(`Error getting IP for ${serial}:`, error.message);
    return null;
  }
}

// Enable TCP/IP mode pada device
export async function POST(req) {
  try {
    const body = await req.json();
    const { action, serial, port = 5555 } = body;

    if (action === "enable-tcpip") {
      // Enable TCP/IP mode
      if (!serial) {
        return NextResponse.json(
          { error: "Serial device tidak diberikan" },
          { status: 400 }
        );
      }

      // Enable tcpip pada port tertentu
      await execAsync(`adb -s ${serial} tcpip ${port}`);
      
      // Wait untuk device restart
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Dapatkan IP address
      const ip = await getDeviceIP(serial);
      
      if (!ip) {
        return NextResponse.json(
          { error: "Gagal mendapatkan IP address dari device" },
          { status: 500 }
        );
      }

      // Connect via TCP/IP
      const { stdout: connectResult } = await execAsync(`adb connect ${ip}:${port}`);
      
      return NextResponse.json({
        success: true,
        message: `TCP/IP mode enabled untuk ${serial}`,
        ip: `${ip}:${port}`,
        connectResult: connectResult.trim()
      });

    } else if (action === "connect") {
      // Connect ke device via IP
      const { ip } = body;
      
      if (!ip) {
        return NextResponse.json(
          { error: "IP address tidak diberikan" },
          { status: 400 }
        );
      }

      const { stdout } = await execAsync(`adb connect ${ip}`);
      
      return NextResponse.json({
        success: true,
        message: `Connected to ${ip}`,
        output: stdout.trim()
      });

    } else if (action === "disconnect") {
      // Disconnect dari device
      const { ip } = body;
      
      if (!ip) {
        return NextResponse.json(
          { error: "IP address tidak diberikan" },
          { status: 400 }
        );
      }

      const { stdout } = await execAsync(`adb disconnect ${ip}`);
      
      return NextResponse.json({
        success: true,
        message: `Disconnected from ${ip}`,
        output: stdout.trim()
      });

    } else if (action === "run-automation") {
      // Jalankan automation script
      const cmd = "python3 scripts/run_all_devices.py";
      const { stdout, stderr } = await execAsync(cmd);

      const message =
        (stdout && stdout.trim()) ||
        (stderr && stderr.trim()) ||
        "Automation script dijalankan";

      return NextResponse.json({
        success: true,
        message,
      });

    } else if (action === "setup-all") {
      // Setup semua device yang terhubung via USB ke TCP/IP mode
      const { stdout: devicesOutput } = await execAsync("adb devices -l");
      
      const devices = devicesOutput
        .split("\n")
        .slice(1)
        .filter((line) => line.trim() !== "" && line.includes("device"))
        .map((line) => {
          const parts = line.trim().split(/\s+/);
          return parts[0];
        });

      if (devices.length === 0) {
        return NextResponse.json(
          { error: "Tidak ada device yang terhubung" },
          { status: 404 }
        );
      }

      const results = [];
      
      for (const device of devices) {
        try {
          // Enable tcpip
          await execAsync(`adb -s ${device} tcpip ${port}`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Get IP
          const ip = await getDeviceIP(device);
          
          if (ip) {
            // Connect
            const { stdout: connectResult } = await execAsync(`adb connect ${ip}:${port}`);
            results.push({
              serial: device,
              ip: `${ip}:${port}`,
              status: "success",
              message: connectResult.trim()
            });
          } else {
            results.push({
              serial: device,
              status: "failed",
              message: "Gagal mendapatkan IP address"
            });
          }
        } catch (error) {
          results.push({
            serial: device,
            status: "error",
            message: error.message
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Setup completed untuk ${results.length} devices`,
        results
      });

    } else {
      return NextResponse.json(
        { error: "Action tidak valid. Gunakan: enable-tcpip, connect, disconnect, run-automation, atau setup-all" },
        { status: 400 }
      );
    }

  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Gagal menjalankan automation" },
      { status: 500 }
    );
  }
}

// GET endpoint untuk mendapatkan status devices
export async function GET() {
  try {
    const { stdout } = await execAsync("adb devices -l");
    
    const devices = stdout
      .split("\n")
      .slice(1)
      .filter((line) => line.trim() !== "")
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        return {
          serial: parts[0],
          status: parts[1],
          isWifi: parts[0].includes(":5555") || parts[0].includes(":")
        };
      });

    return NextResponse.json({
      success: true,
      devices,
      total: devices.length,
      wifi: devices.filter(d => d.isWifi).length,
      usb: devices.filter(d => !d.isWifi).length
    });

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
