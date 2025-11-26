"use client";

import QRCode from "react-qr-code";

export default function PairingQR({ pairIpPort, pairCode, onClose }) {

  // QR FORMAT fix: tambah S:adb → wajib untuk Pixel
  const qrValue = `WIFI:T:ADB;S:adb;P:${pairCode};A:${pairIpPort};;`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000000cc",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999,
      }}
    >
      <div
        style={{
          padding: 20,
          background: "#0f172a",
          borderRadius: 16,
          boxShadow: "0 0 20px #00ff9d55",
          width: 300,
          textAlign: "center",
        }}
      >
        <h3 style={{ color: "#00fca8", marginBottom: 10 }}>QR Pairing</h3>

        <QRCode
          value={qrValue}
          size={220}
          style={{ background: "white", padding: 10, borderRadius: 10 }}
        />

        <p style={{ marginTop: 10, fontSize: 11, opacity: 0.6 }}>
          {qrValue}
        </p>

        <button
          onClick={onClose}
          style={{
            marginTop: 14,
            padding: "8px 16px",
            background: "#00fca8",
            color: "#00120b",
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
            width: "100%",
          }}
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
