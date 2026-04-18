export default function NeonCard({ title, children }) {
    return (
      <section
        style={{
          backgroundColor: "var(--panel-bg)",
          borderRadius: "14px",
          border: "1px solid var(--panel-border)",
          padding: "18px 16px",
          boxShadow: "0 0 20px #00ff9d11 inset, 0 0 12px #00ff9d22",
        }}
      >
        {title && (
          <h3
            style={{
              marginTop: 0,
              marginBottom: "10px",
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--neon-green)",
              textShadow: "var(--glow-green)",
            }}
          >
            {title}
          </h3>
        )}
        {children}
      </section>
    );
  }
  