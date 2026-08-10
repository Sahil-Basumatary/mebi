"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          color: "#ffffff",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "2rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "32rem",
            border: "1px solid #262626",
            background: "#0a0a0a",
            padding: "2rem",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#8f8f8f",
            }}
          >
            Error
          </p>
          <h1
            style={{
              margin: "0.75rem 0 0",
              fontFamily: "ui-serif, Georgia, serif",
              fontSize: "2rem",
              fontWeight: 300,
            }}
          >
            Something broke.
          </h1>
          <p style={{ margin: "1rem 0 0", color: "#b3b3b3", lineHeight: 1.5 }}>
            The app failed before it could load. Try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              height: "2.5rem",
              padding: "0 1.25rem",
              border: 0,
              background: "#ffffff",
              color: "#000000",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
