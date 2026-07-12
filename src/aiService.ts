import { supabase } from './supabaseClient';

export const getAIMentorResponse = async (userData: any, userMessage: string = "") => {
  try {
    // @ts-ignore
    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;

    if (!GROQ_API_KEY) {
      return { response: "API key is missing. Check Vercel Environment Variables.", insight: "" };
    }

    // Get latest reflection for personalization
    const { data: latestReflection } = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const systemPrompt = `
You are Lumora's friendly AI Growth Mentor for Class 9 students.

User Profile:
- Name: ${userData.name}
- Class: ${userData.class}
- Goal: ${userData.goal}
- Study Feeling: ${userData.studyFeeling}

Latest Reflection: ${latestReflection ? JSON.stringify(latestReflection) : "No recent reflection yet"}
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
          { role: "user", content: userMessage || "Give me personalized daily growth advice." }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      return { response: `Groq Error ${response.status}`, insight: "" };
    }

    const data = await response.json();
    const fullResponse = data.choices[0].message.content;

    // Generate short insight for hidden_patterns
    const insightResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "Summarize the following advice into a short, inspiring insight (max 80 characters):" },
          { role: "user", content: fullResponse }
        ],
        temperature: 0.7,
        max_tokens: 80
      })
    });

    const insightData = await insightResponse.json();
    const shortInsight = insightData.choices[0].message.content.trim();

    return { response: fullResponse, insight: shortInsight };
  } catch (error) {
    console.error("AI Error:", error);
    return { response: "Sorry, I'm having trouble connecting right now. Try again later 🌱", insight: "" };
  }
};