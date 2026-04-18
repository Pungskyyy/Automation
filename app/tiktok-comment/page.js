"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TikTokCommentPage() {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [comment, setComment] = useState("");
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

  async function handleComment() {
    if (!videoUrl || !comment) {
      addLog("Video URL dan Comment harus diisi", "error");
      return;
    }

    if (selectedDevices.length === 0) {
      addLog("Pilih minimal 1 device", "error");
      return;
    }

    setLoading(true);
    addLog(`Memulai comment ke ${selectedDevices.length} device...`, "info");

    try {
      const res = await fetch("/api/tiktok-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl,
          comment,
          serials: selectedDevices,
        }),
      });

      const data = await res.json();

      if (data.success) {
        addLog(`✅ Selesai! Success: ${data.successCount}/${data.total}`, "success");
        data.results.forEach(r => {
          if (r.success) {
            addLog(`${r.serial}: Success`, "success");
          } else {
            addLog(`${r.serial}: ${r.error}`, "error");
          }
        });
      } else {
        addLog(`Error: ${data.error}`, "error");
      }
    } catch (err) {
      addLog(`Error: ${err.message}`, "error");
    }

    setLoading(false);
  }

  const toggleDevice = (serial) => {
    if (selectedDevices.includes(serial)) {
      setSelectedDevices(selectedDevices.filter(s => s !== serial));
    } else {
      setSelectedDevices([...selectedDevices, serial]);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      padding: "40px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
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
              background: "linear-gradient(135deg, #00f2ea, #00c4cc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 700
            }}>
              🎬 TikTok Video Comment
            </h1>
            <p style={{ margin: "8px 0 0 0", opacity: 0.6, fontSize: 14 }}>
              Mass comment on TikTok videos
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
            ← Back
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          
          {/* Left Panel */}
          <div>
            <div style={{
              background: cardBg,
              borderRadius: 16,
              padding: 24,
              border: `1px solid ${cardBorder}`,
              marginBottom: 24
            }}>
              <h3 style={{ fontSize: 18, marginBottom: 16, color: "#00fca8" }}>
                📝 Comment Details
              </h3>

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
                  Comment Text
                </div>
                <textarea
                  placeholder="Your comment here..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={4}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    fontSize: 14,
                    resize: "vertical"
                  }}
                />
              </label>

              <button
                onClick={handleComment}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: 16,
                  borderRadius: 12,
                  border: "none",
                  background: loading 
                    ? "rgba(100,100,100,0.5)" 
                    : "linear-gradient(135deg, #00f2ea, #00c4cc)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? "⏳ Processing..." : "🚀 Send Comments"}
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
                📝 Logs
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

          {/* Right Panel - Devices */}
          <div>
            <div style={{
              background: cardBg,
              borderRadius: 16,
              padding: 24,
              border: `1px solid ${cardBorder}`,
            }}>
              <h3 style={{ fontSize: 18, marginBottom: 16, color: "#f59e0b" }}>
                📱 Devices ({selectedDevices.length}/{devices.length})
              </h3>
              <div style={{ maxHeight: 600, overflowY: "auto" }}>
                {devices.map(d => {
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
                          ? "rgba(34, 197, 94, 0.2)" 
                          : "rgba(255,255,255,0.05)",
                        border: selected
                          ? "2px solid #22c55e"
                          : "1px solid rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <div style={{ fontSize: 13, fontFamily: "monospace" }}>
                        {d.serial}
                      </div>
                      {selected && <div style={{ color: "#22c55e" }}>✓</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}