# Stroke Recovery Hub

An intelligent, accessible, full-stack rehabilitation assistant designed to empower stroke survivors and support caregivers. Featuring tailored physical & cognitive exercises, real-time safety monitoring, AI-powered coaching, and caregiver dashboards.

---

## 🌟 Key Features

### 1. Patient Workspace
- **Tailored Exercise Routines**: Guided visual exercises targeting motor, fine motor, speech, and cognitive rehabilitation, complete with difficulty levels, step-by-step instructions, and countdown timers.
- **AI Coach with Safety Monitoring**: Interactive text/voice coaching powered by Google Gemini, equipped with automatic alert triggering for pain symptoms or physical fatigue.
- **Medication Tracker**: Quick logging and scheduling for daily medications to ensure full adherence.
- **Accessibility Controls**: Native toggleable adjustments for **High Contrast mode**, **Large Text sizing**, and **Voice-Assisted read-alouds** to support seniors and those with physical/visual impairments.
- **Progress Dashboard**: Visual charts and statistics tracking daily activities, exercise completions, and emotional wellness logs.

### 2. Caregiver Remote Dashboard
- **Patient Monitoring**: Link multiple patient profiles using secure connection codes.
- **Progress Tracking**: View complete rehabilitation analytics with dynamic charts displaying daily activity levels, completions, and emotional logs.
- **Real-Time Safety Alerts**: Caregivers receive instant active warnings if a patient reports pain, high fatigue, or triggers an emergency event.
- **Medication Management**: Remotely view and log patient medication completion schedules.
- **Communication Hub**: Secure messaging between caregivers and patients.

---

## 🛠️ Tech Stack

- **Frontend**: React 18 with Vite, TypeScript, and Tailwind CSS.
- **Animations**: Framer Motion for gentle, accessible micro-interactions.
- **Analytics & Charts**: Recharts for performance reporting.
- **Backend**: Express (Node.js) with tsx/esbuild bundling pipeline.
- **AI Integration**: Google Gemini API via Node.js server proxy for maximum key security.
- **Storage**: Clean server-side in-memory JSON state representation (`db.json`) supporting realistic REST APIs.
- **Text-to-Speech**: Web Speech API for voice-assisted read-alouds.
- **Authentication**: JWT-based session management with secure connection codes.

---

## 📁 Project Structure

```
STROKE-CARE-HUB/
├── src/
│   ├── components/
│   │   ├── patient/           # Patient workspace components
│   │   │   ├── ExerciseList.tsx
│   │   │   ├── ExerciseDetail.tsx
│   │   │   ├── MedicationTracker.tsx
│   │   │   ├── AICoach.tsx
│   │   │   └── ProgressDashboard.tsx
│   │   ├── caregiver/         # Caregiver dashboard components
│   │   │   ├── PatientMonitor.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── AlertCenter.tsx
│   │   │   └── PatientLink.tsx
│   │   ├── shared/            # Shared UI components
│   │   │   ├── AccessibilityMenu.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── Alert.tsx
│   │   └── auth/              # Authentication components
│   │       ├── Login.tsx
│   │       └── Register.tsx
│   ├── pages/
│   │   ├── PatientDashboard.tsx
│   │   ├── CaregiverDashboard.tsx
│   │   ├── ExerciseSession.tsx
│   │   └── Settings.tsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useExercises.ts
│   │   └── useAccessibility.ts
│   ├── utils/                 # Utility functions
│   │   ├── api.ts
│   │   ├── gemini.ts
│   │   ├── accessibility.ts
│   │   └── validators.ts
│   ├── styles/                # Global styles
│   │   └── globals.css
│   ├── types/                 # TypeScript type definitions
│   │   ├── patient.ts
│   │   ├── exercise.ts
│   │   └── caregiver.ts
│   ├── App.tsx
│   └── main.tsx
├── server/
│   ├── routes/
│   │   ├── auth.ts            # Authentication endpoints
│   │   ├── patients.ts        # Patient data management
│   │   ├── exercises.ts       # Exercise endpoints
│   │   ├── medications.ts     # Medication tracking
│   │   ├── alerts.ts          # Safety alert system
│   │   └── caregivers.ts      # Caregiver endpoints
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── services/
│   │   ├── geminiService.ts   # Google Gemini AI integration
│   │   ├── alertService.ts    # Alert logic
│   │   └── storageService.ts  # Data persistence
│   ├── db.json                # In-memory database
│   └── server.ts              # Express server entry point
├── dist/                      # Production build output
├── public/                    # Static assets
├── .env.example               # Environment template
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn installed
- Google Gemini API key

### Environment Setup

Create a `.env` file in the root directory based on `.env.example`:

```env
# Backend Server
VITE_API_BASE_URL=http://localhost:3000/api

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Database
DATABASE_FILE=./server/db.json

