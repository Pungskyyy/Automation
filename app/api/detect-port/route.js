import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
const run = util.promisify(exec);

export async function POST() {
  try {
    const { stdout } = await run(`adb shell dumpsys adbd | grep pairing`);
    const port = stdout.match(/port=(\d+)/)?.[1];
    const code = stdout.match(/code=(\d+)/)?.[1];

    return NextResponse.json({
      ip: "192.168.1.x", // dummy, diganti real dari get-pairing
      port,
      pairingCode: code
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
