import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [currentPage, setCurrentPage] = useState<'onboarding' | 'dashboard' | 'reflection' | 'ai' | 'tree' | 'career'>('onboarding');
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [user, setUser] = useState({
    id: "",
    name: "",
    class: "",
    goal: "",
    preferredTone: "Friendly",
    studentType: "Mixed",
    studyFeeling: "Focused",
    streak: 0,
    seeds: 0,
    completedOnboarding: false,
  });

  const [reflection, setReflection] = useState({
    studyHours: "",
    subjects: "",
    mood: "Good",
    confidence: "Medium",
    wins: "",
    struggles: "",
  });

  const [hiddenDiscoveries, setHiddenDiscoveries] = useState<string[]>([
    "You are building good daily habits",
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('lumoraUser');
    if (saved) {
      setUser(JSON.parse(saved));
      setCurrentPage('dashboard');
    }
  }, []);

  const addNotification = (message: string) => {
    setNotifications(prev => [message, ...prev].slice(0, 5));
  };

  const finishOnboarding = async () => {
    // ... same as before
    addNotification("Welcome to Lumora! Your profile is set.");
  };

  const saveReflection = async () => {
    // ... same save logic

    addNotification("I found something interesting in your reflection today!");
    if (user.streak + 1 % 5 === 0) {
      addNotification("Your Growth Tree just evolved! Check it out.");
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f1e9', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ backgroundColor: 'white', padding: '16px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '36px' }}>🌱</span>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#9a3412' }}>Lumora</h1>
          </div>

          {user.completedOnboarding && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button onClick={() => setShowNotifications(!showNotifications)} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>
                🛎️ {notifications.length}
              </button>
              {/* Other nav buttons */}
            </div>
          )}
        </div>
      </nav>

      {showNotifications && (
        <div style={{ position: 'fixed', top: '70px', right: '20px', backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 200, maxWidth: '300px' }}>
          <h4>Notifications</h4>
          {notifications.length === 0 ? <p>No new notifications</p> : notifications.map((n, i) => <p key={i} style={{ margin: '10px 0' }}>• {n}</p>)}
        </div>
      )}

      {/* Rest of the UI same as before */}
    </div>
  );
}

export default App;