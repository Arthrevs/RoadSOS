import { useState } from "react";
import { Lightbulb } from "lucide-react";

function CopyChip({ text }) {
  const [copied, setCopied] = useState(false);

  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <span
      onClick={handle}
      title="Click to copy"
      style={{
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        background: copied ? "rgba(29,98,211,0.25)" : "rgba(29,98,211,0.12)",
        border: `1px solid ${copied ? "rgba(29,98,211,0.7)" : "rgba(29,98,211,0.3)"}`,
        borderRadius: "5px",
        padding: "1px 8px",
        cursor: "pointer",
        color: copied ? "#a8c4f5" : "#7aabee",
        fontSize: "11.5px",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
        display: "inline-block",
        verticalAlign: "middle",
        lineHeight: "1.8",
      }}
    >
      {copied ? "✓ copied" : text}
    </span>
  );
}

export default function JudgeTip() {
  return (
    <div style={{
      background: "#1e293b",
      borderBottom: "2px solid rgba(29,98,211,0.5)",
      borderLeft: "4px solid #3b82f6",
      padding: "14px 18px",
      fontSize: "12.5px",
      lineHeight: "1.8",
      color: "#f1f5f9",
      fontWeight: 500,
      margin: "0",
      position: "relative",
      zIndex: 9999,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
    }}>
      <span style={{
        fontWeight: 600,
        color: "#60a5fa",
        marginRight: "6px",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        verticalAlign: "middle",
      }}>
        <Lightbulb size={15} color="#60a5fa" strokeWidth={2.5} />
        Hackathon Judge Tip:
      </span>
      To test full Gemini AI &amp; Google Places parallelism without
      supplying your own API keys, create a{" "}
      <CopyChip text="frontend/.env.local" />{" "}
      file with <code style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: "#e2e8f0", fontSize: "11.5px" }}>VITE_API_URL=</code>
      <div style={{ margin: "6px 0" }}>
        <CopyChip text='"https://roadsos-pl3k.onrender.com"' />
      </div>
      and restart this server.
    </div>
  );
}
