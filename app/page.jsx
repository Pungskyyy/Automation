"use client";

import { useState, useRef, useMemo } from "react";
import Sidebar from "../components/Sidebar";

export default function Home() {
  const [activeSection, setActiveSection] = useState("devices");

  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [devicesError, setDevicesError] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");

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

  // Add logs
  function addLog(message) {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${message}`, ...prev].slice(0, 200));
  }

  // Scan devices
  async function handleScanDevices() {
    setLoadingDevices(true);
    setDevicesError("");
    try {
      const res = await fetch("/api/devices", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal ambil data device");
      setDevices(data.devices || []);
      addLog(`Scan devices: ${data.devices?.length || 0} device`);
    } catch (err) {
      setDevicesError(err.message);
      addLog(`Error scan devices: ${err.message}`);
    } finally {
      setLoadingDevices(false);
    }
  }

  // Pairing
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
      if (!res.ok) throw new Error(data.error || "Gagal pair device");
      setPairStatus(data.message || "Pair & connect berhasil");
      addLog(`Pair: ${data.message || "berhasil"}`);
    } catch (err) {
      setPairStatus(`Error: ${err.message}`);
      addLog(`Error pair: ${err.message}`);
    } finally {
      setPairLoading(false);
    }
  }

  // Automation
  const runAutomationOnce = async () => {
    setAutomationLoading(true);
    setAutomationStatus("");
    try {
      const res = await fetch("/api/automation", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menjalankan automation");
      setAutomationStatus(data.message || "Automation dijalankan");
      addLog(`Automation: ${data.message || "dijalankan"}`);
    } catch (err) {
      setAutomationStatus(`Error: ${err.message}`);
      addLog(`Error automation: ${err.message}`);
    } finally {
      setAutomationLoading(false);
    }
  };

  async function handleAutomation() {
    runAutomationOnce();
  }

  async function handleRunForDevice(serial) {
    addLog(`Run script untuk device ${serial}`);
    try {
      const res = await fetch("/api/automation-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menjalankan script per device");
      addLog(`Device ${serial}: ${data.message || "OK"}`);
    } catch (err) {
      addLog(`Error device ${serial}: ${err.message}`);
    }
  }

  function handleStartScheduler() {
    const sec = Number(automationIntervalSec);
    if (!sec || sec < 5) {
      setAutomationStatus("Interval minimal 5 detik");
      return;
    }
    if (automationTimerRef.current) {
      setAutomationStatus("Scheduler sudah jalan");
      return;
    }

    setAutomationRunning(true);
    setAutomationStatus(`Scheduler jalan tiap ${sec} detik`);
    addLog(`Scheduler ON, interval ${sec} detik`);

    runAutomationOnce();

    automationTimerRef.current = setInterval(() => runAutomationOnce(), sec * 1000);
  }

  function handleStopScheduler() {
    if (automationTimerRef.current) {
      clearInterval(automationTimerRef.current);
      automationTimerRef.current = null;
    }
    setAutomationRunning(false);
    setAutomationStatus("Scheduler dimatikan");
    addLog("Scheduler OFF");
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
        color: "#f9fafb",
        display: "flex",
      }}
    >
      <Sidebar active={activeSection} onChange={setActiveSection} />

      {/* ===========================
          HEADER
      ============================ */}
      <main
        style={{
          flexGrow: 1,
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
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
              Monitoring, pairing, dan automation untuk banyak device sekaligus.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "12px",
            }}
          >
            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "999px",
                backgroundColor: "#22c55e",
                boxShadow: "0 0 8px #22c55e",
              }}
            />
            <span style={{ opacity: 0.8 }}>ADB Daemon</span>
          </div>
        </div>

        {/* ===============================
           CONTENT BASED ON SELECTED MENU
        ================================ */}

        {/* --- DEVICES --- */}
        {activeSection === "devices" && (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2.1fr)" }}>
            {/* Devices Section */}
            <section
              style={{
                backgroundColor: cardBg,
                borderRadius: "16px",
                border: `1px solid ${cardBorder}`,
                padding: "16px 16px 12px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
                    Connected Devices
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      marginTop: "2px",
                      fontSize: "12px",
                      opacity: 0.7,
                    }}
                  >
                    Device yang terdeteksi via ADB.
                  </p>
                </div>

                <button
                  onClick={handleScanDevices}
                  disabled={loadingDevices}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "999px",
                    border: "1px solid #1d4ed8",
                    background: loadingDevices ? "#1d4ed8aa" : "#1d4ed8",
                    color: "#e5e7eb",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {loadingDevices ? "Scanning..." : "Scan Devices"}
                </button>
              </div>

              <div
                style={{
                  maxHeight: "230px",
                  overflowY: "auto",
                  backgroundColor: shellBg,
                  padding: "8px 10px",
                  borderRadius: "10px",
                  border: "1px solid #111827",
                  fontSize: "12px",
                }}
              >
                {devices.length === 0 ? (
                  <p style={{ opacity: 0.6 }}>Belum ada device. Klik Scan.</p>
                ) : (
                  devices.map((d) => (
                    <div
                      key={d.serial}
                      style={{
                        padding: "6px 0",
                        borderBottom: "1px solid #111827",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{d.serial}</div>
                        <div style={{ opacity: 0.65 }}>
                          Status: <span style={{ color: "#22c55e" }}>{d.status}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRunForDevice(d.serial)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "999px",
                          background: "#22c55e",
                          color: "#022c22",
                          fontWeight: 600,
                        }}
                      >
                        Run script
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
            <div style={{ display:"flex", gap:"10px", marginBottom:"10px" }}>
  <button
    onClick={() => {
      fetch("/api/tiktok-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: "Mantap banget bang!",
          videoUrl: "https://www.tiktok.com/@xxxx/video/yyyy"
        })
      });
    }}
    style={{
      padding: "8px 16px",
      borderRadius: "999px",
      background:"#00fca8",
      color:"#001d14",
      fontWeight:"700",
      cursor:"pointer"
    }}
  >
    Comment TikTok
  </button>

  <button
    onClick={() => {
      fetch("/api/ig-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: "Keren banget kontennya!",
          postUrl: "https://www.instagram.com/reel/xxxx"
        })
      });
    }}
    style={{
      padding: "8px 16px",
      borderRadius: "999px",
      background:"#00fca8",
      color:"#001d14",
      fontWeight:"700",
      cursor:"pointer"
    }}
  >
    Comment Instagram
  </button>
</div>




        {/* --- PAIRING --- */}
        {activeSection === "pairing" && (
          <section
            style={{
              backgroundColor: cardBg,
              borderRadius: "16px",
              border: `1px solid ${cardBorder}`,
              padding: "18px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
              Wireless Pairing
            </h3>
            <p style={{ margin: 0, opacity: 0.7, fontSize: "12px", marginBottom: "10px" }}>
              Masukkan IP:Port dan pairing code untuk wireless debugging.
            </p>

            <form onSubmit={handlePair} style={{ display: "grid", gap: "10px" }}>
              <label>
                Pair IP:Port
                <input
                  value={pairIpPort}
                  onChange={(e) => setPairIpPort(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: "8px",
                    marginTop: "4px",
                    backgroundColor: shellBg,
                    border: "1px solid #374151",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <label>
                  Pairing code
                  <input
                    value={pairCode}
                    onChange={(e) => setPairCode(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "8px",
                      marginTop: "4px",
                      backgroundColor: shellBg,
                      border: "1px solid #374151",
                      color: "#fff",
                    }}
                  />
                </label>

                <label>
                  Device IP:Port (opsional)
                  <input
                    value={deviceIpPort}
                    onChange={(e) => setDeviceIpPort(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "8px",
                      marginTop: "4px",
                      backgroundColor: shellBg,
                      border: "1px solid #374151",
                      color: "#fff",
                    }}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={pairLoading}
                style={{
                  padding: "8px 16px",
                  borderRadius: "999px",
                  border: "none",
                  background: "#16a34a",
                  color: "#022c22",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {pairLoading ? "Pairing..." : "Pair & Connect"}
              </button>
            </form>

            {pairStatus && (
              <p style={{ marginTop: "10px", opacity: 0.8, fontSize: "12px" }}>
                {pairStatus}
              </p>
            )}
          </section>
        )}

        {/* --- AUTOMATION --- */}
        {activeSection === "automation" && (
          <section
            style={{
              backgroundColor: cardBg,
              borderRadius: "16px",
              border: `1px solid ${cardBorder}`,
              padding: "18px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Automation</h3>
            <p style={{ opacity: 0.7, fontSize: "12px" }}>
              Jalankan script Python atau jadwalkan interval otomatis.
            </p>

            <button
              onClick={handleAutomation}
              disabled={automationLoading}
              style={{
                padding: "8px 16px",
                borderRadius: "999px",
                background: "#eab308",
                border: "none",
                color: "#000",
                fontWeight: 700,
                fontSize: "13px",
                marginTop: "10px",
              }}
            >
              {automationLoading ? "Running..." : "Run sekali sekarang"}
            </button>

            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                borderRadius: "10px",
                border: "1px dashed #4b5563",
                backgroundColor: "#020617",
                fontSize: "12px",
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: "8px" }}>Scheduler</div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="number"
                  min={5}
                  value={automationIntervalSec}
                  onChange={(e) => setAutomationIntervalSec(e.target.value)}
                  style={{
                    width: "80px",
                    padding: "6px",
                    borderRadius: "8px",
                    backgroundColor: "#020617",
                    border: "1px solid #4b5563",
                    color: "#fff",
                  }}
                />
                <span>detik</span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  onClick={handleStartScheduler}
                  disabled={automationRunning}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "999px",
                    background: automationRunning ? "#4b5563" : "#22c55e",
                    border: "none",
                    color: "#022c22",
                    fontWeight: 600,
                  }}
                >
                  Start
                </button>

                <button
                  onClick={handleStopScheduler}
                  disabled={!automationRunning}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "999px",
                    background: !automationRunning ? "#4b5563" : "#f87171",
                    border: "none",
                    color: "#000",
                    fontWeight: 600,
                  }}
                >
                  Stop
                </button>
              </div>

              {automationStatus && (
                <p style={{ marginTop: "10px", opacity: 0.8 }}>{automationStatus}</p>
              )}
            </div>
          </section>
        )}

        {/* --- LOGS --- */}
        {activeSection === "logs" && (
          <section
            style={{
              backgroundColor: cardBg,
              borderRadius: "16px",
              border: `1px solid ${cardBorder}`,
              padding: "18px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Logs</h3>
            <p style={{ opacity: 0.7, fontSize: "12px" }}>
              Riwayat scan, pairing, dan automation.
            </p>

            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                backgroundColor: shellBg,
                borderRadius: "10px",
                border: "1px solid #111827",
                padding: "10px",
                marginTop: "10px",
                fontSize: "12px",
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
