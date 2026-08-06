import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { getAIMentorResponse } from './aiService';

function App() {
  // Page Navigation State
  const [currentPage, setCurrentPage] = useState<'login' | 'onboarding' | 'dashboard' | 'reflection' | 'ai' | 'tree' | 'career'>('login');
  
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

  // Mobile sidebar state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load saved user from localStorage on start
  useEffect(() => {
    const saved = localStorage.getItem('lumoraUser');
    if (saved) {
      setUser(JSON.parse(saved));
      setCurrentPage('dashboard');
    }
  }, []);

  // ==================== LOGIN WITH SUPABASE ====================
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

    setUser({
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
    });
    setCurrentPage('dashboard');
  };

  // ==================== ONBOARDING WITH SUPABASE ====================
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

  // ==================== SAVE REFLECTION + STREAK + SEEDS ====================
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

  // ==================== AI MENTOR WITH PERSONALIZATION ====================
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

  // ==================== AR CAMERA FILTER ====================
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

  // Helper to change page and close mobile menu
  const goToPage = (page: typeof currentPage) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  // ==================== SIDEBAR NAVIGATION ITEMS ====================
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'reflection', label: 'Reflection', icon: '📝' },
    { id: 'ai', label: 'AI Mentor', icon: '🤖' },
    { id: 'tree', label: 'Growth Tree', icon: '🌳' },
    { id: 'career', label: 'Career Roadmap', icon: '🎯' },
  ] as const;

  // ==================== RENDER ====================
  return (
    <>
      <style>{`
        @keyframes grow {
          from { transform: scale(0.85); }
          to { transform: scale(1.15); }
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f8f1e9;
        }
        ::-webkit-scrollbar-thumb {
          background: #d6a67a;
          border-radius: 10px;
        }
      `}</style>

      <div className="min-h-screen bg-[#f8f1e9] font-sans text-gray-800">
        
        {/* ========== LOGIN & ONBOARDING (Full screen, no sidebar) ========== */}
        {(currentPage === 'login' || currentPage === 'onboarding') ? (
          <div className="min-h-screen flex items-center justify-center p-4">
            {currentPage === 'login' && (
              <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 md:p-12">
                <div className="flex flex-col items-center mb-8">
                  <img src="/logo.png" alt="Lumora Logo" className="h-16 mb-3" />
                  <h1 className="text-3xl md:text-4xl font-bold text-[#9a3412]">Welcome to Lumora</h1>
                  <p className="text-gray-500 mt-2 text-center">Your AI Growth Companion</p>
                </div>

                <input
                  type="text"
                  placeholder="User ID"
                  className="w-full px-4 py-3.5 mb-4 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none text-lg"
                  value={loginId}
                  onChange={e => setLoginId(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full px-4 py-3.5 mb-4 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none text-lg"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                />
                
                {loginError && <p className="text-red-500 text-center mb-4">{loginError}</p>}
                
                <button
                  onClick={handleLogin}
                  className="w-full py-4 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-2xl text-lg font-semibold transition-colors"
                >
                  Login
                </button>
                
                <p className="text-center mt-6 text-gray-600">
                  New here?{' '}
                  <button
                    onClick={() => setCurrentPage('onboarding')}
                    className="text-[#ea580c] font-medium hover:underline"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            )}

            {currentPage === 'onboarding' && (
              <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 md:p-12">
                <div className="flex flex-col items-center mb-8">
                  <img src="/logo.png" alt="Lumora Logo" className="h-14 mb-3" />
                  <h1 className="text-3xl font-bold text-[#9a3412]">Create Your Profile</h1>
                </div>

                <input type="text" placeholder="Unique User ID" className="w-full px-4 py-3.5 mb-4 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none" value={user.id} onChange={e => setUser(p => ({...p, id: e.target.value}))} />
                <input type="text" placeholder="Full Name" className="w-full px-4 py-3.5 mb-4 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none" value={user.name} onChange={e => setUser(p => ({...p, name: e.target.value}))} />
                <input type="text" placeholder="Class" className="w-full px-4 py-3.5 mb-4 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none" value={user.class} onChange={e => setUser(p => ({...p, class: e.target.value}))} />
                <input type="text" placeholder="Your Big Goal" className="w-full px-4 py-3.5 mb-4 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none" value={user.goal} onChange={e => setUser(p => ({...p, goal: e.target.value}))} />
                <input type="password" placeholder="Set Password" className="w-full px-4 py-3.5 mb-4 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none" value={user.password} onChange={e => setUser(p => ({...p, password: e.target.value}))} />

                <label className="block mb-2 font-medium text-gray-700">What do you usually feel while studying?</label>
                <select
                  className="w-full px-4 py-3.5 mb-6 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none"
                  value={user.studyFeeling}
                  onChange={e => setUser(p => ({...p, studyFeeling: e.target.value}))}
                >
                  <option value="Focused">Focused</option>
                  <option value="Motivated">Motivated</option>
                  <option value="Anxious">Anxious</option>
                  <option value="Bored">Bored</option>
                  <option value="Tired">Tired</option>
                </select>

                <button
                  onClick={finishOnboarding}
                  className="w-full py-4 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-2xl text-lg font-semibold transition-colors"
                >
                  Create Profile & Start
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ========== MAIN APP LAYOUT (Sidebar + Content) ========== */
          <div className="flex min-h-screen">
            
            {/* ===== LEFT SIDEBAR (Desktop) ===== */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-orange-100 shadow-sm fixed h-full z-30">
              {/* Logo */}
              <div className="flex items-center gap-3 px-6 py-6 border-b border-orange-50">
                <img src="/logo.png" alt="Lumora" className="h-10" />
                <h1 className="text-2xl font-bold text-[#9a3412]">Lumora</h1>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => goToPage(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
                      currentPage === item.id
                        ? 'bg-[#9a3412] text-white shadow-md'
                        : 'text-gray-700 hover:bg-orange-50'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* User mini profile at bottom */}
              <div className="px-4 py-5 border-t border-orange-50">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-[#ea580c] flex items-center justify-center text-white font-bold text-lg">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold text-sm truncate">{user.name || 'Student'}</p>
                    <p className="text-xs text-gray-500 truncate">Class {user.class}</p>
                  </div>
                </div>
              </div>
            </aside>

            {/* ===== MOBILE TOP BAR ===== */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-orange-100 z-40 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Lumora" className="h-8" />
                <span className="text-xl font-bold text-[#9a3412]">Lumora</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg bg-orange-50 text-[#9a3412]"
              >
                {isMobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>

            {/* ===== MOBILE SIDEBAR OVERLAY ===== */}
            {isMobileMenuOpen && (
              <div className="md:hidden fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/40" onClick={() => setIsMobileMenuOpen(false)}></div>
                <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-5">
                  <div className="flex items-center gap-3 mb-8">
                    <img src="/logo.png" alt="Lumora" className="h-10" />
                    <h1 className="text-2xl font-bold text-[#9a3412]">Lumora</h1>
                  </div>
                  <nav className="space-y-2">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => goToPage(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left ${
                          currentPage === item.id
                            ? 'bg-[#9a3412] text-white'
                            : 'text-gray-700 hover:bg-orange-50'
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            )}

            {/* ===== MAIN CONTENT AREA ===== */}
            <main className="flex-1 md:ml-64 min-h-screen pt-16 md:pt-0 pb-20 md:pb-8">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">

                {/* ========== DASHBOARD ========== */}
                {currentPage === 'dashboard' && (
                  <div>
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-[#9a3412] to-[#ea580c] rounded-3xl p-6 md:p-8 text-white mb-8 shadow-lg">
                      <h1 className="text-2xl md:text-3xl font-bold mb-1">Welcome back, {user.name}!</h1>
                      <p className="opacity-90">Keep growing. Every day counts. 🌱</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-50">
                        <div className="flex items-center gap-2 text-gray-600 mb-3">
                          <span className="text-2xl">🔥</span>
                          <span className="font-medium">Streak</span>
                        </div>
                        <p className="text-4xl md:text-5xl font-bold text-[#9a3412]">{user.streak} <span className="text-xl font-medium text-gray-500">days</span></p>
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-50">
                        <div className="flex items-center gap-2 text-gray-600 mb-3">
                          <span className="text-2xl">🌱</span>
                          <span className="font-medium">Seeds</span>
                        </div>
                        <p className="text-4xl md:text-5xl font-bold text-[#9a3412]">{user.seeds}</p>
                      </div>
                    </div>

                    {/* Hidden Discoveries */}
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 mb-4">Hidden Discoveries</h2>
                      <div className="space-y-3">
                        {hiddenDiscoveries.map((d, i) => (
                          <div
                            key={i}
                            className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-orange-50 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">✨</span>
                              <span className="text-gray-700">{d}</span>
                            </div>
                            <button
                              onClick={() => setHiddenDiscoveries(prev => prev.filter((_, index) => index !== i))}
                              className="text-red-400 hover:text-red-600 text-lg p-1"
                            >
                              🗑
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ========== DAILY REFLECTION ========== */}
                {currentPage === 'reflection' && (
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-3xl shadow-sm border border-orange-50 p-6 md:p-10">
                      <h2 className="text-2xl font-bold text-[#9a3412] mb-6">Daily Reflection</h2>

                      <input
                        type="text"
                        placeholder="Hours studied today"
                        className="w-full px-4 py-3.5 mb-4 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none"
                        value={reflection.studyHours}
                        onChange={e => setReflection(p => ({...p, studyHours: e.target.value}))}
                      />

                      <textarea
                        placeholder="Subjects studied (comma separated)"
                        className="w-full px-4 py-3.5 mb-4 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none h-24"
                        value={reflection.subjects}
                        onChange={e => setReflection(p => ({...p, subjects: e.target.value}))}
                      />

                      <label className="block mb-2 font-medium text-gray-700">Mood Today</label>
                      <select
                        className="w-full px-4 py-3.5 mb-4 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none"
                        value={reflection.mood}
                        onChange={e => setReflection(p => ({...p, mood: e.target.value}))}
                      >
                        <option value="Great">Great</option>
                        <option value="Good">Good</option>
                        <option value="Okay">Okay</option>
                        <option value="Tired">Tired</option>
                        <option value="Struggling">Struggling</option>
                      </select>

                      <label className="block mb-2 font-medium text-gray-700">Confidence Level</label>
                      <select
                        className="w-full px-4 py-3.5 mb-4 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none"
                        value={reflection.confidence}
                        onChange={e => setReflection(p => ({...p, confidence: e.target.value}))}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>

                      <textarea
                        placeholder="Wins today"
                        className="w-full px-4 py-3.5 mb-4 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none h-28"
                        value={reflection.wins}
                        onChange={e => setReflection(p => ({...p, wins: e.target.value}))}
                      />

                      <textarea
                        placeholder="Struggles"
                        className="w-full px-4 py-3.5 mb-6 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none h-28"
                        value={reflection.struggles}
                        onChange={e => setReflection(p => ({...p, struggles: e.target.value}))}
                      />

                      <button
                        onClick={saveReflection}
                        className="w-full py-4 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-2xl text-lg font-semibold transition-colors"
                      >
                        Save Reflection
                      </button>
                    </div>
                  </div>
                )}

                {/* ========== AI GROWTH MENTOR ========== */}
                {currentPage === 'ai' && (
                  <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-3xl shadow-sm border border-orange-50 p-6 md:p-8">
                      <h2 className="text-2xl font-bold text-[#9a3412] mb-2">🤖 Your AI Growth Mentor</h2>
                      <p className="text-gray-500 mb-6">Personalized using your profile and latest reflections (10 messages/day)</p>

                      <div className="mb-6 max-h-96 overflow-y-auto space-y-3 pr-2">
                        {chatHistory.length === 0 && (
                          <div className="text-center text-gray-400 py-10">
                            Ask anything about your growth journey...
                          </div>
                        )}
                        {chatHistory.map((msg, i) => (
                          <div
                            key={i}
                            className={`p-4 rounded-2xl ${
                              msg.role === 'user'
                                ? 'bg-orange-50 ml-8'
                                : 'bg-[#f8f1e9] mr-8'
                            }`}
                          >
                            <strong className="text-sm text-gray-500 block mb-1">
                              {msg.role === 'user' ? 'You' : 'AI Mentor'}
                            </strong>
                            <p className="text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        ))}
                      </div>

                      <textarea
                        placeholder="Ask anything..."
                        className="w-full px-4 py-3.5 mb-4 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none h-28"
                        value={userMessage}
                        onChange={e => setUserMessage(e.target.value)}
                      />

                      <button
                        onClick={getAIAdvice}
                        disabled={isLoading}
                        className="w-full py-4 bg-[#ea580c] hover:bg-[#c2410c] disabled:bg-orange-300 text-white rounded-2xl text-lg font-semibold transition-colors"
                      >
                        {isLoading ? "AI is thinking..." : "Get Personalized Advice"}
                      </button>

                      {messageLimit >= 10 && (
                        <p className="text-red-500 text-center mt-4">
                          Daily limit reached (10 messages). Come back tomorrow!
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ========== AR GROWTH TREE ========== */}
                {currentPage === 'tree' && (
                  <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-[#9a3412] mb-2">🌳 Your Growth Tree</h1>
                    <p className="text-gray-500 mb-6">AR Filter – Make invisible growth visible</p>

                    <div className="relative w-full max-w-lg mx-auto rounded-3xl overflow-hidden shadow-2xl mb-8">
                      <video
                        id="cameraFeed"
                        autoPlay
                        playsInline
                        className="w-full h-[420px] object-cover bg-black"
                      />
                      
                      <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[140px] pointer-events-none z-10"
                        style={{ animation: 'grow 3s infinite alternate', filter: 'drop-shadow(0 0 40px #4ade80)' }}
                      >
                        🌳
                      </div>

                      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-2 rounded-full text-sm z-20">
                        AR Filter Active • Level {Math.floor(user.streak / 3) + 1}
                      </div>
                    </div>

                    <button
                      onClick={startCamera}
                      className="px-10 py-4 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-full text-lg font-semibold shadow-lg transition-colors"
                    >
                      Start AR Camera (Selfie)
                    </button>

                    <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-orange-50 inline-block">
                      <h3 className="font-bold text-lg text-[#9a3412]">Current Level: {Math.floor(user.streak / 3) + 1}</h3>
                      <p className="text-gray-600 mt-1">Streak: {user.streak} days | Seeds: {user.seeds}</p>
                    </div>
                  </div>
                )}

                {/* ========== CAREER ROADMAP (Placeholder) ========== */}
                {currentPage === 'career' && (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🎯</div>
                    <h2 className="text-2xl font-bold text-[#9a3412] mb-2">Career Roadmap</h2>
                    <p className="text-gray-500">Coming very soon in Lumora v2...</p>
                  </div>
                )}

              </div>
            </main>

            {/* ===== MOBILE BOTTOM NAV ===== */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 z-40 flex justify-around py-2 safe-area-pb">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => goToPage(item.id)}
                  className={`flex flex-col items-center px-2 py-1.5 rounded-xl ${
                    currentPage === item.id ? 'text-[#9a3412]' : 'text-gray-500'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-[10px] mt-0.5 font-medium">{item.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </>
  );
}

export default App;