import { GoogleGenAI } from "@google/genai";
import { MANGA_PROMPT } from "../types";

/**
 * Converts a File object to a Base64 string.
 */
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Calls Gemini to transform the image.
 * Uses the standard gemini-2.5-flash-image model with dynamic aspect ratio.
 */
export const transformImageToManga = async (
  base64Image: string,
  mimeType: string,
  aspectRatio: string = "1:1"
): Promise<string> => {
  // Initialize the client strictly before the call to ensure usage of the latest selected key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash-image';

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: MANGA_PROMPT },
          { inlineData: { mimeType: mimeType, data: base64Image } }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any // Cast to any to satisfy specific string literal types if needed
        }
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    
    if (!parts) {
      throw new Error("No content received from Gemini.");
    }

    // Iterate to find the image part
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    // If no image found, check for text (usually a refusal or error description)
    const textPart = parts.find(p => p.text);
    if (textPart && textPart.text) {
        throw new Error(`Model refused to generate image: ${textPart.text}`);
    }

    throw new Error("No valid image data found in response.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};