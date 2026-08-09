import { supabase } from './supabaseClient';

export const getAIMentorResponse = async (userData: any, userMessage: string = "") => {
  try {
    // @ts-ignore
    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;

    if (!GROQ_API_KEY) {
      return { 
        response: "API key is missing. Please check your environment variables.", 
        insight: "" 
      };
    }

    // Fetch recent reflections
    const { data: reflections } = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', userData.id)
      .order('date', { ascending: false })
      .limit(20);

    // Hidden discoveries
    const { data: discoveries } = await supabase
      .from('hidden_patterns')
      .select('pattern')
      .eq('user_id', userData.id)
      .order('discovered_date', { ascending: false })
      .limit(8);

    // Calculate simple trajectory
    let trajectoryText = "Not enough data yet.";
    if (reflections && reflections.length > 0) {
      const recent = reflections.slice(0, 10);
      const count = recent.length;

      const avgHours = recent.reduce((sum: number, r: any) => sum + (Number(r.study_hours) || 0), 0) / count;
      const studyConsistency = Math.min(100, Math.round((avgHours / 4) * 100));

      const moodScore = recent.reduce((sum: number, r: any) => {
        if (r.mood === 'Great') return sum + 5;
        if (r.mood === 'Good') return sum + 4;
        if (r.mood === 'Okay') return sum + 3;
        if (r.mood === 'Tired') return sum + 2;
        return sum + 1;
      }, 0);
      const energy = Math.round((moodScore / (count * 5)) * 100);

      trajectoryText = `
Work Consistency: ${studyConsistency}/100
Energy Level: ${energy}/100
Current Streak: ${userData.streak || 0} days
`;
    }

    const discoveriesText = discoveries && discoveries.length > 0
      ? discoveries.map((d: any) => `- ${d.pattern}`).join('\n')
      : "No discoveries yet.";

    const systemPrompt = `
You are Lumora Office — an AI Growth Companion for professionals and employees.

Your role is to help employees grow in their career, improve consistency, manage energy, and stay aligned with their goals.

=== EMPLOYEE PROFILE ===
Name: ${userData.name}
Role / Department: ${userData.class || "Not specified"}
Current Goal: ${userData.goal}
Usual Work Feeling: ${userData.studyFeeling}

=== GROWTH METRICS ===
Current Streak: ${userData.streak || 0} days
Total Seeds: ${userData.seeds || 0}

=== CURRENT TRAJECTORY ===
${trajectoryText}

=== HIDDEN DISCOVERIES ===
${discoveriesText}

=== YOUR STYLE ===
- Professional yet warm
- Practical and clear
- Focus on sustainable growth
- Never generic
- Keep responses under 160 words
`;

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
          { role: "user", content: userMessage || "Give me personalized professional growth advice." }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      return { 
        response: `Sorry, I'm having trouble connecting right now. Please try again.`, 
        insight: "" 
      };
    }

    const data = await response.json();
    const fullResponse = data.choices[0]?.message?.content || "I couldn't generate a response.";

    // Short insight
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
              content: "Create one short professional insight (max 70 characters) from the advice." 
            },
            { role: "user", content: fullResponse }
          ],
          temperature: 0.6,
          max_tokens: 50
        })
      });

      if (insightResponse.ok) {
        const insightData = await insightResponse.json();
        shortInsight = insightData.choices[0]?.message?.content?.trim() || "";
      }
    } catch (e) {}

    return { 
      response: fullResponse, 
      insight: shortInsight 
    };

  } catch (error) {
    console.error("AI Error:", error);
    return { 
      response: "Sorry, something went wrong. Please try again later.", 
      insight: "" 
    };
  }
};