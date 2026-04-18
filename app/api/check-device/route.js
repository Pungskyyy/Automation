import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export async function POST(req) {
  try {
    const { serial } = await req.json();

    if (!serial) {
      return NextResponse.json(
        { success: false, error: "Serial is required" },
        { status: 400 }
      );
    }

    // Check if device exists
    const { stdout } = await execAsync(`adb devices`);
    
    if (!stdout.includes(serial)) {
      return NextResponse.json({
        success: false,
        connected: false,
        message: `Device ${serial} not found`,
      });
    }

    // Check device state
    try {
      const { stdout: state } = await execAsync(`adb -s ${serial} get-state`);
      const deviceState = state.trim();

      return NextResponse.json({
        success: true,
        connected: deviceState === 'device',
        state: deviceState,
        serial,
      });
    } catch (err) {
      return NextResponse.json({
        success: false,
        connected: false,
        message: err.message,
      });
    }
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}