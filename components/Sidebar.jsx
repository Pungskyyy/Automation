"use client";

export default function Sidebar({ active, onChange }) {
  const menu = [
    { id: "devices", label: "Devices", icon: "🖥️" },
    { id: "pairing", label: "Wireless Pairing", icon: "📡" },
    { id: "automation", label: "Automation", icon: "⚡" },
    { id: "logs", label: "Logs", icon: "📜" },
  
    // Tambahan baru
    { id: "tiktok", label: "Auto Comment TikTok", icon: "🎵" },
    { id: "instagram", label: "Auto Comment Instagram", icon: "📸" },
  ];


  return (
    <aside
      style={{
        width: "240px",
        height: "100vh",
        backgroundColor: "#020d0a",
        borderRight: "1px solid #0c221a",
        boxShadow: "0 0 18px #00ff9d22 inset",
        padding: "26px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "22px",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: "10px" }}>
        <div
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--neon-green)",
            textShadow: "var(--glow-green)",
          }}
        >
          ADB STUDIO
        </div>
        <div style={{ opacity: 0.6, fontSize: "12px" }}>
          Multi-Device Automation
        </div>
      </div>

      {/* Menu Items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {menu.map((m) => (
          <div
            key={m.id}
            onClick={() => onChange(m.id)}
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              color: active === m.id ? "#00150d" : "#d7ffef",
              backgroundColor:
                active === m.id ? "var(--neon-green)" : "transparent",
              boxShadow:
                active === m.id
                  ? "0 0 12px #00ff9d99, 0 0 20px #00ff9d55"
                  : "none",
              transition: "0.2s",
            }}
          >
            <span>{m.icon}</span> {m.label}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ marginTop: "auto", opacity: 0.4, fontSize: "11px" }}>
        © 2025 ADB Neon Console
      </div>
    </aside>
  );
}
