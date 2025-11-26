// app/api/pair/route.js
import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export async function POST(req) {
  try {
    const { pairIpPort, pairCode, deviceIpPort } = await req.json();

    if (!pairIpPort || !pairCode || !deviceIpPort) {
      return NextResponse.json(
        { error: "pairIpPort, pairCode, dan deviceIpPort wajib diisi" },
        { status: 400 }
      );
    }

    // adb pair 10.76.230.1:38513
    const pairCmd = `adb pair ${pairIpPort} ${pairCode}`;
    const pairResult = await execAsync(pairCmd);

    // adb connect ip:port
    const connectCmd = `adb connect ${deviceIpPort}`;
    const connectResult = await execAsync(connectCmd);

    const message = `Pair: ${pairResult.stdout.trim() || pairResult.stderr.trim()} | Connect: ${
      connectResult.stdout.trim() || connectResult.stderr.trim()
    }`;

    return NextResponse.json({ message }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Gagal pair & connect device" },
      { status: 500 }
    );
  }
}
