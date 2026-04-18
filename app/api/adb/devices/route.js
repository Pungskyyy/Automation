import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

// ✅ Helper: Get device IP
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

// ✅ Helper: Wait for device to be ready
async function waitForDevice(serial, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { stdout } = await execPromise("adb devices");
      if (stdout.includes(serial)) {
        console.log(`[${serial}] Device ready after ${i + 1} attempts`);
        return true;
      }
    } catch (err) {
      console.error(`Attempt ${i + 1}: Device check failed`, err.message);
    }
    
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  
  return false;
}

export async function POST(req) {
  try {
    const { serial } = await req.json();

    if (!serial) {
      return Response.json(
        { success: false, error: "Serial number required" },
        { status: 400 }
      );
    }

    console.log(`\n========================================`);
    console.log(`[${serial}] Starting TCP/IP setup...`);
    console.log(`========================================\n`);

    // ✅ Step 1: Verify device is connected
    const isConnected = await waitForDevice(serial, 3);
    if (!isConnected) {
      return Response.json({
        success: false,
        error: "Device not found. Please connect device via USB first.",
      });
    }

    // ✅ Step 2: Get device IP BEFORE enabling TCP/IP
    console.log(`[${serial}] Step 1: Getting device IP...`);
    const deviceIp = await getDeviceIp(serial);
    
    if (!deviceIp) {
      return Response.json({
        success: false,
        error: "Failed to get device IP. Make sure device is connected to WiFi.",
      });
    }

    console.log(`[${serial}] ✅ Device IP: ${deviceIp}`);

    // ✅ Step 3: Enable TCP/IP mode
    console.log(`[${serial}] Step 2: Enabling TCP/IP mode...`);
    
    try {
      const { stdout: tcpipOutput, stderr: tcpipError } = await execPromise(
        `adb -s ${serial} tcpip 5555`
      );

      console.log(`[${serial}] TCP/IP output:`, tcpipOutput);
      if (tcpipError) console.error(`[${serial}] TCP/IP stderr:`, tcpipError);

      if (!tcpipOutput.includes("restarting") && !tcpipOutput.includes("5555")) {
        throw new Error(tcpipError || tcpipOutput || "Failed to enable TCP/IP");
      }

      console.log(`[${serial}] ✅ TCP/IP mode enabled`);
    } catch (err) {
      // ✅ Jika device sudah disconnect, itu normal behavior
      if (err.message.includes("not found")) {
        console.log(`[${serial}] ⚠️ Device disconnected (normal after tcpip command)`);
      } else {
        throw err;
      }
    }

    // ✅ Step 4: Wait for device to restart in TCP/IP mode
    console.log(`[${serial}] Step 3: Waiting for device to restart...`);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // ✅ Step 5: Connect to device via IP
    const ipAddress = `${deviceIp}:5555`;
    console.log(`[${serial}] Step 4: Connecting to ${ipAddress}...`);

    let connectOutput = "";
    let connectError = "";
    let connected = false;

    // ✅ Retry connection up to 3 times
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await execPromise(`adb connect ${ipAddress}`);
        connectOutput = result.stdout;
        connectError = result.stderr || "";

        console.log(`[${serial}] Attempt ${attempt} - Connect output:`, connectOutput);
        if (connectError) console.error(`[${serial}] Connect stderr:`, connectError);

        // Check if connected
        connected = connectOutput.includes("connected") || 
                   connectOutput.includes("already connected");

        if (connected) {
          console.log(`[${serial}] ✅ Connected successfully!`);
          break;
        }

        // Wait before retry
        if (attempt < 3) {
          console.log(`[${serial}] Retrying in 2 seconds...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (err) {
        console.error(`[${serial}] Attempt ${attempt} failed:`, err.message);
        
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          connectError = err.message;
        }
      }
    }

    console.log(`\n========================================`);
    console.log(`[${serial}] Setup complete!`);
    console.log(`========================================\n`);

    if (connected) {
      return Response.json({
        success: true,
        message: `TCP/IP enabled and connected to ${ipAddress}`,
        ip: ipAddress,
        deviceIp: deviceIp,
        steps: {
          ipDetection: "✅ Success",
          tcpipMode: "✅ Enabled",
          connection: "✅ Connected",
        },
      });
    } else {
      return Response.json({
        success: false,
        error: `TCP/IP enabled but failed to connect after 3 attempts: ${connectError || connectOutput}`,
        ip: ipAddress,
        deviceIp: deviceIp,
        hint: "Try manually: adb connect " + ipAddress,
      });
    }
  } catch (err) {
    console.error("❌ Error enabling TCP/IP:", err);
    return Response.json(
      { 
        success: false, 
        error: err.message,
        hint: "Make sure device is connected via USB and ADB debugging is enabled"
      },
      { status: 500 }
    );
  }
}