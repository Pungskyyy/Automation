"use client";

import { useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import PairingQR from "../components/PairingQR";

export default function Home() {
const [activeSection, setActiveSection] = useState("devices");

const [devices, setDevices] = useState([]);
const [loadingDevices, setLoadingDevices] = useState(false);
const [devicesError, setDevicesError] = useState("");

const [pairIpPort, setPairIpPort] = useState("");
const [pairCode, setPairCode] = useState("");
const [deviceIpPort, setDeviceIpPort] = useState("");
const [pairStatus, setPairStatus] = useState("");
const [pairLoading, setPairLoading] = useState(false);

const [automationStatus, setAutomationStatus] = useState("");
const [automationLoading, setAutomationLoading] = useState(false);
const [automationIntervalSec, setAutomationIntervalSec] = useState(60);
const [automationRunning, setAutomationRunning] = useState(false);

const automationTimerRef = useRef(null);
const [logs, setLogs] = useState([]);

const [showPairQR, setShowPairQR] = useState(false);

const [tiktokUrl, setTikTokUrl] = useState("");
const [tiktokComment, setTikTokComment] = useState("");
const [igUrl, setIgUrl] = useState("");
const [igComment, setIgComment] = useState("");

// Koordinat untuk device 1080x2160
const tiktokCoords = {
commentButton: { x: 540, y: 864 },
inputField: { x: 603, y: 973 },
sendButton: { x: 984, y: 1157 },
};

const igCoords = {
commentButton: { x: 254, y: 1965 },
inputField: { x: 487, y: 1145 },
sendButton: { x: 876, y: 1145 },
};

function addLog(msg) {
const t = new Date().toLocaleTimeString();
setLogs((prev) => [`[${t}] ${msg}`, ...prev.slice(0, 200)]);
}

// ============================
// DEVICE SCAN
// ============================
async function handleScanDevices() {
setLoadingDevices(true);
setDevicesError("");

try {
  const res = await fetch("/api/devices", { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Gagal ambil data");

  setDevices(data.devices || []);
  addLog(`Scan devices: ${data.devices?.length || 0}`);
} catch (err) {
  setDevicesError(err.message);
  addLog("Error scan devices: " + err.message);
}

setLoadingDevices(false);


}

// ============================
// PAIRING HANDLER
// ============================
async function handlePair(e) {
e.preventDefault();
setPairStatus("");
setPairLoading(true);

try {
  const res = await fetch("/api/pair", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pairIpPort, pairCode, deviceIpPort }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  setPairStatus(data.message || "Pair & connect berhasil");
  addLog("Pair sukses");
} catch (err) {
  setPairStatus("Error: " + err.message);
  addLog("Pair error: " + err.message);
}

setPairLoading(false);


}

// ============================
// AUTO COMMENT TIKTOK
// ============================
async function sendTikTokComment() {
  const url = tiktokUrl.trim();
  const text = tiktokComment.trim();

  if (!url || !text) {
    addLog("Error TikTok: URL TikTok atau komentar kosong");
    return;
  }

  try {
    const res = await fetch("/api/tiktok-comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoUrl: url,
        comment: text,
        coords: tiktokCoords,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    addLog("Kirim komentar TikTok ke " + url);
  } catch (err) {
    addLog("Error TikTok: " + err.message);
  }

}

// ============================
// AUTO COMMENT INSTAGRAM
// ============================
async function sendInstagramComment() {
  const url = igUrl.trim();
  const text = igComment.trim();

  if (!url || !text) {
    addLog("Error Instagram: URL Instagram tidak boleh kosong");
    return;
  }

  try {
    const res = await fetch("/api/ig-comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postUrl: url,
        comment: text,
        coords: igCoords,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    addLog("Kirim komentar Instagram ke " + url);
  } catch (err) {
    addLog("Error Instagram: " + err.message);
  }
}
// ============================
// AUTOMATION
// ============================
const runAutomationOnce = async () => {
setAutomationLoading(true);
setAutomationStatus("");

try {
  const res = await fetch("/api/automation", { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  setAutomationStatus(data.message || "Automation dijalankan");
  addLog("Automation success");
} catch (err) {
  setAutomationStatus("Error: " + err.message);
  addLog("Automation error: " + err.message);
}

setAutomationLoading(false);


};

function handleStartScheduler() {
const sec = Number(automationIntervalSec);
if (!sec || sec < 5) {
setAutomationStatus("Minimal 5 detik");
return;
}

if (automationTimerRef.current) {
  setAutomationStatus("Scheduler sudah berjalan");
  return;
}

setAutomationRunning(true);
setAutomationStatus(`Scheduler ON (${sec}s)`);
addLog(`Scheduler ON (${sec}s)`);

runAutomationOnce();
automationTimerRef.current = setInterval(runAutomationOnce, sec * 1000);


}

function handleStopScheduler() {
if (automationTimerRef.current) {
clearInterval(automationTimerRef.current);
automationTimerRef.current = null;
}
setAutomationRunning(false);
setAutomationStatus("Scheduler OFF");
addLog("Scheduler OFF");
}

async function handleRunForDevice(serial) {
addLog("Run script device " + serial);

try {
  const res = await fetch("/api/automation-device", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serial }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  addLog(`Device ${serial}: ${data.message}`);
} catch (err) {
  addLog(`Error device ${serial}: ${err.message}`);
}


}

const shellBg = "#020617";
const cardBg = "#020617";
const cardBorder = "#1f2937";

return (
<div
style={{
minHeight: "100vh",
background:
"radial-gradient(circle at 0 0,#0f172a,transparent 55%), radial-gradient(circle at 100% 100%,#020617,transparent 55%)",
display: "flex",
color: "#f9fafb",
}}
>
<Sidebar active={activeSection} onChange={setActiveSection} />

  {showPairQR && (
    <PairingQR
      pairIpPort={pairIpPort}
      pairCode={pairCode}
      onClose={() => setShowPairQR(false)}
    />
  )}

  <main
    style={{
      flexGrow: 1,
      padding: "24px 28px",
      display: "flex",
      flexDirection: "column",
      gap: "18px",
    }}
  >
    {/* HEADER */}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div>
        <div style={{ fontSize: "22px", fontWeight: 700 }}>
          ADB Multi-Device Dashboard
        </div>
        <div style={{ fontSize: "13px", opacity: 0.7 }}>
          Monitoring, pairing, automation untuk banyak device.
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: 999,
            background: "#22c55e",
            boxShadow: "0 0 8px #22c55e",
          }}
        />
        <span style={{ opacity: 0.8 }}>ADB Daemon</span>
      </div>
    </div>

    {/* ======================= DEVICES */}
    {activeSection === "devices" && (
      <section
        style={{
          background: cardBg,
          padding: 16,
          borderRadius: 16,
          border: `1px solid ${cardBorder}`,
        }}
      >
        <h3>Connected Devices</h3>

        <button
          onClick={handleScanDevices}
          disabled={loadingDevices}
          style={{
            marginTop: 10,
            padding: "7px 14px",
            borderRadius: 999,
            background: "#1d4ed8",
            color: "#e5e7eb",
            fontWeight: 600,
          }}
        >
          {loadingDevices ? "Scanning..." : "Scan Devices"}
        </button>

        <div
          style={{
            maxHeight: 230,
            overflowY: "auto",
            marginTop: 14,
            background: shellBg,
            borderRadius: 10,
            padding: 10,
          }}
        >
          {devices.length === 0 ? (
            <p style={{ opacity: 0.6 }}>Belum ada device.</p>
          ) : (
            devices.map((d) => (
              <div
                key={d.serial}
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid #111827",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{d.serial}</div>
                  <div>
                    Status:
                    <span style={{ color: "#22c55e" }}> {d.status}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRunForDevice(d.serial)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "#22c55e",
                    color: "#022c22",
                    fontWeight: 700,
                  }}
                >
                  Run script
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    )}

    {/* ======================= PAIRING */}
    {activeSection === "pairing" && (
      <section
        style={{
          background: cardBg,
          padding: 18,
          borderRadius: 16,
          border: `1px solid ${cardBorder}`,
        }}
      >
        <h3>Wireless Pairing</h3>

        <button
          onClick={() => setShowPairQR(true)}
          style={{
            marginTop: 10,
            padding: "8px 16px",
            background: "#00fca8",
            color: "#00332a",
            fontWeight: 700,
            borderRadius: 999,
          }}
        >
          Tampilkan QR Pairing
        </button>

        <form
          onSubmit={handlePair}
          style={{ marginTop: 16, display: "grid", gap: 10 }}
        >
          <label>
            Pair IP:Port
            <input
              value={pairIpPort}
              onChange={(e) => setPairIpPort(e.target.value)}
              style={{
                width: "100%",
                padding: 6,
                background: shellBg,
                borderRadius: 10,
                border: "1px solid #374151",
                marginTop: 4,
                color: "white",
              }}
            />
          </label>

          <label>
            Pairing Code
            <input
              value={pairCode}
              onChange={(e) => setPairCode(e.target.value)}
              style={{
                width: "100%",
                padding: 6,
                background: shellBg,
                borderRadius: 10,
                border: "1px solid #374151",
                marginTop: 4,
                color: "white",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={pairLoading}
            style={{
              padding: 8,
              background: "#16a34a",
              borderRadius: 999,
              fontWeight: 700,
              color: "#022c22",
              marginTop: 8,
            }}
          >
            {pairLoading ? "Pairing..." : "Pair & Connect"}
          </button>
        </form>

        {pairStatus && (
          <p style={{ marginTop: 10, opacity: 0.9 }}>{pairStatus}</p>
        )}
      </section>
    )}

    {/* ======================= AUTO COMMENT TIKTOK */}
    {activeSection === "tiktok" && (
      <section
        style={{
          background: cardBg,
          padding: 18,
          borderRadius: 16,
          border: `1px solid ${cardBorder}`,
        }}
      >
        <h3>Auto Comment TikTok</h3>

        <label style={{ marginTop: 12, display: "block" }}>
          Link Video TikTok
          <input
            value={tiktokUrl}
            onChange={(e) => setTikTokUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@user/video/xxxx"
            style={{
              width: "100%",
              padding: 8,
              background: shellBg,
              borderRadius: 10,
              border: "1px solid #374151",
              marginTop: 4,
              color: "white",
            }}
          />
        </label>

        <label style={{ marginTop: 12, display: "block" }}>
          Komentar
          <input
            value={tiktokComment}
            onChange={(e) => setTikTokComment(e.target.value)}
            placeholder="Komentar..."
            style={{
              width: "100%",
              padding: 8,
              background: shellBg,
              borderRadius: 10,
              border: "1px solid #374151",
              marginTop: 4,
              color: "white",
            }}
          />
        </label>

        <button
          onClick={sendTikTokComment}
          style={{
            marginTop: 14,
            padding: "10px",
            background: "#00fca8",
            borderRadius: 999,
            fontWeight: 700,
            color: "#00150a",
          }}
        >
          Kirim Komentar TikTok
        </button>
      </section>
    )}

    {/* ======================= AUTO COMMENT INSTAGRAM */}
    {activeSection === "instagram" && (
      <section
        style={{
          background: cardBg,
          padding: 18,
          borderRadius: 16,
          border: `1px solid ${cardBorder}`,
        }}
      >
        <h3>Auto Comment Instagram</h3>

        <label style={{ marginTop: 12, display: "block" }}>
          Link Post Instagram
          <input
            value={igUrl}
            onChange={(e) => setIgUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/xxxx"
            style={{
              width: "100%",
              padding: 8,
              background: shellBg,
              borderRadius: 10,
              border: "1px solid #374151",
              marginTop: 4,
              color: "white",
            }}
          />
        </label>

        <label style={{ marginTop: 12, display: "block" }}>
          Komentar
          <input
            value={igComment}
            onChange={(e) => setIgComment(e.target.value)}
            placeholder="Komentar..."
            style={{
              width: "100%",
              padding: 8,
              background: shellBg,
              borderRadius: 10,
              border: "1px solid #374151",
              marginTop: 4,
              color: "white",
            }}
          />
        </label>

        <button
          onClick={sendInstagramComment}
          style={{
            marginTop: 14,
            padding: "10px",
            background: "#00fca8",
            borderRadius: 999,
            fontWeight: 700,
            color: "#00150a",
          }}
        >
          Kirim Komentar Instagram
        </button>
      </section>
    )}

    {/* ======================= AUTOMATION */}
    {activeSection === "automation" && (
      <section
        style={{
          background: cardBg,
          padding: 18,
          borderRadius: 16,
          border: `1px solid ${cardBorder}`,
        }}
      >
        <h3>Automation</h3>

        <button
          onClick={runAutomationOnce}
          disabled={automationLoading}
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            background: "#eab308",
            border: "none",
            marginTop: 10,
          }}
        >
          {automationLoading ? "Running..." : "Run sekali sekarang"}
        </button>

        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 10,
            background: shellBg,
            border: "1px dashed #4b5563",
          }}
        >
          <div>Scheduler</div>

          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input
              type="number"
              min={5}
              value={automationIntervalSec}
              onChange={(e) => setAutomationIntervalSec(e.target.value)}
              style={{
                width: 80,
                padding: 6,
                background: shellBg,
                borderRadius: 8,
                border: "1px solid #4b5563",
                color: "white",
              }}
            />
            <span>detik</span>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <button
              onClick={handleStartScheduler}
              disabled={automationRunning}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                background: automationRunning ? "#4b5563" : "#22c55e",
                color: "#022c22",
              }}
            >
              Start
            </button>

            <button
              onClick={handleStopScheduler}
              disabled={!automationRunning}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                background: !automationRunning ? "#4b5563" : "#f87171",
                color: "#000",
              }}
            >
              Stop
            </button>
          </div>

          {automationStatus && <p style={{ marginTop: 8 }}>{automationStatus}</p>}
        </div>
      </section>
    )}

    {/* ======================= LOGS */}
    {activeSection === "logs" && (
      <section
        style={{
          background: cardBg,
          padding: 18,
          borderRadius: 16,
          border: `1px solid ${cardBorder}`,
        }}
      >
        <h3>Logs</h3>

        <div
          style={{
            maxHeight: 300,
            overflowY: "auto",
            background: shellBg,
            borderRadius: 10,
            border: "1px solid #111827",
            padding: 10,
            marginTop: 10,
          }}
        >
          {logs.length === 0 ? (
            <p style={{ opacity: 0.6 }}>Belum ada log.</p>
          ) : (
            logs.map((l, i) => (
              <div
                key={i}
                style={{
                  padding: "6px 0",
                  borderBottom: "1px solid #111827",
                }}
              >
                {l}
              </div>
            ))
          )}
        </div>
      </section>
    )}
  </main>
</div>


);
}