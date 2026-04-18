import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function POST(req) {
  try {
    const { ip, port, code } = await req.json();

    if (!ip || !port || !code) {
      return NextResponse.json({ error: "IP, port, code wajib diisi" }, { status: 400 });
    }

    const qrPayload = `WIFI:T:ADB;H:${ip};PORT:${port};CODE:${code};;`;

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      color: { dark: "#00ff99", light: "#00000000" }
    });

    return NextResponse.json({
      ok: true,
      qr: qrDataUrl,
      payload: qrPayload
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
