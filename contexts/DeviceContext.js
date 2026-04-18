"use client";

import { createContext, useContext, useState, useEffect } from "react";

const DeviceContext = createContext();

export function DeviceProvider({ children }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastFetch, setLastFetch] = useState(null);

  const fetchDevices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/adb/devices");
      const data = await res.json();
      if (data.devices) {
        setDevices(data.devices);
        setLastFetch(Date.now());
        console.log("✅ Devices updated:", data.devices.length);
      } else {
        setDevices([]);
      }
    } catch (err) {
      console.error("❌ Error fetching devices:", err);
      setError(err.message);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount if logged in
  useEffect(() => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (loggedInUser) {
      fetchDevices();
    }
  }, []);

  // ❌ MATIKAN AUTO-REFRESH DULU (comment out)
  // useEffect(() => {
  //   const loggedInUser = localStorage.getItem("loggedInUser");
  //   if (!loggedInUser) return;

  //   const interval = setInterval(() => {
  //     console.log("🔄 Auto-refreshing devices...");
  //     fetchDevices();
  //   }, 30000);

  //   return () => clearInterval(interval);
  // }, []);

  return (
    <DeviceContext.Provider value={{ devices, loading, error, fetchDevices, lastFetch }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevices() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevices must be used within DeviceProvider");
  }
  return context;
}