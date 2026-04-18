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

  useEffect(() => {
    fetch("/api/devices")
      .then(res => res.json())
      .then(data => setDevices(data.devices || []));
  }, []);

  function addLog(msg) {
    const t = new Date().toLocaleTimeString();
    setLogs(prev => [`[${t}] ${msg}`, ...prev.slice(0, 50)]);
  }

  async function handleReport() {
    if (!targetUsername && !profileUrl && !videoUrl) {
      addLog("❌ Isi minimal target");
      return;
    }

    if (selectedDevices.length === 0) {
      addLog("❌ Pilih device");
      return;
    }

    setLoading(true);
    addLog(`🚀 Start ${selectedDevices.length} device`);

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

        addLog(`✅ ${serial} success`);
      } catch (err) {
        addLog(`❌ ${serial}: ${err.message}`);
      }

      await new Promise(r => setTimeout(r, 1000));
    }

    setLoading(false);
    addLog("✅ DONE");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a, #1e293b)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: 20
    }}>
      <div style={{
        width: "100%",
        maxWidth: 700,
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)",
        borderRadius: 16,
        padding: 24,
        color: "white",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
      }}>

        <h2 style={{ fontSize: 24, marginBottom: 20 }}>🚨 TikTok Report</h2>

        <input
          placeholder="Username"
          value={targetUsername}
          onChange={e => setTargetUsername(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Profile URL"
          value={profileUrl}
          onChange={e => setProfileUrl(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Video URL"
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          style={inputStyle}
        />

        <div style={{ marginTop: 15 }}>
          {devices.map(d => {
            const selected = selectedDevices.includes(d.serial);
            return (
              <div
                key={d.serial}
                onClick={() => {
                  if (selected) {
                    setSelectedDevices(selectedDevices.filter(s => s !== d.serial));
                  } else {
                    setSelectedDevices([...selectedDevices, d.serial]);
                  }
                }}
                style={{
                  padding: 10,
                  marginBottom: 6,
                  borderRadius: 8,
                  cursor: "pointer",
                  background: selected ? "#10b981" : "rgba(255,255,255,0.1)"
                }}
              >
                {d.serial}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleReport}
          disabled={loading}
          style={{
            marginTop: 20,
            width: "100%",
            padding: 14,
            borderRadius: 10,
            border: "none",
            background: loading ? "#555" : "linear-gradient(135deg,#f43f5e,#ec4899)",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          {loading ? "Processing..." : "🚀 Start Report"}
        </button>

        <div style={{
          marginTop: 20,
          maxHeight: 200,
          overflowY: "auto",
          fontSize: 12
        }}>
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>

      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 12,
  marginBottom: 10,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.1)",
  color: "white"
};