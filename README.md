# Lumora - AI-Powered Personal Growth Agent for Students

**"Your Personal AI Growth Companion"**

**Live Demo:** [https://lumora-tan-eight.vercel.app](https://lumora-tan-eight.vercel.app)  
**GitHub:** [Aarav-InnovateDevRev/Lumora](https://github.com/Aarav-InnovateDevRev/Lumora)

---

## The Problem

Students today struggle with **lack of consistent motivation**, **no personalized guidance**, and **no long-term growth tracking**. Generic apps and chatbots fail because they don't remember the student as a person — they only remember conversations.
Most AI tools can answer questions, but very few continuously understand a student's long-term journey. They remember conversations instead of the person behind those conversations, making it difficult to provide consistent guidance, identify behavioural patterns, or help students improve over time.

## The Solution

**Lumora** is an **AI Growth Agent** that treats every student as a unique individual. It builds a deep, evolving profile through daily reflections, streak tracking, and hidden pattern discovery — then uses that knowledge to deliver truly personalized guidance.

Lumora directly aligns with ShriTeq's vision to "build AI agents capable of accelerating innovation by generating insights, uncovering patterns, identifying opportunities, assisting research, or enabling breakthroughs that would otherwise require significant human effort and expertise."

Instead of acting as another chatbot, Lumora continuously analyses student reflections, streaks and progress history to generate meaningful insights that would otherwise require months of observation by a human mentor. This enables a breakthrough in the Education Technology (EdTech) industry by making personalised mentoring scalable.

> "Build AI agents capable of accelerating innovation by generating insights, uncovering patterns, identifying opportunities... that would otherwise require significant human effort and expertise."

Lumora does exactly that in the **EdTech domain**.

---

## Key Features

### 1. Personalized Onboarding & Profile
- Unique User ID + Password
- Deep profile (study feelings, goals, learning style)

### 2. Daily Reflection System + Gamification
- Mood, confidence, wins, struggles, hours studied
- **Streak & Seeds** reward system (1 streak per day)
- Data stored in Supabase for long-term pattern analysis

### 3. AI Growth Mentor (Personalized Agent)
- Uses Groq (Llama 3.1) + user's real data from Supabase
- Remembers reflections, streaks, goals
- Gives actionable, personalized advice
- Daily message limit (10) for healthy usage
- Unlike traditional AI assistants that mainly rely on the current conversation, Lumora combines long-term reflection history, streaks, goals and Hidden Discoveries to provide responses based on the student's complete growth journey. This allows the AI to give advice that becomes more personalised and accurate over time.

> "Lumora's work though can be done with human efforts but can help make a breakthrough in EdTech"

### 4. Hidden Discoveries & Pattern Engine
- AI automatically finds insights from reflections
- "Chatbots remember conversations. **Lumora remembers people.**"
- Discoveries stored in database and shown on dashboard
- This feature is inspired directly by ShriTeq's emphasis on "generating insights" and "uncovering patterns." Lumora continuously analyses long-term student data to identify opportunities, recurring behaviours and productivity trends that are difficult to discover manually.

These discoveries transform raw data into meaningful guidance instead of simply displaying statistics.

### 5. AR Growth Tree (Camera Filter)
- Real front camera AR filter with animated tree
- Tree size scales with streak & level
- Visual representation of growth in the real world
- The Growth Tree is more than a visual feature. It transforms invisible personal progress into something students can actually see. Every streak, reflection and achievement contributes to the tree's growth, making consistency rewarding and reinforcing positive habits through visual feedback.

---

## Tech Stack

- **Frontend:** React + Vite + TypeScript
- **Backend/Database:** Supabase (Auth, PostgreSQL, RLS)
- **AI:** Groq (Llama 3.1) with personalized context
- **AR:** WebRTC Camera + CSS Overlay
- **Deployment:** Vercel
- **Architecture:** React Components → Supabase Database → AI Context Engine → Groq (Llama 3.1) → Personalized Guidance → AR Visualization

---

## Why Lumora Fits the Prompt Perfectly

- **Industry:** Education / Student Development
- **AI Agent:** Specialized growth agent that reasons using real user data
- **Breakthrough:** Moves from generic chatbots to **deep personal memory + pattern discovery**
- **Autonomous Workflows:** Daily reflection → streak → AI insight → AR visualization
- **Discovery & Innovation:** Hidden patterns that would normally require a human mentor
- **Generating insights** → Hidden Discoveries Engine analyses long-term reflection history.
- **Identifying opportunities** → Personalized recommendations help students improve continuously.
- 

---

## Compromises & Future Roadmap

These compromises were intentional so that the MVP remained stable, polished and fully functional within the hackathon timeline while preserving the core innovation of the project.

**For MVP we compromised on:**
- Full 3D AR model-viewer (used camera overlay instead)
- Advanced analytics dashboard
- Leaderboard & social features

**Future Plans:**
- Premium version with unlimited AI messages
- Leaderboard + school competitions
- Seeds marketplace (redeem for real rewards)
- AI-generated weekly growth reports
- Predictive habit analysis using long-term data
- Advanced Hidden Discoveries dashboard
- Personalized career roadmap based on continuous growth patterns
- Full WebXR 3D AR tree
- Parent/Teacher dashboard

---

## Why Lumora is Different

**"Chatbots remember conversations. Lumora remembers people."**
This philosophy is what makes Lumora fundamentally different.

Lumora builds a continuously evolving understanding of every student through:

- Long-term reflection history
- Hidden Discoveries
- Streak-based behavioural analysis
- Personal goals
- Emotional trends
- Growth milestones

Instead of answering one question well, Lumora continuously improves its understanding of the student and delivers increasingly personalised guidance.

## How to Run Locally

```bash
git clone https://github.com/Aarav-InnovateDevRev/Lumora.git
cd Lumora/frontend
npm install
npm run dev


Made with ❤️ by Aarav, Akshat, Aditya, Jingle, Shashi
For ShriTeq 2026 Hackathon
