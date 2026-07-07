# DynamicAgent2UI 🖥️🤖

An **OS-Native Floating Dialog & Form UI Canvas** that exposes interactive desktop widgets to AI agents using the **Model Context Protocol (MCP)**. 

With **DynamicAgent2UI**, any MCP-compatible AI agent (such as Gemini Antigravity, Claude Desktop, or VS Code Cline) can render high-fidelity, native-looking dialogs and settings forms directly on the user's desktop screen, block execution, and retrieve the user's interaction (button clicks, form inputs) as the tool response.

---

## ✨ Features & Architecture Highlights

- 🖥️ **OS-Native Styles**: Renders native-looking dialogs and forms precisely matching **macOS**, **Windows 11 (Fluent)**, and **Android (Material 3)** visual guidelines.
- 📐 **Dynamic Window Resizing**: Utilizes a custom `ResizeObserver` container and Electron IPC to dynamically shrink or expand the frameless window to the exact content dimensions (+ drop shadow padding). This completely resolves the invisible background click-blocking issue, allowing clicks on transparent areas to pass through seamlessly to underlying OS applications.
- 🕳️ **Opacity & Bleed Correction**: Uses solid, opaque fills (`bg-white` & `bg-[#1e1e1e]`) for dialogue wrappers. This prevents dark desktop wallpapers from bleeding through transparent utility classes, ensuring cross-platform text and controls remain highly legible and crisp.
- 🎛️ **Draggable Regions**: Injects `-webkit-app-region: drag` styles natively onto the dialog backgrounds for floating multi-window environments. It keeps explicit interactive components (buttons, inputs, labels, textareas) isolated via `no-drag` exclusions to ensure perfect widget responsiveness while maintaining canvas flexibility.
- 🔌 **Unified Self-Starting MCP**: The standalone vanilla Node.js MCP server automatically monitors local port `3000`. If offline, it intelligently boots up the Next.js development server and Electron shell wrapper concurrently on agent connection — requiring zero manual CLI management.
- 🧩 **Zod Schema Deduplication Guard**: Built using robust factory abstractions (`makeDialogSchema()`) to prevent `Zod-to-JSON-Schema` compilation bugs from collapsing separate OS-specific dialog parameters into single `$defs` references, ensuring stable model tool validation.

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    Agent[AI Agent] <-->|MCP Protocol| MCPServer[MCP Server: mcp-server.js]
    MCPServer <-->|POST/GET /api/sync| NextJS[Next.js API & Routing]
    NextJS <-->|Poll /api/sync & BroadcastChannel| Electron[Electron Frameless Desktop Window]
    ControlPanel[Web Control Panel] -->|Local Storage & Broadcast| Electron
🛠️ Tech Stack
Frontend Framework: Next.js (App Router, Tailwind CSS, TypeScript, Zod Verification)

Desktop Container: Electron (Frameless, Transparent Canvas, IPC Channels, Node Integration)

Protocol Protocol: Model Context Protocol (MCP JSON-RPC 2.0 over standard stdio)

🚀 Getting Started
1. Prerequisites
Node.js (v18 or higher recommended)

npm (or pnpm/yarn)

2. Installation & Environment Configuration
Clone the repository, enter the project root directory, and install the necessary dependencies:
git clone [https://github.com/iorcunyilmaz/DynamicAgent2UI.git](https://github.com/iorcunyilmaz/DynamicAgent2UI.git)
cd DynamicAgent2UI
npm install
Create a .env file in the root directory to configure the AI agent's chat interface parameters (optional):
# Optional: Setup a custom LLM endpoint (OpenAI compatible) for the built-in control panel chat
CUSTOM_LLM_BASE_URL=[https://api.your-provider.com/v1](https://api.your-provider.com/v1)
CUSTOM_LLM_API_KEY=your-api-key
CUSTOM_LLM_MODEL=your-model-name
Note: Replace the absolute workspace path specified within the args array with your actual cloned local repository path.

Once configured and restarted, the active LLM agent will inherit execution control over the following specialized UI lifecycle tools:

Tool: show_dialog
Displays a native OS dialog overlay and blocks runtime pipeline execution until a responsive click action payload is transmitted back.

primaryButton (required): Text label (e.g. "OK", "Save").

secondaryButton / cancelButton (optional): Secondary alternative action button labels.

title / message (optional): Header title and body structural description markup.

icon (optional): "info" | "warning" | "error" | "question" | "success".

platform (optional): "macos" | "windows" | "android". Defaults to auto-detecting the host operating system platform.

theme (optional): "light" | "dark". Default is "light".

inputPlaceholder (optional): Appends an automated inline text validation box into the dialog flow.

Tool: show_form
Displays a structured native multi-input form layout panel tailored for gathering structured runtime variables.

title (required): Structural form header title.

fields (required): Comma-separated token declarations specifying fields and system types, e.g. "Username: text, Age: number, Role: select(Admin|User), Active: checkbox".

submitButton (required): Final submit confirmation button layout label.

platform / theme (optional): OS aesthetic engine parameters and color palette choices.

🏃 Running Manually (Optional)
If you wish to test, inspect, or run the underlying web client interface and localized desktop wrappers independently without attaching an active MCP server:
npm run dev
Run the Electron frameless desktop application layer:
npm run desktop
npm run build

Run the local Next.js development environment:
