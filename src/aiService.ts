import { supabase } from './supabaseClient';

export const getAIMentorResponse = async (userData: any, userMessage: string = "") => {
  try {
    // @ts-ignore
    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;

    if (!GROQ_API_KEY) {
      return { 
        response: "API key is missing. Please check your Vercel Environment Variables.", 
        insight: "" 
      };
    }

    // ==================== 1. FETCH RICH MEMORY ====================
    
    // Last 30 reflections
    const { data: reflections } = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', userData.id)
      .order('date', { ascending: false })
      .limit(30);

    // Hidden discoveries
    const { data: discoveries } = await supabase
      .from('hidden_patterns')
      .select('pattern')
      .eq('user_id', userData.id)
      .order('discovered_date', { ascending: false })
      .limit(10);

    // ==================== 2. CALCULATE TRAJECTORY ====================
    let trajectoryText = "Not enough data yet to calculate trajectory.";

    if (reflections && reflections.length > 0) {
      const recent = reflections.slice(0, 14);
      const count = recent.length;

      const avgHours = recent.reduce((sum: number, r: any) => sum + (Number(r.study_hours) || 0), 0) / count;
      const studyConsistency = Math.min(100, Math.round((avgHours / 4) * 100));

      const confidenceScore = recent.reduce((sum: number, r: any) => {
        if (r.confidence === 'High') return sum + 3;
        if (r.confidence === 'Medium') return sum + 2;
        return sum + 1;
      }, 0);
      const skillGrowth = Math.round((confidenceScore / (count * 3)) * 100);

      const moodScore = recent.reduce((sum: number, r: any) => {
        if (r.mood === 'Great') return sum + 5;
        if (r.mood === 'Good') return sum + 4;
        if (r.mood === 'Okay') return sum + 3;
        if (r.mood === 'Tired') return sum + 2;
        return sum + 1;
      }, 0);
      const energy = Math.round((moodScore / (count * 5)) * 100);

      const goalAlignment = Math.min(100, Math.round((userData.streak * 4) + (count * 2)));
      const burnoutRisk = Math.min(100, Math.round(100 - energy + (avgHours > 5 ? 20 : 0)));

      trajectoryText = `
Study Consistency: ${studyConsistency}/100
Skill Growth: ${skillGrowth}/100
Energy / Mood: ${energy}/100
Goal Alignment: ${goalAlignment}/100
Burnout Risk: ${burnoutRisk}/100
`;
    }

    // ==================== 3. BUILD CONTEXT ====================

    const totalHours = reflections?.reduce((sum: number, r: any) => sum + (Number(r.study_hours) || 0), 0) || 0;
    const level = Math.floor((userData.streak || 0) / 3) + 1;

    let reflectionsSummary = "No reflections yet.";
    if (reflections && reflections.length > 0) {
      reflectionsSummary = reflections.slice(0, 8).map((r: any, i: number) => {
        return `${i + 1}. ${r.date} | Hours: ${r.study_hours} | Mood: ${r.mood} | Confidence: ${r.confidence}`;
      }).join('\n');
    }

    const discoveriesText = discoveries && discoveries.length > 0
      ? discoveries.map((d: any) => `- ${d.pattern}`).join('\n')
      : "No discoveries yet.";

    // ==================== 4. SYSTEM PROMPT ====================

    const systemPrompt = `
You are Lumora — an AI Growth Mentor for students.

Your core philosophy:
- Memory over conversation
- Progress over productivity
- Show the student where their current patterns are leading them

=== STUDENT PROFILE ===
Name: ${userData.name}
Class: ${userData.class}
Big Goal: ${userData.goal}
Usual Study Feeling: ${userData.studyFeeling}
Preferred Tone: ${userData.preferredTone || "Friendly"}

=== GROWTH METRICS ===
Current Streak: ${userData.streak || 0} days
Total Seeds: ${userData.seeds || 0}
Current Level: ${level}
Total Study Hours (last 30 days): ${totalHours.toFixed(1)}

=== CURRENT TRAJECTORY ===
${trajectoryText}

=== RECENT REFLECTIONS ===
${reflectionsSummary}

=== HIDDEN DISCOVERIES ===
${discoveriesText}

=== YOUR ROLE ===
- Speak with warmth and honesty
- Reference the student's real trajectory when relevant
- Help them see where their current habits are leading
- Give practical advice
- Keep responses clear (max 180 words)
`;

    // ==================== 5. CALL GROQ ====================

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage || "Give me personalized growth advice based on my current trajectory." }
        ],
        temperature: 0.7,
        max_tokens: 450
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq Error:", errorText);
      return { 
        response: `Sorry, I'm having trouble connecting right now (Error ${response.status}). Please try again.`, 
        insight: "" 
      };
    }

    const data = await response.json();
    const fullResponse = data.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";

    // ==================== 6. GENERATE SHORT INSIGHT ====================

    // ==================== GENERATE HIDDEN DISCOVERY ====================
let shortInsight = "";
try {
  const insightResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { 
          role: "system", 
          content: `You are a pattern detector for a student growth app.

First, look for something real and useful:
- A clear change in mood, confidence, or consistency
- A risk (burnout, low energy, dropping streak)
- A positive emerging pattern
- Something important the student should know

Rules:
- Maximum 75 characters
- Be specific and honest
- If you find a real pattern or risk → write that
- If nothing important is found → write one short, meaningful quote related to growth or consistency
- Never return empty`
        },
        { 
          role: "user", 
          content: `Based on this mentor response and student context, create one Hidden Discovery:\n\n${fullResponse}` 
        }
      ],
      temperature: 0.55,
      max_tokens: 60
    })
  });

  if (insightResponse.ok) {
    const insightData = await insightResponse.json();
    shortInsight = insightData.choices[0]?.message?.content?.trim() || "Small consistent actions create big change.";
  }
} catch (e) {
  console.error("Insight generation failed:", e);
  shortInsight = "Small consistent actions create big change.";
}
  

    return { 
      response: fullResponse, 
      insight: shortInsight 
    };

  } catch (error) {
    console.error("AI Error:", error);
    return { 
      response: "Sorry, I'm having trouble connecting right now. Please try again later 🌱", 
      insight: "" 
    };
  }
};