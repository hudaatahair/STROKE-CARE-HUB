import express from "express";
import path from "path";
import fs from "fs/promises";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI Coach will operate in fallback mode.");
}

app.use(express.json());

// JSON File Database Setup
interface User {
  uid: string;
  email: string;
  role: "patient" | "caregiver";
}

interface Profile {
  patient_id: string;
  age: number;
  affected_side: "left" | "right" | "none";
  recovery_stage: "early" | "mid" | "late";
  mobility_level: "low" | "medium" | "high";
  last_active: number;
  caregiver_code: string;
  accessibility_high_contrast: boolean;
  accessibility_large_text: boolean;
}

interface ProgressLog {
  record_id: string;
  patient_id: string;
  exercise_id: string;
  exercise_name: string;
  status: "complete";
  timestamp: number;
  slot: "morning" | "afternoon" | "evening";
}

interface Message {
  msg_id: string;
  patient_id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: number;
  is_alert: boolean;
}

interface Medication {
  med_id: string;
  patient_id: string;
  name: string;
  dosage: string;
  time: string; // e.g., "08:00 AM" or "08:00 PM"
}

interface MedLog {
  log_id: string;
  patient_id: string;
  med_name: string;
  status: "taken" | "snoozed";
  timestamp: number;
}

interface CaregiverLink {
  caregiver_id: string;
  patient_id: string;
}

interface DBState {
  users: Record<string, User>;
  profiles: Record<string, Profile>;
  progress: ProgressLog[];
  messages: Message[];
  meds: Medication[];
  medLogs: MedLog[];
  caregiverLinks: CaregiverLink[];
}

const DEFAULT_DB_STATE: DBState = {
  users: {},
  profiles: {},
  progress: [],
  messages: [],
  meds: [],
  medLogs: [],
  caregiverLinks: [],
};

// Helper functions for DB reading/writing with improved error handling
async function readDB(): Promise<DBState> {
  try {
    const content = await fs.readFile(DB_FILE, "utf-8");
    try {
      return JSON.parse(content);
    } catch (parseErr) {
      console.error("Invalid JSON in db.json, resetting to default state:", parseErr);
      await writeDB(DEFAULT_DB_STATE);
      return DEFAULT_DB_STATE;
    }
  } catch (err: unknown) {
    // File doesn't exist or can't be read, create default
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      console.log("db.json not found, creating new database file");
      await writeDB(DEFAULT_DB_STATE);
      return DEFAULT_DB_STATE;
    }
    console.error("Error reading db.json:", err);
    return DEFAULT_DB_STATE;
  }
}

async function writeDB(state: DBState): Promise<void> {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to db.json:", err);
    throw new Error(`Failed to save database: ${err}`);
  }
}

// Generate unique ID
function generateId(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate caregiver code
function generateCaregiverCode(): string {
  return "SC-" + Math.floor(1000 + Math.random() * 9000).toString();
}

// Seed medications for a patient if none exist
function getInitialMeds(patientId: string): Medication[] {
  return [
    {
      med_id: generateId("med"),
      patient_id: patientId,
      name: "Aspirin (Blood thinner)",
      dosage: "81mg - 1 Tablet",
      time: "08:00 AM",
    },
    {
      med_id: generateId("med"),
      patient_id: patientId,
      name: "Atorvastatin (Cholesterol)",
      dosage: "20mg - 1 Tablet",
      time: "08:00 PM",
    },
  ];
}

// Error handler middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error", details: err.message });
});

// ================= API ENDPOINTS =================

