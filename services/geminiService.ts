
import { GoogleGenAI } from "@google/genai";

export const getAIFeedback = async (lastTime: number, bestTime: number) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a cold, professional F1 race engineer. Analyze a reaction time of ${lastTime}ms (Best is ${bestTime}ms). Provide a one-sentence critique or encouragement using motorsport terminology like 'delta', 'apex', 'reaction', 'clutch', 'lights out'. Be concise.`,
      config: {
        temperature: 0.8,
        maxOutputTokens: 100,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
