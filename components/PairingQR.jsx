"use client";

export default function PairingQR({ qr, onClose }) {

  const containerStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  };

  const boxStyle = {
    background: "#0f172a",
    borderRadius: 16,
    padding: "24px 32px",
    border: "1px solid #1e293b",
    textAlign: "center",
    color: "white",
    minWidth: 280,
  };

  const closeBtn = {
    marginTop: 16,
    padding: "6px 16px",
    borderRadius: 999,
    background: "#ef4444",
    color: "white",
    fontWeight: 700,
  };

  return (
    <div style={containerStyle}>
      <div style={boxStyle}>
        <h3 style={{ marginBottom: 12 }}>Scan QR Pairing</h3>

        {qr ? (
          <img
            src={qr}
            style={{ width: 220, height: 220, background: "white", borderRadius: 8 }}
            alt="qr"
          />
        ) : (
          <p style={{ opacity: 0.7 }}>QR tidak tersedia</p>
        )}

        <button onClick={onClose} style={closeBtn}>
          Tutup
        </button>
      </div>
    </div>
  );
}
