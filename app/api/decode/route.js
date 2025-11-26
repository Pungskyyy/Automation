import { NextResponse } from "next/server";
import QRCode from "qrcode-reader";
import Jimp from "jimp";

export async function POST(req) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const buffer = Buffer.from(imageBase64, "base64");
    const img = await Jimp.read(buffer);

    const qr = new QRCode();

    const result = await new Promise((resolve, reject) => {
      qr.callback = (err, value) => {
        if (err) reject(err);
        else resolve(value.result);
      };
      qr.decode(img.bitmap);
    });

    return NextResponse.json({ decoded: result });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
