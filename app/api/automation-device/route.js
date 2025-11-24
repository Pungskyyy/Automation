import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function POST(req) {
    const { serial } = await req.json();
    if (!serial) {
    return NextResponse.json({ error: "Missing serial" }, { status: 400 });
    }

    return new Promise((resolve) => {
    exec(`adb -s ${serial} shell input tap 500 500`, (err) => {
        if (err) {
        return resolve(
            NextResponse.json(
            { error: "Gagal menjalankan script" },
            { status: 500 }
            )
        );
        }

        resolve(
        NextResponse.json({
            message: `Automation OK untuk ${serial}`,
        })
        );
    });
    });
}
