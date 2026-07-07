const readline = require("readline");
const { spawn } = require("child_process");
const net = require("net");

// Configuration
const nextPort = 3000;
const workspaceDir = "C:/Workspace/OpenUI";

// Auto-start background services if not running
ensureBackendRunning();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on("line", async (line) => {
  if (!line.trim()) return;
  try {
    const request = JSON.parse(line);
    await handleRequest(request);
  } catch (err) {
    sendError(null, -32700, "Parse error: " + err.message);
  }
});

function isPortOpen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(true); // Port is in use (server is running)
      } else {
        resolve(false);
      }
    });
    server.once("listening", () => {
      server.close();
      resolve(false); // Port is free (server is not running)
    });
    server.listen(port);
  });
}

async function ensureBackendRunning() {
  try {
    const open = await isPortOpen(nextPort);
    if (!open) {
      console.error(`Next.js dev server is not running on port ${nextPort}. Starting it automatically...`);
      
      // Spawn Next.js dev server
      const nextDev = spawn("npm", ["run", "dev"], {
        cwd: workspaceDir,
        shell: true,
        stdio: "ignore" // ignore to not pollute stdout/stderr of MCP
      });
      nextDev.unref();

      // Wait for Next.js to start (max 15 seconds)
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const active = await isPortOpen(nextPort);
        if (active) {
          console.error("Next.js server is now active on port 3000.");
          break;
        }
      }

      // Now start Electron desktop window
      console.error("Starting Electron desktop app...");
      const electronApp = spawn("npm", ["run", "desktop"], {
        cwd: workspaceDir,
        shell: true,
        stdio: "ignore"
      });
      electronApp.unref();
    } else {
      console.error("Next.js server is already running on port 3000.");
    }
  } catch (err) {
    console.error("Error ensuring backend is running:", err.message);
  }
}

async function handleRequest(req) {
  const { jsonrpc, id, method, params } = req;
  
  if (method === "initialize") {
    sendResponse(id, {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: "DynamicAgent2UI",
        version: "1.0.0"
      }
    });
    return;
  }

  if (method === "tools/list") {
    sendResponse(id, {
      tools: [
        {
          name: "show_dialog",
          description: "Displays a native-looking OS dialog (macOS, Windows, or Android style) on the user's desktop, blocks, and waits for the user to click a button.",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Title of the dialog window" },
              message: { type: "string", description: "Description or body text explaining the alert details" },
              icon: { type: "string", enum: ["info", "warning", "error", "question", "success"], description: "Icon style (default: 'info')" },
              primaryButton: { type: "string", description: "Label of the main action button (e.g. Save, OK, Delete)" },
              secondaryButton: { type: "string", description: "Label of the alternative action button (e.g. Don't Save, No)" },
              cancelButton: { type: "string", description: "Label of the cancel button" },
              platform: { type: "string", enum: ["macos", "windows", "android"], description: "Visual style platform (omitted = auto-detect based on host OS)" },
              theme: { type: "string", enum: ["light", "dark"], description: "Color theme (default: 'light')" },
              inputPlaceholder: { type: "string", description: "If provided, renders a text input field inside the dialog" }
            },
            required: ["primaryButton"]
          }
        },
        {
          name: "show_form",
          description: "Displays a native-looking OS settings form (macOS, Windows, or Android style) on the user's desktop to collect multi-field input, blocks, and waits for submission.",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Title of the form" },
              fields: { type: "string", description: "Comma-separated field definitions, e.g. 'Name: text, Age: number, Type: select(Admin|User)'" },
              submitButton: { type: "string", description: "Label of the submit button" },
              cancelButton: { type: "string", description: "Label of the cancel button" },
              platform: { type: "string", enum: ["macos", "windows", "android"], description: "Visual style platform (omitted = auto-detect based on host OS)" },
              theme: { type: "string", enum: ["light", "dark"], description: "Color theme (default: 'light')" }
            },
            required: ["title", "fields", "submitButton"]
          }
        }
      ]
    });
    return;
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params;
    try {
      let result = null;
      if (name === "show_dialog") {
        result = await handleShowDialog(args);
      } else if (name === "show_form") {
        result = await handleShowForm(args);
      } else {
        sendError(id, -32601, `Method not found: ${name}`);
        return;
      }
      sendResponse(id, {
        content: [
          {
            type: "text",
            text: typeof result === "string" ? result : JSON.stringify(result)
          }
        ]
      });
    } catch (err) {
      sendError(id, -32603, `Internal error: ${err.message}`);
    }
    return;
  }

  // Fallback for notifications/other methods
  if (id !== undefined) {
    sendError(id, -32601, `Method not found: ${method}`);
  }
}

