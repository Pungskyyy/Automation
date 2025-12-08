import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export async function POST(request) {
  try {
    const body = await request.json();
    const { serial } = body;

    if (!serial) {
      return NextResponse.json(
        { error: "Device serial harus diisi" },
        { status: 400 }
      );
    }

    console.log(`Disconnecting device: ${serial}`);

    // Disconnect device
    const { stdout, stderr } = await execAsync(`adb disconnect ${serial}`);
    
    console.log("Disconnect output:", stdout);
    if (stderr) console.error("Disconnect error:", stderr);

    return NextResponse.json({
      success: true,
      message: `Device ${serial} berhasil disconnect`,
      output: stdout
    });

  } catch (error) {
    console.error("Disconnect device error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal disconnect device" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Disconnect Device API",
    methods: ["POST"],
    requiredParams: ["serial"]
  });
}
