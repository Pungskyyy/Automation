import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function POST(request) {
  try {
    const { serial } = await request.json();

    if (!serial) {
      return Response.json({ error: "Serial is required" }, { status: 400 });
    }

    console.log(`[API] Disconnecting device: ${serial}`);

    // Execute adb disconnect
    const { stdout, stderr } = await execPromise(`adb disconnect ${serial}`);

    console.log(`[API] stdout:`, stdout);
    if (stderr) console.log(`[API] stderr:`, stderr);

    return Response.json({
      success: true,
      message: `Device ${serial} disconnected`,
      output: stdout,
    });
  } catch (error) {
    console.error(`[API] Disconnect error:`, error);
    return Response.json(
      { error: error.message || "Failed to disconnect device" },
      { status: 500 }
    );
  }
}