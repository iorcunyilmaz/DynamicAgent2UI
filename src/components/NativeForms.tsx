"use client";

import React, { useState } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { useTriggerAction } from "@openuidev/react-lang";

export interface NativeFormProps {
  platform: "macos" | "windows" | "android";
  title: string;
  fields: string; // "Fatura Adı (text); Tutar (number); Kategori (select: Genel, Ulaşım); Onay (checkbox)"
  submitButton: string;
  cancelButton?: string;
  theme?: "light" | "dark";
}

interface FormField {
  label: string;
  type: "text" | "number" | "textarea" | "checkbox" | "select";
  options?: string[];
}

// Parse string field definitions: "Name (type: options)"
const parseFields = (fieldsString: string): FormField[] => {
  if (!fieldsString) return [];
  return fieldsString
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((trimmed): FormField => {
      // Match "Label (type)" or "Label (type: options)"
      const match = trimmed.match(/^([^(]+)\(([^)]+)\)$/);
      if (!match) {
        return { label: trimmed, type: "text" };
      }

      const label = match[1].trim();
      const typeContent = match[2].trim();

      if (typeContent.startsWith("select:")) {
        const options = typeContent
          .replace("select:", "")
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean);
        return { label, type: "select", options };
      }

      const type = typeContent as FormField["type"];
      const validTypes: FormField["type"][] = ["text", "number", "textarea", "checkbox", "select"];
      return {
        label,
        type: validTypes.includes(type) ? type : "text",
      };
    });
};

