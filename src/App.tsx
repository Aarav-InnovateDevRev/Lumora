import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { getAIMentorResponse } from './aiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function App() {
  const [currentPage, setCurrentPage] = useState<'login' | 'onboarding' | 'dashboard' | 'reflection' | 'ai' | 'tree' | 'career' | 'pomodoro' | 'leaderboard' | 'stats' | 'mirror' | 'reels' | 'planner'>('login');
  
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [user, setUser] = useState({
    id: "", name: "", class: "", goal: "", preferredTone: "Friendly",
    studentType: "Mixed", studyFeeling: "Focused", password: "",
    streak: 0, seeds: 0,
  });

  const [reflection, setReflection] = useState({
  studyHours: "", 
  subjects: "", 
  mood: "Good", 
  confidence: "Medium", 
  wins: "", 
  struggles: "",
  tomorrowIntention: ""
});
  const [yesterdayIntention, setYesterdayIntention] = useState<any>(null);

  const [hiddenDiscoveries, setHiddenDiscoveries] = useState<string[]>(["You started your growth journey 🌱"]);

  const [userMessage, setUserMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [messageLimit, setMessageLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [reelsCategory, setReelsCategory] = useState<'all' | 'facts' | 'space' | 'mindset'>('all');
  const [watchedReelsCount, setWatchedReelsCount] = useState(0);
  const [showReelsLimit, setShowReelsLimit] = useState(false);

  const [plannerInput, setPlannerInput] = useState("");
  const [weeklyPlan, setWeeklyPlan] = useState<string>("");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [leaderboardTab, setLeaderboardTab] = useState<'streak' | 'seeds'>('streak');

  const [reflectionsData, setReflectionsData] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const [futureVision, setFutureVision] = useState("");
  const [isGeneratingFuture, setIsGeneratingFuture] = useState(false);

  const [careerAnalysis, setCareerAnalysis] = useState("");
  const [isAnalyzingCareer, setIsAnalyzingCareer] = useState(false);
  const [suggestedGoal, setSuggestedGoal] = useState("");
  const [careerSteps, setCareerSteps] = useState<any[]>([]);
  const [isGeneratingStep, setIsGeneratingStep] = useState(false);

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

  const reelsData = [
  {
    id: 1,
    title: "Strange Facts About Your Body",
    channel: "FactoHolic",
    category: "facts",
    videoId: "tJ2nrgUMWy8"
  },
  {
    id: 2,
    title: "Why Do We Crave Sweets",
    channel: "FactoHolic",
    category: "facts",
    videoId: "tL_zR0lA3ns"
  },
  {
    id: 3,
    title: "The Nasal Cycle",
    channel: "FactoHolic",
    category: "facts",
    videoId: "rqaVLsjqfok"
  },
  {
    id: 4,
    title: "Saturn's Perfect Hexagon",
    channel: "Spacetopia",
    category: "space",
    videoId: "peGn_Bw1R1c"
  },
  {
    id: 5,
    title: "Moon Has a Comet-like Tail",
    channel: "Spacetopia",
    category: "space",
    videoId: "BkYW-9T1_Tg"
  },
  {
    id: 6,
    title: "The Loneliest Place in the Universe",
    channel: "Spacetopia",
    category: "space",
    videoId: "4rITv5ceH2I"
  },
  {
    id: 7,
    title: "How Medicines Work",
    channel: "FactoHolic",
    category: "facts",
    videoId: "zE1pGmSbtAc"
  },
  {
    id: 8,
    title: "Stay Consistent - Study Motivation",
    channel: "Mindset",
    category: "mindset",
    videoId: "ZXsQAXx_ao0"
  }
];

  // ==================== LOAD USER ====================
  useEffect(() => {
    const loadUserProperly = async () => {
      const saved = localStorage.getItem('lumoraUser');
      if (!saved) return;

      const savedUser = JSON.parse(saved);

      try {
        const { data: profile } = await supabase
          .from('growth_profile')
          .select('current_streak, total_seeds')
          .eq('user_id', savedUser.id)
          .single();

        const updatedUser = {
          ...savedUser,
          streak: profile?.current_streak ?? 0,
          seeds: profile?.total_seeds ?? 0,
        };

        setUser(updatedUser);
        localStorage.setItem('lumoraUser', JSON.stringify(updatedUser));
        setCurrentPage('dashboard');
      } catch (err) {
        setUser(savedUser);
        setCurrentPage('dashboard');
      }
    };

    loadUserProperly();
  }, []);

  useEffect(() => {
    if ((currentPage === 'stats' || currentPage === 'mirror' || currentPage === 'dashboard') && user.id) {
      fetchStatsData();
    }
    if ((currentPage === 'reflection' || currentPage === 'dashboard') && user.id) {
    loadYesterdayIntention();
    }
    if (currentPage === 'career' && user.id) {
      loadCareerTimeline();
    }
  }, [currentPage, user.id]);

  const fetchStatsData = async () => {
    setStatsLoading(true);
    try {
      const { data } = await supabase
        .from('daily_reflections')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .limit(30);
      setReflectionsData(data || []);
    } catch (err) {
      setReflectionsData([]);
    }
    setStatsLoading(false);
  };

  // ==================== LOAD YESTERDAY INTENTION ====================
const loadYesterdayIntention = async () => {
  if (!user.id) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const { data } = await supabase
    .from('daily_reflections')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', yesterdayStr)
    .single();

  if (data && data.tomorrow_intention && !data.intention_completed) {
    setYesterdayIntention(data);
  } else {
    setYesterdayIntention(null);
  }
};

const markIntentionCompleted = async (completed: boolean) => {
  if (!yesterdayIntention) return;

  await supabase
    .from('daily_reflections')
    .update({ intention_completed: completed })
    .eq('id', yesterdayIntention.id);

  setYesterdayIntention(null);

  if (completed) {
    await addSeeds(5, "Completed yesterday's intention");
    alert("Great! +5 Seeds for following through.");
  }
};

  // ==================== DAILY / WEEKLY PLANNER ====================
const generateWeeklyPlan = async () => {
  if (!user.id) return;
  setIsGeneratingPlan(true);
  setWeeklyPlan("");

  try {
    const trajectory = calculateTrajectory();

    const prompt = `You are Lumora's Weekly Planner.

Student Goal: ${user.goal}
Class: ${user.class}
Streak: ${user.streak}
Study Feeling: ${user.studyFeeling}

Current Trajectory:
Study Consistency: ${trajectory.studyConsistency}
Energy: ${trajectory.energy}
Burnout Risk: ${trajectory.burnoutRisk}

What the student wants to focus on this week:
${plannerInput || "General progress toward my goal"}

Create a light and realistic weekly plan.

Rules:
- Only give 5 short tasks for the whole week (not a full timetable)
- Each task should be small and achievable
- Make it personalized
- Format clearly like this:

Monday: ...
Tuesday: ...
Wednesday: ...
Thursday: ...
Friday: ...

Keep the total response under 120 words.`;

    const result = await getAIMentorResponse(user, prompt);
    setWeeklyPlan(result.response);

  } catch (error) {
    setWeeklyPlan("Sorry, I couldn't create your plan right now. Please try again.");
  }

  setIsGeneratingPlan(false);
};

  // ==================== POMODORO ====================
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
        addSeeds(5, "Completed a Pomodoro session");
        alert("Work session complete! +5 Seeds. Time for a 5-minute break.");
      } else {
        setPomodoroMode('work');
        setTimeLeft(25 * 60);
        alert("Break over! Ready for another focus session?");
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

  // ==================== SEEDS SYSTEM ====================
const addSeeds = async (amount: number, reason: string = "") => {
  if (!user.id || amount <= 0) return;

  const newSeeds = (user.seeds || 0) + amount;

  await supabase
    .from('growth_profile')
    .update({ total_seeds: newSeeds })
    .eq('user_id', user.id);

  const updatedUser = { ...user, seeds: newSeeds };
  setUser(updatedUser);
  localStorage.setItem('lumoraUser', JSON.stringify(updatedUser));

  if (reason) {
    setHiddenDiscoveries(prev => [...prev, `+${amount} Seeds: ${reason}`]);
  }
};

const checkStreakMilestones = async (newStreak: number) => {
  if (newStreak === 7) {
    await addSeeds(25, "7-day streak milestone!");
    alert("🎉 7-day streak! +25 bonus Seeds");
  } else if (newStreak === 14) {
    await addSeeds(50, "14-day streak milestone!");
    alert("🎉 14-day streak! +50 bonus Seeds");
  } else if (newStreak === 30) {
    await addSeeds(100, "30-day streak milestone!");
    alert("🎉 30-day streak! +100 bonus Seeds");
  }
};

// ==================== CALCULATE TRAJECTORY ====================
const calculateTrajectory = () => {
  if (reflectionsData.length === 0) {
    return {
      studyConsistency: 50,
      skillGrowth: 50,
      energy: 50,
      goalAlignment: 50,
      burnoutRisk: 50
    };
  }

  const recent = reflectionsData.slice(-14); // last 14 days if available
  const count = recent.length;

  // Study Consistency (based on study hours)
  const avgHours = recent.reduce((sum, r) => sum + (Number(r.study_hours) || 0), 0) / count;
  const studyConsistency = Math.min(100, Math.round((avgHours / 4) * 100)); // 4 hours = 100%

  // Skill Growth (based on confidence)
  const confidenceScore = recent.reduce((sum, r) => {
    if (r.confidence === 'High') return sum + 3;
    if (r.confidence === 'Medium') return sum + 2;
    return sum + 1;
  }, 0);
  const skillGrowth = Math.round((confidenceScore / (count * 3)) * 100);

  // Energy (based on mood)
  const moodScore = recent.reduce((sum, r) => {
    if (r.mood === 'Great') return sum + 5;
    if (r.mood === 'Good') return sum + 4;
    if (r.mood === 'Okay') return sum + 3;
    if (r.mood === 'Tired') return sum + 2;
    return sum + 1;
  }, 0);
  const energy = Math.round((moodScore / (count * 5)) * 100);

  // Goal Alignment (simple: higher if user has reflections + streak)
  const goalAlignment = Math.min(100, Math.round((user.streak * 4) + (count * 2)));

  // Burnout Risk (higher when mood is low + high study hours)
  const burnoutRisk = Math.min(100, Math.round(100 - energy + (avgHours > 5 ? 20 : 0)));

  return {
    studyConsistency,
    skillGrowth,
    energy,
    goalAlignment,
    burnoutRisk
  };
};

  // ==================== LOGIN ====================
  const handleLogin = async () => {
    setLoginError("");
    const { data, error } = await supabase.from('users').select('*').eq('id', loginId).single();

    if (error || !data) {
      setLoginError("Invalid User ID");
      return;
    }

    if (data.password && data.password !== loginPassword) {
      setLoginError("Wrong Password");
      return;
    }

    const { data: profile } = await supabase.from('growth_profile').select('*').eq('user_id', loginId).single();

    if (!profile) {
      await supabase.from('growth_profile').insert([{
        user_id: loginId, total_seeds: 0, current_streak: 0, longest_streak: 0, growth_score: 0
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
    localStorage.setItem('lumoraUser', JSON.stringify(finalUser));
    setCurrentPage('dashboard');
  };

  // ==================== ONBOARDING ====================
  const finishOnboarding = async () => {
    if (!user.id || !user.name || !user.class || !user.goal) {
      alert("Please fill all fields!");
      return;
    }

    const { error } = await supabase.from('users').upsert([{
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
      alert(`Error: ${error.message}`);
      return;
    }

    await supabase.from('growth_profile').insert([{
      user_id: user.id, total_seeds: 0, current_streak: 0, longest_streak: 0, growth_score: 0
    }]);

    const newUser = { ...user, streak: 0, seeds: 0 };
    setUser(newUser);
    localStorage.setItem('lumoraUser', JSON.stringify(newUser));
    alert("Profile Created!");
    setCurrentPage('dashboard');
  };

  // ==================== SAVE REFLECTION ====================
  const saveReflection = async () => {
    const today = new Date().toISOString().split('T')[0];
    if (localStorage.getItem('lastReflectionDate') === today) {
      alert("You already reflected today!");
      return;
    }

    localStorage.setItem('lastReflectionDate', today);

    const { error: reflectionError } = await supabase.from('daily_reflections').insert([{
  user_id: user.id,
  date: today,
  study_hours: parseFloat(reflection.studyHours) || 0,
  subjects: reflection.subjects.split(',').map(s => s.trim()),
  mood: reflection.mood,
  confidence: reflection.confidence,
  wins: reflection.wins,
  struggles: reflection.struggles,
  tomorrow_intention: reflection.tomorrowIntention || null,
  intention_completed: false
}]);

    if (reflectionError) {
      alert(`Reflection Error: ${reflectionError.message}`);
      return;
    }

    const newStreak = (user.streak || 0) + 1;
    const newSeeds = (user.seeds || 0) + 15;
    const newLevel = Math.floor(newStreak / 3) + 1;
    const newGrowthScore = Math.min(100, Math.round(newStreak * 5 + newSeeds / 10));

    const { data: existingProfile } = await supabase
      .from('growth_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      await supabase
        .from('growth_profile')
        .update({
          total_seeds: newSeeds,
          current_streak: newStreak,
          longest_streak: Math.max(existingProfile.longest_streak || 0, newStreak),
          level: newLevel,
          growth_score: newGrowthScore
        })
        .eq('user_id', user.id);
    } else {
      await supabase.from('growth_profile').insert([{
        user_id: user.id,
        total_seeds: newSeeds,
        current_streak: newStreak,
        longest_streak: newStreak,
        level: newLevel,
        growth_score: newGrowthScore
      }]);
    }

    const updatedUser = { ...user, streak: newStreak, seeds: newSeeds };
    setUser(updatedUser);
    localStorage.setItem('lumoraUser', JSON.stringify(updatedUser));

    await checkStreakMilestones(newStreak);

    setHiddenDiscoveries(prev => [...prev, `Reflection saved! Mood: ${reflection.mood}`]);
    alert("Reflection Saved! +1 Streak🔥 & +15 Seeds🌱");
    setCurrentPage('dashboard');
  };

  // ==================== AI MENTOR ====================
  const getAIAdvice = async () => {
    if (messageLimit >= 10) {
      alert("You have reached the daily limit of 10 messages. Come back tomorrow!");
      return;
    }

    setIsLoading(true);
    const result = await getAIMentorResponse(user, userMessage || "");

    setChatHistory(prev => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "assistant", content: result.response }
    ]);
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

  // ==================== FUTURE YOU (with Trajectory + Habit Simulation) ====================
const generateFutureVision = async () => {
  if (!user.id) return;
  setIsGeneratingFuture(true);
  setFutureVision("");

  try {
    // Calculate current trajectory
    const trajectory = calculateTrajectory();

    const prompt = `You are Lumora's Future Vision guide.

Student Goal: ${user.goal}
Class: ${user.class}
Current Streak: ${user.streak}

Current Trajectory:
- Study Consistency: ${trajectory.studyConsistency}/100
- Skill Growth: ${trajectory.skillGrowth}/100
- Energy / Mood: ${trajectory.energy}/100
- Goal Alignment: ${trajectory.goalAlignment}/100
- Burnout Risk: ${trajectory.burnoutRisk}/100

Write a short and powerful Future Glimpse for this student.

Structure your response exactly like this:

Current Trajectory Summary:
(2-3 sentences about where their current patterns are leading)

One Habit Change:
(Suggest ONE realistic habit change that would improve their trajectory. Example: +45 minutes of sleep, 25-minute focused study blocks, etc.)

New Possible Trajectory:
(Describe how that one change could positively shift their future)

Keep the whole response under 140 words. Be honest, warm and specific.`;

    const result = await getAIMentorResponse(user, prompt);
    setFutureVision(result.response);

    // Give Seeds
    await addSeeds(10, "Generated Future You glimpse");

  } catch (error) {
    setFutureVision("Something went wrong while creating your future glimpse. Please try again.");
  }

  setIsGeneratingFuture(false);
};

  // ==================== CAREER ====================
  const analyzeCareerPath = async () => {
    if (!user.id) return;
    setIsAnalyzingCareer(true);
    setCareerAnalysis("");
    setSuggestedGoal("");

    try {
      const prompt = `You are Lumora's Career Guide for a Class ${user.class} student.

Analyze this student using their real data (goal, reflections, patterns, streak, study style).

Respond in this exact format:

Career Direction:
(Write 2-3 clear sentences)

Why this fits you:
(Explain using their actual patterns)

About your current goal:
(Be respectful. If the current goal is good, support it. If a different goal would fit better, gently suggest one.)

Today's Career Step:
(Give ONE small practical action for today)

If you want to gently suggest a different goal, write it clearly on a new line like this:
SUGGESTED_GOAL: New Goal Here`;

      const result = await getAIMentorResponse(user, prompt);
      setCareerAnalysis(result.response);

      if (result.response.includes("SUGGESTED_GOAL:")) {
        const parts = result.response.split("SUGGESTED_GOAL:");
        if (parts[1]) {
          const goal = parts[1].trim().split("\n")[0].trim();
          if (goal && goal.length > 2) {
            setSuggestedGoal(goal);
          }
        }
      }
    } catch (error) {
      setCareerAnalysis("Sorry, I couldn't analyze your career path right now. Please try again.");
    }
    setIsAnalyzingCareer(false);
  };

  const updateUserGoal = async (newGoal: string) => {
    if (!newGoal.trim()) return;

    const { error } = await supabase.from('users').update({ goal: newGoal }).eq('id', user.id);
    if (error) {
      alert("Could not update goal. Please try again.");
      return;
    }

    const updatedUser = { ...user, goal: newGoal };
    setUser(updatedUser);
    localStorage.setItem('lumoraUser', JSON.stringify(updatedUser));
    setSuggestedGoal("");
    alert("Goal updated successfully!");
  };

  const loadCareerTimeline = async () => {
    if (!user.id) return;
    const { data } = await supabase
      .from('career_steps')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setCareerSteps(data);
  };

  // ==================== GENERATE TODAY'S CAREER STEP (with last 5 steps context) ====================
const generateTodayCareerStep = async () => {
  if (!user.id) return;
  setIsGeneratingStep(true);

  try {
    // 1. Get the last 5 career steps from database
    const { data: previousSteps } = await supabase
      .from('career_steps')
      .select('step_text, date')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // 2. Create a clean summary of previous steps
    let previousStepsText = "No previous career steps yet.";
    if (previousSteps && previousSteps.length > 0) {
      previousStepsText = previousSteps
        .map((step, index) => `${index + 1}. [${step.date}] ${step.step_text}`)
        .join('\n');
    }

    // 3. Better prompt with history
    const prompt = `You are Lumora's Career Coach for a Class ${user.class} student.

Student's Big Goal: ${user.goal}

Here are the student's last 5 career steps (most recent first):
${previousStepsText}

Now generate ONE new small, practical career task for TODAY.

Rules:
- Do NOT repeat any of the previous steps
- Make it specific and achievable in one day
- Connect it to the student's goal
- Maximum 20 words
- Only return the task text, nothing else`;

    // 4. Call AI
    const result = await getAIMentorResponse(user, prompt);
    const stepText = result.response.trim();

    // 5. Save the new step
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('career_steps').insert([{
      user_id: user.id,
      step_text: stepText,
      is_completed: false,
      date: today
    }]);

    if (!error) {
      await loadCareerTimeline();
      await addSeeds(8, "Generated today's Career Task");
    } else {
      alert("Could not save the task. Please try again.");
    }

  } catch (error) {
    console.error(error);
    alert("Something went wrong while generating the task.");
  }

  setIsGeneratingStep(false);
};

  // ==================== AR CAMERA ====================
  const startCamera = () => {
    const video = document.getElementById('cameraFeed') as HTMLVideoElement;
    if (video) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => { video.srcObject = stream; })
        .catch(() => { alert("Please allow camera permission to use AR filter."); });
    }
  };

  const goToPage = (page: typeof currentPage) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: '🏠' },
    { id: 'mirror' as const, label: 'Mirror', icon: '🪞' },
    { id: 'reflection' as const, label: 'Reflection', icon: '📝' },
    { id: 'ai' as const, label: 'AI Mentor', icon: '🤖' },
    { id: 'stats' as const, label: 'Stats', icon: '📊' },
    { id: 'pomodoro' as const, label: 'Pomodoro', icon: '⏱️' },
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: '🏆' },
    { id: 'reels' as const, label: 'Reels', icon: '🎬' },
    { id: 'tree' as const, label: 'Growth Tree', icon: '🌳' },
    { id: 'planner' as const, label: 'Planner', icon: '📅' },
    { id: 'career' as const, label: 'Career', icon: '🎯' },
  ];

  const colors = {
    bg: '#f8f1e9',
    primary: '#9a3412',
    accent: '#ea580c',
    white: '#ffffff',
    border: '#fed7aa',
    text: '#374151',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', marginBottom: '14px',
    borderRadius: '12px', border: '2px solid #fed7aa', fontSize: '16px',
    outline: 'none', background: 'white',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%', padding: '16px', backgroundColor: '#ea580c', color: 'white',
    border: 'none', borderRadius: '14px', fontSize: '17px', fontWeight: 600,
    cursor: 'pointer', marginTop: '8px',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white', borderRadius: '18px', padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f3e8d8',
  };

  const studyHoursData = reflectionsData.map(r => ({
    date: r.date ? r.date.slice(5) : '',
    hours: Number(r.study_hours) || 0
  }));

  const moodMap: Record<string, number> = { 'Great': 5, 'Good': 4, 'Okay': 3, 'Tired': 2, 'Struggling': 1 };
  const confidenceMap: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };

  const moodData = reflectionsData.map(r => ({
    date: r.date ? r.date.slice(5) : '',
    mood: moodMap[r.mood] || 3
  }));

  const confidenceData = reflectionsData.map(r => ({
    date: r.date ? r.date.slice(5) : '',
    confidence: confidenceMap[r.confidence] || 2
  }));

  const totalHours = reflectionsData.reduce((sum, r) => sum + (Number(r.study_hours) || 0), 0);
  const latestReflection = reflectionsData.length > 0 ? reflectionsData[reflectionsData.length - 1] : null;

    return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; background: ${colors.bg}; }
        @keyframes grow { from { transform: scale(0.85); } to { transform: scale(1.15); } }
        .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 250px; background: ${colors.white}; border-right: 1px solid #f3e8d8; display: flex; flex-direction: column; z-index: 40; }
        .main-content { margin-left: 250px; min-height: 100vh; padding: 32px 40px; }
        .nav-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 18px; border: none; border-radius: 12px; background: transparent; color: ${colors.text}; font-size: 15px; font-weight: 500; cursor: pointer; text-align: left; transition: all 0.15s; }
        .nav-item:hover { background: #fff7ed; }
        .nav-item.active { background: ${colors.primary}; color: white; }
        .mobile-topbar { display: none; }
        .mobile-bottom-nav { display: none; }
        .mobile-menu-overlay { display: none; }
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .main-content { margin-left: 0; padding: 80px 16px 90px 16px; }
          .mobile-topbar { display: flex; position: fixed; top: 0; left: 0; right: 0; height: 60px; background: white; border-bottom: 1px solid #f3e8d8; align-items: center; justify-content: space-between; padding: 0 16px; z-index: 50; }
          .mobile-bottom-nav { display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: white; border-top: 1px solid #f3e8d8; justify-content: space-around; padding: 8px 0; z-index: 50; overflow-x: auto; }
          .mobile-menu-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 60; }
          .mobile-sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 270px; background: white; z-index: 70; padding: 20px; box-shadow: 4px 0 20px rgba(0,0,0,0.1); }
        }
      `}</style>

      <div style={{ minHeight: '100vh', position: 'relative' }}>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'url(/forest-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', zIndex: 0 }} />
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(248, 241, 233, 0.70)', zIndex: 1 }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
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
                    New here? <button onClick={() => setCurrentPage('onboarding')} style={{ color: colors.accent, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 500 }}>Create Account</button>
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
              <aside className="sidebar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '24px 20px', borderBottom: '1px solid #f3e8d8' }}>
                  <img src="/logo.png" alt="Lumora" style={{ height: '40px' }} />
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>Lumora</h1>
                </div>
                <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
                  {navItems.map(item => (
                    <button key={item.id} onClick={() => goToPage(item.id)} className={`nav-item ${currentPage === item.id ? 'active' : ''}`}>
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
                <div style={{ padding: '16px 20px', borderTop: '1px solid #f3e8d8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: colors.accent, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || 'Student'}</p>
                      <p style={{ fontSize: '12px', color: '#9ca3af' }}>Class {user.class}</p>
                    </div>
                  </div>
                </div>
              </aside>

              <div className="mobile-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src="/logo.png" alt="Lumora" style={{ height: '32px' }} />
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary }}>Lumora</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(true)} style={{ background: '#fff7ed', border: 'none', borderRadius: '10px', padding: '8px 12px', fontSize: '20px', cursor: 'pointer', color: colors.primary }}>☰</button>
              </div>

              {isMobileMenuOpen && (
                <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="mobile-sidebar" onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                      <img src="/logo.png" alt="Lumora" style={{ height: '40px' }} />
                      <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: colors.primary }}>Lumora</h1>
                    </div>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {navItems.map(item => (
                        <button key={item.id} onClick={() => goToPage(item.id)} className={`nav-item ${currentPage === item.id ? 'active' : ''}`}>
                          <span style={{ fontSize: '20px' }}>{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              )}

              <main className="main-content">
                {/* DASHBOARD */}
                {currentPage === 'dashboard' && (
                  <div>
                    <div style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`, borderRadius: '20px', padding: '28px 32px', color: 'white', marginBottom: '32px', boxShadow: '0 8px 24px rgba(154,52,18,0.25)' }}>
                      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '6px' }}>Welcome back, {user.name}!</h1>
                      <p style={{ opacity: 0.9 }}>Keep growing. Every day counts. 🌱</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                      <div style={cardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', marginBottom: '12px' }}>
                          <span style={{ fontSize: '22px' }}>🔥</span>
                          <span style={{ fontWeight: 500 }}>Streak</span>
                        </div>
                        <p style={{ fontSize: '42px', fontWeight: 'bold', color: colors.primary }}>{user.streak} <span style={{ fontSize: '18px', fontWeight: 500, color: '#9ca3af' }}>days</span></p>
                      </div>
                      <div style={cardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', marginBottom: '12px' }}>
                          <span style={{ fontSize: '22px' }}>🌱</span>
                          <span style={{ fontWeight: 500 }}>Seeds</span>
                        </div>
                        <p style={{ fontSize: '42px', fontWeight: 'bold', color: colors.primary }}>{user.seeds}</p>
                      </div>
                    </div>
                    {/* ===== ACCOUNTABILITY CHECKLIST ===== */}
{(yesterdayIntention || careerSteps.length > 0) && (
  <div style={{ ...cardStyle, marginBottom: '32px' }}>
    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.primary, marginBottom: '16px' }}>
      Today's Accountability
    </h2>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Yesterday Intention */}
      {yesterdayIntention && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#fff7ed',
          borderRadius: '12px'
        }}>
          <div>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>Yesterday's Intention</p>
            <p style={{ fontWeight: 500, color: colors.text }}>{yesterdayIntention.tomorrow_intention}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => markIntentionCompleted(true)}
              style={{
                padding: '6px 12px',
                background: colors.accent,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
            <button
              onClick={() => markIntentionCompleted(false)}
              style={{
                padding: '6px 12px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Latest Career Task */}
      {careerSteps.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#f0f9ff',
          borderRadius: '12px'
        }}>
          <div>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>Latest Career Task</p>
            <p style={{ fontWeight: 500, color: colors.text }}>{careerSteps[0].step_text}</p>
          </div>
        </div>
      )}
    </div>
  </div>
)}
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, marginBottom: '16px' }}>Hidden Discoveries</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {hiddenDiscoveries.map((d, i) => (
                        <div key={i} style={{ background: colors.white, borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f3e8d8' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '18px' }}>✨</span>
                            <span style={{ color: colors.text }}>{d}</span>
                          </div>
                          <button onClick={() => setHiddenDiscoveries(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '18px' }}>🗑</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MIRROR */}
                {currentPage === 'mirror' && (
                  <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: colors.primary, marginBottom: '6px' }}>🪞 Mirror of You</h1>
                    <p style={{ color: '#6b7280', marginBottom: '32px' }}>See who you are becoming</p>

                    <div style={{ ...cardStyle, marginBottom: '24px' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary, marginBottom: '20px' }}>Current You</h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', flexShrink: 0 }}>
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
                          <p style={{ color: colors.text }}>Mood: <strong>{latestReflection.mood}</strong> · Confidence: <strong>{latestReflection.confidence}</strong> · Hours: <strong>{latestReflection.study_hours}</strong></p>
                        </div>
                      )}
                    </div>

                    <div style={{ ...cardStyle, marginBottom: '24px', background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`, color: 'white' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>✨ Future You</h2>
                      {futureVision ? (
                        <div>
                          <p style={{ fontSize: '16px', lineHeight: 1.7, opacity: 0.95, whiteSpace: 'pre-wrap' }}>{futureVision}</p>
                          <button onClick={generateFutureVision} disabled={isGeneratingFuture} style={{ marginTop: '20px', padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                            {isGeneratingFuture ? "Creating new glimpse..." : "Order another glimpse"}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p style={{ fontSize: '16px', lineHeight: 1.6, opacity: 0.9, marginBottom: '20px' }}>Ready to see a glimpse of who you are becoming?</p>
                          <button onClick={generateFutureVision} disabled={isGeneratingFuture} style={{ padding: '14px 28px', background: 'white', color: colors.primary, border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 600, cursor: isGeneratingFuture ? 'not-allowed' : 'pointer', opacity: isGeneratingFuture ? 0.7 : 1 }}>
                            {isGeneratingFuture ? "Creating your glimpse..." : "Order your Future glimpses?"}
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ ...cardStyle, marginBottom: '24px' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary, marginBottom: '20px' }}>Growth Journey</h2>
                      {reflectionsData.length === 0 ? (
                        <p style={{ color: '#9ca3af' }}>Complete reflections to see your journey timeline here.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {reflectionsData.slice(-5).reverse().map((r, i) => (
                            <div key={i} style={{ display: 'flex', gap: '14px', padding: '14px', background: '#fafafa', borderRadius: '12px', border: '1px solid #f3e8d8' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors.accent, marginTop: '6px', flexShrink: 0 }} />
                              <div>
                                <p style={{ fontWeight: 600, color: colors.text, fontSize: '14px' }}>{r.date}</p>
                                <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '2px' }}>{r.study_hours}h studied · Mood: {r.mood} · Confidence: {r.confidence}</p>
                                {r.wins && <p style={{ color: colors.text, fontSize: '13px', marginTop: '4px' }}>Win: {r.wins}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={cardStyle}>
                      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary, marginBottom: '16px' }}>Hidden Discoveries</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {hiddenDiscoveries.map((d, i) => (
                          <div key={i} style={{ background: '#fff7ed', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span>✨</span>
                              <span style={{ color: colors.text }}>{d}</span>
                            </div>
                            <button onClick={() => setHiddenDiscoveries(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '16px' }}>🗑</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* REFLECTION */}
                {yesterdayIntention && (
  <div style={{ ...cardStyle, marginBottom: '24px', border: '2px solid #fed7aa' }}>
    <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: colors.primary, marginBottom: '10px' }}>
      Did you complete yesterday’s intention?
    </h3>
    <p style={{ color: colors.text, marginBottom: '16px', lineHeight: 1.5 }}>
      “{yesterdayIntention.tomorrow_intention}”
    </p>
    <div style={{ display: 'flex', gap: '12px' }}>
      <button
        onClick={() => markIntentionCompleted(true)}
        style={{
          padding: '10px 20px',
          background: colors.accent,
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        Yes, I did it
      </button>
      <button
        onClick={() => markIntentionCompleted(false)}
        style={{
          padding: '10px 20px',
          background: 'white',
          color: colors.text,
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          cursor: 'pointer'
        }}
      >
        Not yet
      </button>
    </div>
  </div>
)}
                {currentPage === 'reflection' && (
                  <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                    <div style={{ ...cardStyle, padding: '36px' }}>
                      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary, marginBottom: '24px' }}>Daily Reflection</h2>
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
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, marginTop: '8px' }}>
                      What do you want to do tomorrow?
                      </label>
                      <textarea
                      placeholder="Example: Finish Physics chapter, revise notes, sleep by 11 PM..."
                      value={reflection.tomorrowIntention}
                      onChange={e => setReflection(p => ({ ...p, tomorrowIntention: e.target.value }))}
                      style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
                     />
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
                      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary, marginBottom: '6px' }}>🤖 Your AI Growth Mentor</h2>
                      <p style={{ color: '#6b7280', marginBottom: '24px' }}>Personalized using your profile and latest reflections (10 messages/day)</p>
                      <div style={{ maxHeight: '360px', overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {chatHistory.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}>Ask anything about your growth journey...</div>}
                        {chatHistory.map((msg, i) => (
                          <div key={i} style={{ padding: '14px 18px', borderRadius: '14px', background: msg.role === 'user' ? '#fff7ed' : '#f8f1e9', marginLeft: msg.role === 'user' ? '40px' : '0', marginRight: msg.role === 'assistant' ? '40px' : '0' }}>
                            <strong style={{ fontSize: '13px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>{msg.role === 'user' ? 'You' : 'AI Mentor'}</strong>
                            <p style={{ whiteSpace: 'pre-wrap', color: colors.text }}>{msg.content}</p>
                          </div>
                        ))}
                      </div>
                      <textarea placeholder="Ask anything..." value={userMessage} onChange={e => setUserMessage(e.target.value)} style={{ ...inputStyle, height: '100px', resize: 'vertical' }} />
                      <button onClick={getAIAdvice} disabled={isLoading} style={{ ...buttonStyle, opacity: isLoading ? 0.7 : 1 }}>{isLoading ? "AI is thinking..." : "Get Personalized Advice"}</button>
                      {messageLimit >= 10 && <p style={{ color: '#ef4444', textAlign: 'center', marginTop: '12px' }}>Daily limit reached (10 messages). Come back tomorrow!</p>}
                    </div>
                  </div>
                )}

                {/* STATS */}
                {currentPage === 'stats' && (
                  <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: colors.primary, marginBottom: '8px' }}>📊 Your Progress Stats</h1>
                    <p style={{ color: '#6b7280', marginBottom: '28px' }}>Real data from your last 30 reflections</p>
                    {statsLoading ? (
                      <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Loading your stats...</div>
                    ) : (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '36px' }}>
                          <div style={cardStyle}><p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>Total Reflections</p><p style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>{reflectionsData.length}</p></div>
                          <div style={cardStyle}><p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>Total Study Hours</p><p style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>{totalHours.toFixed(1)}</p></div>
                          <div style={cardStyle}><p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>Current Streak</p><p style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>{user.streak}</p></div>
                          <div style={cardStyle}><p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '6px' }}>Total Seeds</p><p style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>{user.seeds}</p></div>
                        </div>

                        {/* ===== CURRENT TRAJECTORY ===== */}
                        {(() => {
  const trajectory = calculateTrajectory();
  
  const getTrend = (score: number) => {
    if (score >= 70) return { arrow: '↗', color: '#16a34a', label: 'Strong' };
    if (score >= 45) return { arrow: '→', color: '#ca8a04', label: 'Stable' };
    return { arrow: '↘', color: '#dc2626', label: 'Needs Attention' };
  };

  const items = [
    { name: 'Study Consistency', score: trajectory.studyConsistency, icon: '📚' },
    { name: 'Skill Growth', score: trajectory.skillGrowth, icon: '💻' },
    { name: 'Energy / Mood', score: trajectory.energy, icon: '⚡' },
    { name: 'Goal Alignment', score: trajectory.goalAlignment, icon: '🎯' },
    { name: 'Burnout Risk', score: trajectory.burnoutRisk, icon: '🔥', reverse: true },
  ];

  return (
    <div style={{ ...cardStyle, marginBottom: '32px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.primary, marginBottom: '6px' }}>
        🔮 Current Trajectory
      </h3>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
        Based on your recent patterns
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {items.map((item) => {
          const trend = getTrend(item.reverse ? 100 - item.score : item.score);
          return (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span style={{ fontWeight: 500, color: colors.text }}>{item.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', color: trend.color, fontWeight: 'bold' }}>{trend.arrow}</span>
                <span style={{ fontSize: '13px', color: trend.color, fontWeight: 500 }}>{trend.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
})()}
                        {reflectionsData.length === 0 ? (
                          <div style={{ ...cardStyle, textAlign: 'center', padding: '50px' }}><p style={{ fontSize: '18px', color: '#6b7280' }}>No reflections yet.</p><p style={{ color: '#9ca3af', marginTop: '8px' }}>Complete a few daily reflections to see your graphs here.</p></div>
                        ) : (
                          <>
                            <div style={{ ...cardStyle, marginBottom: '28px' }}>
                              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '20px' }}>Study Hours (Last 30 days)</h3>
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
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '20px' }}>Mood Trend</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                  <BarChart data={moodData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3e8d8" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="mood" fill="#9a3412" radius={[6, 6, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>5 = Great · 4 = Good · 3 = Okay · 2 = Tired · 1 = Struggling</p>
                              </div>
                              <div style={cardStyle}>
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '20px' }}>Confidence Trend</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                  <LineChart data={confidenceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3e8d8" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis domain={[0, 3]} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="confidence" stroke="#ea580c" strokeWidth={3} dot={{ r: 4 }} />
                                  </LineChart>
                                </ResponsiveContainer>
                                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>3 = High · 2 = Medium · 1 = Low</p>
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
                      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary, marginBottom: '8px' }}>⏱️ Pomodoro Timer</h2>
                      <p style={{ color: '#6b7280', marginBottom: '32px' }}>Classic 25 min focus + 5 min break</p>
                      <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '999px', background: pomodoroMode === 'work' ? '#fff7ed' : '#ecfdf5', color: pomodoroMode === 'work' ? colors.accent : '#059669', fontWeight: 600, marginBottom: '28px', fontSize: '15px' }}>
                        {pomodoroMode === 'work' ? '🔥 Focus Time' : '🌿 Break Time'}
                      </div>
                      <div style={{ fontSize: '72px', fontWeight: 'bold', color: colors.primary, letterSpacing: '2px', marginBottom: '36px', fontVariantNumeric: 'tabular-nums' }}>{formatTime(timeLeft)}</div>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {!isRunning ? (
                          <button onClick={startPomodoro} style={{ padding: '14px 32px', background: colors.accent, color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>Start</button>
                        ) : (
                          <button onClick={pausePomodoro} style={{ padding: '14px 32px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>Pause</button>
                        )}
                        <button onClick={resetPomodoro} style={{ padding: '14px 32px', background: 'white', color: colors.primary, border: `2px solid ${colors.primary}`, borderRadius: '14px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>Reset</button>
                      </div>
                      <p style={{ marginTop: '28px', color: '#9ca3af', fontSize: '14px' }}>Stay focused. Small consistent sessions create long-term growth.</p>
                    </div>
                  </div>
                )}

                {/* LEADERBOARD */}
                {currentPage === 'leaderboard' && (
                  <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                    <div style={{ ...cardStyle, padding: '32px' }}>
                      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary, marginBottom: '6px' }}>🏆 Leaderboard</h2>
                      <p style={{ color: '#6b7280', marginBottom: '24px' }}>Demo rankings • Real data coming soon</p>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
                        <button onClick={() => setLeaderboardTab('streak')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: 'pointer', background: leaderboardTab === 'streak' ? colors.primary : '#fff7ed', color: leaderboardTab === 'streak' ? 'white' : colors.primary }}>🔥 By Streak</button>
                        <button onClick={() => setLeaderboardTab('seeds')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: 'pointer', background: leaderboardTab === 'seeds' ? colors.primary : '#fff7ed', color: leaderboardTab === 'seeds' ? 'white' : colors.primary }}>🌱 By Seeds</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {demoLeaderboard[leaderboardTab].map((entry) => (
                          <div key={entry.rank} style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderRadius: '14px', background: entry.rank <= 3 ? '#fff7ed' : '#fafafa', border: entry.rank <= 3 ? '1px solid #fed7aa' : '1px solid #f3e8d8' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: entry.rank === 1 ? '#f59e0b' : entry.rank === 2 ? '#9ca3af' : entry.rank === 3 ? '#d97706' : colors.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '15px', marginRight: '16px', flexShrink: 0 }}>{entry.rank}</div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontWeight: 600, color: colors.text }}>{entry.name}</p>
                              <p style={{ fontSize: '13px', color: '#9ca3af' }}>Class {entry.class}</p>
                            </div>
                            <div style={{ fontWeight: 'bold', color: colors.primary, fontSize: '18px' }}>{entry.value}<span style={{ fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginLeft: '4px' }}>{leaderboardTab === 'streak' ? 'days' : ''}</span></div>
                          </div>
                        ))}
                      </div>
                      <p style={{ textAlign: 'center', marginTop: '24px', color: '#9ca3af', fontSize: '13px' }}>This is demo data. Real leaderboard will connect to Supabase soon.</p>
                    </div>
                  </div>
                )}

                {/* GROWTH TREE */}
                {currentPage === 'tree' && (
                  <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: colors.primary, marginBottom: '8px' }}>🌳 Your Growth Tree</h1>
                    <p style={{ color: '#6b7280', marginBottom: '28px' }}>AR Filter – Make invisible growth visible</p>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '520px', margin: '0 auto 28px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
                      <video id="cameraFeed" autoPlay playsInline style={{ width: '100%', height: '400px', objectFit: 'cover', background: '#111' }} />
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '140px', animation: 'grow 3s infinite alternate', filter: 'drop-shadow(0 0 40px #4ade80)', pointerEvents: 'none', zIndex: 10 }}>🌳</div>
                      <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '8px 20px', borderRadius: '999px', fontSize: '14px', zIndex: 20 }}>AR Filter Active • Level {Math.floor(user.streak / 3) + 1}</div>
                    </div>
                    <button onClick={startCamera} style={{ padding: '16px 40px', background: colors.accent, color: 'white', border: 'none', borderRadius: '999px', fontSize: '17px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 24px rgba(234,88,12,0.35)' }}>Start AR Camera (Selfie)</button>
                    <div style={{ ...cardStyle, marginTop: '32px', display: 'inline-block', minWidth: '260px' }}>
                      <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: colors.primary }}>Current Level: {Math.floor(user.streak / 3) + 1}</h3>
                      <p style={{ color: '#6b7280', marginTop: '6px' }}>Streak: {user.streak} days | Seeds: {user.seeds}</p>
                    </div>
                  </div>
                )}

                {/* PLANNER PAGE */}
{currentPage === 'planner' && (
  <div style={{ maxWidth: '640px', margin: '0 auto' }}>
    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: colors.primary, marginBottom: '6px' }}>
      📅 Weekly Planner
    </h1>
    <p style={{ color: '#6b7280', marginBottom: '28px' }}>
      Light personalized tasks for this week
    </p>

    <div style={{ ...cardStyle, marginBottom: '24px' }}>
      <label style={{ display: 'block', marginBottom: '10px', fontWeight: 500, color: colors.text }}>
        What do you want to focus on this week?
      </label>
      <textarea
        placeholder="Example: Improve consistency in Physics, prepare for upcoming test, reduce distractions..."
        value={plannerInput}
        onChange={e => setPlannerInput(e.target.value)}
        style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
      />

      <button
        onClick={generateWeeklyPlan}
        disabled={isGeneratingPlan}
        style={{
          ...buttonStyle,
          opacity: isGeneratingPlan ? 0.7 : 1,
          marginTop: '8px'
        }}
      >
        {isGeneratingPlan ? "Creating your plan..." : "Generate My Weekly Plan"}
      </button>
    </div>

    {weeklyPlan && (
      <div style={{ ...cardStyle }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.primary, marginBottom: '16px' }}>
          Your Personalized Plan
        </h3>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: colors.text, fontSize: '15px' }}>
          {weeklyPlan}
        </div>
      </div>
    )}
  </div>
)}

                {/* CAREER */}
                {currentPage === 'career' && (
                  <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: colors.primary, marginBottom: '8px' }}>🎯 Career Roadmap</h1>
                    <p style={{ color: '#6b7280', marginBottom: '28px' }}>Personalized guidance + daily steps based on who you are becoming</p>

                    <div style={{ ...cardStyle, marginBottom: '24px' }}>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Your Current Big Goal</p>
                      <p style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary }}>{user.goal || "Not set yet"}</p>
                    </div>

                    {!careerAnalysis && (
                      <div style={{ ...cardStyle, textAlign: 'center', padding: '36px 24px', marginBottom: '28px' }}>
                        <p style={{ fontSize: '16px', color: colors.text, marginBottom: '24px', lineHeight: 1.6 }}>I will look at your reflections, patterns, strengths and current goal to suggest the most fitting career direction for you.</p>
                        <button onClick={analyzeCareerPath} disabled={isAnalyzingCareer} style={{ padding: '14px 28px', background: colors.accent, color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 600, cursor: isAnalyzingCareer ? 'not-allowed' : 'pointer', opacity: isAnalyzingCareer ? 0.7 : 1 }}>
                          {isAnalyzingCareer ? "Analyzing your path..." : "Analyze My Career Path"}
                        </button>
                      </div>
                    )}

                    {careerAnalysis && (
                      <div style={{ ...cardStyle, marginBottom: '28px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.primary, marginBottom: '16px' }}>Your Career Analysis</h3>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: colors.text, fontSize: '15px' }}>{careerAnalysis}</div>
                        <button onClick={analyzeCareerPath} disabled={isAnalyzingCareer} style={{ marginTop: '20px', padding: '10px 20px', background: '#fff7ed', color: colors.primary, border: `1px solid ${colors.border}`, borderRadius: '12px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                          {isAnalyzingCareer ? "Re-analyzing..." : "Analyze Again"}
                        </button>
                      </div>
                    )}

                    {suggestedGoal && (
                      <div style={{ ...cardStyle, marginBottom: '28px', border: '2px solid #fed7aa' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: colors.primary, marginBottom: '12px' }}>Would you like to update your goal?</h3>
                        <p style={{ color: '#6b7280', marginBottom: '16px' }}>Suggested: <strong>{suggestedGoal}</strong></p>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <button onClick={() => updateUserGoal(suggestedGoal)} style={{ padding: '12px 20px', background: colors.accent, color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>Yes, update my goal</button>
                          <button onClick={() => setSuggestedGoal("")} style={{ padding: '12px 20px', background: 'white', color: colors.text, border: '1px solid #e5e7eb', borderRadius: '12px', fontWeight: 500, cursor: 'pointer' }}>Keep my current goal</button>
                        </div>
                      </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary }}>Daily Career Timeline</h2>
                    </div>

                    <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                      <button onClick={generateTodayCareerStep} disabled={isGeneratingStep} style={{ padding: '14px 28px', background: colors.primary, color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 600, cursor: isGeneratingStep ? 'not-allowed' : 'pointer', opacity: isGeneratingStep ? 0.7 : 1 }}>
                        {isGeneratingStep ? "Creating today's task..." : "Generate Today's Career Task"}
                      </button>
                    </div>

                    {careerSteps.length === 0 ? (
                      <div style={{ ...cardStyle, textAlign: 'center', padding: '40px' }}>
                        <p style={{ color: '#6b7280' }}>No career tasks yet.</p>
                        <p style={{ color: '#9ca3af', marginTop: '8px' }}>Click the button above to generate your first personalized daily task.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {careerSteps.map((step, index) => (
                          <div key={step.id} style={{ ...cardStyle, display: 'flex', gap: '16px', alignItems: 'flex-start', borderLeft: index === 0 ? `4px solid ${colors.accent}` : '4px solid #fed7aa' }}>
                            <div style={{ minWidth: '60px', textAlign: 'center', paddingTop: '4px' }}>
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: index === 0 ? colors.accent : '#d6a67a', margin: '0 auto 6px' }} />
                              <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>{step.date ? step.date.slice(5) : '—'}</p>
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '15px', lineHeight: 1.6, color: colors.text }}>{step.step_text}</p>
                              {step.is_completed && <p style={{ fontSize: '13px', color: '#059669', marginTop: '6px' }}>✓ Completed</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* REELS PAGE */}
{currentPage === 'reels' && (
  <div style={{ maxWidth: '480px', margin: '0 auto' }}>
    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: colors.primary, marginBottom: '6px' }}>
      🎬 Study Reels
    </h1>
    <p style={{ color: '#6b7280', marginBottom: '24px' }}>
      Short educational videos to boost curiosity
    </p>

    {/* Category Filters */}
    <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
      {['all', 'facts', 'space', 'mindset'].map(cat => (
        <button
          key={cat}
          onClick={() => setReelsCategory(cat as any)}
          style={{
            padding: '8px 16px',
            borderRadius: '999px',
            border: 'none',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            background: reelsCategory === cat ? colors.primary : '#fff7ed',
            color: reelsCategory === cat ? 'white' : colors.primary
          }}
        >
          {cat.charAt(0).toUpperCase() + cat.slice(1)}
        </button>
      ))}
    </div>

    {/* Limit Message */}
    {showReelsLimit ? (
      <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌿</div>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary, marginBottom: '12px' }}>
          You’ve explored enough for now
        </h3>
        <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: '28px' }}>
          Real growth happens when you return to your goals.<br />
          Ready to take one small step?
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => goToPage('dashboard')}
            style={{
              padding: '12px 24px',
              background: colors.accent,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => {
              setShowReelsLimit(false);
              setWatchedReelsCount(0);
            }}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: colors.primary,
              border: `2px solid ${colors.primary}`,
              borderRadius: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Continue watching
          </button>
        </div>
      </div>
    ) : (
      /* Reels Feed */
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {reelsData
          .filter(reel => reelsCategory === 'all' || reel.category === reelsCategory)
          .map(reel => (
            <div
              key={reel.id}
              style={{ ...cardStyle, padding: '0', overflow: 'hidden' }}
              onClick={() => {
                const newCount = watchedReelsCount + 1;
                setWatchedReelsCount(newCount);
                if (newCount >= 6) {
                  setShowReelsLimit(true);
                }
              }}
            >
              <div style={{ position: 'relative', paddingBottom: '177%', height: 0 }}>
                <iframe
                  src={`https://www.youtube.com/embed/${reel.videoId}?rel=0`}
                  title={reel.title}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div style={{ padding: '16px' }}>
                <p style={{ fontWeight: 600, color: colors.text, marginBottom: '4px' }}>{reel.title}</p>
                <p style={{ fontSize: '13px', color: '#9ca3af' }}>{reel.channel}</p>
              </div>
            </div>
          ))}
      </div>
    )}

    <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '13px', color: '#9ca3af' }}>
      Videos are embedded from public educational channels for learning purposes.
    </p>
  </div>
)}
              </main>

              <nav className="mobile-bottom-nav">
                {navItems.map(item => (
                  <button key={item.id} onClick={() => goToPage(item.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', padding: '6px 8px', cursor: 'pointer', color: currentPage === item.id ? colors.primary : '#9ca3af', fontSize: '10px', fontWeight: 500, minWidth: '60px' }}>
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