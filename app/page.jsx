"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import PairingQR from "../components/PairingQR";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

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

  // MASS COMMENT STATES
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [massRunning, setMassRunning] = useState(false);
  const [massProgress, setMassProgress] = useState(0);

  // Loading states untuk setiap aksi
  const [tiktokVideoLoading, setTiktokVideoLoading] = useState(false);
  const [tiktokPostLoading, setTiktokPostLoading] = useState(false);
  const [igPostLoading, setIgPostLoading] = useState(false);
  const [igReelsLoading, setIgReelsLoading] = useState(false);

  // TikTok / IG States
  const [tiktokVideoUrl, setTikTokVideoUrl] = useState("");
  const [tiktokVideoComment, setTikTokVideoComment] = useState("");
  const [tiktokPostUrl, setTiktokPostUrl] = useState("");
  const [tiktokPostComment, setTikTokPostComment] = useState("");
  
  const [igPostUrl, setIgPostUrl] = useState("");
  const [igPostComment, setIgPostComment] = useState("");
  const [igReelsUrl, setIgReelsUrl] = useState("");
  const [igReelsComment, setIgReelsComment] = useState("");

  // Backward compatibility (untuk section lama yang masih ada)
  const [tiktokUrl, setTikTokUrl] = useState("");
  const [tiktokComment, setTikTokComment] = useState("");
  const [igUrl, setIgUrl] = useState("");
  const [igComment, setIgComment] = useState("");

  // TCP/IP States
  const [tcpipLoading, setTcpipLoading] = useState(false);
  const [tcpipStatus, setTcpipStatus] = useState("");

  // Koordinat device 1080 × 2160
  const tiktokCoords = {
    commentButton: { x: 540, y: 864 },
    inputField: { x: 603, y: 973 },
    sendButton: { x: 984, y: 1157 }
  };

  const igCoords = {
    commentButton: { x: 254, y: 1965 },
    inputField: { x: 487, y: 1145 },
    sendButton: { x: 876, y: 1145 }
  };

  function addLog(msg) {
    const t = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${t}] ${msg}`, ...prev.slice(0, 200)]);
  }

  // ============================
  // Scan Devices
  // ============================
  async function handleScanDevices() {
    setLoadingDevices(true);
    setDevicesError("");

    try {
      const res = await fetch("/api/devices", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setDevices(data.devices);
      addLog(`Scan devices: ${data.devices?.length || 0}`);
    } catch (err) {
      setDevicesError(err.message);
      addLog("Error scan: " + err.message);
    }

    setLoadingDevices(false);
  }

  async function handleDisconnect(serial) {
    addLog(`Disconnecting ${serial}...`);
  
    try {
      const res = await fetch(`/api/disconnect/${serial}`, {
        method: "POST",
      });
      const data = await res.json();
  
      if (!res.ok) throw new Error(data.error);
  
      addLog(`Disconnected ${serial}`);
  
      // refresh list
      handleScanDevices();
  
    } catch (err) {
      addLog("Disconnect error: " + err.message);
    }
  }

  // ============================
  // Pairing
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

      setPairStatus(data.message || "Pair berhasil");
      addLog("Pair success");
    } catch (err) {
      setPairStatus("Error: " + err.message);
      addLog("Pair error: " + err.message);
    }

    setPairLoading(false);
  }

  // ============================
  // Single Comment TikTok
  // ============================
  async function sendTikTokComment() {
    console.log("[DEBUG] sendTikTokComment called");
    console.log("[DEBUG] tiktokUrl:", tiktokUrl);
    console.log("[DEBUG] tiktokComment:", tiktokComment);
    console.log("[DEBUG] selectedDevices:", selectedDevices);
    console.log("[DEBUG] devices:", devices);

    if (!tiktokUrl || !tiktokComment) {
      addLog("TikTok: URL atau komentar kosong");
      return;
    }

    // Gunakan device yang terselect, atau device pertama yang tersedia
    const targetSerial = selectedDevices.length > 0 
      ? selectedDevices[0] 
      : (devices.length > 0 ? devices[0].serial : null);

    if (!targetSerial) {
      addLog("TikTok: Tidak ada device tersedia. Scan device terlebih dahulu.");
      return;
    }

    console.log("[DEBUG] Sending to device:", targetSerial);

    try {
      const response = await fetch("/api/tiktok-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: tiktokUrl,
          comment: tiktokComment,
          coords: tiktokCoords,
          serial: targetSerial,
        }),
      });

      const data = await response.json();
      console.log("[DEBUG] API Response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to send comment");
      }

      addLog(`Komentar TikTok terkirim ke ${targetSerial}`);
    } catch (err) {
      console.error("[DEBUG] Error:", err);
      addLog("Error TikTok: " + err.message);
    }
  }

  // ============================
  // Single Comment Instagram
  // ============================
  async function sendInstagramComment(type = "post") {
    if (!igUrl || !igComment) {
      addLog("Instagram: URL atau komentar kosong");
      return;
    }

    // Gunakan device yang terselect, atau device pertama yang tersedia
    const targetSerial = selectedDevices.length > 0 
      ? selectedDevices[0] 
      : (devices.length > 0 ? devices[0].serial : null);

    if (!targetSerial) {
      addLog("Instagram: Tidak ada device tersedia. Scan device terlebih dahulu.");
      return;
    }

    try {
      await fetch("/api/ig-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postUrl: igUrl,
          comment: igComment,
          coords: igCoords,
          serial: targetSerial,
          type: type, // "post" or "reels"
        }),
      });

      const typeLabel = type === "reels" ? "Reels" : "Post";
      addLog(`Komentar Instagram ${typeLabel} terkirim ke ${targetSerial}`);
    } catch (err) {
      addLog("Error IG: " + err.message);
    }
  }

  // ============================
  // TikTok Video Comment
  // ============================
  async function sendTikTokVideoComment() {
    console.log("[DEBUG] sendTikTokVideoComment called");
    
    if (!tiktokVideoUrl || !tiktokVideoComment) {
      addLog("TikTok Video: URL atau komentar kosong");
      return;
    }

    const targetSerial = selectedDevices.length > 0 
      ? selectedDevices[0] 
      : (devices.length > 0 ? devices[0].serial : null);

    if (!targetSerial) {
      addLog("TikTok Video: Tidak ada device tersedia. Scan device terlebih dahulu.");
      return;
    }

    setTiktokVideoLoading(true);

    try {
      const response = await fetch("/api/tiktok-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: tiktokVideoUrl,
          comment: tiktokVideoComment,
          coords: tiktokCoords,
          serial: targetSerial,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send comment");

      addLog(`✅ Komentar TikTok Video terkirim ke ${targetSerial}`);
    } catch (err) {
      console.error("[DEBUG] Error:", err);
      addLog("❌ Error TikTok Video: " + err.message);
    } finally {
      setTiktokVideoLoading(false);
    }
  }

  // ============================
  // TikTok Post Comment
  // ============================
  async function sendTikTokPostComment() {
    console.log("[DEBUG] sendTikTokPostComment called");
    
    if (!tiktokPostUrl || !tiktokPostComment) {
      addLog("TikTok Post: URL atau komentar kosong");
      return;
    }

    const targetSerial = selectedDevices.length > 0 
      ? selectedDevices[0] 
      : (devices.length > 0 ? devices[0].serial : null);

    if (!targetSerial) {
      addLog("TikTok Post: Tidak ada device tersedia. Scan device terlebih dahulu.");
      return;
    }

    setTiktokPostLoading(true);

    try {
      const response = await fetch("/api/tiktok-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: tiktokPostUrl,
          comment: tiktokPostComment,
          coords: tiktokCoords,
          serial: targetSerial,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send comment");

      addLog(`✅ Komentar TikTok Post terkirim ke ${targetSerial}`);
    } catch (err) {
      console.error("[DEBUG] Error:", err);
      addLog("❌ Error TikTok Post: " + err.message);
    } finally {
      setTiktokPostLoading(false);
    }
  }

  // ============================
  // Instagram Post Comment
  // ============================
  async function sendInstagramPostComment() {
    if (!igPostUrl || !igPostComment) {
      addLog("Instagram Post: URL atau komentar kosong");
      return;
    }

    const targetSerial = selectedDevices.length > 0 
      ? selectedDevices[0] 
      : (devices.length > 0 ? devices[0].serial : null);

    if (!targetSerial) {
      addLog("Instagram Post: Tidak ada device tersedia. Scan device terlebih dahulu.");
      return;
    }

    setIgPostLoading(true);

    try {
      await fetch("/api/ig-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postUrl: igPostUrl,
          comment: igPostComment,
          coords: igCoords,
          serial: targetSerial,
          type: "post",
        }),
      });

      addLog(`✅ Komentar Instagram Post terkirim ke ${targetSerial}`);
    } catch (err) {
      addLog("❌ Error Instagram Post: " + err.message);
    } finally {
      setIgPostLoading(false);
    }
  }

  // ============================
  // Instagram Reels Comment
  // ============================
  async function sendInstagramReelsComment() {
    if (!igReelsUrl || !igReelsComment) {
      addLog("Instagram Reels: URL atau komentar kosong");
      return;
    }

    const targetSerial = selectedDevices.length > 0 
      ? selectedDevices[0] 
      : (devices.length > 0 ? devices[0].serial : null);

    if (!targetSerial) {
      addLog("Instagram Reels: Tidak ada device tersedia. Scan device terlebih dahulu.");
      return;
    }

    setIgReelsLoading(true);

    try {
      await fetch("/api/ig-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postUrl: igReelsUrl,
          comment: igReelsComment,
          coords: igCoords,
          serial: targetSerial,
          type: "reels",
        }),
      });

      addLog(`✅ Komentar Instagram Reels terkirim ke ${targetSerial}`);
    } catch (err) {
      addLog("❌ Error Instagram Reels: " + err.message);
    } finally {
      setIgReelsLoading(false);
    }
  }

  // ============================
  // MASS COMMENT TIKTOK
  // ============================
  async function massSendTikTok() {
    if (!tiktokUrl || !tiktokComment) return addLog("URL / Comment kosong");
    if (selectedDevices.length === 0) return addLog("Tidak ada device dipilih");

    setMassRunning(true);
    setMassProgress(0);

    let done = 0;

    for (const serial of selectedDevices) {
      try {
        await fetch("/api/tiktok-comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl: tiktokUrl,
            comment: tiktokComment,
            coords: tiktokCoords,
            serial,
          }),
        });

        done++;
        setMassProgress(Math.round((done / selectedDevices.length) * 100));
        addLog(`TikTok mass → ${serial} OK`);
      } catch (err) {
        addLog(`TikTok mass → ${serial} ERROR`);
      }

      await new Promise((r) => setTimeout(r, 800));
    }

    setMassRunning(false);
    addLog("Mass comment TikTok selesai");
  }

  // ============================
  // MASS COMMENT INSTAGRAM
  // ============================
  async function massSendInstagram(type = "post") {
    if (!igUrl || !igComment) return addLog("URL / Comment kosong");
    if (selectedDevices.length === 0) return addLog("Tidak ada device dipilih");

    setMassRunning(true);
    setMassProgress(0);

    let done = 0;

    for (const serial of selectedDevices) {
      try {
        await fetch("/api/ig-comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postUrl: igUrl,
            comment: igComment,
            coords: igCoords,
            serial,
            type: type, // "post" or "reels"
          }),
        });

        done++;
        setMassProgress(Math.round((done / selectedDevices.length) * 100));
        const typeLabel = type === "reels" ? "Reels" : "Post";
        addLog(`IG ${typeLabel} mass → ${serial} OK`);
      } catch (err) {
        addLog(`IG mass → ${serial} ERROR`);
      }

      await new Promise((r) => setTimeout(r, 800));
    }

    setMassRunning(false);
    const typeLabel = type === "reels" ? "Reels" : "Post";
    addLog(`Mass comment Instagram ${typeLabel} selesai`);
  }

  // ============================
  // MASS COMMENT - TikTok Video
  // ============================
  async function massSendTikTokVideo() {
    if (!tiktokVideoUrl || !tiktokVideoComment) return addLog("URL / Comment kosong");
    if (selectedDevices.length === 0) return addLog("Tidak ada device dipilih");

    setMassRunning(true);
    setMassProgress(0);
    let done = 0;

    for (const serial of selectedDevices) {
      try {
        await fetch("/api/tiktok-comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl: tiktokVideoUrl,
            comment: tiktokVideoComment,
            coords: tiktokCoords,
            serial,
          }),
        });

        done++;
        setMassProgress(Math.round((done / selectedDevices.length) * 100));
        addLog(`TikTok Video mass → ${serial} OK`);
      } catch (err) {
        addLog(`TikTok Video mass → ${serial} ERROR`);
      }

      await new Promise((r) => setTimeout(r, 800));
    }

    setMassRunning(false);
    addLog("Mass comment TikTok Video selesai");
  }

  // ============================
  // MASS COMMENT - TikTok Post
  // ============================
  async function massSendTikTokPost() {
    if (!tiktokPostUrl || !tiktokPostComment) return addLog("URL / Comment kosong");
    if (selectedDevices.length === 0) return addLog("Tidak ada device dipilih");

    setMassRunning(true);
    setMassProgress(0);
    let done = 0;

    for (const serial of selectedDevices) {
      try {
        await fetch("/api/tiktok-comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl: tiktokPostUrl,
            comment: tiktokPostComment,
            coords: tiktokCoords,
            serial,
          }),
        });

        done++;
        setMassProgress(Math.round((done / selectedDevices.length) * 100));
        addLog(`TikTok Post mass → ${serial} OK`);
      } catch (err) {
        addLog(`TikTok Post mass → ${serial} ERROR`);
      }

      await new Promise((r) => setTimeout(r, 800));
    }

    setMassRunning(false);
    addLog("Mass comment TikTok Post selesai");
  }

  // ============================
  // MASS COMMENT - Instagram Post
  // ============================
  async function massSendInstagramPost() {
    if (!igPostUrl || !igPostComment) return addLog("URL / Comment kosong");
    if (selectedDevices.length === 0) return addLog("Tidak ada device dipilih");

    setMassRunning(true);
    setMassProgress(0);
    let done = 0;

    for (const serial of selectedDevices) {
      try {
        await fetch("/api/ig-comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postUrl: igPostUrl,
            comment: igPostComment,
            coords: igCoords,
            serial,
            type: "post",
          }),
        });

        done++;
        setMassProgress(Math.round((done / selectedDevices.length) * 100));
        addLog(`Instagram Post mass → ${serial} OK`);
      } catch (err) {
        addLog(`Instagram Post mass → ${serial} ERROR`);
      }

      await new Promise((r) => setTimeout(r, 800));
    }

    setMassRunning(false);
    addLog("Mass comment Instagram Post selesai");
  }

  // ============================
  // MASS COMMENT - Instagram Reels
  // ============================
  async function massSendInstagramReels() {
    if (!igReelsUrl || !igReelsComment) return addLog("URL / Comment kosong");
    if (selectedDevices.length === 0) return addLog("Tidak ada device dipilih");

    setMassRunning(true);
    setMassProgress(0);
    let done = 0;

    for (const serial of selectedDevices) {
      try {
        await fetch("/api/ig-comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postUrl: igReelsUrl,
            comment: igReelsComment,
            coords: igCoords,
            serial,
            type: "reels",
          }),
        });

        done++;
        setMassProgress(Math.round((done / selectedDevices.length) * 100));
        addLog(`Instagram Reels mass → ${serial} OK`);
      } catch (err) {
        addLog(`Instagram Reels mass → ${serial} ERROR`);
      }

      await new Promise((r) => setTimeout(r, 800));
    }

    setMassRunning(false);
    addLog("Mass comment Instagram Reels selesai");
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

      setAutomationStatus(data.message || "Automation OK");
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
  }

  async function handleRunForDevice(serial) {
    addLog("Manual run → " + serial);

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

  // ============================
  // UI COLORS
  // ============================
  const shellBg = "#020617";
  const cardBg = "#020617";
  const cardBorder = "#1f2937";

  const users = [
    { username: "admin", password: "password" },
    { username: "Alfi", password: "alfi123!" },
    { username: "Ardi", password: "Ardi123!" },
    { username: "Ilham", password: "Ilham123!" },
    { username: "Jata", password: "Jata123!" },
  ];

  const handleLogin = (e) => {
    e.preventDefault();

    console.log("DEBUG: Username -", username);
    console.log("DEBUG: Password -", password);

    // Validasi login dengan daftar pengguna
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      console.log("DEBUG: Login berhasil untuk user -", user.username);
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      console.log("DEBUG: Login gagal. Username atau password salah.");
      setLoginError("Username atau password salah");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
    setLoginError("");
    console.log("DEBUG: User logged out");
  };

  if (!isLoggedIn) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#0f172a",
          color: "#f9fafb",
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            background: "#1e293b",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            width: "300px",
          }}
        >
          <h2 style={{ marginBottom: "16px", textAlign: "center" }}>Login</h2>

          <label style={{ display: "block", marginBottom: "8px" }}>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "4px",
                borderRadius: "8px",
                border: "1px solid #374151",
                background: "#0f172a",
                color: "#f9fafb",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "16px" }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "4px",
                borderRadius: "8px",
                border: "1px solid #374151",
                background: "#0f172a",
                color: "#f9fafb",
              }}
            />
          </label>

          {loginError && (
            <p style={{ color: "#f87171", marginBottom: "16px" }}>{loginError}</p>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              background: "#22c55e",
              color: "#022c22",
              fontWeight: "bold",
              border: "none",
            }}
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  async function handleEnableTcpIpAll() {
    setTcpipLoading(true);
    setTcpipStatus("");

    try {
      const res = await fetch("/api/auto-connect", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setTcpipStatus(data.message);
      addLog("TCP/IP enabled for all devices");
      addLog(data.output);

      // Refresh device list
      setTimeout(() => handleScanDevices(), 3000);
    } catch (err) {
      setTcpipStatus("Error: " + err.message);
      addLog("TCP/IP error: " + err.message);
    }

    setTcpipLoading(false);
  }

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
      {/* LOGOUT BUTTON */}
      <button
        onClick={handleLogout}
        style={{
          position: "fixed", // Memastikan tombol tetap terlihat
          top: "16px",
          right: "16px",
          padding: "10px 20px",
          borderRadius: "8px",
          background: "#ef4444",
          color: "#fff",
          fontWeight: "bold",
          border: "none",
          cursor: "pointer",
          zIndex: 9999, // Z-index tinggi untuk memastikan tombol di atas elemen lain
        }}
      >
        Logout
      </button>
      <script>
        {console.log("DEBUG: Tombol logout dirender")}
      </script>

      {/* SIDEBAR */}
      <Sidebar active={activeSection} onChange={setActiveSection} />

      {/* QR MODAL */}
      {showPairQR && (
        <PairingQR
          pairIpPort={pairIpPort}
          pairCode={pairCode}
          onClose={() => setShowPairQR(false)}
        />
      )}

      {/* MAIN CONTENT */}
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
              OPS AUTOMATION SOSIAL MEDIA
            </div>
            <div style={{ fontSize: "13px", opacity: 0.7 }}>
              Monitoring, pairing, automation untuk banyak device.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Bacaan ADB Daemon dihapus */}
          </div>
        </div>

        {/* ======================= DEVICES LIST */}
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

            {/* SELECT ALL */}
            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button
                onClick={() =>
                  setSelectedDevices(devices.map((d) => d.serial))
                }
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "#00fca8",
                  color: "#002a1f",
                  fontWeight: 700,
                }}
              >
                Select All
              </button>

              <button
                onClick={() => setSelectedDevices([])}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "#f87171",
                  color: "#001210",
                  fontWeight: 700,
                }}
              >
                Clear
              </button>
            </div>

            <button
              onClick={handleEnableTcpIpAll}
              disabled={tcpipLoading}
              style={{
                marginTop: 10,
                padding: "7px 14px",
                borderRadius: 999,
                background: "#22c55e",
                color: "#022c22",
                fontWeight: 600,
              }}
            >
              {tcpipLoading ? "Enabling TCP/IP..." : "Enable TCP/IP (All Devices)"}
            </button>

            {tcpipStatus && (
              <p style={{ marginTop: 10, opacity: 0.9 }}>{tcpipStatus}</p>
            )}

            {/* DEVICE LIST */}
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
                      alignItems: "center",
                    }}
                  >
                    {/* Checkbox + Info */}
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={selectedDevices.includes(d.serial)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDevices((p) => [...p, d.serial]);
                          } else {
                            setSelectedDevices((p) =>
                              p.filter((x) => x !== d.serial)
                            );
                          }
                        }}
                      />

                      <div>
                        <div style={{ fontWeight: 600 }}>{d.serial}</div>
                        <div>
                          Status:
                          <span style={{ color: "#22c55e" }}> {d.status}</span>
                        </div>
                      </div>
                    </div>

                    <button
                          onClick={() => handleDisconnect(d.serial)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 999,
                            background: "#ef4444",
                            color: "white",
                            fontWeight: 700,
                          }}
                        >
                          Disconnect
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

            <label style={{ marginTop: 12 }}>
              Link Video TikTok
              <input
                value={tiktokUrl}
                onChange={(e) => setTikTokUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@user/video/xxxx"
                style={{
                  width: "100%",
                  padding: 10,
                  background: shellBg,
                  borderRadius: 10,
                  border: "1px solid #374151",
                  color: "white",
                  marginTop: 5,
                }}
              />
            </label>

            <label style={{ marginTop: 12 }}>
              Komentar
              <input
                value={tiktokComment}
                onChange={(e) => setTikTokComment(e.target.value)}
                placeholder="Komentar..."
                style={{
                  width: "100%",
                  padding: 10,
                  background: shellBg,
                  borderRadius: 10,
                  border: "1px solid #374151",
                  color: "white",
                  marginTop: 5,
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

            {/* MASS COMMENT */}
            <button
              onClick={massSendTikTok}
              disabled={massRunning}
              style={{
                marginTop: 14,
                padding: "10px",
                width: "100%",
                background: "#1d4ed8",
                borderRadius: 999,
                fontWeight: 700,
                color: "white",
              }}
            >
              {massRunning ? "Sending to all devices..." : "Mass Comment TikTok"}
            </button>

            {/* Progress Bar */}
            {massRunning && (
              <div
                style={{
                  marginTop: 10,
                  width: "100%",
                  height: "10px",
                  background: "#1e293b",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${massProgress}%`,
                    height: "100%",
                    background: "#00fca8",
                    transition: "0.25s",
                  }}
                />
              </div>
            )}
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

            <label style={{ marginTop: 12 }}>
              Link Post IG
              <input
                value={igUrl}
                onChange={(e) => setIgUrl(e.target.value)}
                placeholder="https://instagram.com/p/xxxx"
                style={{
                  width: "100%",
                  padding: 10,
                  background: shellBg,
                  borderRadius: 10,
                  border: "1px solid #374151",
                  color: "white",
                  marginTop: 5,
                }}
              />
            </label>

            <label style={{ marginTop: 12 }}>
              Komentar
              <input
                value={igComment}
                onChange={(e) => setIgComment(e.target.value)}
                placeholder="Komentar IG..."
                style={{
                  width: "100%",
                  padding: 10,
                  background: shellBg,
                  borderRadius: 10,
                  border: "1px solid #374151",
                  color: "white",
                  marginTop: 5,
                }}
              />
            </label>

            <button
              onClick={() => sendInstagramComment("post")}
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

            {/* MASS COMMENT IG */}
            <button
              onClick={() => massSendInstagram("post")}
              disabled={massRunning}
              style={{
                marginTop: 14,
                padding: "10px",
                width: "100%",
                background: "#1d4ed8",
                borderRadius: 999,
                fontWeight: 700,
                color: "white",
              }}
            >
              {massRunning ? "Sending to all devices..." : "Mass Comment Instagram"}
            </button>

            {massRunning && (
              <div
                style={{
                  marginTop: 10,
                  width: "100%",
                  height: "10px",
                  background: "#1e293b",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${massProgress}%`,
                    height: "100%",
                    background: "#00fca8",
                    transition: "0.25s",
                  }}
                />
              </div>
            )}
          </section>
        )}

        {/* ======================= INSTAGRAM POST */}
        {activeSection === "instagram-post" && (
          <section
            style={{
              background: cardBg,
              padding: 18,
              borderRadius: 16,
              border: `1px solid ${cardBorder}`,
            }}
          >
            <h3>📸 Auto Comment Instagram Post</h3>

            <label style={{ marginTop: 12, display: "block" }}>
              Link Post Instagram
              <input
                value={igPostUrl}
                onChange={(e) => setIgPostUrl(e.target.value)}
                placeholder="https://instagram.com/p/xxxx"
                style={{
                  width: "100%",
                  padding: 10,
                  background: shellBg,
                  borderRadius: 10,
                  border: "1px solid #374151",
                  color: "white",
                  marginTop: 5,
                }}
              />
            </label>

            <label style={{ marginTop: 12, display: "block" }}>
              Komentar
              <input
                value={igPostComment}
                onChange={(e) => setIgPostComment(e.target.value)}
                placeholder="Tulis komentar untuk Instagram Post..."
                style={{
                  width: "100%",
                  padding: 10,
                  background: shellBg,
                  borderRadius: 10,
                  border: "1px solid #374151",
                  color: "white",
                  marginTop: 5,
                }}
              />
            </label>

            <button
              onClick={() => sendInstagramPostComment()}
              disabled={igPostLoading}
              style={{
                marginTop: 14,
                padding: "10px 20px",
                background: igPostLoading ? "#4b5563" : "#00fca8",
                borderRadius: 999,
                fontWeight: 700,
                color: "#00150a",
                width: "100%",
                cursor: igPostLoading ? "not-allowed" : "pointer",
                opacity: igPostLoading ? 0.7 : 1,
                transition: "all 0.3s ease",
              }}
            >
              {igPostLoading ? "⏳ Mengirim..." : "✅ Kirim Komentar Instagram Post"}
            </button>

            <button
              onClick={() => massSendInstagramPost()}
              disabled={massRunning}
              style={{
                marginTop: 14,
                padding: "10px 20px",
                width: "100%",
                background: "#1d4ed8",
                borderRadius: 999,
                fontWeight: 700,
                color: "white",
              }}
            >
              {massRunning ? "Mengirim ke semua device..." : "Mass Comment Instagram Post"}
            </button>

            {massRunning && (
              <div
                style={{
                  marginTop: 10,
                  width: "100%",
                  height: "10px",
                  background: "#1e293b",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${massProgress}%`,
                    height: "100%",
                    background: "#00fca8",
                    transition: "0.25s",
                  }}
                />
              </div>
            )}
          </section>
        )}

        {/* ======================= INSTAGRAM REELS */}
        {activeSection === "instagram-reels" && (
          <section
            style={{
              background: cardBg,
              padding: 18,
              borderRadius: 16,
              border: `1px solid ${cardBorder}`,
            }}
          >
            <h3>🎬 Auto Comment Instagram Reels</h3>

            <label style={{ marginTop: 12, display: "block" }}>
              Link Instagram Reels
              <input
                value={igReelsUrl}
                onChange={(e) => setIgReelsUrl(e.target.value)}
                placeholder="https://instagram.com/reel/xxxx"
                style={{
                  width: "100%",
                  padding: 10,
                  background: shellBg,
                  borderRadius: 10,
                  border: "1px solid #374151",
                  color: "white",
                  marginTop: 5,
                }}
              />
            </label>

            <label style={{ marginTop: 12, display: "block" }}>
              Komentar
              <input
                value={igReelsComment}
                onChange={(e) => setIgReelsComment(e.target.value)}
                placeholder="Tulis komentar untuk Instagram Reels..."
                style={{
                  width: "100%",
                  padding: 10,
                  background: shellBg,
                  borderRadius: 10,
                  border: "1px solid #374151",
                  color: "white",
                  marginTop: 5,
                }}
              />
            </label>

            <button
              onClick={() => sendInstagramReelsComment()}
              disabled={igReelsLoading}
              style={{
                marginTop: 14,
                padding: "10px 20px",
                background: igReelsLoading ? "#4b5563" : "#00fca8",
                borderRadius: 999,
                fontWeight: 700,
                color: "#00150a",
                width: "100%",
                cursor: igReelsLoading ? "not-allowed" : "pointer",
                opacity: igReelsLoading ? 0.7 : 1,
                transition: "all 0.3s ease",
              }}
            >
              {igReelsLoading ? "⏳ Mengirim..." : "✅ Kirim Komentar Instagram Reels"}
            </button>

            <button
              onClick={() => massSendInstagramReels()}
              disabled={massRunning}
              style={{
                marginTop: 14,
                padding: "10px 20px",
                width: "100%",
                background: "#1d4ed8",
                borderRadius: 999,
                fontWeight: 700,
                color: "white",
              }}
            >
              {massRunning ? "Mengirim ke semua device..." : "Mass Comment Instagram Reels"}
            </button>

            {massRunning && (
              <div
                style={{
                  marginTop: 10,
                  width: "100%",
                  height: "10px",
                  background: "#1e293b",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${massProgress}%`,
                    height: "100%",
                    background: "#00fca8",
                    transition: "0.25s",
                  }}
                />
              </div>
            )}
          </section>
        )}

        {/* ======================= TIKTOK VIDEO */}
        {activeSection === "tiktok-video" && (
          <section
            style={{
              background: cardBg,
              padding: 18,
              borderRadius: 16,
              border: `1px solid ${cardBorder}`,
            }}
          >
            <h3>🎵 Auto Comment TikTok Video</h3>

            <label style={{ marginTop: 12, display: "block" }}>
              Link Video TikTok
              <input
                value={tiktokVideoUrl}
                onChange={(e) => setTikTokVideoUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@user/video/xxxx"
                style={{
                  width: "100%",
                  padding: 10,
                  background: shellBg,
                  borderRadius: 10,
                  border: "1px solid #374151",
                  color: "white",
                  marginTop: 5,
                }}
              />
            </label>

            <label style={{ marginTop: 12, display: "block" }}>
              Komentar
              <input
                value={tiktokVideoComment}
                onChange={(e) => setTikTokVideoComment(e.target.value)}
                placeholder="Tulis komentar untuk TikTok Video..."
                style={{
                  width: "100%",
                  padding: 10,
                  background: shellBg,
                  borderRadius: 10,
                  border: "1px solid #374151",
                  color: "white",
                  marginTop: 5,
                }}
              />
            </label>

            <button
              onClick={sendTikTokVideoComment}
              disabled={tiktokVideoLoading}
              style={{
                marginTop: 14,
                padding: "10px 20px",
                background: tiktokVideoLoading ? "#4b5563" : "#00fca8",
                borderRadius: 999,
                fontWeight: 700,
                color: "#00150a",
                width: "100%",
                cursor: tiktokVideoLoading ? "not-allowed" : "pointer",
                opacity: tiktokVideoLoading ? 0.7 : 1,
                transition: "all 0.3s ease",
                transform: tiktokVideoLoading ? "scale(0.98)" : "scale(1)",
              }}
            >
              {tiktokVideoLoading ? "⏳ Mengirim..." : "✅ Kirim Komentar TikTok Video"}
            </button>

            <button
              onClick={massSendTikTokVideo}
              disabled={massRunning}
              style={{
                marginTop: 14,
                padding: "10px 20px",
                width: "100%",
                background: "#1d4ed8",
                borderRadius: 999,
                fontWeight: 700,
                color: "white",
              }}
            >
              {massRunning ? "Mengirim ke semua device..." : "Mass Comment TikTok Video"}
            </button>

            {massRunning && (
              <div
                style={{
                  marginTop: 10,
                  width: "100%",
                  height: "10px",
                  background: "#1e293b",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${massProgress}%`,
                    height: "100%",
                    background: "#00fca8",
                    transition: "0.25s",
                  }}
                />
              </div>
            )}
          </section>
        )}

        {/* ======================= TIKTOK POST */}
        {activeSection === "tiktok-post" && (
          <section
            style={{
              background: cardBg,
              padding: 18,
              borderRadius: 16,
              border: `1px solid ${cardBorder}`,
            }}
          >
            <h3>📱 Auto Comment TikTok Post</h3>

            <label style={{ marginTop: 12, display: "block" }}>
              Link TikTok Post
              <input
                value={tiktokPostUrl}
                onChange={(e) => setTiktokPostUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@user/photo/xxxx"
                style={{
                  width: "100%",
                  padding: 10,
                  background: shellBg,
                  borderRadius: 10,
                  border: "1px solid #374151",
                  color: "white",
                  marginTop: 5,
                }}
              />
            </label>

            <label style={{ marginTop: 12, display: "block" }}>
              Komentar
              <input
                value={tiktokPostComment}
                onChange={(e) => setTikTokPostComment(e.target.value)}
                placeholder="Tulis komentar untuk TikTok Post..."
                style={{
                  width: "100%",
                  padding: 10,
                  background: shellBg,
                  borderRadius: 10,
                  border: "1px solid #374151",
                  color: "white",
                  marginTop: 5,
                }}
              />
            </label>

            <button
              onClick={sendTikTokPostComment}
              disabled={tiktokPostLoading}
              style={{
                marginTop: 14,
                padding: "10px 20px",
                background: tiktokPostLoading ? "#4b5563" : "#00fca8",
                borderRadius: 999,
                fontWeight: 700,
                color: "#00150a",
                width: "100%",
                cursor: tiktokPostLoading ? "not-allowed" : "pointer",
                opacity: tiktokPostLoading ? 0.7 : 1,
                transition: "all 0.3s ease",
              }}
            >
              {tiktokPostLoading ? "⏳ Mengirim..." : "✅ Kirim Komentar TikTok Post"}
            </button>

            <button
              onClick={massSendTikTokPost}
              disabled={massRunning}
              style={{
                marginTop: 14,
                padding: "10px 20px",
                width: "100%",
                background: "#1d4ed8",
                borderRadius: 999,
                fontWeight: 700,
                color: "white",
              }}
            >
              {massRunning ? "Mengirim ke semua device..." : "Mass Comment TikTok Post"}
            </button>

            {massRunning && (
              <div
                style={{
                  marginTop: 10,
                  width: "100%",
                  height: "10px",
                  background: "#1e293b",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${massProgress}%`,
                    height: "100%",
                    background: "#00fca8",
                    transition: "0.25s",
                  }}
                />
              </div>
            )}
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
                  onChange={(e) =>
                    setAutomationIntervalSec(e.target.value)
                  }
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

              {automationStatus && (
                <p style={{ marginTop: 8 }}>{automationStatus}</p>
              )}
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