"use client";

import React, { useState, useEffect, useRef } from "react";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";
import { Renderer } from "@openuidev/react-lang";
import { dialogLibrary } from "../../lib/dialogLibrary";

export default function FloatingPage() {
  const [code, setCode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Listen for live updates via BroadcastChannel
    const channel = new BroadcastChannel("dialog-channel");
    channel.onmessage = (event) => {
      if (event.data.type === "update-code") {
        setCode(event.data.code || null);
      }
    };

    // 2. Poll sync server (for Electron window preview)
    let lastCode = "";
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/sync");
        if (res.ok) {
          const data = await res.json();
          const serverCode = data.code || "";
          if (serverCode !== lastCode) {
            setCode(serverCode || null);
            lastCode = serverCode;
          }
        }
      } catch (err) {
        console.error("Failed to poll code from sync server:", err);
      }
    }, 500);

    return () => {
      channel.close();
      clearInterval(pollInterval);
    };
  }, []);

  // Monitor the dialog's dimensions and resize the Electron window accordingly
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;

        // Add 32px padding (16px on each side) to accommodate shadows
        const roundedWidth = Math.ceil(width) + 32;
        const roundedHeight = Math.ceil(height) + 32;

        if (typeof window !== "undefined" && (window as any).process && (window as any).process.type === "renderer") {
          try {
            const { ipcRenderer } = (window as any).require("electron");
            ipcRenderer.send("resize-window", { width: roundedWidth, height: roundedHeight });
          } catch (err) {
            console.error("Failed to send resize event to Electron:", err);
          }
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [code]);

  const handleAction = (event: any) => {
    console.log("Floating window action triggered:", event);
    
    // Broadcast action locally
    const channel = new BroadcastChannel("dialog-channel");
    channel.postMessage({ type: "trigger-action", event });
    channel.close();

    // Broadcast action to the server
    fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "trigger-action", event }),
    }).catch((err) => console.error("Failed to post action to sync server:", err));
  };

  if (!code) {
    return (
      <style dangerouslySetInnerHTML={{ __html: `
        html, body {
          background: transparent !important;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
      ` }} />
    );
  }

  return (
    <div className="inline-block bg-transparent select-none overflow-visible p-4">
      <style dangerouslySetInnerHTML={{ __html: `
        html, body {
          background: transparent !important;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        .draggable-region {
          -webkit-app-region: drag;
        }
        .draggable-region button,
        .draggable-region input,
        .draggable-region textarea,
        .draggable-region select,
        .draggable-region a,
        .draggable-region svg,
        .draggable-region label {
          -webkit-app-region: no-drag;
        }
      ` }} />
      <div ref={containerRef} className="inline-block relative overflow-visible draggable-region">
        <Renderer
          response={code}
          library={dialogLibrary}
          isStreaming={false}
          onAction={handleAction}
        />
      </div>
    </div>
  );
}
