"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <html>
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc", margin: 0 }}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>The app encountered an unexpected error. Please try refreshing.</p>
          <button
            onClick={reset}
            style={{ background: "#0891b2", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
