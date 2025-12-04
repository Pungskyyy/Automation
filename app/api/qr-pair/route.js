import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function POST(req) {
  try {
    const { ip } = await req.json();

    if (!ip)
      return NextResponse.json({ error: "IP tidak ditemukan" }, { status: 400 });

    // QR berisi command connect
    const text = `adb connect ${ip}:5555`;

    const qr = await QRCode.toDataURL(text);

    return NextResponse.json({ qr });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