# Session & Security
SESSION_SECRET=your_secure_random_string_here
JWT_EXPIRY=7d
```

### Installation

Install all required npm packages:

```bash
npm install
```

### Running the Development Server

Start the full-stack development server (Express backend + Vite frontend):

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

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (patient or caregiver)
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Patient Endpoints
- `GET /api/patients/:id` - Get patient profile
- `PUT /api/patients/:id` - Update patient profile
- `GET /api/patients/:id/exercises` - Get assigned exercises
- `POST /api/patients/:id/exercises/:exerciseId/complete` - Mark exercise as complete
- `GET /api/patients/:id/progress` - Get progress analytics

### Exercise Endpoints
- `GET /api/exercises` - Get all available exercises
- `GET /api/exercises/:id` - Get exercise details
- `POST /api/exercises/:id/log` - Log exercise attempt with performance metrics

### Medication Endpoints
- `GET /api/patients/:id/medications` - Get medication schedule
- `POST /api/patients/:id/medications` - Add medication
- `PUT /api/patients/:id/medications/:medId` - Update medication log
- `DELETE /api/patients/:id/medications/:medId` - Remove medication

### Alert Endpoints
- `GET /api/alerts` - Get active alerts
- `POST /api/alerts` - Create new alert (triggered by patient or system)
- `PUT /api/alerts/:alertId/acknowledge` - Mark alert as acknowledged

### Caregiver Endpoints
- `GET /api/caregivers/:id/patients` - Get list of linked patients
- `POST /api/caregivers/:id/link-patient` - Link to a patient using code
- `GET /api/caregivers/:id/analytics` - Get aggregated analytics
- `GET /api/caregivers/:id/alerts` - Get caregiver alerts

### AI Coach Endpoints
- `POST /api/ai/chat` - Send message to AI coach
- `POST /api/ai/analyze-symptoms` - Analyze patient symptoms for safety alerts

---

## 🛡️ Safety & Clinical Disclaimer

**Stroke Recovery Hub** is designed as a support and motivation tool for home-based stroke rehabilitation. It is **not** a substitute for professional clinical advice, diagnosis, physical therapy, medical treatment, or emergency medical services.

**Important Safety Guidelines:**
- Always consult with healthcare professionals before starting any new rehabilitation program.
- In case of emergency or severe symptoms, immediately contact emergency services (911 in the USA).
- The AI coach provides general guidance only—medical decisions should be made with professional healthcare providers.
- Real-time alerts are designed to notify caregivers but should not replace direct patient supervision when needed.

---

## 🔐 Security & Privacy

- **Data Encryption**: All sensitive patient data is encrypted at rest and in transit.
- **HIPAA Compliance**: Designed with HIPAA-compliant data handling practices in mind.
- **Secure Connection Codes**: Caregivers link to patients using one-time, time-limited connection codes.
- **JWT Authentication**: Token-based authentication with automatic session expiry.
- **API Key Protection**: Gemini API keys stored server-side only—never exposed to client.

---

## 🤝 Contributing

We welcome contributions to improve stroke recovery support. Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support & Resources

- **Documentation**: Check `/docs` folder for detailed guides
- **FAQ**: See `FAQ.md` for common questions
- **Issues**: Report bugs or request features on GitHub Issues
- **Email Support**: For urgent matters, contact the team

### Stroke Recovery Resources
- [American Stroke Association](https://www.stroke.org/)
- [National Stroke Association](https://www.stroke.org/)
- [Stroke Recovery Resources by CDC](https://www.cdc.gov/stroke/)

---

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.

---

## 🙏 Acknowledgments

- Built with compassion for stroke survivors and their caregivers
- Powered by Google Gemini AI
- Inspired by rehabilitation best practices and accessibility standards (WCAG 2.1)

---

**Last Updated**: July 2024  
**Version**: 1.0.0-alpha
