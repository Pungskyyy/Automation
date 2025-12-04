// app/api/automation/route.js
import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import pyotp from "pyotp";
import { FastAPI, HTTPException } from "fastapi";

const execAsync = util.promisify(exec);
const app = FastAPI();

// Endpoint untuk menghasilkan secret key
app.get("/generate-secret", (req, res) => {
  const secret = pyotp.random_base32();
  res.json({ secret });
});

// Endpoint untuk memverifikasi kode OTP
app.post("/verify-otp", (req, res) => {
  const { secret, otp } = req.body;
  const totp = pyotp.TOTP(secret);
  if (totp.verify(otp)) {
    res.json({ success: true });
  } else {
    throw new HTTPException(400, "Invalid OTP");
  }
});

export async function POST() {
  try {
    // Contoh: jalankan python multi-device
    const cmd = "python3 scripts/run_all_devices.py";
    const { stdout, stderr } = await execAsync(cmd);

    const message =
      (stdout && stdout.trim()) ||
      (stderr && stderr.trim()) ||
      "Automation script dijalankan";

    return NextResponse.json(
      {
        message,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Gagal menjalankan automation" },
      { status: 500 }
    );
  }
}
