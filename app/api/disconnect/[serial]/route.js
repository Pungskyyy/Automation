import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const run = util.promisify(exec);

export async function POST(req, { params }) {
  try {
    const serial = params.serial;
    if (!serial) {
      return NextResponse.json({ error: "Serial wajib" }, { status: 400 });
    }

    await run(`adb disconnect ${serial}`);

    return NextResponse.json({
      success: true,
      message: `Disconnected: ${serial}`,
    });

  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