function getAutoPlatform(platform) {
  if (platform) return platform;
  if (process.platform === "win32") return "windows";
  if (process.platform === "darwin") return "macos";
  return "android";
}

async function handleShowDialog(args) {
  const platform = getAutoPlatform(args.platform);
  const theme = args.theme || "light";
  const title = args.title || "";
  const message = args.message || "";
  const icon = args.icon || "info";
  const primaryButton = args.primaryButton;
  const secondaryButton = args.secondaryButton || "";
  const cancelButton = args.cancelButton || "";
  const inputPlaceholder = args.inputPlaceholder || "";

  // Make sure backend is running (double check)
  await ensureBackendRunning();

  // 1. Clear any pending actions
  try {
    await fetch("http://localhost:3000/api/sync?type=action");
  } catch (e) {
    console.error("Warning: Sync server not reachable:", e.message);
  }

  // 2. Build DSL Code
  let code = "";
  const escapeStr = (str) => str.replace(/"/g, '\\"');

  if (platform === "macos") {
    code = `MacDialog(title="${escapeStr(title)}", message="${escapeStr(message)}", icon="${icon}", primaryButton="${escapeStr(primaryButton)}"${secondaryButton ? `, secondaryButton="${escapeStr(secondaryButton)}"` : ""}${cancelButton ? `, cancelButton="${escapeStr(cancelButton)}"` : ""}, theme="${theme}"${inputPlaceholder ? `, inputPlaceholder="${escapeStr(inputPlaceholder)}"` : ""})`;
  } else if (platform === "windows") {
    code = `WindowsDialog(title="${escapeStr(title)}", message="${escapeStr(message)}", icon="${icon}", primaryButton="${escapeStr(primaryButton)}"${secondaryButton ? `, secondaryButton="${escapeStr(secondaryButton)}"` : ""}${cancelButton ? `, cancelButton="${escapeStr(cancelButton)}"` : ""}, theme="${theme}"${inputPlaceholder ? `, inputPlaceholder="${escapeStr(inputPlaceholder)}"` : ""})`;
  } else {
    code = `AndroidDialog(title="${escapeStr(title)}", message="${escapeStr(message)}", icon="${icon}", primaryButton="${escapeStr(primaryButton)}"${secondaryButton ? `, secondaryButton="${escapeStr(secondaryButton)}"` : ""}${cancelButton ? `, cancelButton="${escapeStr(cancelButton)}"` : ""}, theme="${theme}"${inputPlaceholder ? `, inputPlaceholder="${escapeStr(inputPlaceholder)}"` : ""})`;
  }

  console.error(`Showing dialog on platform [${platform}], code: ${code}`);

  // 3. POST code to sync server
  await fetch("http://localhost:3000/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "update-code", code })
  });

  // 4. Poll for action
  const result = await pollForAction(300); // 150 seconds timeout

  // 5. Reset code to hide dialog
  await fetch("http://localhost:3000/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "update-code", code: "" })
  });

  return result;
}

async function handleShowForm(args) {
  const platform = getAutoPlatform(args.platform);
  const theme = args.theme || "light";
  const title = args.title;
  const fields = args.fields;
  const submitButton = args.submitButton;
  const cancelButton = args.cancelButton || "";

  // Make sure backend is running
  await ensureBackendRunning();

  // 1. Clear any pending actions
  try {
    await fetch("http://localhost:3000/api/sync?type=action");
  } catch (e) {
    // Ignore
  }

  // 2. Build DSL Code
  const escapeStr = (str) => str.replace(/"/g, '\\"');
  const code = `NativeForm(platform="${platform}", title="${escapeStr(title)}", fields="${escapeStr(fields)}", submitButton="${escapeStr(submitButton)}"${cancelButton ? `, cancelButton="${escapeStr(cancelButton)}"` : ""}, theme="${theme}")`;

  console.error(`Showing form on platform [${platform}], code: ${code}`);

  // 3. POST code to sync server
  await fetch("http://localhost:3000/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "update-code", code })
  });

  // 4. Poll for action
  const result = await pollForAction(300);

  // 5. Reset code to hide form
  await fetch("http://localhost:3000/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "update-code", code: "" })
  });

  return result;
}

async function pollForAction(maxTicks) {
  for (let i = 0; i < maxTicks; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const res = await fetch("http://localhost:3000/api/sync?type=action");
      if (res.ok) {
        const data = await res.json();
        if (data.actions && data.actions.length > 0) {
          return data.actions[0];
        }
      }
    } catch (err) {
      console.error("Polling error:", err.message);
    }
  }
  return { error: "Timeout waiting for user action" };
}

function sendResponse(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}

function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");
}
