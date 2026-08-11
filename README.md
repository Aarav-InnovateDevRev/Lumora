# Lumora

**Make Invisible Progress Visible**

AI-Powered Personal Growth Companion for Students

**Live Demo:** https://lumora-tan-eight.vercel.app  
**GitHub:** https://github.com/Aarav-InnovateDevRev/Lumora  
**Team:** Aarav • Akshat • Shashi • Jingle  
**Competition:** InnoNATION Odyssey Senior 2026

---

## The Problem

Students work hard for weeks and still feel like nothing has changed.

They study. They struggle. They improve.  
But most of the time, they never actually see the change.

When progress stays invisible, it becomes easy to believe there is none.

Generic apps and chatbots fail because they remember conversations — not the person behind them. They cannot identify long-term behavioural patterns or help a student understand who they are becoming.

**Lumora was built to answer one question:**  
What if technology could make that invisible progress visible?

---

## The Solution — The Mirror of Progress

Lumora is an AI Growth Agent that treats every student as a unique individual.

It builds a deep, evolving profile through daily reflections, streak tracking, and hidden pattern discovery — then uses that knowledge to deliver truly personalized guidance.

Instead of acting as another chatbot, Lumora continuously analyses reflections, streaks and progress history to generate meaningful insights that would otherwise require months of observation by a human mentor.

A single day tells almost nothing.  
A journey tells you who you are becoming.

That journey becomes the **Mirror of Progress**.

> Chatbots remember conversations.  
> Lumora remembers people.

---

## How It Works

Student Reflection  
→ Long-term Memory (Supabase)  
→ Pattern Analysis + Trajectory  
→ AI Reasoning (Groq / Llama 3.1)  
→ What the student sees in the Mirror

The AI does not work from one isolated conversation.  
It works from the student’s accumulated reflection history and growth context.

---

## Key Features

### 1. Personalized Onboarding & Profile
- Unique User ID + Password
- Deep profile (study feelings, goals, learning style)

### 2. Daily Reflection System + Gamification
- Mood, confidence, wins, struggles, hours studied
- Tomorrow Intention with next-day accountability
- Streak & Seeds reward system
- Data stored in Supabase for long-term pattern analysis

### 3. AI Growth Mentor
- Uses Groq (Llama 3.1) + real student data from Supabase
- Remembers reflections, streaks, goals and discoveries
- Gives actionable, personalized advice
- Daily message limit (10) for healthy usage
- Becomes more accurate as the student’s data grows

### 4. Hidden Discoveries & Pattern Engine
- AI automatically finds real patterns and risks from reflections
- Stores discoveries in the database and shows them on the dashboard
- Transforms raw data into meaningful guidance

### 5. Current Trajectory
- Visual view of Study Consistency, Skill Growth, Energy, Goal Alignment and Burnout Risk
- Built from real recent reflection data

### 6. Mirror of You
- Current You summary
- Future Glimpse (trajectory-based projection)
- Growth Journey timeline
- Hidden Discoveries

### 7. Weekly Growth Report
- AI summary of what improved
- What needs attention
- One clear recommendation for the coming week

### 8. Career Roadmap
- Personalized career direction analysis
- Daily career steps with history awareness
- Goal update suggestions when patterns indicate a better fit

### 9. Weekly Planner
- Light, realistic AI-generated weekly tasks based on student goals and data

### 10. Focus Timer (Pomodoro)
- Classic 25 + 5 focus sessions
- Seeds awarded on completion

### 11. Study Reels
- Curated educational short-form content
- Soft limit with accountability message

### 12. AR Growth Tree
- Real front-camera AR filter with animated tree
- Visual representation of growth in the real world

---

## Alignment with InnoNATION Odyssey Senior Criteria

### Innovation & Originality
Most student apps focus on productivity or content delivery.  
Lumora focuses on identity and progress visibility.  
It treats growth as a longitudinal story, not a daily checklist.  
The core idea — Mirror of Progress — turns forgotten daily signals into a visible trajectory of who the student is becoming.

### Practicality & Feasibility
Lumora is not only a concept. It is a working product with:
- Live deployment on Vercel
- Real authentication and data storage
- Functional AI mentor, reflection system, trajectory, reports and career guidance

A student can enter, reflect, receive guidance, and see their progress today.

### Technological Integration
- Frontend: React + TypeScript + Vite
- Database & Auth: Supabase (PostgreSQL)
- AI: Groq (Llama 3.1) with rich personal context
- Visualization: Recharts
- Architecture: Reflection → Memory → Pattern Analysis → AI → Mirror

### Business Viability
Lumora starts with the individual student, then expands outward:

1. Lumora (Student) – Personal growth companion  
2. Lumora Office – Team / manager layer for schools and organizations  

This creates a natural path from one student → classrooms → institutions, while keeping the personal growth experience at the centre.

### Social Impact
Many students do not stop because they lack ability.  
Sometimes they stop because they cannot see their own progress.

If progress becomes visible, a student is more likely to believe in the next step.

Lumora exists for the student who thinks they are not improving — when they actually are.

---

## Tech Stack

- Frontend: React + Vite + TypeScript
- Backend / Database: Supabase (Auth, PostgreSQL, RLS)
- AI: Groq (Llama 3.1) with personalized context
- AR: WebRTC Camera + CSS Overlay
- Charts: Recharts
- Deployment: Vercel

Architecture:  
React Components → Supabase Database → AI Context Engine → Groq (Llama 3.1) → Personalized Guidance → AR Visualization

---

## Why Lumora Is Different

Lumora builds a continuously evolving understanding of every student through:

- Long-term reflection history
- Hidden Discoveries
- Streak-based behavioural analysis
- Personal goals
- Emotional trends
- Growth milestones

Instead of answering one question well, Lumora continuously improves its understanding of the student and delivers increasingly personalised guidance.

---

## Future Roadmap

- Advanced analytics dashboard
- Real leaderboard & school competitions
- Seeds marketplace
- Predictive habit analysis using long-term data
- Full WebXR 3D AR tree
- Parent / Teacher dashboard
- Deeper integration with Lumora Office for institutions

---

## How to Run Locally

```bash
git clone https://github.com/Aarav-InnovateDevRev/Lumora.git
cd Lumora
npm install
