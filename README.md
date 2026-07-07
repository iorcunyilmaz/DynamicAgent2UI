# DynamicAgent2UI 🖥️🤖

An **OS-Native Floating Dialog & Form UI Canvas** that exposes interactive desktop widgets to AI agents using the **Model Context Protocol (MCP)**. 

With **DynamicAgent2UI**, any MCP-compatible AI agent (such as Gemini Antigravity, Claude Desktop, or VS Code Cline) can render high-fidelity, native-looking dialogs and settings forms directly on the user's desktop screen, block execution, and retrieve the user's interaction (button clicks, form inputs) as the tool response.

---
## 🏗️ Architecture Overview

```mermaid
graph TD
    Agent[AI Agent] <-->|MCP Protocol| MCPServer[MCP Server: mcp-server.js]
    MCPServer <-->|POST/GET /api/sync| NextJS[Next.js API & Routing]
    NextJS <-->|Poll /api/sync & BroadcastChannel| Electron[Electron Frameless Desktop Window]
    ControlPanel[Web Control Panel] -->|Local Storage & Broadcast| Electron

## ✨ Features

- 🖥️ **OS-Native Styles**: Renders native-looking dialogs and forms matching **macOS**, **Windows 11 (Fluent)**, and **Android (Material 3)**.
- 📐 **Dynamic Window Resizing**: Utilizes `ResizeObserver` and Electron IPC to resize the frameless window to the exact dimensions of the dialog content (+ drop shadow padding), allowing clicks on transparent areas to pass through to background apps.
- 🕳️ **Opacity Correction**: Uses solid, opaque fills (`bg-white` & `bg-[#1e1e1e]`) preventing desktop wallpapers from bleeding through and keeping text/controls highly legible.
- 🎛️ **Draggable Regions**: Allows the user to click and drag the dialog background to position it anywhere on their screen, while keeping buttons and inputs interactive.
- 🔌 **Unified Self-Starting MCP**: The MCP server automatically checks port `3000` and launches the Next.js backend and Electron app in the background when the agent connects. Zero manual CLI commands required!

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router, Tailwind CSS, TypeScript, Zod)
- **Desktop Wrapper**: Electron (Frameless, Transparent, IPC, Node Integration)
- **Protocol**: Model Context Protocol (MCP JSON-RPC 2.0 over `stdio`)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (or pnpm/yarn)

### 2. Installation & Environment Configuration
Clone the repository, enter the directory, and install dependencies:
```bash
git clone https://github.com/your-username/DynamicAgent2UI.git
cd DynamicAgent2UI
npm install
```

Create a `.env` file in the root directory to configure the AI agent's chat interface (optional):
```env
# Optional: Setup a custom LLM endpoint (OpenAI compatible) for the built-in control panel chat
CUSTOM_LLM_BASE_URL=https://api.your-provider.com/v1
CUSTOM_LLM_API_KEY=your-api-key
CUSTOM_LLM_MODEL=your-model-name
```

---

## 🔌 Using with an MCP Client (e.g. Gemini, Claude Desktop, Cline)

To integrate **DynamicAgent2UI** with your agent, add it to your client's MCP configuration settings file (e.g., `claude_desktop_config.json` or `cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "DynamicAgent2UI": {
      "command": "node",
      "args": ["C:/Workspace/OpenUI/mcp-server.js"]
    }
  }
}
```

*Note: Replace the absolute path in `args` with your cloned repository path.*

Once configured and restarted, the agent will have access to the following tools:

### Tool: `show_dialog`
Displays a native OS dialog and blocks until a button is clicked.
- **`primaryButton`** (required): Text label (e.g. `"OK"`, `"Save"`).
- **`secondaryButton`** / **`cancelButton`** (optional): Alternative button labels.
- **`title`** / **`message`** (optional): Title and body description.
- **`icon`** (optional): `"info" | "warning" | "error" | "question" | "success"`.
- **`platform`** (optional): `"macos" | "windows" | "android"`. Defaults to auto-detecting the host OS.
- **`theme`** (optional): `"light" | "dark"`. Default is `"light"`.
- **`inputPlaceholder`** (optional): Adds a text input box.

### Tool: `show_form`
Displays a native multi-input form panel.
- **`title`** (required): Form header title.
- **`fields`** (required): Comma-separated labels and types, e.g. `"Username: text, Age: number, Role: select(Admin|User), Active: checkbox"`.
- **`submitButton`** (required): Button label.
- **`platform`** / **`theme`** (optional): OS style and color theme.

---

## 🏃 Running Manually (Optional)

If you wish to run the web interface or desktop window manually without the MCP server:

- Run the Next.js development server:
  ```bash
  npm run dev
  ```
- Run the Electron desktop window:
  ```bash
  npm run desktop
  ```
- Build for production:
  ```bash
  npm run build
  ```
