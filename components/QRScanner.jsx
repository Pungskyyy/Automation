"use client";

import { Scanner } from "@yudiel/react-qr-scanner";

export default function QRScanner({ onDecoded, onClose }) {
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
        }}
    >
        <h3 style={{ color: "#00fca8", marginBottom: "10px" }}>
        Scan QR Pairing
        </h3>

        <Scanner
        allowMultiple={false}
        onResult={(text) => {
            try {
            const parsed = JSON.parse(text);
            onDecoded(parsed);
            } catch (err) {
            console.log("QR decode error:", err);
            }
        }}
        onError={(err) => console.log("QR scanner error:", err)}
        style={{
            width: "280px",
            height: "280px",
            borderRadius: "10px",
            overflow: "hidden",
        }}
        />

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
            width: "100%",
        }}
        >
        Tutup
        </button>
    </div>
    </div>
);
}
