"use client";

import { useState, useEffect } from "react";

export default function HomePage() {
  // ...existing states... (sama seperti sebelumnya)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("home");
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [deviceLogs, setDeviceLogs] = useState({});
  const [deviceScreenshots, setDeviceScreenshots] = useState({});
  const [logoError, setLogoError] = useState({});
  const [expandedPlatforms, setExpandedPlatforms] = useState({});

  // NEW: Add Device Modal States
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [deviceIpAddress, setDeviceIpAddress] = useState("");
  const [devicePort, setDevicePort] = useState("5555");
  const [addingDevice, setAddingDevice] = useState(false);

  // NEW: TCP/IP Bulk Enable States
  const [showTcpipModal, setShowTcpipModal] = useState(false);
  const [tcpipPort, setTcpipPort] = useState("5555");
  const [enablingTcpip, setEnablingTcpip] = useState(false);

  // ✅ FIXED: Disable auto-login
  useEffect(() => {
    setLoading(false);
  }, []);

  // ✅ NEW: Real-time device refresh every 3 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial fetch
    fetchDevices();

    // Auto-refresh every 3 seconds
    const interval = setInterval(() => {
      fetchDevices();
    }, 3000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  async function fetchDevices() {
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      setDevices(data.devices || []);
      
      // Remove selected devices yang sudah tidak terhubung
      setSelectedDevices(prev => 
        prev.filter(serial => (data.devices || []).some(d => d.serial === serial))
      );
    } catch (err) {
      console.error("Error fetching devices:", err);
    } finally {
      setLoading(false);
    }
  }

  // ✅ NEW: Add Device via TCP/IP
  async function handleAddDevice() {
    if (!deviceIpAddress) {
      addLog("IP Address harus diisi", "error");
      return;
    }

    setAddingDevice(true);
    addLog(`Menghubungkan ke ${deviceIpAddress}:${devicePort}...`, "info");

    try {
      const res = await fetch("/api/adb/tcpip/connect-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: deviceIpAddress,
          port: devicePort
        })
      });

      const data = await res.json();

      if (data.success) {
        addLog(`✅ Device ${deviceIpAddress} berhasil terhubung!`, "success");
        setDeviceIpAddress("");
        setDevicePort("5555");
        setShowAddDeviceModal(false);
        fetchDevices(); // Refresh device list
      } else {
        addLog(`❌ Gagal: ${data.error}`, "error");
      }
    } catch (err) {
      addLog(`❌ Error: ${err.message}`, "error");
    } finally {
      setAddingDevice(false);
    }
  }

  // ✅ NEW: Enable TCP/IP on ALL selected devices
  async function handleEnableTcpipBulk() {
    if (selectedDevices.length === 0) {
      addLog("Pilih minimal 1 device untuk enable TCP/IP", "error");
      return;
    }

    setEnablingTcpip(true);
    addLog(`Mengaktifkan TCP/IP mode pada ${selectedDevices.length} device...`, "info");

    let successCount = 0;
    let failCount = 0;

    for (const serial of selectedDevices) {
      try {
        const res = await fetch("/api/adb/tcpip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serial,
            port: parseInt(tcpipPort)
          })
        });

        const data = await res.json();

        if (data.success) {
          addLog(`✅ ${serial}: TCP/IP enabled (port ${tcpipPort})`, "success");
          successCount++;
        } else {
          throw new Error(data.error);
        }
      } catch (err) {
        addLog(`❌ ${serial}: ${err.message}`, "error");
        failCount++;
      }

      // Delay antar device
      await new Promise(r => setTimeout(r, 500));
    }

    addLog(`Selesai! Success: ${successCount}, Failed: ${failCount}`, successCount > 0 ? "success" : "error");
    setShowTcpipModal(false);
    setEnablingTcpip(false);
  }

  // ... (rest of existing functions: handleLogin, addLog, toggleDevice, etc.)

  return (
    // ... (JSX sama seperti sebelumnya, tapi tambahkan modal dan button)
  );
}
