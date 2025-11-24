import NeonCard from "./NeonCard";

export default function DevicesPanel({
  devices,
  filteredDevices,
  loadingDevices,
  deviceFilter,
  setDeviceFilter,
  handleScanDevices,
  devicesError,
  renderStatusBadge,
  handleRunForDevice,
}) {
  return (
    <NeonCard title="Connected Devices">
      <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
        <p style={{ opacity: 0.7, margin: 0 }}>Device yang terdeteksi via ADB.</p>

        <button
          onClick={handleScanDevices}
          disabled={loadingDevices}
          style={{
            padding: "7px 14px",
            borderRadius: "12px",
            border: "1px solid var(--neon-green)",
            background: loadingDevices ? "#00ff9d33" : "var(--neon-green)",
            color: "#00150c",
            fontWeight: 700,
            cursor: "pointer",
            textShadow: "0 0 3px #fff",
          }}
        >
          {loadingDevices ? "Scanning…" : "Scan Devices"}
        </button>
      </div>

      {/* search */}
      <div style={{ marginBottom: "8px", display: "flex", gap: "10px" }}>
        <input
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
          placeholder="Filter hostname / IP / status…"
          style={{
            flexGrow: 1,
            padding: "8px 10px",
            borderRadius: "999px",
            border: "1px solid #0c221a",
            background: "#000",
            color: "var(--neon-green)",
          }}
        />
        <span style={{ opacity: 0.6, fontSize: "11px", whiteSpace: "nowrap" }}>
          {filteredDevices.length}/{devices.length}
        </span>
      </div>

      {devicesError && (
        <p style={{ color: "#ff6e6e", fontSize: "12px" }}>{devicesError}</p>
      )}

      <div
        style={{
          background: "#000",
          border: "1px solid #0c221a",
          padding: "10px",
          borderRadius: "10px",
          maxHeight: "220px",
          overflowY: "auto",
        }}
      >
        {filteredDevices.length === 0 && (
          <p style={{ opacity: 0.5, fontSize: "12px" }}>
            Tidak ada device. Coba Scan ulang.
          </p>
        )}

        {filteredDevices.map((d) => (
          <div
            key={d.serial}
            style={{
              padding: "10px 0",
              borderBottom: "1px solid #0c221a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{d.serial}</div>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                {renderStatusBadge(d.status)}
                <span style={{ opacity: 0.4, fontSize: "12px" }}>
                  raw: {d.status}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleRunForDevice(d.serial)}
              style={{
                padding: "6px 12px",
                borderRadius: "999px",
                background: "var(--neon-green)",
                border: "none",
                color: "#02150c",
                cursor: "pointer",
                fontWeight: 700,
                boxShadow: "0 0 6px #00ff9dbb",
              }}
            >
              Run script
            </button>
          </div>
        ))}
      </div>
    </NeonCard>
  );
}
