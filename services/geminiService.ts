
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Suggests high-yield modules for skill-based learning.
 * Uses gemini-3-pro-preview for superior reasoning.
 */
export const suggestLectures = async (subject: string): Promise<string[]> => {
  // Always initialize with apiKey from process.env.API_KEY using named parameter.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Suggest a list of exactly 15 learning module names for "${subject}" skill development. Output as a JSON array of strings only.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: { 
            type: Type.STRING,
            description: "The name of an important learning module"
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
