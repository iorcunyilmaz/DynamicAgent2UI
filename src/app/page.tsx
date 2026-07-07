"use client";

import React, { useState, useEffect, useRef } from "react";
import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";
import { Renderer } from "@openuidev/react-lang";
import { dialogLibrary, dialogPromptOptions } from "../lib/dialogLibrary";
import { 
  Search, MessageSquare, Library, Settings, Share2, Star, Edit, 
  Play, Moon, Sun, ArrowRight, Loader2, Sparkles, CheckCircle2, Circle, AlertCircle
} from "lucide-react";

interface RecentItem {
  id: string;
  prompt: string;
  code: string;
  platform: "macos" | "windows" | "android";
  theme: "light" | "dark";
}

const DEFAULT_RECENT: RecentItem[] = [
  {
    id: "rec-1",
    prompt: "Save document warning dialog",
    platform: "macos",
    theme: "light",
    code: `root = NativeDialog("macos", "Do you want to save changes to Document?", "Your changes will be lost if you don't save them.", "question", "Save", "Don't Save", "Cancel", "light")`
  },
  {
    id: "rec-2",
    prompt: "Permanent file deletion alert",
    platform: "windows",
    theme: "dark",
    code: `root = NativeDialog("windows", "Delete File", "Are you sure you want to permanently delete 'financial_report.xlsx'?", "warning", "Delete", null, "Cancel", "dark")`
  },
  {
    id: "rec-3",
    prompt: "Camera and photos access permissions",
    platform: "android",
    theme: "light",
    code: `root = NativeDialog("android", "Allow camera access?", "This app requires camera permission to scan QR codes and set your profile picture.", "info", "Allow", null, "Don't allow", "light")`
  },
  {
    id: "rec-4",
    prompt: "Server connection failure dialog",
    platform: "macos",
    theme: "dark",
    code: `root = NativeDialog("macos", "Connection Failure", "Could not establish a connection to the server. Please verify your internet settings.", "error", "Retry", null, "Cancel", "dark")`
  }
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState<"macos" | "windows" | "android">("macos");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [code, setCode] = useState<string>(DEFAULT_RECENT[0].code);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<"idle" | "thinking" | "generating" | "done" | "error">("done");
  const [recent, setRecent] = useState<RecentItem[]>(DEFAULT_RECENT);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDialogId, setActiveDialogId] = useState<string>("rec-1");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [rendererErrors, setRendererErrors] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: "user", content: DEFAULT_RECENT[0].prompt },
    { role: "assistant", content: DEFAULT_RECENT[0].code }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat automatically
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, code]);

  // 1. Listen for actions from the floating desktop window (BroadcastChannel and server polling)
  useEffect(() => {
    // Local channel (same-browser preview)
    const channel = new BroadcastChannel("dialog-channel");
    channel.onmessage = (event) => {
      if (event.data.type === "trigger-action") {
        console.log("Received action from floating window:", event.data.event);
        handleAction(event.data.event);
      }
    };

    // Server poll (cross-browser / Electron sync)
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/sync?type=action");
        if (res.ok) {
          const data = await res.json();
          if (data.actions && data.actions.length > 0) {
            data.actions.forEach((event: any) => {
              console.log("Received action from sync server:", event);
              handleAction(event);
            });
          }
        }
      } catch (err) {
        console.error("Failed to poll actions from sync server:", err);
      }
    }, 500);

    return () => {
      channel.close();
      clearInterval(pollInterval);
    };
  }, [chatMessages]);

  // 2. Broadcast code updates to the floating desktop window (BroadcastChannel and server post)
  useEffect(() => {
    if (code) {
      localStorage.setItem("current-dialog-code", code);
      
      // Local channel (same-browser preview)
      const channel = new BroadcastChannel("dialog-channel");
      channel.postMessage({ type: "update-code", code });
      channel.close();

      // Sync server (cross-browser / Electron sync)
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "update-code", code }),
      }).catch((err) => console.error("Failed to post code to sync server:", err));
    }
  }, [code]);

  // Load a recent dialog
  const handleLoadRecent = (item: RecentItem) => {
    setActiveDialogId(item.id);
    setPrompt(item.prompt);
    setPlatform(item.platform);
    setTheme(item.theme);
    setCode(item.code);
    setStep("done");
    setRendererErrors([]);
    setChatMessages([
      { role: "user", content: item.prompt },
      { role: "assistant", content: item.code }
    ]);
  };

  // Helper to parse double-quoted, single-quoted, null, or word arguments in DSL
  const parseDslArgs = (codeString: string): { component: "NativeDialog" | "NativeForm" | null; args: string[] } => {
    const match = codeString.match(/(NativeDialog|NativeForm)\(([\s\S]*)\)/);
    if (!match) return { component: null, args: [] };
    const component = match[1] as "NativeDialog" | "NativeForm";
    const argsContent = match[2];
    const args: string[] = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = "";
    
    for (let i = 0; i < argsContent.length; i++) {
      const char = argsContent[i];
      if (char === '"' || char === "'") {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar && argsContent[i-1] !== '\\') {
          inQuotes = false;
        }
        current += char;
      } else if (char === ',' && !inQuotes) {
        args.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) {
      args.push(current.trim());
    }
    return { component, args };
  };

  // Change platform in UI and rewrite platform (arg 1) in DSL
  const handlePlatformChange = (newPlatform: "macos" | "windows" | "android") => {
    setPlatform(newPlatform);
    setRendererErrors([]);
    if (code) {
      const { component, args } = parseDslArgs(code);
      if (component && args.length > 0) {
        args[0] = `"${newPlatform}"`;
        const newCode = `root = ${component}(${args.join(", ")})`;
        setCode(newCode);
        
        // Update the last assistant message in history with the updated code
        setChatMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.findLastIndex(m => m.role === "assistant");
          if (lastIdx !== -1) {
            updated[lastIdx] = { ...updated[lastIdx], content: newCode };
          }
          return updated;
        });
      }
    }
  };

  // Change theme in UI and rewrite theme in DSL
  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    setRendererErrors([]);
    if (code) {
      const { component, args } = parseDslArgs(code);
      if (component && args.length > 0) {
        let newCode = "";
        if (component === "NativeDialog") {
          while (args.length < 8) {
            args.push("null");
          }
          args[7] = `"${newTheme}"`;
        } else if (component === "NativeForm") {
          while (args.length < 6) {
            args.push("null");
          }
          args[5] = `"${newTheme}"`;
        }
        newCode = `root = ${component}(${args.join(", ")})`;
        setCode(newCode);
        
        setChatMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.findLastIndex(m => m.role === "assistant");
          if (lastIdx !== -1) {
            updated[lastIdx] = { ...updated[lastIdx], content: newCode };
          }
          return updated;
        });
      }
    }
  };

  // Unified completion caller
  const runChatCompletion = async (nextMessages: any[]) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setStep("thinking");
    setCode("");
    setActionMessage(null);
    setRendererErrors([]);

    // Format message list for LLM context (we omit code brackets / strip systems so LLM understands)
    const formattedMessages = nextMessages.map(m => ({
      role: m.role,
      content: m.content
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: formattedMessages,
          systemPrompt: dialogLibrary.prompt(dialogPromptOptions),
          platform,
          theme,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to agent backend");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader on response");

      const decoder = new TextDecoder();
      let buffer = "";
      setStep("generating");
      let currentCode = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === "content") {
              currentCode = data.content;
              setCode(currentCode);
            } else if (data.type === "event") {
              if (data.event === "thinking") {
                setStep("thinking");
              } else if (data.event === "generating") {
                setStep("generating");
              }
            }
          } catch (err) {
            currentCode += line;
            setCode(currentCode);
          }
        }
      }

      setStep("done");
      
      // Save assistant response to chat history
      setChatMessages([...nextMessages, { role: "assistant", content: currentCode }]);
      
      // Save to recent list
      const newItem: RecentItem = {
        id: `rec-${Date.now()}`,
        prompt: nextMessages[nextMessages.length - 2]?.content || "Dialog Update",
        platform,
        theme,
        code: currentCode || generateLocalFallbackCode(prompt, platform, theme),
      };
      setRecent((prev) => [newItem, ...prev.slice(0, 5)]);
      setActiveDialogId(newItem.id);

    } catch (err) {
      console.error(err);
      setStep("error");
      const fallbackCode = generateLocalFallbackCode(prompt, platform, theme);
      setCode(fallbackCode);
      setChatMessages([...nextMessages, { role: "assistant", content: fallbackCode }]);
      setStep("done");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    const nextMessages = [...chatMessages, { role: "user", content: prompt }];
    setChatMessages(nextMessages);
    setPrompt(""); // Clear input composer
    await runChatCompletion(nextMessages);
  };

  // Local helper to create a fallback string instantly
  const generateLocalFallbackCode = (promptText: string, targetPlatform: string, targetTheme: string) => {
    const title = promptText.slice(0, 20) + (promptText.length > 20 ? "..." : "");
    const message = promptText;
    return `root = NativeDialog("${targetPlatform}", "${title}", "${message}", "info", "Confirm", null, "Cancel", "${targetTheme}")`;
  };

  // Listen to actions from the renderer (like clicking buttons)
  const handleAction = async (event: any) => {
    console.log("Renderer Action:", event);
    
    // Display feedback notice on the screen
    const feedbackMsg = event.humanFriendlyMessage || event.type || "Interaction triggered";
    setActionMessage(`Feedback: "${feedbackMsg}"`);
    setTimeout(() => setActionMessage(null), 3000);

    // If it's a dialog button click / continue conversation trigger, feed it directly to Gemma!
    if (event.type === "continue_conversation" || event.type === "submit" || event.humanFriendlyMessage) {
      const userMsgText = event.humanFriendlyMessage || event.params?.message || "User selected an option";
      
      // Append the user choice to message list and trigger new AI generation round!
      const nextMessages = [...chatMessages, { role: "user", content: userMsgText }];
      setChatMessages(nextMessages);
      await runChatCompletion(nextMessages);
    }
  };

  // Filter recent items based on search query
  const filteredRecent = recent.filter(item => 
    item.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen bg-[#f9f9fb] text-slate-800 antialiased overflow-hidden">
      
      {/* 1. Left Sidebar (Visual replication of the user's uploaded design) */}
      <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col h-full select-none flex-shrink-0">
        {/* Profile Element */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-600 text-sm border border-indigo-200/50 overflow-hidden">
              <span className="text-xs">EK</span>
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-800 leading-tight">Emily Kerr</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Search Box */}
        <div className="px-4 pb-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ⌘K" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-[12px] bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition-colors"
            />
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="px-2 py-2 flex flex-col gap-0.5">
          <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-800 bg-slate-100/80">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            Chat Agent
          </button>
          <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors">
            <Library className="w-4 h-4 text-slate-400" />
            Library
          </button>
          <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors">
            <Settings className="w-4 h-4 text-slate-400" />
            Settings
          </button>
        </nav>

        {/* Recent Items Section */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Recent</p>
          <div className="flex flex-col gap-0.5">
            {filteredRecent.map((item) => (
              <button
                key={item.id}
                onClick={() => handleLoadRecent(item)}
                className={`flex items-center justify-between text-left px-3 py-2 rounded-lg text-[12px] transition-all group ${
                  activeDialogId === item.id 
                    ? "bg-slate-100 font-medium text-slate-900" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="truncate pr-2">{item.prompt}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold bg-slate-200/60 text-slate-500 scale-90 opacity-70 group-hover:opacity-100 transition-opacity">
                  {item.platform}
                </span>
              </button>
            ))}
            {filteredRecent.length === 0 && (
              <p className="px-3 py-2 text-[11px] text-slate-400 italic">No recent prompts</p>
            )}
          </div>

          {/* Favourites Section */}
          <div className="mt-4">
            <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Favourites</p>
            <div className="flex flex-col gap-0.5">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>macOS Light Mode</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Windows Dark Alert</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Android Material 3</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400">Agent Interface v1.2</p>
        </div>
      </aside>

      {/* 2. Main Content Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Workspace Header */}
        <header className="h-[56px] border-b border-slate-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-semibold text-slate-900">
              OS-Native Dialog Builder & AI Agent Canvas
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors">
              <Edit className="w-4 h-4" />
            </button>
            <span className="h-4 w-[1px] bg-slate-200 mx-1" />
            <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Connected
            </span>
          </div>
        </header>

        {/* Workspace Workspace Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left panel: Prompt & Control settings */}
          <div className="w-[380px] border-r border-slate-200 bg-white flex flex-col h-full flex-shrink-0">
            {/* Platform Selector Group */}
            <div className="p-4 border-b border-slate-100 flex flex-col gap-2.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Operating System</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-lg">
                {(["macos", "windows", "android"] as const).map((os) => (
                  <button
                    key={os}
                    type="button"
                    onClick={() => handlePlatformChange(os)}
                    className={`py-1.5 rounded-md text-[11px] font-semibold capitalize transition-all select-none ${
                      platform === os 
                        ? "bg-white text-slate-900 shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {os === "macos" ? "macOS" : os === "windows" ? "Windows" : "Android"}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selector Group */}
            <div className="p-4 border-b border-slate-100 flex flex-col gap-2.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interface Theme</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleThemeChange("light")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                    theme === "light" 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  Light Mode
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange("dark")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                    theme === "dark" 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  Dark Mode
                </button>
              </div>
            </div>

            {/* Todoist-Style Agent Progress Steps (Visual replication of the user's uploaded design) */}
            <div className="p-4 border-b border-slate-100 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agent Execution Steps</label>
                {isGenerating && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-500 italic">
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                    Running
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {step !== "idle" && step !== "error" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <p className={`text-[12px] font-medium leading-none ${step !== "idle" && step !== "error" ? "text-slate-800" : "text-slate-400"}`}>
                      Analyze requirements
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Parse prompt context & target OS details</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {step === "generating" ? (
                      <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    ) : step === "done" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <p className={`text-[12px] font-medium leading-none ${step === "generating" || step === "done" ? "text-slate-800" : "text-slate-400"}`}>
                      Assemble OS-native DSL
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Compile structure into valid OpenUI Lang DSL</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {step === "done" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <p className={`text-[12px] font-medium leading-none ${step === "done" ? "text-slate-800" : "text-slate-400"}`}>
                      Render interactive preview
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Evaluate DSL and display live responsive component</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Code Section */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 h-[220px] flex flex-col font-mono text-[11px] text-slate-300 overflow-hidden">
              <div className="flex items-center justify-between mb-2 text-[9px] uppercase tracking-wider font-semibold text-slate-500">
                <span>OpenUI Lang Source</span>
                {step === "generating" && <span className="text-indigo-400 animate-pulse">Streaming...</span>}
              </div>
              <div className="flex-1 overflow-auto bg-slate-950 p-3 rounded-lg border border-slate-800 text-emerald-400 whitespace-pre-wrap select-all">
                {code || "# Enter a prompt below to see generated OpenUI Lang code here"}
              </div>
            </div>
          </div>

          {/* Right panel: Preview Canvas Area (Chat flow layout mimicking the attached image) */}
          <div className="flex-1 bg-slate-100 flex flex-col h-full relative overflow-hidden">
            {/* Canvas grid background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

            {/* Toast feedback for dialog actions */}
            {actionMessage && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white font-medium text-[12px] px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2 animate-bounce">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>{actionMessage}</span>
              </div>
            )}

            {/* Scrollable Conversation Stream */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 relative w-full">
              {chatMessages.length === 0 ? (
                <div className="flex-grow flex items-center justify-center">
                  <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-sm text-center text-slate-500 shadow-md">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-3" />
                    <h3 className="font-semibold text-slate-700 text-sm mb-1">No Dialog Generated Yet</h3>
                    <p className="text-xs">Type a prompt in the composer below and click generate to design a native dialog.</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
                  {chatMessages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col w-full ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      {msg.role === "user" ? (
                        // User speech bubble (from the attached image design)
                        <div className="bg-white text-slate-800 text-[12px] px-4 py-2.5 rounded-2xl max-w-[75%] border border-slate-200 shadow-sm font-medium leading-relaxed">
                          {msg.content}
                        </div>
                      ) : (
                        // Assistant generated dialog preview card
                        <div className="relative w-full max-w-[90%] md:max-w-[80%] my-2">
                          {idx === chatMessages.length - 1 && rendererErrors.length > 0 && (
                            <div className="absolute -top-16 left-0 right-0 bg-red-50 border border-red-200 text-red-700 text-[11px] p-2.5 rounded-lg shadow-md z-30 flex flex-col gap-1">
                              <p className="font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Parser / Evaluation Error:
                              </p>
                              {rendererErrors.map((err, i) => (
                                <p key={i}>• {err.message} ({err.code})</p>
                              ))}
                            </div>
                          )}
                          <div className="relative shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-2xl overflow-visible p-1">
                            <Renderer
                              response={msg.content}
                              library={dialogLibrary}
                              isStreaming={isGenerating && idx === chatMessages.length - 1}
                              onAction={handleAction}
                              onError={(errs) => {
                                if (idx === chatMessages.length - 1) {
                                  console.log("Renderer errors:", errs);
                                  setRendererErrors(errs);
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Scroll anchor */}
              <div ref={chatEndRef} />
            </div>

            {/* Bottom prompt composer (Wording & layout inspired by the attached image's input bar) */}
            <div className="p-4 border-t border-slate-200 bg-white flex-shrink-0">
              <form onSubmit={handleGenerate} className="flex gap-2">
                <div className="flex-grow relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:bg-white focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-slate-100 transition-all">
                  <span className="text-[14px] text-slate-400 mr-2 select-none">+</span>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the native dialog to generate (e.g. Save file warn, camera request)..."
                    disabled={isGenerating}
                    className="flex-grow bg-transparent text-[13px] border-none outline-none focus:ring-0 placeholder-slate-400 pr-12 text-slate-800"
                  />
                  <div className="absolute right-3 flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded lowercase">
                      gemma-4-12b-it
                    </span>
                    <button
                      type="submit"
                      disabled={isGenerating || !prompt.trim()}
                      className={`p-1.5 rounded-lg text-white transition-all flex items-center justify-center ${
                        isGenerating || !prompt.trim()
                          ? "bg-slate-300 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 cursor-pointer shadow-md shadow-indigo-600/10"
                      }`}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </form>
              <p className="text-[10px] text-center text-slate-400 mt-2">
                AI Agent generates functional native dialog structures. Check and compile files before deployment.
              </p>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}