// macOS styled settings/form page
export const MacForm: React.FC<Omit<NativeFormProps, "platform">> = ({
  title,
  fields,
  submitButton,
  cancelButton,
  theme = "light",
}) => {
  const isDark = theme === "dark";
  const triggerAction = useTriggerAction();
  const parsedFields = parseFields(fields);

  const [formState, setFormState] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valuesStr = parsedFields
      .map((f) => `${f.label}: "${formState[f.label] !== undefined ? formState[f.label] : ""}"`)
      .join(", ");
    triggerAction(`User submitted macOS form "${title}" entering values: ${valuesStr}`);
  };

  const handleCancel = () => {
    triggerAction(`User cancelled macOS form "${title}"`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backdropFilter: "blur(30px) saturate(200%)",
        WebkitBackdropFilter: "blur(30px) saturate(200%)",
      }}
      className={`w-[400px] rounded-2xl p-6 shadow-2xl border transition-colors duration-200 text-left ${
        isDark
          ? "bg-[#1e1e1e] border-[#3c3c3c]/50 text-white shadow-black/60"
          : "bg-white border-[#e5e5e5]/80 text-[#1e1e1e] shadow-black/15"
      }`}
    >
      {/* Form Title & Window controls */}
      <div className="flex items-center justify-between mb-5 border-b pb-3 border-slate-500/10">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
        </div>
        <span className="text-[13px] font-bold text-center flex-1 pr-6">{title}</span>
      </div>

      {/* Field Elements (macOS Left Label, Right Input style) */}
      <div className="flex flex-col gap-4 mb-6">
        {parsedFields.map((field, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-4 items-start">
            <label className={`text-[12px] font-medium text-right pt-1.5 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              {field.label}
            </label>
            <div className="col-span-2">
              {field.type === "textarea" ? (
                <textarea
                  rows={2}
                  value={formState[field.label] || ""}
                  onChange={(e) => setFormState({ ...formState, [field.label]: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-md border text-[12px] outline-none resize-none focus:ring-2 focus:ring-blue-500/50 ${
                    isDark
                      ? "bg-[#252525] border-[#444444] text-white focus:border-blue-500"
                      : "bg-white border-[#d2d2d7] text-black focus:border-[#007aff]"
                  }`}
                />
              ) : field.type === "select" ? (
                <div className="relative">
                  <select
                    value={formState[field.label] || (field.options?.[0] || "")}
                    onChange={(e) => setFormState({ ...formState, [field.label]: e.target.value })}
                    className={`w-full appearance-none px-2.5 py-1.5 rounded-md border text-[12px] outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      isDark
                        ? "bg-[#252525] border-[#444444] text-white focus:border-blue-500"
                        : "bg-white border-[#d2d2d7] text-black focus:border-[#007aff]"
                    }`}
                  >
                    {field.options?.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-gray-400 pointer-events-none" />
                </div>
              ) : field.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={!!formState[field.label]}
                  onChange={(e) => setFormState({ ...formState, [field.label]: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 mt-1.5"
                />
              ) : (
                <input
                  type={field.type === "number" ? "number" : "text"}
                  value={formState[field.label] || ""}
                  onChange={(e) => setFormState({ ...formState, [field.label]: e.target.value })}
                  className={`w-full px-2.5 py-1.5 rounded-md border text-[12px] outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    isDark
                      ? "bg-[#252525] border-[#444444] text-white focus:border-blue-500"
                      : "bg-white border-[#d2d2d7] text-black focus:border-[#007aff]"
                  }`}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 border-t pt-4 border-slate-500/10">
        {cancelButton && (
          <button
            type="button"
            onClick={handleCancel}
            className={`py-1 px-4 rounded-md text-[13px] border transition-colors whitespace-nowrap flex-shrink-0 ${
              isDark
                ? "bg-[#333333] border-[#4a4a4a] text-white hover:bg-[#444444]"
                : "bg-white border-[#d2d2d7] text-[#1e1e1e] hover:bg-[#f5f5f7]"
            }`}
          >
            {cancelButton}
          </button>
        )}
        <button
          type="submit"
          className="py-1 px-5 rounded-md text-[13px] font-medium text-white bg-gradient-to-b from-[#327df6] to-[#0051e0] shadow-sm hover:from-[#4089f7] hover:to-[#0c5de3] active:opacity-95 whitespace-nowrap flex-shrink-0"
        >
          {submitButton}
        </button>
      </div>
    </form>
  );
};

// Windows 11 styled Settings Form card
export const WindowsForm: React.FC<Omit<NativeFormProps, "platform">> = ({
  title,
  fields,
  submitButton,
  cancelButton,
  theme = "light",
}) => {
  const isDark = theme === "dark";
  const triggerAction = useTriggerAction();
  const parsedFields = parseFields(fields);

  const [formState, setFormState] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valuesStr = parsedFields
      .map((f) => `${f.label}: "${formState[f.label] !== undefined ? formState[f.label] : ""}"`)
      .join(", ");
    triggerAction(`User submitted Windows form "${title}" entering values: ${valuesStr}`);
  };

  const handleCancel = () => {
    triggerAction(`User cancelled Windows form "${title}"`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        fontFamily: '"Segoe UI", "Segoe UI Variable Text", sans-serif',
      }}
      className={`w-[460px] rounded-lg border shadow-2xl text-left overflow-hidden transition-colors duration-200 ${
        isDark
          ? "bg-[#2c2c2c] border-[#454545] text-white shadow-black/80"
          : "bg-[#f3f3f3] border-[#dcdcdc] text-black shadow-black/20"
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-3 border-b rounded-t-lg ${
        isDark ? "bg-[#202020] border-[#454545]" : "bg-white border-[#dcdcdc]"
      }`}>
        <span className="text-[13px] font-semibold">{title}</span>
        <button
          type="button"
          onClick={handleCancel}
          className="p-1 hover:bg-[#e81123] hover:text-white rounded-sm transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Fields */}
      <div className={`p-6 flex flex-col gap-4 ${isDark ? "bg-[#2c2c2c]" : "bg-white"}`}>
        {parsedFields.map((field, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <label className={`text-[12px] font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              {field.label}
            </label>
            {field.type === "textarea" ? (
              <textarea
                rows={2}
                value={formState[field.label] || ""}
                onChange={(e) => setFormState({ ...formState, [field.label]: e.target.value })}
                className={`w-full px-3 py-1.5 border text-[13px] outline-none resize-none focus:border-[#0067c0] focus:ring-1 focus:ring-[#0067c0] ${
                  isDark
                    ? "bg-[#202020] border-[#555555] text-white placeholder-gray-600"
                    : "bg-white border-[#868686] text-black placeholder-gray-400"
                }`}
              />
            ) : field.type === "select" ? (
              <div className="relative">
                <select
                  value={formState[field.label] || (field.options?.[0] || "")}
                  onChange={(e) => setFormState({ ...formState, [field.label]: e.target.value })}
                  className={`w-full px-3 py-1.5 border text-[13px] outline-none appearance-none focus:border-[#0067c0] focus:ring-1 focus:ring-[#0067c0] ${
                    isDark
                      ? "bg-[#202020] border-[#555555] text-white"
                      : "bg-white border-[#868686] text-black"
                  }`}
                >
                  {field.options?.map((opt, oIdx) => (
                    <option key={oIdx} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-gray-500 pointer-events-none" />
              </div>
            ) : field.type === "checkbox" ? (
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={!!formState[field.label]}
                  onChange={(e) => setFormState({ ...formState, [field.label]: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-0 border-gray-300"
                />
                <span className={`text-[12px] ${isDark ? "text-gray-300" : "text-gray-600"}`}>Enable/Yes</span>
              </label>
            ) : (
              <input
                type={field.type === "number" ? "number" : "text"}
                value={formState[field.label] || ""}
                onChange={(e) => setFormState({ ...formState, [field.label]: e.target.value })}
                className={`w-full px-3 py-1.5 border text-[13px] outline-none focus:border-[#0067c0] focus:ring-1 focus:ring-[#0067c0] ${
                  isDark
                    ? "bg-[#202020] border-[#555555] text-white placeholder-gray-600"
                    : "bg-white border-[#868686] text-black placeholder-gray-400"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Windows Footer */}
      <div className={`px-6 py-4 flex flex-row-reverse gap-2 border-t rounded-b-lg ${
        isDark ? "bg-[#202020] border-[#333333]" : "bg-[#f3f3f3] border-[#e6e6e6]"
      }`}>
        <button
          type="submit"
          className="min-w-[84px] h-[32px] px-4 rounded text-[13px] font-normal border bg-[#0067c0] border-[#0067c0] text-white hover:bg-[#00549e] active:scale-[0.98] transition-transform whitespace-nowrap flex-shrink-0"
        >
          {submitButton}
        </button>
        {cancelButton && (
          <button
            type="button"
            onClick={handleCancel}
            className={`min-w-[84px] h-[32px] px-4 rounded text-[13px] font-normal border cursor-pointer whitespace-nowrap flex-shrink-0 ${
              isDark
                ? "bg-[#333333] border-[#454545] text-white hover:bg-[#444444]"
                : "bg-white border-[#8a8a8a] text-black hover:bg-[#f4f4f4]"
            }`}
          >
            {cancelButton}
          </button>
        )}
      </div>
    </form>
  );
};

// Android styled form card (Material Design 3 card layout)
export const AndroidForm: React.FC<Omit<NativeFormProps, "platform">> = ({
  title,
  fields,
  submitButton,
  cancelButton,
  theme = "light",
}) => {
  const isDark = theme === "dark";
  const triggerAction = useTriggerAction();
  const parsedFields = parseFields(fields);

  const [formState, setFormState] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valuesStr = parsedFields
      .map((f) => `${f.label}: "${formState[f.label] !== undefined ? formState[f.label] : ""}"`)
      .join(", ");
    triggerAction(`User submitted Android form "${title}" entering values: ${valuesStr}`);
  };

  const handleCancel = () => {
    triggerAction(`User cancelled Android form "${title}"`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        fontFamily: '"Roboto", "Product Sans", sans-serif',
      }}
      className={`w-[360px] rounded-[28px] p-6 shadow-2xl transition-colors duration-200 text-left ${
        isDark ? "bg-[#2b2930] text-[#e6e1e5] shadow-black/50" : "bg-[#efeef6] text-[#1c1b1f] shadow-black/25"
      }`}
    >
      {/* Title */}
      <h3 className="text-[20px] font-normal mb-5 tracking-wide leading-tight">{title}</h3>

      {/* Fields */}
      <div className="flex flex-col gap-5 mb-6">
        {parsedFields.map((field, idx) => (
          <div key={idx} className="flex flex-col gap-1 w-full">
            <label className={`text-[12px] font-medium pl-1 ${isDark ? "text-[#cac4d0]" : "text-[#49454f]"}`}>
              {field.label}
            </label>
            {field.type === "textarea" ? (
              <textarea
                rows={2}
                value={formState[field.label] || ""}
                onChange={(e) => setFormState({ ...formState, [field.label]: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-t-lg border-b-2 text-[15px] outline-none resize-none transition-all ${
                  isDark
                    ? "bg-[#383541] border-[#cac4d0] text-[#e6e1e5] focus:border-[#d0bcff]"
                    : "bg-[#e8e7ef] border-[#49454f] text-[#1c1b1f] focus:border-[#6750a4]"
                }`}
              />
            ) : field.type === "select" ? (
              <div className="relative">
                <select
                  value={formState[field.label] || (field.options?.[0] || "")}
                  onChange={(e) => setFormState({ ...formState, [field.label]: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-t-lg border-b-2 text-[15px] appearance-none outline-none transition-all ${
                    isDark
                      ? "bg-[#383541] border-[#cac4d0] text-[#e6e1e5] focus:border-[#d0bcff]"
                      : "bg-[#e8e7ef] border-[#49454f] text-[#1c1b1f] focus:border-[#6750a4]"
                  }`}
                >
                  {field.options?.map((opt, oIdx) => (
                    <option key={oIdx} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-gray-500 pointer-events-none" />
              </div>
            ) : field.type === "checkbox" ? (
              <label className="flex items-center gap-3 cursor-pointer p-1 mt-1">
                <input
                  type="checkbox"
                  checked={!!formState[field.label]}
                  onChange={(e) => setFormState({ ...formState, [field.label]: e.target.checked })}
                  className="w-5 h-5 rounded border-2 text-[#6750a4] focus:ring-0"
                />
                <span className={`text-[14px] ${isDark ? "text-[#e6e1e5]" : "text-[#49454f]"}`}>Aktif</span>
              </label>
            ) : (
              <input
                type={field.type === "number" ? "number" : "text"}
                value={formState[field.label] || ""}
                onChange={(e) => setFormState({ ...formState, [field.label]: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-t-lg border-b-2 text-[15px] outline-none transition-all ${
                  isDark
                    ? "bg-[#383541] border-[#cac4d0] text-[#e6e1e5] focus:border-[#d0bcff]"
                    : "bg-[#e8e7ef] border-[#49454f] text-[#1c1b1f] focus:border-[#6750a4]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex flex-row-reverse gap-2 justify-start items-center">
        <button
          type="submit"
          className={`h-10 px-5 rounded-full text-[14px] font-medium tracking-wide transition-colors whitespace-nowrap flex-shrink-0 ${
            isDark
              ? "text-[#d0bcff] hover:bg-[#383541] active:bg-[#49454f]"
              : "text-[#6750a4] hover:bg-[#e8e7ef] active:bg-[#dcdbe4]"
          }`}
        >
          {submitButton}
        </button>
        {cancelButton && (
          <button
            type="button"
            onClick={handleCancel}
            className={`h-10 px-4 rounded-full text-[14px] font-medium tracking-wide transition-colors whitespace-nowrap flex-shrink-0 ${
              isDark
                ? "text-[#cac4d0] hover:bg-[#383541]/50"
                : "text-[#49454f] hover:bg-[#e8e7ef]/50"
            }`}
          >
            {cancelButton}
          </button>
        )}
      </div>
    </form>
  );
};

// Unified Wrapper Native Form Container
export const NativeForm: React.FC<NativeFormProps> = (props) => {
  const { platform, ...otherProps } = props;

  switch (platform) {
    case "macos":
      return <MacForm {...otherProps} />;
    case "windows":
      return <WindowsForm {...otherProps} />;
    case "android":
      return <AndroidForm {...otherProps} />;
    default:
      return <MacForm {...otherProps} />;
  }
};
