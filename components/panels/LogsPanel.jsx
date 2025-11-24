"use client";

import NeonCard from "./NeonCard";

export default function LogsPanel({ logs }) {
  return (
    <NeonCard title="Logs">
      <p style={{ opacity: 0.7, marginTop: 0, marginBottom: "10px" }}>
        Riwayat scan, pairing, dan automation.
      </p>

      <div
        style={{
          background: "#000",
          border: "1px solid #0c221a",
          padding: "10px",
          borderRadius: "10px",
          maxHeight: "260px",
          overflowY: "auto",
          fontSize: "12px"
        }}
      >
        {logs.length === 0 && (
          <p style={{ opacity: 0.5 }}>Belum ada log.</p>
        )}

        {logs.map((l, i) => (
          <div
            key={i}
            style={{
              padding: "6px 0",
              borderBottom: "1px solid #0c221a",
              opacity: 0.85
            }}
          >
            {l}
          </div>
        ))}
      </div>
    </NeonCard>
  );
}
