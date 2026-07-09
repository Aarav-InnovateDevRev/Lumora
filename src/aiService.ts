import { supabase } from './supabaseClient';

export const getAIMentorResponse = async (userData: any, userMessage: string = "") => {
  try {
    // @ts-ignore
    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string;

    if (!GROQ_API_KEY) {
      return "API key is not configured. Please check .env file.";
    }

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
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage || "Give me personalized daily growth advice." }
        ],
        temperature: 0.7,
        max_tokens: 700
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI Error:", error);
    return "Sorry, I'm having trouble connecting right now. Try again later 🌱";
  }
};