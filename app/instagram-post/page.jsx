"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InstagramPostPage() {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [igPostUrl, setIgPostUrl] = useState("");
  const [igPostComment, setIgPostComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchDevices();
  }, []);

  async function fetchDevices() {
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (err) {
      console.error("Error:", err);
    }
  }

  function addLog(msg) {
    const t = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${t}] ${msg}`, ...prev.slice(0, 50)]);
  }

  async function handleSendComment() {
    if (!igPostUrl || !igPostComment) {
      addLog("❌ URL atau komentar kosong");
      return;
    }

    if (selectedDevices.length === 0) {
      addLog("❌ Pilih minimal 1 device");
      return;
    }

    setLoading(true);
    addLog(`🚀 Mengirim ke ${selectedDevices.length} device(s)...`);

    for (let i = 0; i < selectedDevices.length; i++) {
      const serial = selectedDevices[i];
      
      try {
        const response = await fetch("/api/ig-comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postUrl: igPostUrl,
            comment: igPostComment,
            serial: serial,
            type: "post",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed");
        }

        addLog(`✅ ${serial}: Success`);
      } catch (err) {
        addLog(`❌ ${serial}: ${err.message}`);
      }

      await new Promise((r) => setTimeout(r, 800));
    }

    setLoading(false);
    addLog("✅ Selesai!");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "680px",
          width: "100%",
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          padding: "32px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          animation: "fadeIn 0.5s ease-in-out",
        }}
      >
        {/* Back Button at Top */}
        <button
          onClick={() => router.push("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.1)",
            color: "white",
            fontWeight: "600",
            fontSize: "14px",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            cursor: "pointer",
            marginBottom: "24px",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.transform = "translateX(-5px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.transform = "translateX(0)";
          }}
        >
          <span style={{ fontSize: "18px" }}>←</span>
          <span>Kembali ke Dashboard</span>
        </button>

        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "36px", marginBottom: "8px", animation: "bounce 1s ease-in-out infinite" }}>📸</div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", color: "white", marginBottom: "8px" }}>
            Instagram Post Comment
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px" }}>
            Otomatis kirim comment ke Instagram Post
          </p>
        </div>

        {/* Device Selection */}
        <div 
          style={{ 
            background: "rgba(0, 0, 0, 0.2)", 
            borderRadius: "12px", 
            padding: "16px", 
            marginBottom: "20px",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 0, 0, 0.3)";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0, 0, 0, 0.2)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ color: "white", fontSize: "14px", margin: 0 }}>
              📱 Pilih Device ({selectedDevices.length} dipilih)
            </h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setSelectedDevices(devices.map((d) => d.serial))}
                style={{ 
                  padding: "6px 12px", 
                  borderRadius: "8px", 
                  background: "#10b981", 
                  color: "white", 
                  border: "none", 
                  fontSize: "12px", 
                  fontWeight: "600", 
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#059669";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#10b981";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedDevices([])}
                style={{ 
                  padding: "6px 12px", 
                  borderRadius: "8px", 
                  background: "#ef4444", 
                  color: "white", 
                  border: "none", 
                  fontSize: "12px", 
                  fontWeight: "600", 
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#dc2626";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ef4444";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {devices.length === 0 ? (
            <p style={{ color: "rgba(255, 255, 255, 0.7)", textAlign: "center", padding: "20px" }}>
              Tidak ada device. Scan device terlebih dahulu.
            </p>
          ) : (
            <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {devices.map((dev) => {
                const isSelected = selectedDevices.includes(dev.serial);
                return (
                  <div
                    key={dev.serial}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDevices(selectedDevices.filter((s) => s !== dev.serial));
                      } else {
                        setSelectedDevices([...selectedDevices, dev.serial]);
                      }
                    }}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: isSelected ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.1)",
                      border: isSelected ? "2px solid #10b981" : "1px solid rgba(255, 255, 255, 0.2)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateX(5px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ width: "16px", height: "16px" }} />
                    <span style={{ color: "white", fontSize: "13px", fontFamily: "monospace" }}>{dev.serial}</span>
                    {dev.model && <span style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "11px" }}>{dev.model}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* URL Input */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ color: "white", fontSize: "14px", display: "block", marginBottom: "8px" }}>🔗 Instagram Post URL</label>
          <input
            type="text"
            value={igPostUrl}
            onChange={(e) => setIgPostUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/ABC123..."
            style={{ 
              width: "100%", 
              padding: "12px 16px", 
              borderRadius: "10px", 
              background: "rgba(255, 255, 255, 0.15)", 
              border: "1px solid rgba(255, 255, 255, 0.3)", 
              color: "white", 
              fontSize: "14px", 
              outline: "none",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.borderColor = "#10b981";
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
            }}
          />
        </div>

        {/* Comment Input */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ color: "white", fontSize: "14px", display: "block", marginBottom: "8px" }}>💬 Comment</label>
          <textarea
            value={igPostComment}
            onChange={(e) => setIgPostComment(e.target.value)}
            placeholder="Tulis comment di sini..."
            rows={4}
            style={{ 
              width: "100%", 
              padding: "12px 16px", 
              borderRadius: "10px", 
              background: "rgba(255, 255, 255, 0.15)", 
              border: "1px solid rgba(255, 255, 255, 0.3)", 
              color: "white", 
              fontSize: "14px", 
              outline: "none", 
              resize: "vertical",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.borderColor = "#10b981";
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
            }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendComment}
          disabled={loading || selectedDevices.length === 0}
          style={{
            width: "100%",
            padding: "14px 20px",
            borderRadius: "12px",
            background: loading || selectedDevices.length === 0 ? "rgba(100, 100, 100, 0.5)" : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "white",
            fontWeight: "bold",
            fontSize: "16px",
            border: "none",
            cursor: loading || selectedDevices.length === 0 ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (!loading && selectedDevices.length > 0) {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(240, 147, 251, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {loading ? "⏳ Mengirim..." : selectedDevices.length === 0 ? "❌ Pilih device" : `📤 Kirim (${selectedDevices.length} device)`}
        </button>

        {/* Logs */}
        {logs.length > 0 && (
          <div 
            style={{ 
              marginTop: "24px", 
              background: "rgba(0, 0, 0, 0.3)", 
              borderRadius: "12px", 
              padding: "16px", 
              maxHeight: "200px", 
              overflowY: "auto",
              animation: "slideUp 0.4s ease-out",
            }}
          >
            <h4 style={{ color: "white", fontSize: "14px", marginBottom: "12px" }}>📋 Activity Logs</h4>
            {logs.map((log, i) => (
              <div 
                key={i} 
                style={{ 
                  color: "rgba(255, 255, 255, 0.8)", 
                  fontSize: "12px", 
                  fontFamily: "monospace", 
                  marginBottom: "6px", 
                  padding: "4px 0", 
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  animation: `fadeInLog 0.3s ease-out ${i * 0.05}s backwards`,
                }}
              >
                {log}
              </div>
            ))}
          </div>
        )}

        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeInLog {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>
    </div>
  );
}