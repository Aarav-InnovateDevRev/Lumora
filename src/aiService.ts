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

    // ==================== 2. BUILD CONTEXT ====================

    const totalHours = reflections?.reduce((sum: number, r: any) => sum + (Number(r.study_hours) || 0), 0) || 0;
    const level = Math.floor((userData.streak || 0) / 3) + 1;

    // Create a clean summary of recent reflections
    let reflectionsSummary = "No reflections yet.";
    if (reflections && reflections.length > 0) {
      reflectionsSummary = reflections.slice(0, 10).map((r: any, i: number) => {
        return `${i + 1}. Date: ${r.date} | Hours: ${r.study_hours} | Mood: ${r.mood} | Confidence: ${r.confidence} | Wins: ${r.wins || '-'} | Struggles: ${r.struggles || '-'}`;
      }).join('\n');
    }

    const discoveriesText = discoveries && discoveries.length > 0
      ? discoveries.map((d: any) => `- ${d.pattern}`).join('\n')
      : "No discoveries yet.";

    // ==================== 3. SYSTEM PROMPT (LUMORA PHILOSOPHY) ====================

    const systemPrompt = `
You are Lumora — an AI Growth Mentor for students.

Your core philosophy:
- Memory over conversation
- Progress over productivity
- Small daily actions create long-term transformation
- You help students understand who they are becoming

You are NOT a generic chatbot. You are a long-term Mirror of Progress.

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

=== RECENT REFLECTIONS (most recent first) ===
${reflectionsSummary}

=== HIDDEN DISCOVERIES ===
${discoveriesText}

=== YOUR ROLE ===
- Speak with warmth, honesty and encouragement
- Reference the student's actual history when relevant
- Help them see patterns and growth
- Give practical, specific advice
- Never be generic
- Keep responses clear and not too long (max 180 words)

When the student asks something, always reason from their real data above.
`;

    // ==================== 4. CALL GROQ ====================

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
          { role: "user", content: userMessage || "Give me personalized growth advice based on my recent journey." }
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

    // ==================== 5. GENERATE SHORT INSIGHT ====================

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
              content: "You are an insight extractor. From the mentor's advice, create one short, inspiring, personal discovery about the student (maximum 70 characters). Make it feel like a real hidden pattern." 
            },
            { role: "user", content: fullResponse }
          ],
          temperature: 0.6,
          max_tokens: 60
        })
      });

      if (insightResponse.ok) {
        const insightData = await insightResponse.json();
        shortInsight = insightData.choices[0]?.message?.content?.trim() || "";
      }
    } catch (e) {
      console.error("Insight generation failed:", e);
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