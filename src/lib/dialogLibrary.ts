"use client";

import { defineComponent, createLibrary, type PromptOptions } from "@openuidev/react-lang";
import { z } from "zod";
import { MacDialog, WindowsDialog, AndroidDialog, NativeDialog } from "../components/NativeDialogs";
import { NativeForm } from "../components/NativeForms";

// Factory for Dialog Zod schemas to prevent deduplication in Zod-to-JSON-Schema
const makeDialogSchema = () => z.object({
  title: z.string().optional().describe("Main title of the dialog window"),
  message: z.string().optional().describe("Description or body text explaining the alert details"),
  icon: z.enum(["info", "warning", "error", "question", "success"]).optional().default("info").describe("Icon style to display (info, warning, error, question, success)"),
  primaryButton: z.string().describe("Label of the main action button (e.g., Save, OK, Delete)"),
  secondaryButton: z.string().optional().describe("Label of the alternative action button (e.g., Don't Save, No)"),
  cancelButton: z.string().optional().describe("Label of the cancel button (usually cancels the operation)"),
  theme: z.enum(["light", "dark"]).optional().default("light").describe("Color theme of the dialog window (light or dark)"),
  inputPlaceholder: z.string().optional().describe("Placeholder of a text input inside the dialog if user input is requested"),
});

// 1. macOS Alert Dialog
export const MacDialogComponent = defineComponent({
  name: "MacDialog",
  description: "A macOS styled native alert dialog. Follows Apple Human Interface Guidelines. Rounded card with traffic light symbols, big central icon, and stacked action buttons.",
  props: makeDialogSchema(),
  component: ({ props }) => MacDialog(props),
});

// 2. Windows 11 Dialog
export const WindowsDialogComponent = defineComponent({
  name: "WindowsDialog",
  description: "A Windows 11 styled native dialog. Follows Fluent Design System. Rectangular card with title bar, close button, and horizontal action buttons.",
  props: makeDialogSchema(),
  component: ({ props }) => WindowsDialog(props),
});

// 3. Android Material 3 Dialog
export const AndroidDialogComponent = defineComponent({
  name: "AndroidDialog",
  description: "An Android Material 3 styled native dialog. Very rounded corners (28px), Roboto typography, optional top-centered icon, and flat text action buttons at the bottom-right.",
  props: makeDialogSchema(),
  component: ({ props }) => AndroidDialog(props),
});

// 4. Unified Native Dialog (allows switching target OS dynamically via 'platform' prop)
export const NativeDialogComponent = defineComponent({
  name: "NativeDialog",
  description: "A multi-platform native-like dialog which renders macOS, Windows, or Android style dialog depending on the 'platform' property.",
  props: z.object({
    platform: z.enum(["macos", "windows", "android"]).describe("The operating system style to mimic (macos, windows, or android)"),
    title: z.string().optional().describe("Main title of the dialog window"),
    message: z.string().optional().describe("Description or body text explaining the alert details"),
    icon: z.enum(["info", "warning", "error", "question", "success"]).optional().default("info").describe("Icon style to display (info, warning, error, question, success)"),
    primaryButton: z.string().describe("Label of the main action button"),
    secondaryButton: z.string().optional().describe("Label of the alternative action button"),
    cancelButton: z.string().optional().describe("Label of the cancel button"),
    theme: z.enum(["light", "dark"]).optional().default("light").describe("Color theme of the dialog window"),
    inputPlaceholder: z.string().optional().describe("Placeholder of a text input inside the dialog if user input is requested"),
  }),
  component: ({ props }) => NativeDialog(props),
});

// 5. Unified Native Form Component
export const NativeFormComponent = defineComponent({
  name: "NativeForm",
  description: "A multi-platform native-looking form panel that allows entering multi-field data using various input types.",
  props: z.object({
    platform: z.enum(["macos", "windows", "android"]).describe("The operating system style to mimic (macos, windows, or android)"),
    title: z.string().describe("Main title of the form window"),
    fields: z.string().describe("Semicolon-separated list of form fields with field types in parentheses. Supported types: text, number, textarea, checkbox, select: option1, option2. E.g. 'Adı (text); Tutar (number)'"),
    submitButton: z.string().describe("Label of the main submit action button"),
    cancelButton: z.string().optional().describe("Label of the cancel button"),
    theme: z.enum(["light", "dark"]).optional().default("light").describe("Color theme of the form window"),
  }),
  component: ({ props }) => NativeForm(props),
});

// Compile into a single library
export const dialogLibrary = createLibrary({
  components: [
    MacDialogComponent,
    WindowsDialogComponent,
    AndroidDialogComponent,
    NativeDialogComponent,
    NativeFormComponent,
  ],
});

export const dialogPromptOptions: PromptOptions = {
  preamble: `You are an expert user interface agent that designs pixel-perfect native dialog windows and forms.
Your goal is to output clean OpenUI Lang markup representing the dialog or form requested by the user.
You can output specific dialogs: MacDialog, WindowsDialog, or AndroidDialog, or the unified NativeDialog and NativeForm components.
Always match the user's specific context with professional titles, detailed copy, correct field types, and proper button combinations.`,
  additionalRules: [
    "You can generate either a dialog using 'NativeDialog' or a full-width settings form using 'NativeForm'.",
    "For forms, 'NativeForm' takes the positional arguments: platform, title, fields, submitButton, cancelButton, theme.",
    "The 'fields' argument is a semicolon-separated list describing inputs: name followed by type in parentheses. E.g., 'Name (text); Age (number); Choice (select: Yes, No); Opt-in (checkbox)'.",
    "Ensure types used in NativeForm fields are exactly one of: text, number, textarea, checkbox, select: option1, option2.",
  ],
  examples: [
    // Example 1: macOS File Save Dialog
    `root = MacDialog("Do you want to save changes to Document?", "Your changes will be lost if you don't save them.", "question", "Save", "Don't Save", "Cancel", "light")`,
    // Example 2: Windows Delete Dialog
    `root = WindowsDialog("Delete File", "Are you sure you want to permanently delete 'financial_report.xlsx'?", "warning", "Delete", null, "Cancel", "dark")`,
    // Example 3: Android Permission Dialog
    `root = AndroidDialog("Allow camera access?", "This app requires camera permission to scan QR codes and set your profile picture.", "info", "Allow", null, "Don't allow", "light")`,
    // Example 4: Unified Native Dialog
    `root = NativeDialog("macos", "Network Connection Lost", "Please check your Wi-Fi or cellular network settings and try again.", "error", "Retry", null, "Close", "light")`,
    // Example 5: Native Dialog with Text Input
    `root = NativeDialog("macos", "Create Folder", "Enter a name for the new folder:", "info", "Create", null, "Cancel", "light", "Folder Name")`,
    // Example 6: Native Form with multiple field types
    `root = NativeForm("macos", "Yeni Fatura Kaydı", "Fatura Adı (text); Tutar (number); Firma (text); Kategori (select: Ulaşım, Yemek, Diğer); Açıklama (textarea); E-posta ile bildir (checkbox)", "Kaydet", "İptal", "light")`
  ],
};
