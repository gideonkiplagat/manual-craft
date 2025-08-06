# 🌊 FlowToManual Frontend

FlowToManual is a productivity platform that captures user workflows via screen and DOM activity recording, generating intelligent manuals and test scripts tailored for **Business Analysts**, **Quality Engineers**, and **Developers**.

This repository contains the **frontend** application, built with React, Vite, and TypeScript.

---

## 🧱 Tech Stack

- **React** (TypeScript)
- **Vite** (Dev server & build tool)
- **TailwindCSS** (Utility-first styling)
- **ShadCN UI** (Component library)
- **JWT Authentication** (Flask backend)
- **Browser Extension** (DOM event integration)
- **RecordRTC / rrweb** (Screen & webcam recording)

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-org/flowtomanual-frontend.git
cd flowtomanual-frontend
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

---

## 🔐 Authentication & Roles

- Uses JWT-based authentication (token stored in `localStorage`)
- Fetches user role from `/api/auth/me`
- Conditionally renders features for:
    - **Business Analyst (BA)**
    - **Quality Engineer (QA)**
    - **Developer**

---

## 🔗 API Integration

- Communicates with a Flask backend via REST APIs

---

## 🎥 Recording Features

- Screen & webcam recording (RecordRTC / rrweb)
- Red border overlay during recording
- Timer and manual stop support
- Captures screenshots at event intervals
- Linked to a browser extension for DOM event capture

---

## 📝 Manual Generation

- Users select their role (BA, QA, Developer)
- Choose from available recordings
- Generate documentation in PDF, Word, or Excel formats
- Integrates with RAG to include SOPs in outputs

---

## 🧩 Browser Extension Sync

- Logs DOM events from a browser extension running in the background
- Events sent to `/events/log` with `recording_id`
- Frontend passes `recording_id` to both extension and backend to tie sessions together
- Preview events in the session dashboard (optional)

---

---
## 📘 SOP (Standard Operating Procedure) Upload

Each user can **optionally upload their own SOP documents** to help generate accurate and personalized manuals or test scripts.

### ✅ Purpose
- Personal SOPs allow the AI manual generator to **reference your preferred workflow**
- RAG system gives **priority** to personal SOPs over global/default ones
- Great for teams with different processes for similar software

### 📤 How It Works

| Action                 | Notes                                             |
|------------------------|---------------------------------------------------|
| Upload SOP             | plain text format supported         |
| View/Delete SOP        | Manage your uploaded SOPs from the dashboard      |
| AI RAG Integration     | Personal SOPs → Team SOPs → Global SOPs (fallback)|
| Admin Not Required     | Any authenticated user can upload without approval|


### 📁 Example Upload Flow

1. User logs in
2. Navigates to **"My SOPs"** tab
3. Clicks **"Upload SOP"** → selects a `.docx` or `.pdf`
4. SOP is stored and indexed for retrieval-augmented generation (RAG)

> **Important:** The AI uses these SOPs only during **manual generation**, matching uploaded documents to tasks/events/screenshots during a session.
---

## 🏗️ Build for Production

```bash
npm run build
```

---

## 📄 License

[MIT](LICENSE)
