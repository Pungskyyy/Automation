"use client";

import NeonCard from "./NeonCard";

export default function AutomationPanel({
  automationLoading,
  handleAutomation,
  automationIntervalSec,
  setAutomationIntervalSec,
  automationRunning,
  handleStartScheduler,
  handleStopScheduler,
  automationStatus
}) {
  return (
    <NeonCard title="Automation">
      <p style={{ opacity: 0.7, marginTop: 0 }}>Eksekusi script untuk semua device.</p>

      <button
        onClick={handleAutomation}
        disabled={automationLoading}
        style={{
          padding: "10px 16px",
          borderRadius: "12px",
          border: "none",
          background: "#eab308",
          color: "#1f1f1f",
          fontWeight: 700,
          cursor: "pointer",
          marginTop: "12px",
          marginBottom: "14px",
          boxShadow: "0 0 10px #eab308aa"
        }}
      >
        {automationLoading ? "Running..." : "Run sekali sekarang"}
      </button>

      {/* scheduler box */}
      <div
        style={{
          padding: "14px",
          borderRadius: "10px",
          border: "1px dashed #0c221a",
          background: "#000",
          marginTop: "10px"
        }}
      >
        <p style={{ margin: 0, marginBottom: "10px", fontWeight: 600 }}>
          Scheduler
        </p>

        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
          <input
            type="number"
            min={5}
            value={automationIntervalSec}
            onChange={(e) => setAutomationIntervalSec(e.target.value)}
            style={{
              width: "80px",
              padding: "6px 10px",
              borderRadius: "8px",
              border: "1px solid #0c221a",
              background: "#000",
              color: "var(--neon-green)"
            }}
          />
          <span style={{ opacity: 0.75 }}>detik</span>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleStartScheduler}
            disabled={automationRunning}
            style={{
              flex: 1,
              padding: "7px 0",
              borderRadius: "10px",
              background: automationRunning ? "#0c221a" : "var(--neon-green)",
              color: automationRunning ? "#555" : "#002417",
              fontWeight: 700,
              cursor: automationRunning ? "not-allowed" : "pointer",
              boxShadow: "0 0 6px #00ff9daa"
            }}
          >
            Start
          </button>

          <button
            onClick={handleStopScheduler}
            disabled={!automationRunning}
            style={{
              flex: 1,
              padding: "7px 0",
              borderRadius: "10px",
              background: !automationRunning ? "#0c221a" : "#ff4d4d",
              color: "#1a0000",
              fontWeight: 700,
              cursor: !automationRunning ? "not-allowed" : "pointer",
              boxShadow: "0 0 6px #ff4d4daa"
            }}
          >
            Stop
          </button>
        </div>

        {automationStatus && (
          <p style={{ marginTop: "12px", opacity: 0.85 }}>{automationStatus}</p>
        )}
      </div>
    </NeonCard>
  );
}
