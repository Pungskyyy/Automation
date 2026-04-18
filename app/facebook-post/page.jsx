"use client";
import { useState, useEffect } from "react";

export default function FacebookPostPage() {
  const [postUrl, setPostUrl] = useState("");
  const [comment, setComment] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      if (data.devices) {
        setDevices(data.devices);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDeviceToggle = (serial) => {
    setSelectedDevices((prev) =>
      prev.includes(serial)
        ? prev.filter((s) => s !== serial)
        : [...prev, serial]
    );
  };

  const addLog = (message) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!postUrl || !comment) {
      alert("Post URL dan Comment harus diisi!");
      return;
    }

    if (selectedDevices.length === 0) {
      alert("Pilih minimal 1 device!");
      return;
    }

    setLoading(true);
    setResult(null);
    setLogs([]);
    addLog("🚀 Starting Facebook comment automation...");

    try {
      addLog(`📘 Post URL: ${postUrl}`);
      addLog(`💬 Comment: "${comment}"`);
      addLog(`📱 Selected devices: ${selectedDevices.length}`);

      const response = await fetch("/api/fb-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postUrl,
          comment,
          serials: selectedDevices,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        addLog(`✅ Success: ${data.successCount}/${data.total} devices`);
        setResult(data);
        
        data.results.forEach((res) => {
          if (res.success) {
            addLog(`✅ ${res.serial}: Comment posted!`);
          } else {
            addLog(`❌ ${res.serial}: ${res.error}`);
          }
        });
      } else {
        addLog(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ Network error: ${error.message}`);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">📘</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Facebook Post Comment
              </h1>
              <p className="text-gray-600 mt-1">
                Auto comment on Facebook posts with human-like typing
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Comment Settings
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Facebook Post URL
                </label>
                <input
                  type="text"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="https://www.facebook.com/..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Paste full Facebook post URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Comment Text
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Keren banget! 🔥"
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Supports emoji & multiple lines
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Devices ({selectedDevices.length} selected)
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto border-2 border-gray-200 rounded-xl p-4">
                  {devices.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No devices connected</p>
                      <button
                        type="button"
                        onClick={fetchDevices}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Refresh Devices
                      </button>
                    </div>
                  ) : (
                    devices.map((device) => (
                      <label
                        key={device.serial}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDevices.includes(device.serial)}
                          onChange={() => handleDeviceToggle(device.serial)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {device.model || device.serial}
                          </p>
                          <p className="text-xs text-gray-500">{device.serial}</p>
                        </div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all transform hover:scale-105 ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "🚀 Send Comments"
                )}
              </button>
            </form>

            {result && (
              <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                  <span className="text-xl">✅</span>
                  <span>Automation Complete!</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Devices</p>
                    <p className="text-2xl font-bold text-gray-800">{result.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Success</p>
                    <p className="text-2xl font-bold text-green-600">
                      {result.successCount}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Activity Logs
            </h2>
            <div className="bg-gray-900 rounded-xl p-4 h-[600px] overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Logs will appear here...
                </p>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`mb-2 ${
                      log.includes("✅")
                        ? "text-green-400"
                        : log.includes("❌")
                        ? "text-red-400"
                        : log.includes("🚀")
                        ? "text-blue-400"
                        : "text-gray-300"
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🤖</span>
              <h3 className="font-bold text-gray-800">Human-Like Typing</h3>
            </div>
            <p className="text-sm text-gray-600">
              Random typing speed, typos, and natural pauses to avoid bot detection
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">⚡</span>
              <h3 className="font-bold text-gray-800">Multi-Device</h3>
            </div>
            <p className="text-sm text-gray-600">
              Comment from multiple devices simultaneously with smart delays
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🎯</span>
              <h3 className="font-bold text-gray-800">Smart Detection</h3>
            </div>
            <p className="text-sm text-gray-600">
              Automatically finds and clicks the right buttons with multiple fallback methods
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
