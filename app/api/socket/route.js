import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export const config = {
  runtime: "edge",
};

let clients = new Map(); // deviceId → websocket

export default async function handler(req) {
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Not a websocket request", { status: 400 });
  }

  const [client, server] = Object.values(new WebSocketPair());
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || crypto.randomUUID();

  server.accept();
  clients.set(id, server);

  console.log("DEVICE CONNECTED:", id);

  server.addEventListener("message", (msg) => {
    // Relay ke dashboard bila perlu
    console.log("FROM DEVICE:", id, msg.data);
  });

  server.addEventListener("close", () => {
    clients.delete(id);
    console.log("DISCONNECTED:", id);
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

// SEND COMMAND (called from dashboard)
export async function sendCommandToDevice(deviceId, message) {
  const ws = clients.get(deviceId);
  if (!ws) return false;

  ws.send(JSON.stringify(message));
  return true;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { serial } = body;

    console.log("[Enable TCP/IP] Received request for:", serial);

    if (!serial) {
      return NextResponse.json(
        { error: "Serial is required" },
        { status: 400 }
      );
    }

    // Check if already in TCP/IP mode
    if (serial.includes(":")) {
      console.log(`[${serial}] Already in TCP/IP mode`);
      return NextResponse.json({
        success: true,
        alreadyTcpip: true,
        message: `Device ${serial} already in TCP/IP mode`,
        ip: serial,
      });
    }

    // Verify device is connected
    console.log(`[${serial}] Verifying device connection...`);
    try {
      const { stdout: deviceCheck } = await execAsync(`adb devices`);
      if (!deviceCheck.includes(serial)) {
        return NextResponse.json(
          { error: `Device ${serial} not found` },
          { status: 400 }
        );
      }
    } catch (err) {
      return NextResponse.json(
        { error: `Failed to check device: ${err.message}` },
        { status: 500 }
      );
    }

    // Enable TCP/IP on port 5555
    console.log(`[${serial}] Enabling TCP/IP mode...`);
    try {
      const { stdout: tcpipOut, stderr: tcpipErr } = await execAsync(
        `adb -s ${serial} tcpip 5555`
      );
      console.log(`[${serial}] TCP/IP output:`, tcpipOut);
      if (tcpipErr) console.log(`[${serial}] TCP/IP stderr:`, tcpipErr);
    } catch (err) {
      console.error(`[${serial}] Failed to enable TCP/IP:`, err);
      return NextResponse.json(
        { error: `Failed to enable TCP/IP: ${err.message}` },
        { status: 500 }
      );
    }

    // Wait for TCP/IP to initialize
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Get device IP address - try multiple methods
    console.log(`[${serial}] Getting device IP address...`);
    let deviceIp = null;

    // Method 1: wlan0
    try {
      const { stdout: ipOut1 } = await execAsync(
        `adb -s ${serial} shell ip addr show wlan0 | grep "inet " | awk '{print $2}' | cut -d/ -f1`
      );
      deviceIp = ipOut1.trim();
      console.log(`[${serial}] wlan0 IP:`, deviceIp);
    } catch (err) {
      console.log(`[${serial}] wlan0 method failed:`, err.message);
    }

    // Method 2: getprop (if Method 1 failed)
    if (!deviceIp || deviceIp === "") {
      try {
        const { stdout: ipOut2 } = await execAsync(
          `adb -s ${serial} shell getprop dhcp.wlan0.ipaddress`
        );
        deviceIp = ipOut2.trim();
        console.log(`[${serial}] getprop IP:`, deviceIp);
      } catch (err) {
        console.log(`[${serial}] getprop method failed:`, err.message);
      }
    }

    // Method 3: ifconfig (if Method 2 failed)
    if (!deviceIp || deviceIp === "") {
      try {
        const { stdout: ipOut3 } = await execAsync(
          `adb -s ${serial} shell ifconfig wlan0 | grep "inet addr" | awk '{print $2}' | cut -d: -f2`
        );
        deviceIp = ipOut3.trim();
        console.log(`[${serial}] ifconfig IP:`, deviceIp);
      } catch (err) {
        console.log(`[${serial}] ifconfig method failed:`, err.message);
      }
    }

    // Method 4: dumpsys (last resort)
    if (!deviceIp || deviceIp === "") {
      try {
        const { stdout: ipOut4 } = await execAsync(
          `adb -s ${serial} shell dumpsys wifi | grep "mIpAddress" | awk '{print $3}'`
        );
        deviceIp = ipOut4.trim();
        console.log(`[${serial}] dumpsys IP:`, deviceIp);
      } catch (err) {
        console.log(`[${serial}] dumpsys method failed:`, err.message);
      }
    }

    if (!deviceIp || deviceIp === "") {
      console.error(`[${serial}] Could not get device IP address`);
      return NextResponse.json(
        { 
          error: "Could not get device IP address. Make sure device is connected to WiFi.",
          tcpipEnabled: true,
        },
        { status: 500 }
      );
    }

    const tcpAddress = `${deviceIp}:5555`;
    console.log(`[${serial}] ✅ TCP/IP enabled: ${tcpAddress}`);

    return NextResponse.json({
      success: true,
      message: `TCP/IP enabled on ${tcpAddress}`,
      ip: tcpAddress,
      tcpAddress,
    });

  } catch (error) {
    console.error("[Enable TCP/IP] Error:", error);
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

async function handleEnableTcpip(serial) {
  addLog(`Mengaktifkan TCPIP untuk device ${serial}...`, "info");
  
  try {
    const res = await fetch("/api/enable-tcpip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serial }),
    });
    const data = await res.json();
    
    if (data.success) {
      if (data.alreadyTcpip) {
        addLog(`Device ${serial} sudah dalam mode TCPIP`, "info");
      } else {
        addLog(`✅ TCPIP berhasil diaktifkan untuk ${serial}`, "success");
      }
      
      if (data.ip) {
        addLog(`📡 IP Address: ${data.ip}`, "success");
        
        // Auto-connect ke IP yang baru
        addLog(`Mencoba auto-connect ke ${data.ip}...`, "info");
        await new Promise(r => setTimeout(r, 2000)); // Wait 2s
        
        const connectRes = await fetch("/api/connect-device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            ip: data.ip.split(':')[0], 
            port: "5555" 
          }),
        });
        
        const connectData = await connectRes.json();
        if (connectData.success) {
          addLog(`✅ Auto-connect berhasil ke ${data.ip}!`, "success");
        } else {
          addLog(`⚠️ Auto-connect gagal. Coba manual connect ke ${data.ip}`, "warning");
        }
      }
      
      await fetchDevices();
    } else {
      addLog(`❌ Gagal enable TCPIP: ${data.error}`, "error");
    }
  } catch (err) {
    console.error("Enable TCPIP error:", err);
    addLog(`❌ Error: ${err.message}`, "error");
  }
}
