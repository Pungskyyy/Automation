"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TikTokReportPage() {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [targetUsername, setTargetUsername] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [reportReason, setReportReason] = useState("spam");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const shellBg = "#020617";
  const cardBg = "#020617";
  const cardBorder = "#1f2937";

  useEffect(() => {
    fetch("/api/devices")
      .then(res => res.json())
      .then(data => setDevices(data.devices || []));
  }, []);

  function addLog(msg, type = "info") {
    const t = new Date().toLocaleTimeString();
    const icon = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
    setLogs(prev => [{ time: t, msg, type, icon }, ...prev.slice(0, 50)]);
  }

  async function handleReport() {
    if (!targetUsername && !profileUrl && !videoUrl) {
      addLog("Isi minimal satu target (Username/Profile/Video)", "error");
      return;
    }

    if (selectedDevices.length === 0) {
      addLog("Pilih minimal 1 device", "error");
      return;
    }

    setLoading(true);
    addLog(`Memulai report dengan ${selectedDevices.length} device...`, "info");

    let successCount = 0;
    let failCount = 0;

    for (const serial of selectedDevices) {
      try {
        const res = await fetch("/api/tiktok-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUsername,
            profileUrl,
            videoUrl,
            reportReason,
            serial,
          }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        addLog(`${serial}: Report berhasil`, "success");
        successCount++;
      } catch (err) {
        addLog(`${serial}: ${err.message}`, "error");
        failCount++;
      }

      await new Promise(r => setTimeout(r, 1000));
    }

    setLoading(false);
    addLog(`Selesai! Success: ${successCount}, Failed: ${failCount}`, "success");
  }

  const toggleDevice = (serial) => {
    if (selectedDevices.includes(serial)) {
      setSelectedDevices(selectedDevices.filter(s => s !== serial));
    } else {
      setSelectedDevices([...selectedDevices, serial]);
    }
  };

  const selectAll = () => {
    setSelectedDevices(devices.map(d => d.serial));
  };

  const deselectAll = () => {
    setSelectedDevices([]);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      padding: "40px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto"
      }}>
        
        {/* Header */}
        <div style={{
          background: cardBg,
          borderRadius: 16,
          padding: "24px",
          marginBottom: 24,
          border: `1px solid ${cardBorder}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h1 style={{ 
              fontSize: 32, 
              margin: 0,
              background: "linear-gradient(135deg, #f43f5e, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 700
            }}>
              🚨 TikTok Report
            </h1>
            <p style={{ 
              margin: "8px 0 0 0", 
              opacity: 0.6,
              fontSize: 14
            }}>
              Mass report TikTok accounts or videos
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          
          {/* Left Panel - Form */}
          <div>
            <div style={{
              background: cardBg,
              borderRadius: 16,
              padding: 24,
              border: `1px solid ${cardBorder}`,
              marginBottom: 24
            }}>
              <h3 style={{ fontSize: 18, marginBottom: 16, color: "#00fca8" }}>
                🎯 Target Information
              </h3>

              <label style={{ display: "block", marginBottom: 16 }}>
                <div style={{ fontSize: 12, marginBottom: 6, opacity: 0.7 }}>
                  Username Target
                </div>
                <input
                  placeholder="@username"
                  value={targetUsername}
                  onChange={e => setTargetUsername(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    fontSize: 14
                  }}
                />
              </label>

              <label style={{ display: "block", marginBottom: 16 }}>
                <div style={{ fontSize: 12, marginBottom: 6, opacity: 0.7 }}>
                  Profile URL
                </div>
                <input
                  placeholder="https://tiktok.com/@username"
                  value={profileUrl}
                  onChange={e => setProfileUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    fontSize: 14
                  }}
                />
              </label>

              <label style={{ display: "block", marginBottom: 16 }}>
                <div style={{ fontSize: 12, marginBottom: 6, opacity: 0.7 }}>
                  Video URL
                </div>
                <input
                  placeholder="https://tiktok.com/@username/video/..."
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    fontSize: 14
                  }}
                />
              </label>

              <label style={{ display: "block", marginBottom: 16 }}>
                <div style={{ fontSize: 12, marginBottom: 6, opacity: 0.7 }}>
                  Report Reason
                </div>
                <select
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    fontSize: 14
                  }}
                >
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="hate_speech">Hate Speech</option>
                  <option value="violence">Violence</option>
                  <option value="misinformation">Misinformation</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <button
                onClick={handleReport}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: 16,
                  borderRadius: 12,
                  border: "none",
                  background: loading 
                    ? "rgba(100,100,100,0.5)" 
                    : "linear-gradient(135deg, #f43f5e, #ec4899)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  transition: "all 0.3s"
                }}
              >
                {loading ? "⏳ Processing..." : "🚀 Start Mass Report"}
              </button>
            </div>

            {/* Logs */}
            <div style={{
              background: cardBg,
              borderRadius: 16,
              padding: 24,
              border: `1px solid ${cardBorder}`,
            }}>
              <h3 style={{ fontSize: 18, marginBottom: 16, color: "#3b82f6" }}>
                📝 Activity Logs
              </h3>
              <div style={{
                maxHeight: 300,
                overflowY: "auto",
                fontSize: 12,
                fontFamily: "monospace"
              }}>
                {logs.length === 0 ? (
                  <div style={{ textAlign: "center", opacity: 0.5, padding: 40 }}>
                    No logs yet
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div 
                      key={i}
                      style={{
                        padding: "8px 12px",
                        marginBottom: 6,
                        borderRadius: 8,
                        background: log.type === "success" 
                          ? "rgba(34, 197, 94, 0.1)" 
                          : log.type === "error"
                          ? "rgba(239, 68, 68, 0.1)"
                          : "rgba(59, 130, 246, 0.1)",
                        border: log.type === "success"
                          ? "1px solid rgba(34, 197, 94, 0.3)"
                          : log.type === "error"
                          ? "1px solid rgba(239, 68, 68, 0.3)"
                          : "1px solid rgba(59, 130, 246, 0.3)",
                        color: log.type === "success"
                          ? "#22c55e"
                          : log.type === "error"
                          ? "#ef4444"
                          : "#3b82f6"
                      }}
                    >
                      {log.icon} [{log.time}] {log.msg}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Device Selection */}
          <div>
            <div style={{
              background: cardBg,
              borderRadius: 16,
              padding: 24,
              border: `1px solid ${cardBorder}`,
            }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16
              }}>
                <h3 style={{ fontSize: 18, margin: 0, color: "#f59e0b" }}>
                  📱 Select Devices ({selectedDevices.length}/{devices.length})
                </h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={selectAll}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: "rgba(34, 197, 94, 0.2)",
                      border: "1px solid rgba(34, 197, 94, 0.4)",
                      color: "#22c55e",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAll}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: "rgba(239, 68, 68, 0.2)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div style={{
                maxHeight: 600,
                overflowY: "auto"
              }}>
                {devices.length === 0 ? (
                  <div style={{ 
                    textAlign: "center", 
                    opacity: 0.5, 
                    padding: 60 
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
                    No devices connected
                  </div>
                ) : (
                  devices.map(d => {
                    const selected = selectedDevices.includes(d.serial);
                    return (
                      <div
                        key={d.serial}
                        onClick={() => toggleDevice(d.serial)}
                        style={{
                          padding: 14,
                          marginBottom: 8,
                          borderRadius: 10,
                          cursor: "pointer",
                          background: selected 
                            ? "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))" 
                            : "rgba(255,255,255,0.05)",
                          border: selected
                            ? "2px solid #22c55e"
                            : "1px solid rgba(255,255,255,0.1)",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}
                      >
                        <div>
                          <div style={{ 
                            fontSize: 13, 
                            fontFamily: "monospace",
                            fontWeight: 600 
                          }}>
                            {d.serial}
                          </div>
                          <div style={{ 
                            fontSize: 11, 
                            opacity: 0.6,
                            marginTop: 4
                          }}>
                            {d.model || "Unknown Model"}
                          </div>
                        </div>
                        {selected && (
                          <div style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "#22c55e",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14
                          }}>
                            ✓
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}