import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export async function POST(req) {
  try {
    const { ip, port = "5555" } = await req.json();

    if (!ip) {
      return NextResponse.json(
        { success: false, error: "IP address is required" },
        { status: 400 }
      );
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return NextResponse.json(
        { success: false, error: "Invalid IP address format" },
        { status: 400 }
      );
    }

    const address = `${ip}:${port}`;

    console.log(`[CONNECT-IP] Attempting to connect to ${address}...`);

    // Try to connect
    const { stdout, stderr } = await execAsync(`adb connect ${address}`);
    const output = stdout + stderr;

    console.log(`[CONNECT-IP] Output: ${output}`);

    // Check if connection was successful
    if (output.includes("connected") || output.includes("already connected")) {
      // Wait a bit for device to be ready
      await new Promise(r => setTimeout(r, 1000));

      // Verify device is actually connected
      try {
        const { stdout: deviceCheck } = await execAsync(`adb devices`);
        if (!deviceCheck.includes(address)) {
          throw new Error("Device not found in device list after connection");
        }
      } catch (err) {
        console.error("[CONNECT-IP] Device verification failed:", err);
        return NextResponse.json(
          {
            success: false,
            error: `Connected but device not responding. Try again.`,
          },
          { status: 400 }
        );
      }

      // Get device info
      let deviceInfo = {
        address,
        model: "Unknown",
        manufacturer: "Unknown",
        androidVersion: "Unknown",
      };

      try {
        const { stdout: model } = await execAsync(
          `adb -s ${address} shell getprop ro.product.model`
        );
        const { stdout: manufacturer } = await execAsync(
          `adb -s ${address} shell getprop ro.product.manufacturer`
        );
        const { stdout: version } = await execAsync(
          `adb -s ${address} shell getprop ro.build.version.release`
        );

        deviceInfo.model = model.trim();
        deviceInfo.manufacturer = manufacturer.trim();
        deviceInfo.androidVersion = version.trim();
      } catch (err) {
        console.log("[CONNECT-IP] Could not get device info:", err.message);
      }

      return NextResponse.json({
        success: true,
        message: `Successfully connected to ${address}`,
        address,
        deviceInfo,
        output: output.trim(),
      });
    } else if (output.includes("failed") || output.includes("cannot connect")) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to connect to ${address}. Make sure the device is on the same network and TCP/IP is enabled.`,
          output: output.trim(),
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Unexpected response: ${output}`,
          output: output.trim(),
        },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("[CONNECT-IP] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}