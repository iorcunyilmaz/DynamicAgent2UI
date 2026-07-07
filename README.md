# OpenUI Native Dialog Builder & AI Agent Canvas 🚀

An advanced Model Context Protocol (MCP) server and LLM agent skill that allows AI agents to dynamically generate, render, and interact with native-looking desktop dialogs and forms. 

By bridging an AI agent workspace with an Electron-powered frameless desktop window, agents can now break out of the chat box and interact with users directly through their operating system's native UI paradigm.

---

## 🏗️ Architecture Overview

The system establishes a real-time bridge between an AI Agent, a localized Model Context Protocol server, a Next.js API layer, and an Electron frameless window:

```mermaid
graph TD
    Agent[AI Agent] <-->|MCP Protocol| MCPServer[MCP Server: mcp-server.js]
    MCPServer <-->|POST/GET /api/sync| NextJS[Next.js API & Routing]
    NextJS <-->|Poll /api/sync & BroadcastChannel| Electron[Electron Frameless Desktop Window]
    ControlPanel[Web Control Panel] -->|Local Storage & Broadcast| Electron