// Auth: Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: "Email and role are required." });
    }

    const db = await readDB();
    const existingUser = Object.values(db.users).find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email." });
    }

    const uid = generateId("user");
    const newUser: User = { uid, email, role };
    db.users[uid] = newUser;

    if (role === "patient") {
      // Create initial profile for patient
      const newProfile: Profile = {
        patient_id: uid,
        age: 65,
        affected_side: "right",
        recovery_stage: "mid",
        mobility_level: "medium",
        last_active: Date.now(),
        caregiver_code: generateCaregiverCode(),
        accessibility_high_contrast: false,
        accessibility_large_text: false,
      };
      db.profiles[uid] = newProfile;
      
      // Create some initial medications
      const initialMeds = getInitialMeds(uid);
      db.meds.push(...initialMeds);
    }

    await writeDB(db);
    res.json({ user: newUser });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Auth: Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const db = await readDB();
    const user = Object.values(db.users).find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Automatically register if not found to provide a seamless preview login!
      const uid = generateId("user");
      const newUser: User = { uid, email, role: "patient" };
      db.users[uid] = newUser;

      const newProfile: Profile = {
        patient_id: uid,
        age: 68,
        affected_side: "right",
        recovery_stage: "mid",
        mobility_level: "medium",
        last_active: Date.now(),
        caregiver_code: generateCaregiverCode(),
        accessibility_high_contrast: false,
        accessibility_large_text: false,
      };
      db.profiles[uid] = newProfile;
      
      const initialMeds = getInitialMeds(uid);
      db.meds.push(...initialMeds);

      await writeDB(db);
      return res.json({ user: newUser, autoRegistered: true });
    }

    res.json({ user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get User Profile
app.get("/api/profiles/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await readDB();
    const profile = db.profiles[userId];
    if (!profile) {
      return res.status(404).json({ error: "Profile not found." });
    }

    // Find linked caregivers
    const caregiverIds = db.caregiverLinks
      .filter((link) => link.patient_id === userId)
      .map((link) => link.caregiver_id);
    const linkedCaregivers = caregiverIds
      .map((cid) => db.users[cid]?.email)
      .filter(Boolean);

    res.json({
      ...profile,
      linkedCaregivers,
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update User Profile
app.post("/api/profiles/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const db = await readDB();
    
    if (!db.profiles[userId]) {
      return res.status(404).json({ error: "Profile not found." });
    }

    db.profiles[userId] = {
      ...db.profiles[userId],
      ...updates,
      last_active: Date.now(),
    };

    await writeDB(db);
    res.json(db.profiles[userId]);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Get Exercise Progress
app.get("/api/progress/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await readDB();
    const logs = db.progress.filter((log) => log.patient_id === userId);
    res.json(logs);
  } catch (err) {
    console.error("Get progress error:", err);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

// Log Exercise Completion
app.post("/api/progress/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { exerciseId, exerciseName, slot } = req.body;
    
    if (!exerciseId || !exerciseName || !slot) {
      return res.status(400).json({ error: "Missing exercise details." });
    }

    const db = await readDB();
    
    const log: ProgressLog = {
      record_id: generateId("record"),
      patient_id: userId,
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      status: "complete",
      timestamp: Date.now(),
      slot,
    };

    db.progress.push(log);
    if (db.profiles[userId]) {
      db.profiles[userId].last_active = Date.now();
    }

    await writeDB(db);
    res.json(log);
  } catch (err) {
    console.error("Log progress error:", err);
    res.status(500).json({ error: "Failed to log progress" });
  }
});

// Get Chat Messages
app.get("/api/messages/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await readDB();
    const messages = db.messages.filter((msg) => msg.patient_id === userId);
    res.json(messages);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Clear and Resolve Active Alerts for Patient
app.post("/api/messages/:userId/clear-alerts", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await readDB();
    let updated = false;
    db.messages = db.messages.map((msg) => {
      if (msg.patient_id === userId && msg.is_alert) {
        updated = true;
        return { ...msg, is_alert: false };
      }
      return msg;
    });
    if (updated) {
      await writeDB(db);
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Clear alerts error:", err);
    res.status(500).json({ error: "Failed to clear alerts" });
  }
});

// Send Message to AI Rehabilitation Coach
app.post("/api/messages/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Message text is required." });
    }

    const db = await readDB();
    
    // Create user message log
    const userMessage: Message = {
      msg_id: generateId("msg"),
      patient_id: userId,
      sender: "user",
      text,
      timestamp: Date.now(),
      is_alert: false,
    };

    db.messages.push(userMessage);

    // Safety Red Flag Keyword Trigger Checks
    const redFlags = ["chest pain", "faint", "severe numbness", "droop", "facial drooping", "shortness of breath", "severe headache", "dizzy", "stroke", "paralyzed", "can't breathe"];
    const containsRedFlag = redFlags.some((flag) => text.toLowerCase().includes(flag));

    if (containsRedFlag) {
      const alertMessage: Message = {
        msg_id: generateId("msg"),
        patient_id: userId,
        sender: "ai",
        text: "!!!EMERGENCY ALERT!!! Please stop exercising immediately and call 911 or your local emergency services. You are experiencing critical warning signs that require urgent medical attention.",
        timestamp: Date.now(),
        is_alert: true,
      };
      db.messages.push(alertMessage);
      await writeDB(db);
      return res.json({ userMessage, aiMessage: alertMessage });
    }

    // Retrieve context
    const profile = db.profiles[userId] || {
      age: 65,
      affected_side: "right",
      recovery_stage: "mid",
      mobility_level: "medium",
    };

    const today = new Date().toDateString();
    const patientProgress = db.progress.filter(
      (log) => log.patient_id === userId && new Date(log.timestamp).toDateString() === today
    );
    const completedToday = patientProgress.map((log) => log.exercise_name);

    // Fallback if AI cannot initialize or API key is missing
    let aiText = "";
    if (!ai) {
      // Empathetic fallback response
      aiText = `Hi there! I am your rehabilitation assistant. Thank you for sharing. Based on your mobility level (${profile.mobility_level}) and stage (${profile.recovery_stage}), please make sure to take regular breaks and listen to your body.`;
    } else {
      try {
        // Gather last 4 chat history messages for short conversational memory
        const recentChat = db.messages
          .filter((msg) => msg.patient_id === userId)
          .slice(-6)
          .map((m) => `${m.sender === "user" ? "User" : "Coach"}: ${m.text}`)
          .join("\n");

        const systemInstruction = `You are Stroke Recovery Hub, a professional, gentle, and empathetic stroke rehabilitation assistant coach.
Guidelines:
1. Use simple, direct, 5th-grade level English so it's highly readable and accessible.
2. Be incredibly encouraging, practical, and gentle.
3. SAFETY: If the user mentions chest pain, shortness of breath, facial drooping, severe headache, or dizziness, your reply MUST start with '!!!EMERGENCY ALERT!!!' and advise calling 911 immediately.
4. Never prescribe medicine or diagnose conditions.
5. Suggest simple, practical exercise modifications (e.g., "Try doing this seated", "Use your stronger arm to guide your weak hand") if they express weakness or frustration.
6. Keep answers highly concise, comforting, and strictly under 100 words.

Patient Background context:
- Age: ${profile.age}
- Affected side of body: ${profile.affected_side} side
- Mobility level: ${profile.mobility_level}
- Stroke recovery stage: ${profile.recovery_stage}
- Completed exercises today: [${completedToday.join(", ") || "None yet today"}]`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `${recentChat}\nUser: ${text}`,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        aiText = response.text || "I am listening. Please take your time and rest if you need to.";
      } catch (err) {
        console.error("Gemini API error:", err);
        aiText = "I am here to support your rehabilitation. Let's work together safely, pace yourself, and rest whenever your muscles feel fatigued.";
      }
    }

    const aiMessage: Message = {
      msg_id: generateId("msg"),
      patient_id: userId,
      sender: "ai",
      text: aiText,
      timestamp: Date.now(),
      is_alert: aiText.startsWith("!!!EMERGENCY ALERT!!!"),
    };

    db.messages.push(aiMessage);
    await writeDB(db);

    res.json({ userMessage, aiMessage });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get Medications
app.get("/api/meds/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await readDB();
    const meds = db.meds.filter((m) => m.patient_id === userId);
    res.json(meds);
  } catch (err) {
    console.error("Get meds error:", err);
    res.status(500).json({ error: "Failed to fetch medications" });
  }
});

// Add Medication
app.post("/api/meds/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, dosage, time } = req.body;
    if (!name || !time) {
      return res.status(400).json({ error: "Medication name and time are required." });
    }

    const db = await readDB();
    const newMed: Medication = {
      med_id: generateId("med"),
      patient_id: userId,
      name,
      dosage: dosage || "As prescribed",
      time,
    };

    db.meds.push(newMed);
    await writeDB(db);
    res.json(newMed);
  } catch (err) {
    console.error("Add med error:", err);
    res.status(500).json({ error: "Failed to add medication" });
  }
});

