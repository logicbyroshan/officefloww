# 17 — Voice Mode & Natural Language UX

The Voice Assistant Bar (`VoiceAssistantBar.tsx`) brings conversational telemetry to the desktop application:

---

## 1. Context-Aware Inquiries

The voice interface automatically adapts its suggestions based on the user's active workspace:
- **In Dashboard**: `"What needs my attention?"`, `"Show today's operational summary"`
- **In Tasks**: `"Show overdue tasks"`, `"Filter by production line"`, `"Show Priya's pending work"`
- **In Stock**: `"How much PVC Sheet is available?"`, `"Show low stock alerts"`
- **In Staff**: `"Who is available for fitting?"`, `"Inspect defect rates"`
- **In Clients**: `"Find St. Xavier's High School"`, `"Check proof status"`
- **In Billing**: `"What are total collections today?"`, `"List overdue invoices"`

---

## 2. Audio & Keyboard Triggering

- Click the `🎙 Voice` button in the top bar.
- Or press `Ctrl + Shift + V` from anywhere in the application.
- Uses Chromium Web Speech API (`webkitSpeechRecognition`) in Indian English (`en-IN`) with seamless text input fallback.
