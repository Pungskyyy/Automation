"use client";

import { useState } from "react";

export default function AutoTikTok() {
  const [videoUrl, setVideoUrl] = useState("");
  const [comment, setComment] = useState("");

  async function sendComment() {
    await fetch("/api/tiktok-comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment, videoUrl }),
    });
    alert("Comment Terkirim!");
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>🎵 Auto Comment TikTok</h2>

      <input
        placeholder="Link Video TikTok"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        style={inputStyle}
      />

      <textarea
        placeholder="Komentar"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={textareaStyle}
      />

      <button style={btnStyle} onClick={sendComment}>
        Kirim Comment
      </button>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 10,
  margin: "10px 0",
  background: "#0d1714",
  border: "1px solid #1f3b33",
  borderRadius: 10,
  color: "white",
};

const textareaStyle = {
  width: "100%",
  padding: 10,
  height: 100,
  margin: "10px 0",
  background: "#0d1714",
  border: "1px solid #1f3b33",
  borderRadius: 10,
  color: "white",
};

const btnStyle = {
  padding: "12px 20px",
  background: "#00fca8",
  color: "#001510",
  borderRadius: 10,
  fontWeight: 800,
  cursor: "pointer",
};