// Log Medication Dose (Taken/Snoozed)
app.post("/api/meds/:userId/log", async (req, res) => {
  try {
    const { userId } = req.params;
    const { medName, status } = req.body;
    if (!medName || !status) {
      return res.status(400).json({ error: "Medication name and status are required." });
    }

    const db = await readDB();
    const log: MedLog = {
      log_id: generateId("medlog"),
      patient_id: userId,
      med_name: medName,
      status,
      timestamp: Date.now(),
    };

    db.medLogs.push(log);
    await writeDB(db);
    res.json(log);
  } catch (err) {
    console.error("Log med error:", err);
    res.status(500).json({ error: "Failed to log medication" });
  }
});

// Get Medication logs
app.get("/api/meds/:userId/logs", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = await readDB();
    const logs = db.medLogs.filter((log) => log.patient_id === userId);
    res.json(logs);
  } catch (err) {
    console.error("Get med logs error:", err);
    res.status(500).json({ error: "Failed to fetch medication logs" });
  }
});

// Caregiver: Link to Patient via Caregiver Code
app.post("/api/caregiver/link", async (req, res) => {
  try {
    const { caregiverId, caregiverCode } = req.body;
    if (!caregiverId || !caregiverCode) {
      return res.status(400).json({ error: "Caregiver ID and Caregiver Code are required." });
    }

    const db = await readDB();
    // Find patient by code
    const profile = Object.values(db.profiles).find(
      (p) => p.caregiver_code.toLowerCase().trim() === caregiverCode.toLowerCase().trim()
    );

    if (!profile) {
      return res.status(404).json({ error: "Invalid caregiver code. No matching patient found." });
    }

    // Check if link already exists
    const exists = db.caregiverLinks.some(
      (link) => link.caregiver_id === caregiverId && link.patient_id === profile.patient_id
    );

    if (!exists) {
      db.caregiverLinks.push({
        caregiver_id: caregiverId,
        patient_id: profile.patient_id,
      });
      await writeDB(db);
    }

    res.json({ success: true, patientId: profile.patient_id });
  } catch (err) {
    console.error("Caregiver link error:", err);
    res.status(500).json({ error: "Failed to link caregiver" });
  }
});

