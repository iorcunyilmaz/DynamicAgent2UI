"use client";

import React, { useState } from "react";
import { AlertTriangle, Info, X, Check, ShieldAlert } from "lucide-react";
import { useTriggerAction } from "@openuidev/react-lang";

export interface NativeDialogProps {
  platform: "macos" | "windows" | "android";
  title?: string;
  message?: string;
  icon?: "info" | "warning" | "error" | "question" | "success";
  primaryButton: string;
  secondaryButton?: string;
  cancelButton?: string;
  theme?: "light" | "dark";
  inputPlaceholder?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  onCancelClick?: () => void;
}

// macOS Native Dialog Component
export const MacDialog: React.FC<Omit<NativeDialogProps, "platform">> = ({
  title,
  message,
  icon = "info",
  primaryButton,
  secondaryButton,
  cancelButton,
  theme = "light",
  inputPlaceholder,
  onPrimaryClick,
  onSecondaryClick,
  onCancelClick,
}) => {
  const isDark = theme === "dark";
  const [inputValue, setInputValue] = useState("");
  const [formState, setFormState] = useState<Record<string, string>>({});
  const triggerAction = useTriggerAction();

  const isMulti = !!(inputPlaceholder && inputPlaceholder.includes(","));
  const placeholderFields = isMulti && inputPlaceholder
    ? inputPlaceholder.split(",").map((s) => s.trim()).filter((s): s is string => !!s)
    : [inputPlaceholder].filter((s): s is string => !!s);

  const handlePrimary = () => {
    if (onPrimaryClick) onPrimaryClick();
    let detail = "";
    if (inputPlaceholder) {
      if (isMulti) {
        detail = " and entered " + placeholderFields.map(f => `${f}: "${formState[f] || ""}"`).join(", ");
      } else {
        detail = ` and entered "${inputValue}"`;
      }
    }
    triggerAction(`User clicked "${primaryButton}"${detail} on macOS dialog: "${title || ""}"`);
  };

  const handleSecondary = () => {
    if (onSecondaryClick) onSecondaryClick();
    triggerAction(`User clicked "${secondaryButton}" on macOS dialog: "${title || ""}"`);
  };

  const handleCancel = () => {
    if (onCancelClick) onCancelClick();
    triggerAction(`User clicked "${cancelButton || "Cancel"}" on macOS dialog: "${title || ""}"`);
  };

  const renderMacIcon = () => {
    switch (icon) {
      case "error":
        return (
          <div className="w-16 h-16 rounded-2xl bg-[#ff3b30] flex items-center justify-center shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-white/10" />
            <ShieldAlert className="w-9 h-9 text-white" />
          </div>
        );
      case "warning":
        return (
          <div className="w-16 h-16 rounded-2xl bg-[#ffcc00] flex items-center justify-center shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-white/10" />
            <AlertTriangle className="w-9 h-9 text-white" />
          </div>
        );
      case "success":
        return (
          <div className="w-16 h-16 rounded-2xl bg-[#34c759] flex items-center justify-center shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-white/10" />
            <Check className="w-9 h-9 text-white" />
          </div>
        );
      case "question":
      case "info":
      default:
        return (
          <div className="w-16 h-16 rounded-2xl bg-[#007aff] flex items-center justify-center shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-white/10" />
            <Info className="w-9 h-9 text-white" />
          </div>
        );
    }
  };

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        backdropFilter: "blur(30px) saturate(200%)",
        WebkitBackdropFilter: "blur(30px) saturate(200%)",
      }}
      className={`w-[340px] rounded-2xl p-5 flex flex-col items-center shadow-2xl border transition-colors duration-200 ${
        isDark
          ? "bg-[#1e1e1e] border-[#3c3c3c]/50 text-white shadow-black/60"
          : "bg-white border-[#e5e5e5]/80 text-[#1e1e1e] shadow-black/15"
      }`}
    >
      {/* Icon */}
      <div className="mb-4 flex justify-center">{renderMacIcon()}</div>

      {/* Content */}
      <div className="w-full text-center">
        {title && (
          <h3 className={`text-[13px] font-bold tracking-normal leading-tight mb-1.5 ${isDark ? "text-white" : "text-[#1e1e1e]"}`}>
            {title}
          </h3>
        )}
        {message && (
          <p className={`text-[11px] font-normal leading-normal mb-4 ${isDark ? "text-[#a5a5a5]" : "text-[#555555]"}`}>
            {message}
          </p>
        )}
      </div>

      {/* Form Fields for macOS */}
      {placeholderFields.length > 0 && (
        <div className="w-full flex flex-col gap-2.5 mb-4 text-left">
          {placeholderFields.map((field, index) => (
            <div key={index} className="flex flex-col gap-0.5 w-full">
              {isMulti && (
                <label className={`text-[9px] font-semibold tracking-wide uppercase ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {field}
                </label>
              )}
              <input
                type="text"
                placeholder={field}
                value={isMulti ? (formState[field] || "") : inputValue}
                onChange={(e) => {
                  if (isMulti) {
                    setFormState({ ...formState, [field]: e.target.value });
                  } else {
                    setInputValue(e.target.value);
                  }
                }}
                className={`w-full px-2.5 py-1.5 rounded-md border text-[12px] outline-none transition-all focus:ring-2 focus:ring-blue-500/50 ${
                  isDark
                    ? "bg-[#252525] border-[#444444] text-white placeholder-gray-600 focus:border-blue-500"
                    : "bg-white border-[#d2d2d7] text-[#1e1e1e] placeholder-gray-400 focus:border-[#007aff]"
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {/* macOS Pill Buttons */}
      <div className="flex flex-col w-full gap-2 mt-auto">
        <button
          onClick={handlePrimary}
          className={`w-full py-1.5 px-3 rounded-md text-[13px] font-medium text-white transition-all cursor-default select-none shadow-[0_1px_2px_rgba(0,0,0,0.15)] active:opacity-90 ${
            icon === "error"
              ? "bg-gradient-to-b from-[#ff453a] to-[#ff3b30] hover:from-[#ff5b52] hover:to-[#ff453a] shadow-red-500/20"
              : "bg-gradient-to-b from-[#327df6] to-[#0051e0] hover:from-[#4089f7] hover:to-[#0c5de3] shadow-blue-500/20"
          }`}
        >
          {primaryButton}
        </button>

        {secondaryButton && (
          <button
            onClick={handleSecondary}
            className={`w-full py-1.5 px-3 rounded-md text-[13px] font-normal border cursor-default select-none transition-colors ${
              isDark
                ? "bg-[#333333]/80 border-[#4a4a4a] text-white hover:bg-[#444444]"
                : "bg-white border-[#d2d2d7] text-[#1e1e1e] shadow-sm hover:bg-[#f5f5f7] active:bg-[#e8e8ed]"
            }`}
          >
            {secondaryButton}
          </button>
        )}

        {cancelButton && (
          <button
            onClick={handleCancel}
            className={`w-full py-1.5 px-3 rounded-md text-[13px] font-normal cursor-default select-none transition-colors ${
              isDark
                ? "text-[#a5a5a5] hover:text-white"
                : "text-[#555555] hover:text-black"
            }`}
          >
            {cancelButton}
          </button>
        )}
      </div>
    </div>
  );
};

// Windows 11 Native Dialog Component
export const WindowsDialog: React.FC<Omit<NativeDialogProps, "platform">> = ({
  title,
  message,
  icon = "info",
  primaryButton,
  secondaryButton,
  cancelButton,
  theme = "light",
  inputPlaceholder,
  onPrimaryClick,
  onSecondaryClick,
  onCancelClick,
}) => {
  const isDark = theme === "dark";
  const [inputValue, setInputValue] = useState("");
  const [formState, setFormState] = useState<Record<string, string>>({});
  const triggerAction = useTriggerAction();

  const isMulti = !!(inputPlaceholder && inputPlaceholder.includes(","));
  const placeholderFields = isMulti && inputPlaceholder
    ? inputPlaceholder.split(",").map((s) => s.trim()).filter((s): s is string => !!s)
    : [inputPlaceholder].filter((s): s is string => !!s);

  const handlePrimary = () => {
    if (onPrimaryClick) onPrimaryClick();
    let detail = "";
    if (inputPlaceholder) {
      if (isMulti) {
        detail = " and entered " + placeholderFields.map(f => `${f}: "${formState[f] || ""}"`).join(", ");
      } else {
        detail = ` and entered "${inputValue}"`;
      }
    }
    triggerAction(`User clicked "${primaryButton}"${detail} on Windows dialog: "${title || ""}"`);
  };

  const handleSecondary = () => {
    if (onSecondaryClick) onSecondaryClick();
    triggerAction(`User clicked "${secondaryButton}" on Windows dialog: "${title || ""}"`);
  };

  const handleCancel = () => {
    if (onCancelClick) onCancelClick();
    triggerAction(`User clicked "${cancelButton || "Cancel"}" on Windows dialog: "${title || ""}"`);
  };

  const renderWindowsIcon = () => {
    switch (icon) {
      case "error":
        return (
          <div className="w-10 h-10 rounded-full bg-[#e81123] flex items-center justify-center text-white shadow-sm">
            <X className="w-6 h-6 stroke-[3]" />
          </div>
        );
      case "warning":
        return (
          <div className="w-10 h-10 flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-9 h-9 fill-amber-500 text-white stroke-[1.5]" />
          </div>
        );
      case "success":
        return (
          <div className="w-10 h-10 rounded-full bg-[#107c41] flex items-center justify-center text-white shadow-sm">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
        );
      case "question":
        return (
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 flex items-center justify-center text-blue-500 font-semibold text-xl">
            ?
          </div>
        );
      case "info":
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-[#0078d4] flex items-center justify-center text-white shadow-sm">
            <Info className="w-6 h-6 stroke-[2.5]" />
          </div>
        );
    }
  };

  return (
    <div
      style={{
        fontFamily: '"Segoe UI", "Segoe UI Variable Text", -apple-system, sans-serif',
      }}
      className={`w-[440px] rounded-lg border shadow-2xl overflow-hidden transition-all duration-200 ${
        isDark
          ? "bg-[#2c2c2c] border-[#454545] text-white shadow-black/80"
          : "bg-[#f3f3f3] border-[#dcdcdc] text-black shadow-black/20"
      }`}
    >
      {/* Title Bar */}
      <div className={`flex items-center justify-between px-4 py-2 border-b text-[12px] rounded-t-lg ${
        isDark ? "bg-[#202020] border-[#454545] text-gray-400" : "bg-white border-[#dcdcdc] text-gray-600"
      }`}>
        <span className="font-semibold tracking-wide truncate max-w-[85%]">{title || "Windows Security"}</span>
        <button
          onClick={handleCancel}
          className={`p-1 rounded-sm transition-colors ${
            isDark ? "hover:bg-[#e81123] hover:text-white" : "hover:bg-[#e81123] hover:text-white"
          }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Body */}
      <div className={`p-6 flex flex-col gap-4 ${isDark ? "bg-[#2c2c2c]" : "bg-white"}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">{renderWindowsIcon()}</div>
          <div className="flex-grow">
            {title && (
              <h4 className={`text-[15px] font-semibold mb-2 leading-snug ${isDark ? "text-white" : "text-black"}`}>
                {title}
              </h4>
            )}
            {message && (
              <p className={`text-[13px] leading-relaxed whitespace-pre-wrap mb-3 ${isDark ? "text-[#cccccc]" : "text-[#5c5c5c]"}`}>
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Form Fields for Windows */}
        {placeholderFields.length > 0 && (
          <div className="w-full flex flex-col gap-3.5 text-left mt-2">
            {placeholderFields.map((field, index) => (
              <div key={index} className="flex flex-col gap-1 w-full">
                {isMulti && (
                  <label className={`text-[11px] font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {field}
                  </label>
                )}
                <input
                  type="text"
                  placeholder={field}
                  value={isMulti ? (formState[field] || "") : inputValue}
                  onChange={(e) => {
                    if (isMulti) {
                      setFormState({ ...formState, [field]: e.target.value });
                    } else {
                      setInputValue(e.target.value);
                    }
                  }}
                  className={`w-full px-2.5 py-1.5 border text-[13px] outline-none transition-all focus:border-[#0067c0] focus:ring-1 focus:ring-[#0067c0] ${
                    isDark
                      ? "bg-[#202020] border-[#555555] text-white placeholder-gray-600"
                      : "bg-white border-[#868686] text-black placeholder-gray-400"
                  }`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className={`px-6 py-4 flex flex-row-reverse gap-2 border-t rounded-b-lg ${
        isDark ? "bg-[#202020] border-[#333333]" : "bg-[#f3f3f3] border-[#e6e6e6]"
      }`}>
        <button
          onClick={handlePrimary}
          className={`min-w-[84px] h-[32px] px-4 rounded text-[13px] font-normal border cursor-pointer select-none transition-all whitespace-nowrap flex-shrink-0 ${
            isDark
              ? "bg-[#0067c0] border-[#00549e] text-white hover:bg-[#1875c7] hover:border-[#1875c7]"
              : "bg-[#0067c0] border-[#0067c0] text-white hover:bg-[#00549e] hover:border-[#00549e]"
          }`}
        >
          {primaryButton}
        </button>

        {secondaryButton && (
          <button
            onClick={handleSecondary}
            className={`min-w-[84px] h-[32px] px-4 rounded text-[13px] font-normal border cursor-pointer select-none transition-all whitespace-nowrap flex-shrink-0 ${
              isDark
                ? "bg-[#333333] border-[#454545] text-white hover:bg-[#444444] hover:border-[#555555]"
                : "bg-white border-[#8a8a8a] text-black hover:bg-[#f4f4f4] hover:border-[#8a8a8a]"
            }`}
          >
            {secondaryButton}
          </button>
        )}

        {cancelButton && (
          <button
            onClick={handleCancel}
            className={`min-w-[84px] h-[32px] px-4 rounded text-[13px] font-normal border cursor-pointer select-none transition-all whitespace-nowrap flex-shrink-0 ${
              isDark
                ? "bg-[#333333] border-[#454545] text-white hover:bg-[#444444] hover:border-[#555555]"
                : "bg-white border-[#8a8a8a] text-black hover:bg-[#f4f4f4] hover:border-[#8a8a8a]"
            }`}
          >
            {cancelButton}
          </button>
        )}
      </div>
    </div>
  );
};

// Android Native Dialog Component (Material Design 3 Alert Dialog)
export const AndroidDialog: React.FC<Omit<NativeDialogProps, "platform">> = ({
  title,
  message,
  icon = "info",
  primaryButton,
  secondaryButton,
  cancelButton,
  theme = "light",
  inputPlaceholder,
  onPrimaryClick,
  onSecondaryClick,
  onCancelClick,
}) => {
  const isDark = theme === "dark";
  const [inputValue, setInputValue] = useState("");
  const [formState, setFormState] = useState<Record<string, string>>({});
  const triggerAction = useTriggerAction();

  const isMulti = !!(inputPlaceholder && inputPlaceholder.includes(","));
  const placeholderFields = isMulti && inputPlaceholder
    ? inputPlaceholder.split(",").map((s) => s.trim()).filter((s): s is string => !!s)
    : [inputPlaceholder].filter((s): s is string => !!s);

  const handlePrimary = () => {
    if (onPrimaryClick) onPrimaryClick();
    let detail = "";
    if (inputPlaceholder) {
      if (isMulti) {
        detail = " and entered " + placeholderFields.map(f => `${f}: "${formState[f] || ""}"`).join(", ");
      } else {
        detail = ` and entered "${inputValue}"`;
      }
    }
    triggerAction(`User clicked "${primaryButton}"${detail} on Android dialog: "${title || ""}"`);
  };

  const handleSecondary = () => {
    if (onSecondaryClick) onSecondaryClick();
    triggerAction(`User clicked "${secondaryButton}" on Android dialog: "${title || ""}"`);
  };

  const handleCancel = () => {
    if (onCancelClick) onCancelClick();
    triggerAction(`User clicked "${cancelButton || "Cancel"}" on Android dialog: "${title || ""}"`);
  };

  const renderAndroidIcon = () => {
    const iconClass = "w-6 h-6";
    switch (icon) {
      case "error":
        return <ShieldAlert className={`${iconClass} text-[#ba1a1a] dark:text-[#ffb4ab]`} />;
      case "warning":
        return <AlertTriangle className={`${iconClass} text-[#d97706] dark:text-[#fbbf24]`} />;
      case "success":
        return <Check className={`${iconClass} text-[#15803d] dark:text-[#4ade80]`} />;
      case "question":
        return <span className="text-xl font-medium text-[#6750a4] dark:text-[#d0bcff]">?</span>;
      case "info":
      default:
        return <Info className={`${iconClass} text-[#6750a4] dark:text-[#d0bcff]`} />;
    }
  };

  return (
    <div
      style={{
        fontFamily: '"Roboto", "Product Sans", -apple-system, sans-serif',
      }}
      className={`w-[360px] rounded-[28px] p-6 shadow-2xl transition-all duration-200 ${
        isDark
          ? "bg-[#2b2930] text-[#e6e1e5] shadow-black/50"
          : "bg-[#efeef6] text-[#1c1b1f] shadow-black/25"
      }`}
    >
      {/* Icon if provided */}
      {icon && (
        <div className="flex justify-center mb-4">
          <div className={`p-2 rounded-full ${isDark ? "bg-[#383541]" : "bg-[#e8e7ef]"}`}>
            {renderAndroidIcon()}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`w-full mb-4 ${icon ? "text-center" : "text-left"}`}>
        {title && (
          <h3 className={`text-[22px] font-normal leading-[28px] mb-2 ${isDark ? "text-[#e6e1e5]" : "text-[#1c1b1f]"}`}>
            {title}
          </h3>
        )}
        {message && (
          <p className={`text-[14px] leading-[20px] font-normal ${isDark ? "text-[#cac4d0]" : "text-[#49454f]"}`}>
            {message}
          </p>
        )}
      </div>

      {/* Form Fields for Android (MD3 style) */}
      {placeholderFields.length > 0 && (
        <div className="w-full flex flex-col gap-4 mb-6 text-left">
          {placeholderFields.map((field, index) => (
            <div key={index} className="flex flex-col gap-1 w-full">
              {isMulti && (
                <label className={`text-[12px] font-medium ${isDark ? "text-[#cac4d0]" : "text-[#49454f]"}`}>
                  {field}
                </label>
              )}
              <input
                type="text"
                placeholder={field}
                value={isMulti ? (formState[field] || "") : inputValue}
                onChange={(e) => {
                  if (isMulti) {
                    setFormState({ ...formState, [field]: e.target.value });
                  } else {
                    setInputValue(e.target.value);
                  }
                }}
                className={`w-full px-4 py-2.5 rounded-t-lg border-b-2 text-[15px] outline-none transition-all ${
                  isDark
                    ? "bg-[#383541] border-[#cac4d0] text-[#e6e1e5] placeholder-gray-500 focus:border-[#d0bcff] focus:bg-[#49454f]"
                    : "bg-[#e8e7ef] border-[#49454f] text-[#1c1b1f] placeholder-gray-400 focus:border-[#6750a4] focus:bg-[#dcdbe4]"
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Buttons - MD3 layout aligned to bottom-right */}
      <div className="flex flex-row-reverse flex-wrap gap-2 justify-start items-center">
        <button
          onClick={handlePrimary}
          className={`h-10 px-4 rounded-full text-[14px] font-medium tracking-wide cursor-pointer select-none transition-colors whitespace-nowrap flex-shrink-0 ${
            isDark
              ? "text-[#d0bcff] hover:bg-[#383541] active:bg-[#49454f]"
              : "text-[#6750a4] hover:bg-[#e8e7ef] active:bg-[#dcdbe4]"
          }`}
        >
          {primaryButton}
        </button>

        {secondaryButton && (
          <button
            onClick={handleSecondary}
            className={`h-10 px-4 rounded-full text-[14px] font-medium tracking-wide cursor-pointer select-none transition-colors whitespace-nowrap flex-shrink-0 ${
              isDark
                ? "text-[#d0bcff] hover:bg-[#383541] active:bg-[#49454f]"
                : "text-[#6750a4] hover:bg-[#e8e7ef] active:bg-[#dcdbe4]"
          }`}
          >
            {secondaryButton}
          </button>
        )}

        {cancelButton && (
          <button
            onClick={handleCancel}
            className={`h-10 px-4 rounded-full text-[14px] font-medium tracking-wide cursor-pointer select-none transition-colors whitespace-nowrap flex-shrink-0 ${
              isDark
                ? "text-[#cac4d0] hover:bg-[#383541]/50 active:bg-[#49454f]/50"
                : "text-[#49454f] hover:bg-[#e8e7ef]/50 active:bg-[#dcdbe4]/50"
            }`}
          >
            {cancelButton}
          </button>
        )}
      </div>
    </div>
  );
};

// Unified Wrapper Native Dialog Container
export const NativeDialog: React.FC<NativeDialogProps> = (props) => {
  const { platform, ...otherProps } = props;

  switch (platform) {
    case "macos":
      return <MacDialog {...otherProps} />;
    case "windows":
      return <WindowsDialog {...otherProps} />;
    case "android":
      return <AndroidDialog {...otherProps} />;
    default:
      return <MacDialog {...otherProps} />;
  }
};
