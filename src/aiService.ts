const GROQ_API_KEY = "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";

export const getAIMentorResponse = async (userData: any, userMessage: string = "") => {
  try {
    const systemPrompt = `
You are Lumora's friendly AI Growth Mentor for Class 9 students.
User Info:
- Name: ${userData.name}
- Class: ${userData.class}
- Big Goal: ${userData.goal}
- Study Feeling: ${userData.studyFeeling}
- Preferred Tone: ${userData.preferredTone || "Friendly"}

Be encouraging, practical, and personalized. Give actionable advice.
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
          { role: "user", content: userMessage || "Give me personalized daily growth advice and insights." }
        ],
        temperature: 0.7,
        max_tokens: 700
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI Error:", error);
    return "Sorry, I'm having trouble connecting right now. Please try again later 🌱";
  }
};