// Caregiver: List Linked Patients and Progress Summaries
app.get("/api/caregiver/patients/:caregiverId", async (req, res) => {
  try {
    const { caregiverId } = req.params;
    const db = await readDB();

    // Find linked patients
    const patientIds = db.caregiverLinks
      .filter((link) => link.caregiver_id === caregiverId)
      .map((link) => link.patient_id);

    const summaries = [];

    for (const patientId of patientIds) {
      const user = db.users[patientId];
      const profile = db.profiles[patientId];
      if (!user || !profile) continue;

      // Get exercise progress
      const progress = db.progress.filter((p) => p.patient_id === patientId);
      
      // Get med adherence logs
      const medLogs = db.medLogs.filter((l) => l.patient_id === patientId);

      // Get last active
      const lastActive = profile.last_active;
      const timeSinceLastActive = Date.now() - lastActive;
      const missedMoreThanTwoDays = timeSinceLastActive > 2 * 24 * 60 * 60 * 1000; // 48 hours

      // Check if the patient has any active emergency alerts
      const isEmergency = db.messages.some((msg) => msg.patient_id === patientId && msg.is_alert);

      // Generate summaries
      summaries.push({
        patientId,
        email: user.email,
        age: profile.age,
        affectedSide: profile.affected_side,
        recoveryStage: profile.recovery_stage,
        mobilityLevel: profile.mobility_level,
        lastActive,
        caregiverCode: profile.caregiver_code,
        progressCount: progress.length,
        medLogsCount: medLogs.length,
        missedMoreThanTwoDays,
        recentProgress: progress.slice(-5),
        medLogs: medLogs.slice(-5),
        isEmergency,
      });
    }

    res.json(summaries);
  } catch (err) {
    console.error("Get caregiver patients error:", err);
    res.status(500).json({ error: "Failed to fetch caregiver patients" });
  }
});

// ================= VITE OR STATIC SERVING =================

async function startServer() {
  try {
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
