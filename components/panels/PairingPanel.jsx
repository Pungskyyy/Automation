"use client";

import NeonCard from "./NeonCard";

export default function PairingPanel({
  pairIpPort,
  pairCode,
  deviceIpPort,
  pairLoading,
  pairStatus,
  setPairIpPort,
  setPairCode,
  setDeviceIpPort,
  handlePair
}) {
  return (
    <NeonCard title="Wireless Pairing">
      <p style={{ opacity: 0.7, marginTop: 0, marginBottom: "12px" }}>
        Gunakan IP:Port dan pairing code dari menu Wireless Debugging.
      </p>

      <form
        onSubmit={handlePair}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          fontSize: "13px"
        }}
      >
        <input
          placeholder="IP:Port"
          value={pairIpPort}
          onChange={(e) => setPairIpPort(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            border: "1px solid #0c221a",
            background: "#000",
            color: "var(--neon-green)"
          }}
        />

        <input
          placeholder="Pairing code"
          value={pairCode}
          onChange={(e) => setPairCode(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            border: "1px solid #0c221a",
            background: "#000",
            color: "var(--neon-green)"
          }}
        />

        <input
          placeholder="Device IP:Port (opsional)"
          value={deviceIpPort}
          onChange={(e) => setDeviceIpPort(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            border: "1px solid #0c221a",
            background: "#000",
            color: "var(--neon-green)"
          }}
        />

        <button
          type="submit"
          disabled={pairLoading}
          style={{
            padding: "9px 16px",
            borderRadius: "12px",
            border: "none",
            background: "var(--neon-green)",
            color: "#002417",
            fontWeight: 700,
            cursor: "pointer",
            marginTop: "6px",
            boxShadow: "0 0 8px #00ff9daa"
          }}
        >
          {pairLoading ? "Pairing..." : "Pair & Connect"}
        </button>
      </form>

      {pairStatus && (
        <p style={{ marginTop: "12px", opacity: 0.85 }}>{pairStatus}</p>
      )}
    </NeonCard>
  );
}
