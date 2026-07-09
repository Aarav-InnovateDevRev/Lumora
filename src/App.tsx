import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'onboarding' | 'dashboard' | 'reflection' | 'ai' | 'tree' | 'career'>('login');
  
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [user, setUser] = useState({
    id: "",
    name: "",
    class: "",
    goal: "",
    preferredTone: "Friendly",
    studentType: "Mixed",
    studyFeeling: "Focused",
    password: "",           // Added password
    streak: 0,
    seeds: 0,
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
    "You are building good daily habits 🌱",
  ]);

  // Load saved user
  useEffect(() => {
    const saved = localStorage.getItem('lumoraUser');
    if (saved) {
      setUser(JSON.parse(saved));
      setCurrentPage('dashboard');
    }
  }, []);

  const handleLogin = async () => {
    setLoginError("");
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginId)
      .single();

    if (error || !data) {
      setLoginError("❌ Invalid User ID. Try creating a new account.");
      return;
    }

    // Simple password check (for MVP)
    if (data.password && data.password !== loginPassword) {
      setLoginError("❌ Wrong Password");
      return;
    }

    setUser({
      id: data.id,
      name: data.name,
      class: data.class,
      goal: data.goal,
      preferredTone: data.preferred_tone || "Friendly",
      studentType: data.student_type || "Mixed",
      studyFeeling: data.study_feeling || "Focused",
      password: data.password || "",
      streak: 5,
      seeds: 120,
    });
    setCurrentPage('dashboard');
    alert("✅ Login Successful!");
  };

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
        password: user.password || "123456"   // default password for testing
      }], { onConflict: 'id' });

    if (error) {
      console.error("Supabase Error:", error);
      alert(`❌ Error: ${error.message}\n\nTry a different User ID like: test${Date.now() % 10000}`);
      return;
    }

    const newUser = { ...user, completedOnboarding: true };
    setUser(newUser);
    localStorage.setItem('lumoraUser', JSON.stringify(newUser));
    
    alert("✅ Profile Created Successfully!");
    setCurrentPage('dashboard');
  };

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
      alert(`❌ Save Error: ${error.message}`);
      return;
    }

    setUser(prev => ({
      ...prev,
      streak: prev.streak + 1,
      seeds: prev.seeds + 15
    }));

    setHiddenDiscoveries(prev => [...prev, "New growth pattern detected!"]);
    alert("✅ Reflection Saved! +1 Streak & +15 Seeds");
    setCurrentPage('dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f1e9', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ backgroundColor: 'white', padding: '16px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '36px' }}>🌱</span>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#9a3412' }}>Lumora</h1>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
        {currentPage === 'login' && (
          <div style={{ maxWidth: '420px', margin: '80px auto', backgroundColor: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h1 style={{ textAlign: 'center', fontSize: '38px', color: '#9a3412' }}>Welcome to Lumora</h1>
            <input type="text" placeholder="User ID (e.g. aarav2026)" style={inputStyle} value={loginId} onChange={e => setLoginId(e.target.value)} />
            <input type="password" placeholder="Password" style={inputStyle} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            {loginError && <p style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>{loginError}</p>}
            <button onClick={handleLogin} style={buttonStyle}>Login</button>
            <p style={{ textAlign: 'center', marginTop: '25px' }}>
              New here? <button onClick={() => setCurrentPage('onboarding')} style={{ color: '#ea580c', background: 'none', border: 'none', fontSize: '17px' }}>Create Account</button>
            </p>
          </div>
        )}

        {currentPage === 'onboarding' && (
          <div style={{ maxWidth: '620px', margin: '0 auto', backgroundColor: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h1 style={{ textAlign: 'center', fontSize: '38px', color: '#9a3412' }}>Create Your Profile</h1>
            <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666' }}>Choose a unique User ID</p>

            <input type="text" placeholder="Unique User ID (e.g. aarav2026)" style={inputStyle} value={user.id} onChange={e => setUser(p => ({...p, id: e.target.value}))} />
            <input type="text" placeholder="Your Full Name" style={inputStyle} value={user.name} onChange={e => setUser(p => ({...p, name: e.target.value}))} />
            <input type="text" placeholder="Class (e.g. 9)" style={inputStyle} value={user.class} onChange={e => setUser(p => ({...p, class: e.target.value}))} />
            <input type="text" placeholder="Your Big Goal / Dream" style={inputStyle} value={user.goal} onChange={e => setUser(p => ({...p, goal: e.target.value}))} />
            <input type="password" placeholder="Set Password (for future login)" style={inputStyle} value={user.password} onChange={e => setUser(p => ({...p, password: e.target.value}))} />

            {/* Other fields */}
            <label style={{ display: 'block', margin: '15px 0 8px' }}>Preferred AI Tone</label>
            <select style={inputStyle} value={user.preferredTone} onChange={e => setUser(p => ({...p, preferredTone: e.target.value}))}>
              <option value="Friendly">Friendly</option>
              <option value="Coach">Coach</option>
              <option value="Mentor">Mentor</option>
            </select>

            <button onClick={finishOnboarding} style={buttonStyle}>Create Profile & Start Journey</button>
          </div>
        )}

        {/* Dashboard, Reflection, etc. same as before */}
        {currentPage === 'dashboard' && (
          <div>
            <h1 style={{ textAlign: 'center', fontSize: '42px', color: '#9a3412' }}>Welcome back, {user.name}!</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginTop: '40px' }}>
              <div style={cardStyle}><h3>🔥 Streak</h3><p style={{fontSize: '52px', fontWeight: 'bold'}}>{user.streak} days</p></div>
              <div style={cardStyle}><h3>🌱 Seeds</h3><p style={{fontSize: '52px', fontWeight: 'bold'}}>{user.seeds}</p></div>
            </div>
            <div style={{ marginTop: '50px' }}>
              <h3>Hidden Discoveries</h3>
              {hiddenDiscoveries.map((d, i) => <div key={i} style={{backgroundColor: 'white', padding: '20px', marginTop: '15px', borderRadius: '16px'}}>✨ {d}</div>)}
            </div>
          </div>
        )}

        {currentPage === 'reflection' && (
          <div style={{ maxWidth: '700px', margin: '0 auto', backgroundColor: 'white', padding: '50px', borderRadius: '24px' }}>
            <h2>Daily Reflection</h2>
            <input type="text" placeholder="Hours studied today" style={inputStyle} value={reflection.studyHours} onChange={e => setReflection(p => ({...p, studyHours: e.target.value}))} />
            <textarea placeholder="Subjects studied (comma separated)" style={{...inputStyle, height: '80px'}} value={reflection.subjects} onChange={e => setReflection(p => ({...p, subjects: e.target.value}))} />
            <textarea placeholder="Wins today" style={{...inputStyle, height: '100px'}} value={reflection.wins} onChange={e => setReflection(p => ({...p, wins: e.target.value}))} />
            <textarea placeholder="Struggles / Challenges" style={{...inputStyle, height: '100px'}} value={reflection.struggles} onChange={e => setReflection(p => ({...p, struggles: e.target.value}))} />
            <button onClick={saveReflection} style={buttonStyle}>Save Reflection</button>
          </div>
        )}

        {currentPage === 'ai' && <div style={{ textAlign: 'center', padding: '120px', fontSize: '26px' }}>🤖 AI Mentor - Coming Soon</div>}
        {currentPage === 'tree' && <div style={{ textAlign: 'center', padding: '120px' }}><div style={{fontSize: '180px'}}>🌳</div><h2>Your Growth Tree</h2></div>}
        {currentPage === 'career' && <div style={{ textAlign: 'center', padding: '120px' }}>🎯 Career Companion - Coming Soon</div>}
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '16px', marginBottom: '16px', borderRadius: '12px', border: '2px solid #fed7aa', fontSize: '17px' };
const buttonStyle = { width: '100%', padding: '18px', backgroundColor: '#ea580c', color: 'white', border: 'none', borderRadius: '16px', fontSize: '19px', marginTop: '20px', cursor: 'pointer' };
const cardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center' as const, boxShadow: '0 10px 15px rgba(0,0,0,0.08)' };

export default App;