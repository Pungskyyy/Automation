import { runForDevices } from "@/automation/runner";

export async function POST(request) {
  const body = await request.json();
  const { devices, text } = body;

  runForDevices(devices, text);

  return Response.json({
    ok: true,
    message: "Queue started for " + devices.length + " devices",
  });
}
await fetch("/api/automation-comment", {
    method: "POST",
    body: JSON.stringify({
        devices,
        text: "Komentar otomatis anda di sini"
    })
    });
