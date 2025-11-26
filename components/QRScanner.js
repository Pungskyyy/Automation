"use client";

import { Scanner } from "@yudiel/react-qr-scanner";

export default function QRScanner({ onDecoded, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 99999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <div
        style={{
          width: "90vw",
          maxWidth: "420px",
          background: "#0f172a",
          borderRadius: "14px",
          padding: "16px",
          textAlign: "center"
        }}
      >
        <h3 style={{ color: "#00fca8" }}>Scan QR Pairing</h3>

        <Scanner
          allowMultiple={false}
          scanDelay={300}
          constraints={{ facingMode: "environment" }}
          onScan={(result) => {
            if (!result) return;

            try {
              const parsed = JSON.parse(result);
              onDecoded(parsed);
            } catch {
              if (result.includes("|")) {
                const [pairIpPort, pairCode] = result.split("|");
                onDecoded({ pairIpPort, pairCode });
              }
            }
          }}
          onError={(err) => console.log("QR Error:", err)}
          styles={{
            container: { width: "100%", height: "330px" },
            video: {
              width: "100%",
              height: "100%",
              borderRadius: "10px",
              objectFit: "cover"
            }
          }}
        />

        <button
          onClick={onClose}
          style={{
            marginTop: "14px",
            padding: "10px 16px",
            width: "100%",
            background: "#00fca8",
            color: "#00120b",
            borderRadius: "8px",
            fontWeight: "700"
          }}
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
