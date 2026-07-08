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

  const handleLogin = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginId)
      .single();

    if (error || !data) {
      setLoginError("Invalid User ID");
      return;
    }

    setUser({
      id: data.id,
      name: data.name,
      class: data.class,
      goal: data.goal,
      preferredTone: data.preferred_tone,
      studentType: data.student_type,
      studyFeeling: data.study_feeling,
      streak: 0,
      seeds: 0,
      completedOnboarding: true,
    });
    setCurrentPage('dashboard');
  };

  const finishOnboarding = async () => {
    if (!user.id || !user.name || !user.class || !user.goal) {
      alert("Please fill all fields!");
      return;
    }

    const { error } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        name: user.name,
        class: user.class,
        goal: user.goal,
        preferred_tone: user.preferredTone,
        student_type: user.studentType,
        study_feeling: user.studyFeeling
      }]);

    if (error) {
      alert("User ID already exists!");
      return;
    }

    const newUser = { ...user, completedOnboarding: true };
    setUser(newUser);
    localStorage.setItem('lumoraUser', JSON.stringify(newUser));
    setCurrentPage('dashboard');
  };

  const saveReflection = async () => {
    const today = new Date().toISOString().split('T')[0];
    if (localStorage.getItem('lastReflectionDate') === today) {
      alert("You already reflected today!");
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
      alert("Error saving reflection");
      return;
    }

    setUser(prev => ({
      ...prev,
      streak: prev.streak + 1,
      seeds: prev.seeds + 15
    }));

    setHiddenDiscoveries(prev => [...prev, "New pattern detected from your reflection!"]);
    alert("Reflection saved! Streak and Seeds updated.");
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
          <div style={{ maxWidth: '400px', margin: '100px auto', backgroundColor: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h1 style={{ textAlign: 'center', fontSize: '38px', color: '#9a3412' }}>Login to Lumora</h1>
            <input type="text" placeholder="User ID" style={inputStyle} value={loginId} onChange={e => setLoginId(e.target.value)} />
            <input type="password" placeholder="Password" style={inputStyle} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            {loginError && <p style={{ color: 'red', textAlign: 'center' }}>{loginError}</p>}
            <button onClick={handleLogin} style={buttonStyle}>Login</button>
            <p style={{ textAlign: 'center', marginTop: '20px' }}>Don't have an account? <button onClick={() => setCurrentPage('onboarding')} style={{ color: '#ea580c', background: 'none', border: 'none' }}>Create one</button></p>
          </div>
        )}

        {currentPage === 'onboarding' && (
          <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h1 style={{ textAlign: 'center', fontSize: '38px', color: '#9a3412' }}>Create Your Profile</h1>
            <p style={{ textAlign: 'center', marginBottom: '40px', color: '#666' }}>Choose unique User ID</p>

            <input type="text" placeholder="Unique User ID (e.g. aarav09)" style={inputStyle} value={user.id} onChange={e => setUser(p => ({...p, id: e.target.value}))} />
            <input type="text" placeholder="Your Full Name" style={inputStyle} value={user.name} onChange={e => setUser(p => ({...p, name: e.target.value}))} />
            <input type="text" placeholder="Your Class" style={inputStyle} value={user.class} onChange={e => setUser(p => ({...p, class: e.target.value}))} />
            <input type="text" placeholder="Your Big Dream / Goal" style={inputStyle} value={user.goal} onChange={e => setUser(p => ({...p, goal: e.target.value}))} />

            <label style={{ display: 'block', margin: '15px 0 8px' }}>Preferred AI Tone</label>
            <select style={inputStyle} value={user.preferredTone} onChange={e => setUser(p => ({...p, preferredTone: e.target.value}))}>
              <option value="Friendly">Friendly</option>
              <option value="Coach">Coach</option>
              <option value="Mentor">Mentor</option>
            </select>

            <label style={{ display: 'block', margin: '15px 0 8px' }}>What type of student are you?</label>
            <select style={inputStyle} value={user.studentType} onChange={e => setUser(p => ({...p, studentType: e.target.value}))}>
              <option value="Visual">Visual Learner</option>
              <option value="Auditory">Auditory Learner</option>
              <option value="Kinesthetic">Kinesthetic Learner</option>
              <option value="Mixed">Mixed</option>
            </select>

            <label style={{ display: 'block', margin: '15px 0 8px' }}>What do you usually feel while studying?</label>
            <select style={inputStyle} value={user.studyFeeling} onChange={e => setUser(p => ({...p, studyFeeling: e.target.value}))}>
              <option value="Focused">Focused</option>
              <option value="Anxious">Anxious</option>
              <option value="Bored">Bored</option>
              <option value="Motivated">Motivated</option>
              <option value="Tired">Tired</option>
            </select>

            <button onClick={finishOnboarding} style={buttonStyle}>Create Profile & Start</button>
          </div>
        )}

        {currentPage === 'dashboard' && (
          <div>
            <h1 style={{ textAlign: 'center', fontSize: '42px', color: '#9a3412' }}>Welcome back, {user.name}!</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginTop: '40px' }}>
              <div style={cardStyle}><h3>🔥 Streak</h3><p style={{fontSize: '52px', fontWeight: 'bold'}}>{user.streak}</p></div>
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
            <textarea placeholder="Subjects studied" style={{...inputStyle, height: '80px'}} value={reflection.subjects} onChange={e => setReflection(p => ({...p, subjects: e.target.value}))} />
            <textarea placeholder="Wins today" style={{...inputStyle, height: '100px'}} value={reflection.wins} onChange={e => setReflection(p => ({...p, wins: e.target.value}))} />
            <textarea placeholder="Struggles" style={{...inputStyle, height: '100px'}} value={reflection.struggles} onChange={e => setReflection(p => ({...p, struggles: e.target.value}))} />
            <button onClick={saveReflection} style={buttonStyle}>Save Reflection</button>
          </div>
        )}

        {currentPage === 'ai' && <div style={{ textAlign: 'center', padding: '120px', fontSize: '26px' }}>AI Mentor - Coming Soon</div>}
        {currentPage === 'tree' && <div style={{ textAlign: 'center', padding: '120px' }}><div style={{fontSize: '200px'}}>🌳</div><h2>Your Growth Tree</h2></div>}
        {currentPage === 'career' && <div style={{ textAlign: 'center', padding: '120px' }}>Career Companion - Coming Soon</div>}
      </div>
    </div>
  );
}

const inputStyle = { 
  width: '100%', 
  padding: '16px', 
  marginBottom: '16px', 
  borderRadius: '12px', 
  border: '2px solid #fed7aa', 
  fontSize: '17px' 
};

const buttonStyle = { 
  width: '100%', 
  padding: '18px', 
  backgroundColor: '#ea580c', 
  color: 'white', 
  border: 'none', 
  borderRadius: '16px', 
  fontSize: '19px', 
  marginTop: '20px', 
  cursor: 'pointer' 
};

const cardStyle = { 
  backgroundColor: 'white', 
  padding: '30px', 
  borderRadius: '20px', 
  textAlign: 'center' as const, 
  boxShadow: '0 10px 15px rgba(0,0,0,0.08)' 
};

const navStyle = (active: boolean) => ({ 
  padding: '10px 20px', 
  borderRadius: '9999px', 
  backgroundColor: active ? '#ea580c' : 'transparent', 
  color: active ? 'white' : '#444', 
  border: 'none', 
  cursor: 'pointer' 
});

export default App;