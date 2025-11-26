"use client";

import QRCode from "react-qr-code";

export default function PairingQR({ pairIpPort, pairCode, onClose }) {
  const qrValue = JSON.stringify({
    pairIpPort,
    pairCode
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000000cc",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999
      }}
    >
      <div
        style={{
          padding: "20px",
          background: "#0f172a",
          borderRadius: "16px",
          boxShadow: "0 0 20px #00ff9d55",
          textAlign: "center",
          width: "300px"
        }}
      >
        <h3 style={{ color: "#00fca8", marginBottom: "12px" }}>
          QR Pairing Device
        </h3>

        <QRCode
          value={qrValue}
          size={220}
          style={{ borderRadius: "10px", background: "#fff", padding: "8px" }}
        />

        <p style={{ marginTop: "12px", opacity: 0.8, fontSize: "12px" }}>
          Scan dari Android untuk wireless pairing.
        </p>

        <button
          onClick={onClose}
          style={{
            marginTop: "14px",
            padding: "8px 16px",
            background: "#00fca8",
            color: "#00120b",
            borderRadius: "8px",
            fontWeight: "700",
            cursor: "pointer",
            width: "100%"
          }}
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
