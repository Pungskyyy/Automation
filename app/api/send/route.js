import { NextResponse } from "next/server";
import { sendCommandToDevice } from "../socket/route";

export async function POST(req) {
  const { id, command } = await req.json();

  const ok = await sendCommandToDevice(id, command);
  return NextResponse.json({
    success: ok,
  });
}
