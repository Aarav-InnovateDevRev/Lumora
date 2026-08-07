import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { getAIMentorResponse } from './aiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function App() {
  // Page Navigation State
  const [currentPage, setCurrentPage] = useState<'login' | 'onboarding' | 'dashboard' | 'reflection' | 'ai' | 'tree' | 'career' | 'pomodoro' | 'leaderboard' | 'stats' | 'mirror'>('login');
  
  // Login State
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // User Profile State
  const [user, setUser] = useState({
    id: "", name: "", class: "", goal: "", preferredTone: "Friendly",
    studentType: "Mixed", studyFeeling: "Focused", password: "",
    streak: 0, seeds: 0,
  });

  // Daily Reflection Form
  const [reflection, setReflection] = useState({
    studyHours: "", subjects: "", mood: "Good", confidence: "Medium", wins: "", struggles: "",
  });

  // Hidden Discoveries from AI
  const [hiddenDiscoveries, setHiddenDiscoveries] = useState<string[]>(["You started your growth journey 🌱"]);

  // AI Chat State
  const [userMessage, setUserMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [messageLimit, setMessageLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Future You AI
  const [futureVision, setFutureVision] = useState("");
  const [isGeneratingFuture, setIsGeneratingFuture] = useState(false);

  // Mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ==================== POMODORO STATE ====================
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ==================== LEADERBOARD STATE ====================
  const [leaderboardTab, setLeaderboardTab] = useState<'streak' | 'seeds'>('streak');

  // Demo leaderboard data
  const demoLeaderboard = {
    streak: [
      { name: "Aarav", class: "9", value: 42, rank: 1 },
      { name: "Priya", class: "9", value: 38, rank: 2 },
      { name: "Rohan", class: "10", value: 31, rank: 3 },
      { name: "Ananya", class: "9", value: 27, rank: 4 },
      { name: "Vikram", class: "8", value: 24, rank: 5 },
      { name: "Sneha", class: "10", value: 19, rank: 6 },
      { name: "Kabir", class: "9", value: 15, rank: 7 },
      { name: "Meera", class: "8", value: 12, rank: 8 },
    ],
    seeds: [
      { name: "Priya", class: "9", value: 680, rank: 1 },
      { name: "Aarav", class: "9", value: 620, rank: 2 },
      { name: "Ananya", class: "9", value: 540, rank: 3 },
      { name: "Rohan", class: "10", value: 490, rank: 4 },
      { name: "Sneha", class: "10", value: 410, rank: 5 },
      { name: "Vikram", class: "8", value: 370, rank: 6 },
      { name: "Meera", class: "8", value: 290, rank: 7 },
      { name: "Kabir", class: "9", value: 240, rank: 8 },
    ]
  };

  // ==================== STATS STATE ====================
  const [reflectionsData, setReflectionsData] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // Load saved user + always fetch latest streak & seeds from Supabase
useEffect(() => {
  const loadUser = async () => {
    const saved = localStorage.getItem('lumoraUser');
    if (!saved) return;

    const savedUser = JSON.parse(saved);

    // Always get the latest growth data from Supabase
    const { data: profile } = await supabase
      .from('growth_profile')
      .select('*')
      .eq('user_id', savedUser.id)
      .single();

    const updatedUser = {
      ...savedUser,
      streak: profile ? profile.current_streak : 0,
      seeds: profile ? profile.total_seeds : 0,
    };

    setUser(updatedUser);
    localStorage.setItem('lumoraUser', JSON.stringify(updatedUser));
    setCurrentPage('dashboard');
  };

  loadUser();
}, []);

  // Fetch real reflections when entering Stats page
  useEffect(() => {
    if ((currentPage === 'stats' || currentPage === 'mirror') && user.id) {
      fetchStatsData();
    }
  }, [currentPage, user.id]);

  const fetchStatsData = async () => {
    setStatsLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_reflections')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .limit(30);

      if (error) {
        console.error(error);
        setReflectionsData([]);
      } else {
        setReflectionsData(data || []);
      }
    } catch (err) {
      console.error(err);
      setReflectionsData([]);
    }
    setStatsLoading(false);
  };

  // ==================== GENERATE FUTURE YOU ====================
const generateFutureVision = async () => {
  if (!user.id) return;
  
  setIsGeneratingFuture(true);
  setFutureVision("");

  try {
    const result = await getAIMentorResponse(
      user, 
      `Based on everything you know about me (my goal, streak, reflections, mood patterns and growth), write a short, inspiring and realistic "Future You" vision. 
      
Speak in second person ("You will..."). 
Make it personal and hopeful but honest. 
Maximum 90 words. 
Focus on who I am becoming because of the habits I am building.`
    );

    setFutureVision(result.response);
  } catch (error) {
    setFutureVision("Something went wrong while creating your future glimpse. Please try again.");
  }

  setIsGeneratingFuture(false);
};

  // ==================== POMODORO TIMER LOGIC ====================
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (pomodoroMode === 'work') {
        setPomodoroMode('break');
        setTimeLeft(5 * 60);
        alert("🎉 Work session complete! Time for a 5-minute break.");
      } else {
        setPomodoroMode('work');
        setTimeLeft(25 * 60);
        alert("🌱 Break over! Ready for another focus session?");
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, pomodoroMode]);

  const startPomodoro = () => setIsRunning(true);
  const pausePomodoro = () => setIsRunning(false);
  const resetPomodoro = () => {
    setIsRunning(false);
    setPomodoroMode('work');
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ==================== LOGIN ====================
  const handleLogin = async () => {
    setLoginError("");
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginId)
      .single();

    if (error || !data) {
      setLoginError("❌ Invalid User ID");
      return;
    }

    if (data.password && data.password !== loginPassword) {
      setLoginError("❌ Wrong Password");
      return;
    }

    const { data: profile } = await supabase
      .from('growth_profile')
      .select('*')
      .eq('user_id', loginId)
      .single();

    if (!profile) {
      await supabase.from('growth_profile').insert([{
        user_id: loginId,
        total_seeds: 0,
        current_streak: 0,
        longest_streak: 0,
        growth_score: 0
      }]);
    }

    const { data: patterns } = await supabase
      .from('hidden_patterns')
      .select('pattern')
      .eq('user_id', loginId)
      .order('discovered_date', { ascending: false })
      .limit(10);

    setHiddenDiscoveries(patterns ? patterns.map(p => p.pattern) : ["You started your growth journey 🌱"]);

    const finalUser = {
  id: data.id,
  name: data.name,
  class: data.class,
  goal: data.goal,
  preferredTone: data.preferred_tone || "Friendly",
  studentType: data.student_type || "Mixed",
  studyFeeling: data.study_feeling || "Focused",
  password: data.password || "",
  streak: profile ? profile.current_streak : 0,
  seeds: profile ? profile.total_seeds : 0,
};

setUser(finalUser);
localStorage.setItem('lumoraUser', JSON.stringify(finalUser)); // ← important
setCurrentPage('dashboard');
  };

  // ==================== ONBOARDING ====================
  const finishOnboarding = async () => {
    if (!user.id || !user.name || !user.class || !user.goal) {
      alert("❌ Please fill all fields!");
      return;
    }

    const { error } = await supabase
      .from('users')
      .upsert([{
        id: user.id,
        name: user.name,
        class: user.class,
        goal: user.goal,
        preferred_tone: user.preferredTone,
        student_type: user.studentType,
        study_feeling: user.studyFeeling,
        password: user.password || "123456"
      }], { onConflict: 'id' });

    if (error) {
      alert(`❌ Error: ${error.message}`);
      return;
    }

    await supabase.from('growth_profile').insert([{
      user_id: user.id,
      total_seeds: 0,
      current_streak: 0,
      longest_streak: 0,
      growth_score: 0
    }]);

    const newUser = { ...user, streak: 0, seeds: 0 };
    setUser(newUser);
    localStorage.setItem('lumoraUser', JSON.stringify(newUser));
    alert("✅ Profile Created!");
    setCurrentPage('dashboard');
  };

  // ==================== SAVE REFLECTION ====================
  const saveReflection = async () => {
    const today = new Date().toISOString().split('T')[0];
    if (localStorage.getItem('lastReflectionDate') === today) {
      alert("⚠️ You already reflected today!");
      return;
    }

    localStorage.setItem('lastReflectionDate', today);

    const { error } = await supabase
      .from('daily_reflections')
      .insert([{
        user_id: user.id,
        date: today,
        study_hours: parseFloat(reflection.studyHours) || 0,
        subjects: reflection.subjects.split(',').map(s => s.trim()),
        mood: reflection.mood,
        confidence: reflection.confidence,
        wins: reflection.wins,
        struggles: reflection.struggles
      }]);

    if (error) {
      alert(`❌ ${error.message}`);
      return;
    }

    const newStreak = user.streak + 1;
    const newSeeds = user.seeds + 15;

    await supabase.from('growth_profile').upsert([{
      user_id: user.id,
      total_seeds: newSeeds,
      current_streak: newStreak,
      longest_streak: Math.max(user.streak, newStreak),
      growth_score: Math.min(100, newStreak * 5 + newSeeds / 10)
    }], { onConflict: 'user_id' });

    setUser(prev => ({
      ...prev,
      streak: newStreak,
      seeds: newSeeds
    }));

    setHiddenDiscoveries(prev => [...prev, `Reflection saved! Mood: ${reflection.mood}`]);
    alert("✅ Reflection Saved! +1 Streak & +15 Seeds");
    setCurrentPage('dashboard');
  };

  // ==================== AI MENTOR ====================
  const getAIAdvice = async () => {
    if (messageLimit >= 10) {
      alert("You have reached the daily limit of 10 messages. Come back tomorrow! 🌱");
      return;
    }

    setIsLoading(true);

    const result = await getAIMentorResponse(user, userMessage || "");

    const newHistory = [
      ...chatHistory,
      { role: "user", content: userMessage },
      { role: "assistant", content: result.response }
    ];

    setChatHistory(newHistory);
    setMessageLimit(prev => prev + 1);
    setUserMessage("");

    if (result.insight) {
      await supabase.from('hidden_patterns').insert([{
        user_id: user.id,
        pattern: result.insight,
        importance: 8
      }]);

      const { data: patterns } = await supabase
        .from('hidden_patterns')
        .select('pattern')
        .eq('user_id', user.id)
        .order('discovered_date', { ascending: false })
        .limit(10);

      setHiddenDiscoveries(patterns ? patterns.map(p => p.pattern) : ["You started your growth journey 🌱"]);
    }

    setIsLoading(false);
  };

  // ==================== AR CAMERA ====================
  const startCamera = () => {
    const video = document.getElementById('cameraFeed') as HTMLVideoElement;
    if (video) {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }
      })
        .then(stream => {
          video.srcObject = stream;
        })
        .catch(() => {
          alert("Please allow camera permission to use AR filter.");
        });
    }
  };

  const goToPage = (page: typeof currentPage) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  // Navigation items
  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: '🏠' },
    { id: 'mirror' as const, label: 'Mirror', icon: '🪞' },
    { id: 'reflection' as const, label: 'Reflection', icon: '📝' },
    { id: 'ai' as const, label: 'AI Mentor', icon: '🤖' },
    { id: 'stats' as const, label: 'Stats', icon: '📊' },
    { id: 'pomodoro' as const, label: 'Pomodoro', icon: '⏱️' },
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: '🏆' },
    { id: 'tree' as const, label: 'Growth Tree', icon: '🌳' },
    { id: 'career' as const, label: 'Career', icon: '🎯' },
  ];

  // ==================== STYLES ====================
  const colors = {
    bg: '#f8f1e9',
    primary: '#9a3412',
    accent: '#ea580c',
    white: '#ffffff',
    border: '#fed7aa',
    text: '#374151',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    marginBottom: '14px',
    borderRadius: '12px',
    border: '2px solid #fed7aa',
    fontSize: '16px',
    outline: 'none',
    background: 'white',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    backgroundColor: '#ea580c',
    color: 'white',
    border: 'none',
    borderRadius: '14px',
    fontSize: '17px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '18px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    border: '1px solid #f3e8d8',
  };

  // Prepare chart data
  const studyHoursData = reflectionsData.map(r => ({
    date: r.date ? r.date.slice(5) : '',
    hours: Number(r.study_hours) || 0
  }));

  const moodMap: Record<string, number> = {
    'Great': 5, 'Good': 4, 'Okay': 3, 'Tired': 2, 'Struggling': 1
  };
  const confidenceMap: Record<string, number> = {
    'High': 3, 'Medium': 2, 'Low': 1
  };

  const moodData = reflectionsData.map(r => ({
    date: r.date ? r.date.slice(5) : '',
    mood: moodMap[r.mood] || 3
  }));

  const confidenceData = reflectionsData.map(r => ({
    date: r.date ? r.date.slice(5) : '',
    confidence: confidenceMap[r.confidence] || 2
  }));

  const totalHours = reflectionsData.reduce((sum, r) => sum + (Number(r.study_hours) || 0), 0);

  // Latest reflection for Mirror
  const latestReflection = reflectionsData.length > 0 ? reflectionsData[reflectionsData.length - 1] : null;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; background: ${colors.bg}; }
        
        @keyframes grow {
          from { transform: scale(0.85); }
          to { transform: scale(1.15); }
        }

        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 250px;
          background: ${colors.white};
          border-right: 1px solid #f3e8d8;
          display: flex;
          flex-direction: column;
          z-index: 40;
        }

        .main-content {
          margin-left: 250px;
          min-height: 100vh;
          padding: 32px 40px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 14px 18px;
          border: none;
          border-radius: 12px;
          background: transparent;
          color: ${colors.text};
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
        }
        .nav-item:hover {
          background: #fff7ed;
        }
        .nav-item.active {
          background: ${colors.primary};
          color: white;
        }

        .mobile-topbar { display: none; }
        .mobile-bottom-nav { display: none; }
        .mobile-menu-overlay { display: none; }

        @media (max-width: 768px) {
          .sidebar { display: none; }
          .main-content {
            margin-left: 0;
            padding: 80px 16px 90px 16px;
          }
          .mobile-topbar {
            display: flex;
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 60px;
            background: white;
            border-bottom: 1px solid #f3e8d8;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            z-index: 50;
          }
          .mobile-bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: white;
            border-top: 1px solid #f3e8d8;
            justify-content: space-around;
            padding: 8px 0;
            z-index: 50;
            overflow-x: auto;
          }
          .mobile-menu-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            z-index: 60;
          }
          .mobile-sidebar {
            position: fixed;
            left: 0; top: 0; bottom: 0;
            width: 270px;
            background: white;
            z-index: 70;
            padding: 20px;
            box-shadow: 4px 0 20px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      <div style={{ minHeight: '100vh', position: 'relative' }}>
        
        {/* Soft Forest Background */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'url(/forest-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,
        }} />
        
        {/* Soft cream overlay */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(248, 241, 233, 0.70)',
          zIndex: 1,
        }} />

        {/* All content */}
        <div style={{ position: 'relative', zIndex: 2 }}>

          {/* LOGIN & ONBOARDING */}
          {(currentPage === 'login' || currentPage === 'onboarding') ? (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              
              {currentPage === 'login' && (
                <div style={{ width: '100%', maxWidth: '420px', background: colors.white, borderRadius: '24px', padding: '48px 40px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <img src="/logo.png" alt="Lumora" style={{ height: '56px', marginBottom: '12px' }} />
                    <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>Welcome to Lumora</h1>
                    <p style={{ color: '#6b7280', marginTop: '8px' }}>Your AI Growth Companion</p>
                  </div>

                  <input type="text" placeholder="User ID" value={loginId} onChange={e => setLoginId(e.target.value)} style={inputStyle} />
                  <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} style={inputStyle} />

                  {loginError && <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '16px' }}>{loginError}</p>}

                  <button onClick={handleLogin} style={buttonStyle}>Login</button>

                  <p style={{ textAlign: 'center', marginTop: '24px', color: '#6b7280' }}>
                    New here?{' '}
                    <button onClick={() => setCurrentPage('onboarding')} style={{ color: colors.accent, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500 }}>
                      Create Account
                    </button>
                  </p>
                </div>
              )}

              {currentPage === 'onboarding' && (
                <div style={{ width: '100%', maxWidth: '520px', background: colors.white, borderRadius: '24px', padding: '48px 40px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
                  <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <img src="/logo.png" alt="Lumora" style={{ height: '48px', marginBottom: '12px' }} />
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: colors.primary }}>Create Your Profile</h1>
                  </div>

                  <input type="text" placeholder="Unique User ID" value={user.id} onChange={e => setUser(p => ({...p, id: e.target.value}))} style={inputStyle} />
                  <input type="text" placeholder="Full Name" value={user.name} onChange={e => setUser(p => ({...p, name: e.target.value}))} style={inputStyle} />
                  <input type="text" placeholder="Class" value={user.class} onChange={e => setUser(p => ({...p, class: e.target.value}))} style={inputStyle} />
                  <input type="text" placeholder="Your Big Goal" value={user.goal} onChange={e => setUser(p => ({...p, goal: e.target.value}))} style={inputStyle} />
                  <input type="password" placeholder="Set Password" value={user.password} onChange={e => setUser(p => ({...p, password: e.target.value}))} style={inputStyle} />

                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: colors.text }}>What do you usually feel while studying?</label>
                  <select value={user.studyFeeling} onChange={e => setUser(p => ({...p, studyFeeling: e.target.value}))} style={inputStyle}>
                    <option value="Focused">Focused</option>
                    <option value="Motivated">Motivated</option>
                    <option value="Anxious">Anxious</option>
                    <option value="Bored">Bored</option>
                    <option value="Tired">Tired</option>
                  </select>

                  <button onClick={finishOnboarding} style={buttonStyle}>Create Profile & Start</button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Sidebar */}
              <aside className="sidebar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 20px', borderBottom: '1px solid #f3e8d8' }}>
                  <img src="/logo.png" alt="Lumora" style={{ height: '40px' }} />
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>Lumora</h1>
                </div>

                <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
                  {navItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => goToPage(item.id)}
                      className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                    >
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>

                <div style={{ padding: '16px 20px', borderTop: '1px solid #f3e8d8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: colors.accent, color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', fontSize: '18px'
                    }}>
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.name || 'Student'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#9ca3af' }}>Class {user.class}</p>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Mobile Top Bar */}
              <div className="mobile-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/logo.png" alt="Lumora" style={{ height: '32px' }} />
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary }}>Lumora</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  style={{
                    background: '#fff7ed', border: 'none', borderRadius: '10px',
                    padding: '8px 12px', fontSize: '20px', cursor: 'pointer', color: colors.primary
                  }}
                >
                  ☰
                </button>
              </div>

              {/* Mobile Menu Overlay */}
              {isMobileMenuOpen && (
                <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="mobile-sidebar" onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                      <img src="/logo.png" alt="Lumora" style={{ height: '40px' }} />
                      <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: colors.primary }}>Lumora</h1>
                    </div>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {navItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => goToPage(item.id)}
                          className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                        >
                          <span style={{ fontSize: '20px' }}>{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              )}

              {/* Main Content */}
              <main className="main-content">

                {/* DASHBOARD */}
                {currentPage === 'dashboard' && (
                  <div>
                    <div style={{
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                      borderRadius: '20px',
                      padding: '28px 32px',
                      color: 'white',
                      marginBottom: '32px',
                      boxShadow: '0 8px 24px rgba(154,52,18,0.25)'
                    }}>
                      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '6px' }}>
                        Welcome back, {user.name}!
                      </h1>
                      <p style={{ opacity: 0.9 }}>Keep growing. Every day counts. 🌱</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                      <div style={cardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', marginBottom: '12px' }}>
                          <span style={{ fontSize: '22px' }}>🔥</span>
                          <span style={{ fontWeight: 500 }}>Streak</span>
                        </div>
                        <p style={{ fontSize: '42px', fontWeight: 'bold', color: colors.primary }}>
                          {user.streak} <span style={{ fontSize: '18px', fontWeight: 500, color: '#9ca3af' }}>days</span>
                        </p>
                      </div>

                      <div style={cardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', marginBottom: '12px' }}>
                          <span style={{ fontSize: '22px' }}>🌱</span>
                          <span style={{ fontWeight: 500 }}>Seeds</span>
                        </div>
                        <p style={{ fontSize: '42px', fontWeight: 'bold', color: colors.primary }}>{user.seeds}</p>
                      </div>
                    </div>

                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, marginBottom: '16px' }}>
                      Hidden Discoveries
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {hiddenDiscoveries.map((d, i) => (
                        <div key={i} style={{
                          background: colors.white,
                          borderRadius: '16px',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          border: '1px solid #f3e8d8'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '18px' }}>✨</span>
                            <span style={{ color: colors.text }}>{d}</span>
                          </div>
                          <button
                            onClick={() => setHiddenDiscoveries(prev => prev.filter((_, idx) => idx !== i))}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '18px' }}
                          >
                            🗑
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ==================== MIRROR OF YOU ==================== */}
                {currentPage === 'mirror' && (
                  <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: colors.primary, marginBottom: '6px' }}>
                      🪞 Mirror of You
                    </h1>
                    <p style={{ color: '#6b7280', marginBottom: '32px' }}>
                      See who you are becoming
                    </p>

                    {/* Current You */}
                    <div style={{ ...cardStyle, marginBottom: '24px' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary, marginBottom: '20px' }}>
                        Current You
                      </h2>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <div style={{
                          width: '72px', height: '72px', borderRadius: '50%',
                          background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '32px', fontWeight: 'bold', flexShrink: 0
                        }}>
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: colors.text }}>{user.name || 'Student'}</h3>
                          <p style={{ color: '#6b7280' }}>Class {user.class} · {user.studyFeeling}</p>
                          <p style={{ color: colors.accent, fontWeight: 500, marginTop: '4px' }}>Goal: {user.goal || 'Not set yet'}</p>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                        <div style={{ background: '#fff7ed', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                          <p style={{ fontSize: '13px', color: '#6b7280' }}>Streak</p>
                          <p style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>{user.streak}</p>
                        </div>
                        <div style={{ background: '#fff7ed', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                          <p style={{ fontSize: '13px', color: '#6b7280' }}>Seeds</p>
                          <p style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>{user.seeds}</p>
                        </div>
                        <div style={{ background: '#fff7ed', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                          <p style={{ fontSize: '13px', color: '#6b7280' }}>Level</p>
                          <p style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>{Math.floor(user.streak / 3) + 1}</p>
                        </div>
                        <div style={{ background: '#fff7ed', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                          <p style={{ fontSize: '13px', color: '#6b7280' }}>Reflections</p>
                          <p style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>{reflectionsData.length}</p>
                        </div>
                      </div>

                      {latestReflection && (
                        <div style={{ marginTop: '20px', padding: '16px', background: '#f8f1e9', borderRadius: '14px' }}>
                          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '6px' }}>Latest Reflection</p>
                          <p style={{ color: colors.text }}>
                            Mood: <strong>{latestReflection.mood}</strong> · Confidence: <strong>{latestReflection.confidence}</strong> · Hours: <strong>{latestReflection.study_hours}</strong>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Future You */}
<div style={{
  ...cardStyle,
  marginBottom: '24px',
  background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
  color: 'white'
}}>
  <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
    ✨ Future You
  </h2>

  {futureVision ? (
    // Show the AI generated vision
    <div>
      <p style={{ fontSize: '16px', lineHeight: 1.7, opacity: 0.95, whiteSpace: 'pre-wrap' }}>
        {futureVision}
      </p>
      <button
        onClick={generateFutureVision}
        disabled={isGeneratingFuture}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500
        }}
      >
        {isGeneratingFuture ? "Creating new glimpse..." : "Order another glimpse"}
      </button>
    </div>
  ) : (
    // Placeholder + Button
    <div>
      <p style={{ fontSize: '16px', lineHeight: 1.6, opacity: 0.9, marginBottom: '20px' }}>
        Ready to see a glimpse of who you are becoming?
      </p>
      
      <button
        onClick={generateFutureVision}
        disabled={isGeneratingFuture}
        style={{
          padding: '14px 28px',
          background: 'white',
          color: colors.primary,
          border: 'none',
          borderRadius: '14px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: isGeneratingFuture ? 'not-allowed' : 'pointer',
          opacity: isGeneratingFuture ? 0.7 : 1
        }}
      >
        {isGeneratingFuture ? "Creating your glimpse..." : "Order your Future glimpses?"}
      </button>
    </div>
  )}
</div>

                    {/* Growth Journey */}
                    <div style={{ ...cardStyle, marginBottom: '24px' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary, marginBottom: '20px' }}>
                        Growth Journey
                      </h2>

                      {reflectionsData.length === 0 ? (
                        <p style={{ color: '#9ca3af' }}>Complete reflections to see your journey timeline here.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {reflectionsData.slice(-5).reverse().map((r, i) => (
                            <div key={i} style={{
                              display: 'flex',
                              gap: '14px',
                              padding: '14px',
                              background: '#fafafa',
                              borderRadius: '12px',
                              border: '1px solid #f3e8d8'
                            }}>
                              <div style={{
                                width: '10px', height: '10px', borderRadius: '50%',
                                background: colors.accent, marginTop: '6px', flexShrink: 0
                              }} />
                              <div>
                                <p style={{ fontWeight: 600, color: colors.text, fontSize: '14px' }}>{r.date}</p>
                                <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '2px' }}>
                                  {r.study_hours}h studied · Mood: {r.mood} · Confidence: {r.confidence}
                                </p>
                                {r.wins && <p style={{ color: colors.text, fontSize: '13px', marginTop: '4px' }}>Win: {r.wins}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Hidden Discoveries */}
                    <div style={cardStyle}>
                      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary, marginBottom: '16px' }}>
                        Hidden Discoveries
                      </h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {hiddenDiscoveries.map((d, i) => (
                          <div key={i} style={{
                            background: '#fff7ed',
                            borderRadius: '12px',
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span>✨</span>
                              <span style={{ color: colors.text }}>{d}</span>
                            </div>
                            <button
                              onClick={() => setHiddenDiscoveries(prev => prev.filter((_, idx) => idx !== i))}
                              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '16px' }}
                            >
                              🗑
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* REFLECTION */}
                {currentPage === 'reflection' && (
                  <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                    <div style={{ ...cardStyle, padding: '36px' }}>
                      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary, marginBottom: '24px' }}>
                        Daily Reflection
                      </h2>

                      <input type="text" placeholder="Hours studied today" value={reflection.studyHours} onChange={e => setReflection(p => ({...p, studyHours: e.target.value}))} style={inputStyle} />
                      <textarea placeholder="Subjects studied (comma separated)" value={reflection.subjects} onChange={e => setReflection(p => ({...p, subjects: e.target.value}))} style={{ ...inputStyle, height: '80px', resize: 'vertical' }} />

                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Mood Today</label>
                      <select value={reflection.mood} onChange={e => setReflection(p => ({...p, mood: e.target.value}))} style={inputStyle}>
                        <option value="Great">Great</option>
                        <option value="Good">Good</option>
                        <option value="Okay">Okay</option>
                        <option value="Tired">Tired</option>
                        <option value="Struggling">Struggling</option>
                      </select>

                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Confidence Level</label>
                      <select value={reflection.confidence} onChange={e => setReflection(p => ({...p, confidence: e.target.value}))} style={inputStyle}>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>

                      <textarea placeholder="Wins today" value={reflection.wins} onChange={e => setReflection(p => ({...p, wins: e.target.value}))} style={{ ...inputStyle, height: '90px', resize: 'vertical' }} />
                      <textarea placeholder="Struggles" value={reflection.struggles} onChange={e => setReflection(p => ({...p, struggles: e.target.value}))} style={{ ...inputStyle, height: '90px', resize: 'vertical' }} />

                      <button onClick={saveReflection} style={buttonStyle}>Save Reflection</button>
                    </div>
                  </div>
                )}

                {/* AI MENTOR */}
                {currentPage === 'ai' && (
                  <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                    <div style={{ ...cardStyle, padding: '32px' }}>
                      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary, marginBottom: '6px' }}>
                        🤖 Your AI Growth Mentor
                      </h2>
                      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                        Personalized using your profile and latest reflections (10 messages/day)
                      </p>

                      <div style={{ maxHeight: '360px', overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {chatHistory.length === 0 && (
                          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>
                            Ask anything about your growth journey...
                          </div>
                        )}
                        {chatHistory.map((msg, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '14px 18px',
                              borderRadius: '14px',
                              background: msg.role === 'user' ? '#fff7ed' : '#f8f1e9',
                              marginLeft: msg.role === 'user' ? '40px' : '0',
                              marginRight: msg.role === 'assistant' ? '40px' : '0',
                            }}
                          >
                            <strong style={{ fontSize: '13px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                              {msg.role === 'user' ? 'You' : 'AI Mentor'}
                            </strong>
                            <p style={{ whiteSpace: 'pre-wrap', color: colors.text }}>{msg.content}</p>
                          </div>
                        ))}
                      </div>

                      <textarea
                        placeholder="Ask anything..."
                        value={userMessage}
                        onChange={e => setUserMessage(e.target.value)}
                        style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
                      />

                      <button
                        onClick={getAIAdvice}
                        disabled={isLoading}
                        style={{ ...buttonStyle, opacity: isLoading ? 0.7 : 1 }}
                      >
                        {isLoading ? "AI is thinking..." : "Get Personalized Advice"}
                      </button>

                      {messageLimit >= 10 && (
                        <p style={{ color: '#ef4444', textAlign: 'center', marginTop: '12px' }}>
                          Daily limit reached (10 messages). Come back tomorrow!
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* STATS PAGE */}
                {currentPage === 'stats' && (
                  <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: colors.primary, marginBottom: '8px' }}>
                      📊 Your Progress Stats
                    </h1>
                    <p style={{ color: '#6b7280', marginBottom: '28px' }}>
                      Real data from your last 30 reflections
                    </p>

                    {statsLoading ? (
                      <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                        Loading your stats...
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '36px' }}>
                          <div style={cardStyle}>
                            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>Total Reflections</p>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>{reflectionsData.length}</p>
                          </div>
                          <div style={cardStyle}>
                            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>Total Study Hours</p>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>{totalHours.toFixed(1)}</p>
                          </div>
                          <div style={cardStyle}>
                            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>Current Streak</p>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>{user.streak}</p>
                          </div>
                          <div style={cardStyle}>
                            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>Total Seeds</p>
                            <p style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>{user.seeds}</p>
                          </div>
                        </div>

                        {reflectionsData.length === 0 ? (
                          <div style={{ ...cardStyle, textAlign: 'center', padding: '50px' }}>
                            <p style={{ fontSize: '18px', color: '#6b7280' }}>No reflections yet.</p>
                            <p style={{ color: '#9ca3af', marginTop: '8px' }}>Complete a few daily reflections to see your graphs here.</p>
                          </div>
                        ) : (
                          <>
                            <div style={{ ...cardStyle, marginBottom: '28px' }}>
                              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '20px' }}>
                                Study Hours (Last 30 days)
                              </h3>
                              <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={studyHoursData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f3e8d8" />
                                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                  <YAxis tick={{ fontSize: 12 }} />
                                  <Tooltip />
                                  <Line type="monotone" dataKey="hours" stroke="#ea580c" strokeWidth={3} dot={{ r: 4 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                              <div style={cardStyle}>
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '20px' }}>
                                  Mood Trend
                                </h3>
                                <ResponsiveContainer width="100%" height={220}>
                                  <BarChart data={moodData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3e8d8" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="mood" fill="#9a3412" radius={[6, 6, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                                  5 = Great · 4 = Good · 3 = Okay · 2 = Tired · 1 = Struggling
                                </p>
                              </div>

                              <div style={cardStyle}>
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '20px' }}>
                                  Confidence Trend
                                </h3>
                                <ResponsiveContainer width="100%" height={220}>
                                  <LineChart data={confidenceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3e8d8" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis domain={[0, 3]} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="confidence" stroke="#ea580c" strokeWidth={3} dot={{ r: 4 }} />
                                  </LineChart>
                                </ResponsiveContainer>
                                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                                  3 = High · 2 = Medium · 1 = Low
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* POMODORO */}
                {currentPage === 'pomodoro' && (
                  <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ ...cardStyle, padding: '40px 32px' }}>
                      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary, marginBottom: '8px' }}>
                        ⏱️ Pomodoro Timer
                      </h2>
                      <p style={{ color: '#6b7280', marginBottom: '32px' }}>
                        Classic 25 min focus + 5 min break
                      </p>

                      <div style={{
                        display: 'inline-block',
                        padding: '8px 20px',
                        borderRadius: '999px',
                        background: pomodoroMode === 'work' ? '#fff7ed' : '#ecfdf5',
                        color: pomodoroMode === 'work' ? colors.accent : '#059669',
                        fontWeight: 600,
                        marginBottom: '28px',
                        fontSize: '15px'
                      }}>
                        {pomodoroMode === 'work' ? '🔥 Focus Time' : '🌿 Break Time'}
                      </div>

                      <div style={{
                        fontSize: '72px',
                        fontWeight: 'bold',
                        color: colors.primary,
                        letterSpacing: '2px',
                        marginBottom: '36px',
                        fontVariantNumeric: 'tabular-nums'
                      }}>
                        {formatTime(timeLeft)}
                      </div>

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {!isRunning ? (
                          <button
                            onClick={startPomodoro}
                            style={{
                              padding: '14px 32px',
                              background: colors.accent,
                              color: 'white',
                              border: 'none',
                              borderRadius: '14px',
                              fontSize: '16px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Start
                          </button>
                        ) : (
                          <button
                            onClick={pausePomodoro}
                            style={{
                              padding: '14px 32px',
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '14px',
                              fontSize: '16px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Pause
                          </button>
                        )}

                        <button
                          onClick={resetPomodoro}
                          style={{
                            padding: '14px 32px',
                            background: 'white',
                            color: colors.primary,
                            border: `2px solid ${colors.primary}`,
                            borderRadius: '14px',
                            fontSize: '16px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Reset
                        </button>
                      </div>

                      <p style={{ marginTop: '28px', color: '#9ca3af', fontSize: '14px' }}>
                        Stay focused. Small consistent sessions create long-term growth.
                      </p>
                    </div>
                  </div>
                )}

                {/* LEADERBOARD */}
                {currentPage === 'leaderboard' && (
                  <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                    <div style={{ ...cardStyle, padding: '32px' }}>
                      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary, marginBottom: '6px' }}>
                        🏆 Leaderboard
                      </h2>
                      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                        Demo rankings • Real data coming soon
                      </p>

                      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
                        <button
                          onClick={() => setLeaderboardTab('streak')}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '12px',
                            border: 'none',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: leaderboardTab === 'streak' ? colors.primary : '#fff7ed',
                            color: leaderboardTab === 'streak' ? 'white' : colors.primary,
                          }}
                        >
                          🔥 By Streak
                        </button>
                        <button
                          onClick={() => setLeaderboardTab('seeds')}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '12px',
                            border: 'none',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: leaderboardTab === 'seeds' ? colors.primary : '#fff7ed',
                            color: leaderboardTab === 'seeds' ? 'white' : colors.primary,
                          }}
                        >
                          🌱 By Seeds
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {demoLeaderboard[leaderboardTab].map((entry) => (
                          <div
                            key={entry.rank}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '14px 18px',
                              borderRadius: '14px',
                              background: entry.rank <= 3 ? '#fff7ed' : '#fafafa',
                              border: entry.rank <= 3 ? '1px solid #fed7aa' : '1px solid #f3e8d8',
                            }}
                          >
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: entry.rank === 1 ? '#f59e0b' : entry.rank === 2 ? '#9ca3af' : entry.rank === 3 ? '#d97706' : colors.primary,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '15px',
                              marginRight: '16px',
                              flexShrink: 0
                            }}>
                              {entry.rank}
                            </div>

                            <div style={{ flex: 1 }}>
                              <p style={{ fontWeight: 600, color: colors.text }}>{entry.name}</p>
                              <p style={{ fontSize: '13px', color: '#9ca3af' }}>Class {entry.class}</p>
                            </div>

                            <div style={{ fontWeight: 'bold', color: colors.primary, fontSize: '18px' }}>
                              {entry.value}
                              <span style={{ fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginLeft: '4px' }}>
                                {leaderboardTab === 'streak' ? 'days' : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <p style={{ textAlign: 'center', marginTop: '24px', color: '#9ca3af', fontSize: '13px' }}>
                        This is demo data. Real leaderboard will connect to Supabase soon.
                      </p>
                    </div>
                  </div>
                )}

                {/* GROWTH TREE */}
                {currentPage === 'tree' && (
                  <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: colors.primary, marginBottom: '8px' }}>
                      🌳 Your Growth Tree
                    </h1>
                    <p style={{ color: '#6b7280', marginBottom: '28px' }}>AR Filter – Make invisible growth visible</p>

                    <div style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: '520px',
                      margin: '0 auto 28px',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.25)'
                    }}>
                      <video
                        id="cameraFeed"
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: '400px', objectFit: 'cover', background: '#111' }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '140px',
                        animation: 'grow 3s infinite alternate',
                        filter: 'drop-shadow(0 0 40px #4ade80)',
                        pointerEvents: 'none',
                        zIndex: 10
                      }}>
                        🌳
                      </div>
                      <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '8px 20px',
                        borderRadius: '999px',
                        fontSize: '14px',
                        zIndex: 20
                      }}>
                        AR Filter Active • Level {Math.floor(user.streak / 3) + 1}
                      </div>
                    </div>

                    <button
                      onClick={startCamera}
                      style={{
                        padding: '16px 40px',
                        background: colors.accent,
                        color: 'white',
                        border: 'none',
                        borderRadius: '999px',
                        fontSize: '17px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 8px 24px rgba(234,88,12,0.35)'
                      }}
                    >
                      Start AR Camera (Selfie)
                    </button>

                    <div style={{ ...cardStyle, marginTop: '32px', display: 'inline-block', minWidth: '260px' }}>
                      <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: colors.primary }}>
                        Current Level: {Math.floor(user.streak / 3) + 1}
                      </h3>
                      <p style={{ color: '#6b7280', marginTop: '6px' }}>
                        Streak: {user.streak} days | Seeds: {user.seeds}
                      </p>
                    </div>
                  </div>
                )}

                {/* CAREER PLACEHOLDER */}
                {currentPage === 'career' && (
                  <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
                    <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: colors.primary, marginBottom: '8px' }}>
                      Career Roadmap
                    </h2>
                    <p style={{ color: '#6b7280' }}>Coming very soon in Lumora v2...</p>
                  </div>
                )}

              </main>

              {/* Mobile Bottom Navigation */}
              <nav className="mobile-bottom-nav">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => goToPage(item.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      color: currentPage === item.id ? colors.primary : '#9ca3af',
                      fontSize: '10px',
                      fontWeight: 500,
                      minWidth: '60px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <span style={{ marginTop: '2px' }}>{item.label.split(' ')[0]}</span>
                  </button>
                ))}
              </nav>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;


//By Aarav Singh, Shashi Shekhar, Akshat Ranjan and our another friends (Named AI!{And obvioulsy others 🙄})