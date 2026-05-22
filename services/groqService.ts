
/**
 * Groq Service for Batchwise AI Suite
 * Provides ultra-fast inference for scheduling, auditing, and quiz generation.
 */

export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
}

export const queryGroq = async (prompt: string, systemPrompt: string = "You are a helpful learning assistant for skill development and creative tools."): Promise<AIResponse> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || "";

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return {
      content: data.choices[0].message.content,
      success: true
    };
  } catch (error: any) {
    console.error("Groq API Error:", error);
    return { content: '', success: false, error: error.message };
  }
};

/**
 * Helper to trigger MathJax rendering
 */
export const reRenderMathJax = () => {
  const render = () => {
    if ((window as any).MathJax) {
      try {
        // Clear previous state and re-typeset
        (window as any).MathJax.typesetClear?.();
        (window as any).MathJax.typesetPromise?.().then(() => {
          console.log("MathJax rendered successfully");
        }).catch((err: any) => console.error("MathJax error:", err));
      } catch (e) {
        console.error("MathJax execution error:", e);
      }
    }
  };
  
  // Try immediately and with delays to ensure content is in DOM
  render();
  setTimeout(render, 100);
  setTimeout(render, 500);
  setTimeout(render, 1500);
};

/**
 * Specifically for scheduling: parses user intent into ScheduleConfig
 */
export const getAIScheduleConfig = async (userPrompt: string, batchMeta: any): Promise<any> => {
  const systemPrompt = `
    You are an AI Scheduling Assistant for a study platform. 
    Your goal is to parse user study requests into a valid JSON configuration for an auto-scheduler.
    
    CURRENT BATCH CONTEXT:
    ${JSON.stringify(batchMeta)}
    
    EXPECTED JSON OUTPUT FORMAT:
    {
      "activeDays": [1,2,3,4,5,6], // 0=Sun, 1=Mon, etc.
      "lecturesPerDay": 3,
      "strategy": "interleaved" | "sequential",
      "startDate": "YYYY-MM-DD",
      "offDays": ["YYYY-MM-DD"],
      "clearExisting": true,
      "reasoning": "A brief explanation of why this schedule was chosen. Use LaTeX ($...$) for any math."
    }
  `;

  const result = await queryGroq(userPrompt, systemPrompt);
  if (result.success) {
    return JSON.parse(result.content);
  }
  throw new Error(result.error);
};

/**
 * EXECUTION ENGINE: Allows AI to perform state mutations
 */
export const executeGlobalAICommand = async (command: string, currentState: any): Promise<{ mutations: any[], response?: string, reasoning: string }> => {
  const systemPrompt = `
    You are the "AI Sovereign" of the Batchwise platform. 
    You have UNLIMITED power to mutate the platform state OR answer questions about the current study ecosystem.
    
    TODAY'S DATE: ${new Date().toISOString().split('T')[0]}
    
    CURRENT STATE (Snapshot):
    ${JSON.stringify(currentState).slice(0, 5000)}
    
    CAPABILITIES:
    1. MUTATIONS: [ADD_SUBJECT, DELETE_BATCH, RESCHEDULE, RENAME_BATCH, SET_GOAL]
    2. QUERIES: If the user asks a question (e.g., "What are my plans for May 2?"), scan the state and provide a helpful, sharp, and concise answer in the "response" field.
    
    Respond ONLY with a JSON object:
    {
      "mutations": [ { "type": "...", ... } ], // Empty if only answering a question
      "response": "Your direct answer to the user (if query)",
      "reasoning": "Internal logic / decision explanation."
    }
  `;

  const result = await queryGroq(command, systemPrompt);
  if (result.success) {
    return JSON.parse(result.content);
  }
  throw new Error(result.error);
};
