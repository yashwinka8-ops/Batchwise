
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Suggests high-yield topics for skill-learning preparation.
 * Uses gemini-3-pro-preview for superior reasoning in STEM subjects.
 */
export const suggestLectures = async (subject: string): Promise<string[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Suggest a list of exactly 15 high-yield topic names for ${subject} skill learning. Output as a JSON array of strings only.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { 
            type: Type.STRING,
            description: "The name of an important topic for skill learning"
          }
        }
      }
    });

    // Access the .text property directly (not a method).
    const text = response.text || "[]";
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};
