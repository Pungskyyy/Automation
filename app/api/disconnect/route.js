"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const router = juseRouter();
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [connectIp, setConnectIp] = useState("");
  const [connectPort, setConnectPort] = useState("5555");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDevices() {
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (err) {
      console.error("Error fetching devices:", err);
    }
  }

  async function handleScanDevices() {
    setScanning(true);
    try {
      const res = await fetch("/api/scan-devices", { method: "POST" });
      const data = await res.json();
      console.log("Scan result:", data);
      await fetchDevices();
    } catch (err) {
      console.error("Scan error:", err);
    }
    setScanning(false);
  }

  async function handleConnectByIp() {
    if (!connectIp) {
      alert("Masukkan IP Address!");
      return;
    }
    
    setConnecting(true);
    try {
      const res = await fetch("/api/connect-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ip: connectIp, 
          port: connectPort || "5555" 
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ Berhasil connect ke ${connectIp}:${connectPort}`);
        setConnectIp("");
        await fetchDevices();
      } else {
        alert(`❌ Gagal connect: ${data.error}`);
      }
    } catch (err) {
      console.error("Connect error:", err);
      alert(`❌ Error: ${err.message}`);
    }
    setConnecting(false);
  }

  async function handleDisconnect(serial) {
    try {
      const res = await fetch("/api/disconnect-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial }),
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ Device ${serial} berhasil disconnect`);
        await fetchDevices();
      } else {
        alert(`❌ Gagal disconnect: ${data.error}`);
      }
    } catch (err) {
      console.error("Disconnect error:", err);
      alert(`❌ Error: ${err.message}`);
    }
  }

  async function handleEnableTcpip(serial) {
    try {
      const res = await fetch("/api/enable-tcpip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial }),
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`✅ TCPIP enabled di device ${serial}\nIP: ${data.ip || 'unknown'}`);
      } else {
        alert(`❌ Gagal enable TCPIP: ${data.error}`);
      }
    } catch (err) {
      console.error("Enable TCPIP error:", err);
      alert(`❌ Error: ${err.message}`);
    }
  }

  async function handleEnableTcpipAll() {
    if (selectedDevices.length === 0) {
      alert("Pilih minimal 1 device!");
      return;
    }

    for (const serial of selectedDevices) {
      await handleEnableTcpip(serial);
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const menuItems = [
    {
      category: "INSTAGRAM",
      icon: "📸",
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      items: [
        { name: "Instagram Post", path: "/instagram-post", emoji: "📸" },
        { name: "Instagram Reels", path: "/instagram-reels", emoji: "🎬" },
        { name: "Report Account", path: "/ig-report", emoji: "🚨" },
      ],
    },
    {
      category: "TIKTOK",
      icon: "🎵",
      color: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      items: [
        { name: "TikTok Video", path: "/tiktok-video", emoji: "🎵" },
        { name: "TikTok Post", path: "/tiktok-post", emoji: "📱" },
        { name: "Report Account", path: "/tiktok-report", emoji: "🚨" },
      ],
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px", animation: "fadeIn 0.6s ease-out" }}>
          <h1 style={{ fontSize: "48px", fontWeight: "bold", color: "white", marginBottom: "8px", textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
            OPS AUTOMATION SOSIAL MEDIA
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "16px" }}>
            Monitoring, pairing, automation untuk banyak device.
          </p>
        </div>

        {/* Connected Devices */}
        <div style={{ background: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(10px)", borderRadius: "20px", padding: "32px", marginBottom: "32px", border: "1px solid rgba(255, 255, 255, 0.2)", animation: "slideUp 0.5s ease-out" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "white", marginBottom: "24px" }}>
            Connected Devices
          </h2>

          <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
            <button
              onClick={handleScanDevices}
              disabled={scanning}
              style={{ padding: "12px 24px", borderRadius: "10px", background: "#3b82f6", color: "white", fontWeight: "600", border: "none", cursor: scanning ? "not-allowed" : "pointer", transition: "all 0.3s ease" }}
              onMouseEnter={(e) => { if (!scanning) { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "scale(1.05)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#3b82f6"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              {scanning ? "⏳ Scanning..." : "📱 Scan Devices"}
            </button>

            <button
              onClick={() => setSelectedDevices(devices.map(d => d.serial))}
              style={{ padding: "12px 24px", borderRadius: "10px", background: "#10b981", color: "white", fontWeight: "600", border: "none", cursor: "pointer", transition: "all 0.3s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#059669"; e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#10b981"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              Select All
            </button>

            <button
              onClick={() => setSelectedDevices([])}
              style={{ padding: "12px 24px", borderRadius: "10px", background: "#ef4444", color: "white", fontWeight: "600", border: "none", cursor: "pointer", transition: "all 0.3s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              Clear
            </button>

            <button
              onClick={handleEnableTcpipAll}
              disabled={selectedDevices.length === 0}
              style={{ padding: "12px 24px", borderRadius: "10px", background: selectedDevices.length === 0 ? "#6b7280" : "#10b981", color: "white", fontWeight: "600", border: "none", cursor: selectedDevices.length === 0 ? "not-allowed" : "pointer", transition: "all 0.3s ease" }}
              onMouseEnter={(e) => { if (selectedDevices.length > 0) { e.currentTarget.style.background = "#059669"; e.currentTarget.style.transform = "scale(1.05)"; } }}
              onMouseLeave={(e) => { if (selectedDevices.length > 0) { e.currentTarget.style.background = "#10b981"; e.currentTarget.style.transform = "scale(1)"; } }}
            >
              Enable TCPIP (All Devices)
            </button>
          </div>

          {devices.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "rgba(255, 255, 255, 0.7)" }}>
              <p style={{ fontSize: "18px" }}>Tidak ada device terdeteksi</p>
              <p style={{ fontSize: "14px", marginTop: "8px" }}>Klik "Scan Devices" untuk mencari device</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {devices.map((dev) => {
                const isSelected = selectedDevices.includes(dev.serial);
                const isOnline = dev.state === "device";
                return (
                  <div
                    key={dev.serial}
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: isSelected ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.1)",
                      border: isSelected ? "2px solid #10b981" : "1px solid rgba(255, 255, 255, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDevices(selectedDevices.filter(s => s !== dev.serial));
                      } else {
                        setSelectedDevices([...selectedDevices, dev.serial]);
                      }
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(5px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateX(0)"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: "white", fontWeight: "600", fontSize: "14px", fontFamily: "monospace" }}>
                            {dev.serial}
                          </span>
                          <span style={{ 
                            background: isOnline ? "#10b981" : "#6b7280", 
                            color: "white", 
                            padding: "2px 8px", 
                            borderRadius: "4px", 
                            fontSize: "10px", 
                            fontWeight: "600" 
                          }}>
                            {isOnline ? "● Online" : "● Offline"}
                          </span>
                        </div>
                        {dev.model && (
                          <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "12px", marginTop: "4px" }}>
                            {dev.model}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnableTcpip(dev.serial);
                        }}
                        style={{ padding: "8px 16px", borderRadius: "8px", background: "#10b981", color: "white", border: "none", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#059669"; e.currentTarget.style.transform = "scale(1.05)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#10b981"; e.currentTarget.style.transform = "scale(1)"; }}
                      >
                        Enable TCPIP
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDisconnect(dev.serial);
                        }}
                        style={{ padding: "8px 16px", borderRadius: "8px", background: "#ef4444", color: "white", border: "none", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.transform = "scale(1.05)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.transform = "scale(1)"; }}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Connect by IP */}
        <div style={{ background: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(10px)", borderRadius: "20px", padding: "32px", marginBottom: "32px", border: "1px solid rgba(255, 255, 255, 0.2)", animation: "slideUp 0.6s ease-out" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "white", marginBottom: "20px" }}>
            Connect by IP
          </h2>
          
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <input
              type="text"
              value={connectIp}
              onChange={(e) => setConnectIp(e.target.value)}
              placeholder="IP Address"
              style={{ flex: "1", minWidth: "200px", padding: "12px 16px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.2)", border: "1px solid rgba(255, 255, 255, 0.3)", color: "white", fontSize: "14px", outline: "none" }}
            />
            
            <input
              type="text"
              value={connectPort}
              onChange={(e) => setConnectPort(e.target.value)}
              placeholder="Port"
              style={{ width: "100px", padding: "12px 16px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.2)", border: "1px solid rgba(255, 255, 255, 0.3)", color: "white", fontSize: "14px", outline: "none" }}
            />
            
            <button
              onClick={handleConnectByIp}
              disabled={connecting || !connectIp}
              style={{ padding: "12px 24px", borderRadius: "10px", background: connecting || !connectIp ? "#6b7280" : "#10b981", color: "white", fontWeight: "600", border: "none", cursor: connecting || !connectIp ? "not-allowed" : "pointer", transition: "all 0.3s ease" }}
              onMouseEnter={(e) => { if (!connecting && connectIp) { e.currentTarget.style.background = "#059669"; e.currentTarget.style.transform = "scale(1.05)"; } }}
              onMouseLeave={(e) => { if (!connecting && connectIp) { e.currentTarget.style.background = "#10b981"; e.currentTarget.style.transform = "scale(1)"; } }}
            >
              {connecting ? "⏳ Connecting..." : "🔌 Connect"}
            </button>
          </div>
        </div>

        {/* Menu Grid */}
        <div style={{ display: "grid", gap: "32px" }}>
          {menuItems.map((category, idx) => (
            <div key={idx} style={{ animation: `slideUp ${0.7 + idx * 0.1}s ease-out` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <span style={{ fontSize: "32px" }}>{category.icon}</span>
                <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "white" }}>
                  {category.category}
                </h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                {category.items.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => router.push(item.path)}
                    style={{
                      padding: "24px",
                      borderRadius: "16px",
                      background: category.color,
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                      e.currentTarget.style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>{item.emoji}</div>
                    <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "white", marginBottom: "8px" }}>
                      {item.name}
                    </h3>
                    <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px" }}>
                      Klik untuk mulai →
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}