"use client";

import { createContext, useContext, useState, useCallback } from "react";

const DeviceContext = createContext();

export function DeviceProvider({ children }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/devices");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch devices");
      }

      setDevices(data.devices || []);
    } catch (err) {
      console.error("[DeviceContext] Error fetching devices:", err);
      setError(err.message);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <DeviceContext.Provider value={{ devices, loading, error, fetchDevices }}>
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