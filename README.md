# Stroke Recovery Hub

An intelligent, accessible, full-stack rehabilitation assistant designed to empower stroke survivors and support caregivers. Featuring tailored physical & cognitive exercises, real-time safety monitoring, medication logging, an interactive empathetic AI Coach, and a dedicated caregiver portal.

---

## 🌟 Key Features

### 1. Patient Workspace
- **Tailored Exercise Routines**: Guided visual exercises targeting motor, fine motor, speech, and cognitive rehabilitation, complete with difficulty levels, step-by-step instructions, and countdown timers.
- **AI Coach with Safety Monitoring**: Interactive text/voice coaching powered by Google Gemini, equipped with automatic alert triggering for pain symptoms or physical fatigue.
- **Medication Tracker**: Quick logging and scheduling for daily medications to ensure full adherence.
- **Accessibility Controls**: Native toggleable adjustments for **High Contrast mode**, **Large Text sizing**, and **Voice-Assisted read-alouds** to support seniors and those with physical/visual impairments.

### 2. Caregiver Remote Dashboard
- **Patient Monitoring**: Link multiple patient profiles using secure connection codes.
- **Progress Tracking**: View complete rehabilitation analytics with dynamic charts displaying daily activity levels, completions, and emotional logs.
- **Real-Time Safety Alerts**: Caregivers receive instant active warnings if a patient reports pain, high fatigue, or triggers an emergency event.
- **Medication Management**: Remotely view and log patient medication completion schedules.

---

## 🛠️ Tech Stack

- **Frontend**: React 18 with Vite, TypeScript, and Tailwind CSS.
- **Animations**: Framer Motion for gentle, accessible micro-interactions.
- **Analytics & Charts**: Recharts for performance reporting.
- **Backend**: Express (Node.js) with tsx/esbuild bundling pipeline.
- **AI Integration**: Google Gemini API via Node.js server proxy for maximum key security.
- **Storage**: Clean server-side in-memory JSON state representation (`db.json`) supporting realistic REST APIs.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **Google Gemini API Key** (for active coaching and AI summaries)

### Environment Setup

Create a `.env` file in the root directory (based on `.env.example`):

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Installation

Install all required npm packages:

```bash
npm install
```

### Running the Development Server

Start the full-stack development server (Express backend + Vite middleware proxy):

```bash
npm run dev
```

The application will be accessible at: `http://localhost:3000`

### Building for Production

Compile both client-side static assets and the server bundle:

```bash
npm run build
```

This generates:
1. Static web assets in `dist/`
2. A single bundled CJS server file in `dist/server.cjs` via `esbuild` for optimal performance.

To start the production server:

```bash
npm run start
```

---

## 🛡️ Safety & Clinical Disclaimer

**Stroke Recovery Hub** is designed as a support and motivation tool for home-based stroke rehabilitation. It is **not** a substitute for professional clinical advice, diagnosis, physical therapy, or emergency medical services. Patients should always consult with their primary healthcare provider or neurologist before commencing any new exercise regimen.
