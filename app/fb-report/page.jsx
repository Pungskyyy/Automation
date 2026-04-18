"use client";
import { useState, useEffect } from "react";

export default function FacebookReportPage() {
  const [reportType, setReportType] = useState("post"); // post or profile
  const [targetUrl, setTargetUrl] = useState("");
  const [reportReason, setReportReason] = useState("spam");
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);

  const reportReasons = [
    { value: "spam", label: "🚫 Spam" },
    { value: "hate_speech", label: "😡 Hate Speech" },
    { value: "violence", label: "⚠️ Violence" },
    { value: "harassment", label: "😢 Harassment" },
    { value: "false_information", label: "❌ False Information" },
    { value: "nudity", label: "🔞 Nudity or Sexual Activity" },
    { value: "scam", label: "💰 Scam or Fraud" },
    { value: "intellectual_property", label: "©️ Intellectual Property" },
  ];

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
    
    if (!targetUrl) {
      alert("Target URL harus diisi!");
      return;
    }

    if (selectedDevices.length === 0) {
      alert("Pilih minimal 1 device!");
      return;
    }

    setLoading(true);
    setResult(null);
    setLogs([]);
    addLog("🚀 Starting Facebook report automation...");

    try {
      addLog(`🎯 Target: ${targetUrl}`);
      addLog(`📋 Reason: ${reportReasons.find(r => r.value === reportReason)?.label}`);
      addLog(`📱 Selected devices: ${selectedDevices.length}`);

      let successCount = 0;
      const results = [];

      for (const serial of selectedDevices) {
        addLog(`[${serial}] Processing...`);
        
        const response = await fetch("/api/fb-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUrl,
            reportReason,
            reportType,
            serial,
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          addLog(`✅ [${serial}] Report submitted successfully!`);
          successCount++;
          results.push({ serial, success: true });
        } else {
          addLog(`❌ [${serial}] Error: ${data.error}`);
          results.push({ serial, success: false, error: data.error });
        }

        // Delay between devices
        if (selectedDevices.indexOf(serial) < selectedDevices.length - 1) {
          addLog(`⏳ Waiting 5 seconds before next device...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      addLog(`\n📊 Summary: ${successCount}/${selectedDevices.length} reports submitted`);
      setResult({ total: selectedDevices.length, successCount, results });

    } catch (error) {
      addLog(`❌ Network error: ${error.message}`);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🚨</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Facebook Report
              </h1>
              <p className="text-gray-600 mt-1">
                Auto report Facebook posts, stories, or profiles
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Report Settings
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Report Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setReportType("post")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      reportType === "post"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl block mb-2">📄</span>
                    <span className="font-semibold">Post/Story</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType("profile")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      reportType === "profile"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl block mb-2">👤</span>
                    <span className="font-semibold">Profile</span>
                  </button>
                </div>
              </div>

              {/* Target URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target URL
                </label>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder={
                    reportType === "post"
                      ? "https://www.facebook.com/story.php?..."
                      : "https://www.facebook.com/username"
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  {reportType === "post"
                    ? "Paste Facebook post/story URL"
                    : "Paste Facebook profile URL"}
                </p>
              </div>

              {/* Report Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Report Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                >
                  {reportReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Choose the most appropriate reason
                </p>
              </div>

              {/* Device Selection */}
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
                        className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
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
                          className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all transform hover:scale-105 ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl"
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
                  "🚨 Submit Reports"
                )}
              </button>
            </form>

            {/* Result Summary */}
            {result && (
              <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                  <span className="text-xl">✅</span>
                  <span>Reports Submitted!</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Devices</p>
                    <p className="text-2xl font-bold text-gray-800">{result.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Success</p>
                    <p className="text-2xl font-bold text-red-600">
                      {result.successCount}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Logs */}
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

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🤖</span>
              <h3 className="font-bold text-gray-800">Automated</h3>
            </div>
            <p className="text-sm text-gray-600">
              Automatically navigate and submit reports with human-like behavior
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">⚡</span>
              <h3 className="font-bold text-gray-800">Multi-Device</h3>
            </div>
            <p className="text-sm text-gray-600">
              Report from multiple devices simultaneously with smart delays
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🛡️</span>
              <h3 className="font-bold text-gray-800">Safe & Ethical</h3>
            </div>
            <p className="text-sm text-gray-600">
              Use responsibly to report genuine violations of community standards
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
