"use client";
import { useState } from "react";

export default function Sidebar({ active, onChange }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const menu = [
    { id: "devices", label: "Scan Devices", icon: "🖥️" },
    {
      id: "instagram",
      label: "Instagram",
      icon: "📸",
      submenus: [
        { id: "instagram-post", label: "Instagram Post" },
        { id: "instagram-reels", label: "Instagram Reels" },
      ],
    },
    {
      id: "tiktok",
      label: "TikTok",
      icon: "🎵",
      submenus: [
        { id: "tiktok-video", label: "TikTok Video" },
        { id: "tiktok-post", label: "TikTok Post" },
      ],
    },
  ];

  console.log("[Sidebar] isLoggedIn:", isLoggedIn);
  console.log("[Sidebar] Active Menu:", active);
  console.log("[Sidebar] Menu Items:", menu);

  const handleLogin = () => {
    setIsLoggedIn(true);
    onChange("devices");
  };

  const handleMenuClick = (id) => {
    onChange(id);
  };

  const handleSubmenuToggle = (id) => {
    setOpenMenu((prev) => (prev === id ? null : id));
  };

  return (
    <aside
      style={{
        width: "240px",
        height: "100vh",
        backgroundColor: "#1e293b",
        borderRadius: "20px",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
        padding: "26px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "22px",
        overflow: "auto",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: "10px", textAlign: "center" }}>
        <div style={{ fontSize: "22px", fontWeight: 700, color: "#f8fafc" }}>OPA AUTOMATION</div>
        <div style={{ opacity: 0.6, fontSize: "12px", color: "#cbd5e1" }}>
          Multi-Device Automation
        </div>
      </div>

      {/* Menu Items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {menu.map((m) => (
          <div key={m.id}>
            <div
              onClick={() => {
                if (m.submenus) {
                  handleSubmenuToggle(m.id);
                } else {
                  handleMenuClick(m.id);
                }
              }}
              style={{
                padding: "12px 16px",
                borderRadius: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "16px",
                fontWeight: 500,
                color: active === m.id ? "#1e293b" : "#e2e8f0",
                backgroundColor:
                  active === m.id ? "#38bdf8" : "transparent",
                boxShadow:
                  active === m.id
                    ? "0 4px 8px rgba(56, 189, 248, 0.3)"
                    : "none",
                transition: "all 0.3s ease",
                transform: "scale(1)",
              }}
              onMouseEnter={(e) => {
                if (active !== m.id) {
                  e.currentTarget.style.backgroundColor = "#334155";
                  e.currentTarget.style.transform = "scale(1.02)";
                }
              }}
              onMouseLeave={(e) => {
                if (active !== m.id) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              <span style={{ fontSize: "18px" }}>{m.icon}</span> {m.label}
            </div>
            {openMenu === m.id && m.submenus && (
              <div style={{ marginLeft: "20px", marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {m.submenus.map((submenu) => (
                  <div
                    key={submenu.id}
                    onClick={() => handleMenuClick(submenu.id)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "15px",
                      fontWeight: 400,
                      color: active === submenu.id ? "#38bdf8" : "#e2e8f0",
                      backgroundColor: active === submenu.id ? "#334155" : "transparent",
                      transition: "all 0.3s ease",
                      transform: "scale(1)",
                    }}
                    onMouseEnter={(e) => {
                      if (active !== submenu.id) {
                        e.currentTarget.style.backgroundColor = "#1e293b";
                        e.currentTarget.style.transform = "scale(1.02)";
                        e.currentTarget.style.paddingLeft = "18px";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (active !== submenu.id) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.paddingLeft = "14px";
                      }
                    }}
                  >
                    {submenu.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ marginTop: "auto", opacity: 0.6, fontSize: "11px", color: "#cbd5e1", textAlign: "center" }}>
        © 2025 ADB Neon Console
      </div>
    </aside>
  );
}
