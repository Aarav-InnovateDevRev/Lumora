import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { getAIMentorResponse } from './aiService';

function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'onboarding' | 'dashboard' | 'reflection' | 'ai' | 'tree' | 'career'>('login');
  
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [user, setUser] = useState({
    id: "", name: "", class: "", goal: "", preferredTone: "Friendly",
    studentType: "Mixed", studyFeeling: "Focused", password: "",
    streak: 0, seeds: 0,
  });

  const [reflection, setReflection] = useState({
    studyHours: "", subjects: "", mood: "Good", confidence: "Medium", wins: "", struggles: "",
  });

  const [hiddenDiscoveries, setHiddenDiscoveries] = useState<string[]>(["You started your growth journey 🌱"]);
  const [aiResponse, setAiResponse] = useState("Click 'Get Advice' to talk with your AI Mentor");
  const [userMessage, setUserMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lumoraUser');
    if (saved) {
      setUser(JSON.parse(saved));
      setCurrentPage('dashboard');
    }
  }, []);

  // Daily Notification
  useEffect(() => {
    if ("Notification" in window && user.id) {
      Notification.requestPermission();
      const lastNotif = localStorage.getItem('lastNotificationDate');
      const today = new Date().toISOString().split('T')[0];
      if (lastNotif !== today) {
        new Notification("🌱 Lumora", { body: `Hey ${user.name}, time for your daily reflection!` });
        localStorage.setItem('lastNotificationDate', today);
      }
    }
  }, [user.id]);

  const handleLogin = async () => { /* same as previous */ };
  const finishOnboarding = async () => { /* same as previous */ };
  const saveReflection = async () => { /* same as previous */ };

  const getAIAdvice = async () => {
    setIsLoading(true);
    const response = await getAIMentorResponse(user, userMessage);
    setAiResponse(response);
    setIsLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f1e9', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navigation */}
      <nav style={{ backgroundColor: 'white', padding: '16px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '36px' }}>🌱</span>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#9a3412' }}>Lumora</h1>
          </div>
          {currentPage !== 'login' && currentPage !== 'onboarding' && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => setCurrentPage('dashboard')} style={navButtonStyle}>🏠 Dashboard</button>
              <button onClick={() => setCurrentPage('reflection')} style={navButtonStyle}>📝 Reflection</button>
              <button onClick={() => setCurrentPage('ai')} style={navButtonStyle}>🤖 AI Mentor</button>
              <button onClick={() => setCurrentPage('tree')} style={navButtonStyle}>🌳 Growth Tree</button>
              <button onClick={() => setCurrentPage('career')} style={navButtonStyle}>🎯 Career</button>
            </div>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Login, Onboarding, Dashboard, Reflection pages - same as last version */}

        {currentPage === 'ai' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '24px' }}>
            <h2>🤖 Your AI Growth Mentor</h2>
            <p>Personalized using your profile & reflections</p>

            <textarea 
              placeholder="Ask me anything... (e.g. How to study better?)" 
              style={{...inputStyle, height: '120px'}} 
              value={userMessage} 
              onChange={e => setUserMessage(e.target.value)}
            />

            <button onClick={getAIAdvice} disabled={isLoading} style={buttonStyle}>
              {isLoading ? "AI is thinking..." : "Get Personalized Advice"}
            </button>

            <div style={{ marginTop: '30px', padding: '25px', backgroundColor: '#f8f1e9', borderRadius: '16px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {aiResponse}
            </div>
          </div>
        )}

        {/* Other placeholder pages */}
        {currentPage === 'tree' && <div style={{ textAlign: 'center', padding: '120px' }}><div style={{fontSize: '200px'}}>🌳</div><h2>Your Growth Tree</h2></div>}
        {currentPage === 'career' && <div style={{ textAlign: 'center', padding: '120px' }}>🎯 Career Roadmap - Coming Soon</div>}
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '16px', marginBottom: '16px', borderRadius: '12px', border: '2px solid #fed7aa', fontSize: '17px' };
const buttonStyle = { width: '100%', padding: '18px', backgroundColor: '#ea580c', color: 'white', border: 'none', borderRadius: '16px', fontSize: '19px', marginTop: '20px', cursor: 'pointer' };
const navButtonStyle = { padding: '10px 18px', backgroundColor: '#9a3412', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '15px' };

export default App;