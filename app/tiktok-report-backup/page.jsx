
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TikTokReportPage() {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [username, setUsername] = useState("");
  const [reportType, setReportType] = useState("spam");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
    setLogs((prev) => [`[${timestamp}] ${emoji} ${message}`, ...prev]);
  };

  async function fetchDevices() {
    try {
      const res = await fetch("/api/scan-devices");
      const data = await res.json();
      if (data.devices) {
        setDevices(data.devices);
        addLog(`Found ${data.devices.length} device(s)`, "success");
      }
    } catch (err) {
      addLog("Failed to fetch devices", "error");
    }
  }

  useEffect(() => {
    fetchDevices();
  }, []);

  function toggleDevice(serial) {
    setSelectedDevices((prev) =>
      prev.includes(serial) ? prev.filter((s) => s !== serial) : [...prev, serial]
    );
  }

  async function handleSendReport() {
    if (!username) {
      alert("Username TikTok harus diisi!");
      return;
    }

    if (selectedDevices.length === 0) {
      alert("Pilih minimal 1 device!");
      return;
    }

    setLoading(true);
    addLog(`Reporting @${username} from ${selectedDevices.length} device(s)...`, "info");

    try {
      const res = await fetch("/api/tiktok-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          reportType,
          serials: selectedDevices,
        }),
      });

      const data = await res.json();

      if (data.success) {
        addLog(`✅ Report done: ${data.successCount}/${data.total} success`, "success");
        
        if (data.results) {
          data.results.forEach(result => {
            if (result.success) {
              addLog(`✅ ${result.serial}: Success`, "success");
            } else {
              addLog(`❌ ${result.serial}: ${result.error}`, "error");
            }
          });
        }
      } else {
        addLog(`❌ Error: ${data.error}`, "error");
      }
    } catch (err) {
      addLog(`❌ Error: ${err.message}`, "error");
    }

    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
      <div style={{ maxWidth: "680px", width: "100%", background: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(10px)", borderRadius: "20px", padding: "32px", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)" }}>
        
        <button onClick={() => router.push("/")} style={{ padding: "10px 16px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.1)", color: "white", fontWeight: "600", fontSize: "14px", border: "1px solid rgba(255, 255, 255, 0.3)", cursor: "pointer", marginBottom: "24px" }}>
          ← Kembali
        </button>

        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "36px" }}>🚨</div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "white", margin: "8px 0" }}>TikTok Report</h1>
        </div>

        {/* Devices */}
        <div style={{ background: "rgba(0, 0, 0, 0.2)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <h3 style={{ color: "white", fontSize: "14px", margin: 0 }}>📱 Devices ({selectedDevices.length})</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setSelectedDevices(devices.map(d => d.serial))} style={{ padding: "6px 12px", borderRadius: "8px", background: "#10b981", color: "white", border: "none", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>All</button>
              <button onClick={() => setSelectedDevices([])} style={{ padding: "6px 12px", borderRadius: "8px", background: "#ef4444", color: "white", border: "none", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Clear</button>
            </div>
          </div>

          {devices.length === 0 ? (
            <p style={{ color: "rgba(255, 255, 255, 0.7)", textAlign: "center", padding: "20px" }}>No devices</p>
          ) : (
            <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {devices.map((dev) => (
                <div key={dev.serial} onClick={() => toggleDevice(dev.serial)} style={{ padding: "12px 16px", borderRadius: "10px", background: selectedDevices.includes(dev.serial) ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.1)", border: selectedDevices.includes(dev.serial) ? "2px solid #10b981" : "1px solid rgba(255, 255, 255, 0.2)", cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>{dev.model || "Unknown"}</div>
                    <div style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "12px" }}>{dev.serial}</div>
                  </div>
                  {selectedDevices.includes(dev.serial) && <span style={{ color: "#10b981", fontSize: "20px" }}>✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Username */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ color: "white", fontSize: "14px", display: "block", marginBottom: "8px" }}>👤 Username (tanpa @)</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username123" style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.3)", color: "white", fontSize: "14px", outline: "none" }} />
        </div>

        {/* Report Type */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ color: "white", fontSize: "14px", display: "block", marginBottom: "8px" }}>⚠️ Reason</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.3)", color: "white", fontSize: "14px", outline: "none" }}>
            <option value="spam" style={{ background: "#1a1a1a" }}>Spam</option>
            <option value="fake" style={{ background: "#1a1a1a" }}>Fake Account</option>
            <option value="hate" style={{ background: "#1a1a1a" }}>Hate Speech</option>
            <option value="harassment" style={{ background: "#1a1a1a" }}>Bullying</option>
            <option value="violence" style={{ background: "#1a1a1a" }}>Violence</option>
          </select>
        </div>

        {/* Button */}
        <button onClick={handleSendReport} disabled={loading || selectedDevices.length === 0 || !username} style={{ width: "100%", padding: "14px 20px", borderRadius: "12px", background: loading || !username || selectedDevices.length === 0 ? "rgba(100, 100, 100, 0.5)" : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white", fontWeight: "bold", fontSize: "16px", border: "none", cursor: loading || !username || selectedDevices.length === 0 ? "not-allowed" : "pointer" }}>
          {loading ? "⏳ Sending..." : !username ? "❌ Enter username" : selectedDevices.length === 0 ? "❌ Select device" : `🚨 Report (${selectedDevices.length})`}
        </button>

        {/* Logs */}
        {logs.length > 0 && (
          <div style={{ marginTop: "24px", background: "rgba(0, 0, 0, 0.3)", borderRadius: "12px", padding: "16px", maxHeight: "200px", overflowY: "auto" }}>
            <h4 style={{ color: "white", fontSize: "14px", marginBottom: "12px" }}>📋 Logs</h4>
            {logs.map((log, i) => (
              <div key={i} style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "12px", fontFamily: "monospace", marginBottom: "6px", padding: "4px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>{log}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}