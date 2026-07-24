import React, { useState, useEffect } from 'react'
import { Heart, Activity, Pill, AlertCircle, LogOut } from 'lucide-react'

interface User {
  uid: string
  email: string
  role: 'patient' | 'caregiver'
}

interface Profile {
  patient_id: string
  age: number
  affected_side: 'left' | 'right' | 'none'
  recovery_stage: 'early' | 'mid' | 'late'
  mobility_level: 'low' | 'medium' | 'high'
  last_active: number
  caregiver_code: string
  accessibility_high_contrast: boolean
  accessibility_large_text: boolean
}

interface Message {
  msg_id: string
  patient_id: string
  sender: 'user' | 'ai'
  text: string
  timestamp: number
  is_alert: boolean
}

interface Medication {
  med_id: string
  patient_id: string
  name: string
  dosage: string
  time: string
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'meds' | 'progress'>('dashboard')
  const [email, setEmail] = useState('')
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(false)

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
        await fetchProfile(data.user.uid)
      }
    } catch (err) {
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/profiles/${userId}`)
      const data = await res.json()
      setProfile(data)
      await Promise.all([
        fetchMessages(userId),
        fetchMedications(userId),
      ])
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }

  // Fetch messages
  const fetchMessages = async (userId: string) => {
    try {
      const res = await fetch(`/api/messages/${userId}`)
      const data = await res.json()
      setMessages(data)
    } catch (err) {
      console.error('Error fetching messages:', err)
    }
  }

  // Fetch medications
  const fetchMedications = async (userId: string) => {
    try {
      const res = await fetch(`/api/meds/${userId}`)
      const data = await res.json()
      setMedications(data)
    } catch (err) {
      console.error('Error fetching medications:', err)
    }
  }

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !user) return

    setLoading(true)
    try {
      const res = await fetch(`/api/messages/${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText }),
      })
      const data = await res.json()
      if (data.userMessage && data.aiMessage) {
        setMessages([...messages, data.userMessage, data.aiMessage])
        setMessageText('')
      }
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setLoading(false)
    }
  }

  // Logout handler
  const handleLogout = () => {
    setUser(null)
    setProfile(null)
    setMessages([])
    setMedications([])
    setEmail('')
    setActiveTab('dashboard')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Heart className="w-8 h-8 text-red-500 mr-2" />
            <h1 className="text-2xl font-bold text-gray-800">Stroke Recovery Hub</h1>
          </div>
          <p className="text-gray-600 text-center mb-6">
            Your personalized stroke rehabilitation companion
          </p>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login / Sign Up'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Heart className="w-6 h-6 text-red-500 mr-2" />
            <h1 className="text-xl font-bold text-gray-800">Stroke Recovery Hub</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 flex gap-8">
          {(['dashboard', 'chat', 'meds', 'progress'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 font-medium transition ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab === 'dashboard' && 'Dashboard'}
              {tab === 'chat' && 'AI Coach'}
              {tab === 'meds' && 'Medications'}
              {tab === 'progress' && 'Progress'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && profile && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4">Your Profile</h2>
              <div className="space-y-3">
                <p><span className="font-semibold">Age:</span> {profile.age}</p>
                <p><span className="font-semibold">Affected Side:</span> {profile.affected_side}</p>
                <p><span className="font-semibold">Recovery Stage:</span> {profile.recovery_stage}</p>
                <p><span className="font-semibold">Mobility Level:</span> {profile.mobility_level}</p>
                <p><span className="font-semibold">Caregiver Code:</span> {profile.caregiver_code}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-green-500" />
                  <span>Messages: {messages.length}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Pill className="w-5 h-5 text-blue-500" />
                  <span>Medications: {medications.length}</span>
                </div>
                {messages.some((m) => m.is_alert) && (
                  <div className="flex items-center gap-3 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span>Active Alerts</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Coach Tab */}
        {activeTab === 'chat' && user && (
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
            <h2 className="text-lg font-bold mb-4">AI Rehabilitation Coach</h2>
            <div className="h-96 overflow-y-auto bg-gray-50 rounded p-4 mb-4">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Start a conversation with your AI coach</p>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.msg_id}
                      className={`p-3 rounded ${
                        msg.sender === 'user'
                          ? 'bg-blue-100 ml-8'
                          : msg.is_alert
                          ? 'bg-red-100'
                          : 'bg-green-100 mr-8'
                      }`}
                    >
                      <p className="text-sm font-semibold mb-1">
                        {msg.sender === 'user' ? 'You' : 'Coach'}
                      </p>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Ask your coach..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* Medications Tab */}
        {activeTab === 'meds' && (
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
            <h2 className="text-lg font-bold mb-4">Your Medications</h2>
            {medications.length === 0 ? (
              <p className="text-gray-500">No medications added yet.</p>
            ) : (
              <div className="space-y-3">
                {medications.map((med) => (
                  <div key={med.med_id} className="p-4 border border-gray-200 rounded-lg">
                    <p className="font-semibold">{med.name}</p>
                    <p className="text-sm text-gray-600">Dosage: {med.dosage}</p>
                    <p className="text-sm text-gray-600">Time: {med.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
            <h2 className="text-lg font-bold mb-4">Your Progress</h2>
            <p className="text-gray-600">Progress tracking and exercise logs will appear here.</p>
          </div>
        )}
      </main>
    </div>
  )
}