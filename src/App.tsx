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
  const [userMessage, setUserMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [messageLimit, setMessageLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f1e9', fontFamily: 'system-ui, sans-serif', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
      <nav style={{ backgroundColor: 'white', padding: '16px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '36px' }}>🌱</span>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#9a3412' }}>Lumora</h1>
          </div>
          
          {currentPage !== 'login' && currentPage !== 'onboarding' && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => setCurrentPage('dashboard')} style={navButtonStyle}>🏠</button>
              <button onClick={() => setCurrentPage('reflection')} style={navButtonStyle}>📝</button>
              <button onClick={() => setCurrentPage('ai')} style={navButtonStyle}>🤖</button>
              <button onClick={() => setCurrentPage('tree')} style={navButtonStyle}>🌳</button>
            </div>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
        {currentPage === 'login' && (
          <div style={{ maxWidth: '420px', margin: '80px auto', backgroundColor: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h1 style={{ textAlign: 'center', fontSize: '38px', color: '#9a3412' }}>Welcome to Lumora</h1>
            <input type="text" placeholder="User ID" style={inputStyle} value={loginId} onChange={e => setLoginId(e.target.value)} />
            <input type="password" placeholder="Password" style={inputStyle} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
            {loginError && <p style={{ color: 'red', textAlign: 'center' }}>{loginError}</p>}
            <button onClick={handleLogin} style={buttonStyle}>Login</button>
            <p style={{ textAlign: 'center', marginTop: '20px' }}>New here? <button onClick={() => setCurrentPage('onboarding')} style={{color: '#ea580c', border:'none', background:'none'}}>Create Account</button></p>
          </div>
        )}

        {currentPage === 'onboarding' && (
          <div style={{ maxWidth: '620px', margin: '0 auto', backgroundColor: 'white', padding: '50px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h1 style={{ textAlign: 'center', fontSize: '38px', color: '#9a3412' }}>Create Your Profile</h1>
            <input type="text" placeholder="Unique User ID" style={inputStyle} value={user.id} onChange={e => setUser(p => ({...p, id: e.target.value}))} />
            <input type="text" placeholder="Full Name" style={inputStyle} value={user.name} onChange={e => setUser(p => ({...p, name: e.target.value}))} />
            <input type="text" placeholder="Class" style={inputStyle} value={user.class} onChange={e => setUser(p => ({...p, class: e.target.value}))} />
            <input type="text" placeholder="Your Big Goal" style={inputStyle} value={user.goal} onChange={e => setUser(p => ({...p, goal: e.target.value}))} />
            <input type="password" placeholder="Set Password" style={inputStyle} value={user.password} onChange={e => setUser(p => ({...p, password: e.target.value}))} />

            <label style={{display:'block', margin:'15px 0 8px'}}>What do you usually feel while studying?</label>
            <select style={inputStyle} value={user.studyFeeling} onChange={e => setUser(p => ({...p, studyFeeling: e.target.value}))}>
              <option value="Focused">Focused</option>
              <option value="Motivated">Motivated</option>
              <option value="Anxious">Anxious</option>
              <option value="Bored">Bored</option>
              <option value="Tired">Tired</option>
            </select>

            <button onClick={finishOnboarding} style={buttonStyle}>Create Profile & Start</button>
          </div>
        )}

        {currentPage === 'dashboard' && (
          <div>
            <h1 style={{ textAlign: 'center', fontSize: '42px', color: '#9a3412' }}>Welcome back, {user.name}!</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginTop: '40px' }}>
              <div style={cardStyle}><h3>🔥 Streak</h3><p style={{fontSize: '52px', fontWeight: 'bold'}}>{user.streak} days</p></div>
              <div style={cardStyle}><h3>🌱 Seeds</h3><p style={{fontSize: '52px', fontWeight: 'bold'}}>{user.seeds}</p></div>
            </div>
            <div style={{ marginTop: '50px' }}>
              <h3>Hidden Discoveries</h3>
              {hiddenDiscoveries.map((d, i) => (
                <div key={i} style={{backgroundColor: 'white', padding: '20px', marginTop: '15px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  ✨ {d}
                  <button onClick={() => setHiddenDiscoveries(prev => prev.filter((_, index) => index !== i))} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '20px' }}>🗑</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentPage === 'reflection' && (
          <div style={{ maxWidth: '700px', margin: '0 auto', backgroundColor: 'white', padding: '50px', borderRadius: '24px' }}>
            <h2>Daily Reflection</h2>
            <input type="text" placeholder="Hours studied today" style={inputStyle} value={reflection.studyHours} onChange={e => setReflection(p => ({...p, studyHours: e.target.value}))} />
            <textarea placeholder="Subjects studied (comma separated)" style={{...inputStyle, height: '80px'}} value={reflection.subjects} onChange={e => setReflection(p => ({...p, subjects: e.target.value}))} />

            <label style={{display:'block', margin:'15px 0 8px'}}>Mood Today</label>
            <select style={inputStyle} value={reflection.mood} onChange={e => setReflection(p => ({...p, mood: e.target.value}))}>
              <option value="Great">Great</option>
              <option value="Good">Good</option>
              <option value="Okay">Okay</option>
              <option value="Tired">Tired</option>
              <option value="Struggling">Struggling</option>
            </select>

            <label style={{display:'block', margin:'15px 0 8px'}}>Confidence Level</label>
            <select style={inputStyle} value={reflection.confidence} onChange={e => setReflection(p => ({...p, confidence: e.target.value}))}>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <textarea placeholder="Wins today" style={{...inputStyle, height: '100px'}} value={reflection.wins} onChange={e => setReflection(p => ({...p, wins: e.target.value}))} />
            <textarea placeholder="Struggles" style={{...inputStyle, height: '100px'}} value={reflection.struggles} onChange={e => setReflection(p => ({...p, struggles: e.target.value}))} />

            <button onClick={saveReflection} style={buttonStyle}>Save Reflection</button>
          </div>
        )}

        {currentPage === 'ai' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '24px' }}>
            <h2>🤖 Your AI Growth Mentor</h2>
            <p>Personalized using your profile and latest reflections (10 messages/day)</p>

            <div style={{ marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }}>
              {chatHistory.map((msg, i) => (
                <div key={i} style={{
                  marginBottom: '15px',
                  padding: '15px',
                  borderRadius: '12px',
                  backgroundColor: msg.role === 'user' ? '#f0f0f0' : '#f8f1e9'
                }}>
                  <strong>{msg.role === 'user' ? 'You' : 'AI Mentor'}:</strong> {msg.content}
                </div>
              ))}
            </div>

            <textarea 
              placeholder="Ask anything..." 
              style={{...inputStyle, height: '120px'}} 
              value={userMessage} 
              onChange={e => setUserMessage(e.target.value)}
            />

            <button onClick={getAIAdvice} disabled={isLoading} style={buttonStyle}>
              {isLoading ? "AI is thinking..." : "Get Personalized Advice"}
            </button>

            {messageLimit >= 10 && <p style={{color: 'red', marginTop: '10px'}}>Daily limit reached (10 messages). Come back tomorrow!</p>}
          </div>
        )}

        {currentPage === 'tree' && (
          <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: '42px', color: '#9a3412' }}>🌳 Your Growth Tree</h1>
            <p style={{ marginBottom: '30px' }}>Your tree grows with streak and seeds</p>

            <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', position: 'relative' }}>
              <div style={{ width: '100%', height: '500px', backgroundColor: '#f0f0f0', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '120px' }}>
                🌳
              </div>
              <button onClick={() => alert('AR mode is coming soon! For now, imagine your tree growing in your room 🌱')} style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '12px 24px',
                backgroundColor: '#ea580c',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                cursor: 'pointer',
                zIndex: 10
              }}>
                View in AR 📱
              </button>
            </div>

            <div style={{ marginTop: '40px', backgroundColor: 'white', padding: '30px', borderRadius: '20px' }}>
              <h3>Current Level: {Math.floor(user.streak / 3) + 1}</h3>
              <p>Streak: {user.streak} days | Seeds: {user.seeds}</p>
              <p>The tree grows stronger with every reflection and AI session!</p>
            </div>
          </div>
        )}

        {currentPage === 'career' && <div style={{ textAlign: 'center', padding: '120px' }}>🎯 Career Roadmap - Coming Soon</div>}
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '16px', marginBottom: '16px', borderRadius: '12px', border: '2px solid #fed7aa', fontSize: '17px' };
const buttonStyle = { width: '100%', padding: '18px', backgroundColor: '#ea580c', color: 'white', border: 'none', borderRadius: '16px', fontSize: '19px', marginTop: '20px', cursor: 'pointer' };
const navButtonStyle = { padding: '10px 18px', backgroundColor: '#9a3412', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '15px' };
const cardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center' as const, boxShadow: '0 10px 15px rgba(0,0,0,0.08)' };

export default App;