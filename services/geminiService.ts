
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. App will not function correctly.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || '' });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: base64EncodedData, mimeType: file.type },
  };
};

export const generateGeminiResponse = async (prompt: string, imageFile?: File): Promise<string> => {
  if (!API_KEY) {
    return "Error: API_KEY is not configured. Please set the environment variable to use the application.";
  }

  const model = 'gemini-2.5-flash';

  try {
    const parts: any[] = [];
    
    if (imageFile) {
      const imagePart = await fileToGenerativePart(imageFile);
      parts.push(imagePart);
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
    });
    
    return response.text;
  } catch (e) {
    console.error("Gemini API call failed:", e);
    return "An error occurred while communicating with the AI. Please check the console for details and ensure your API key is valid.";
  }
};
