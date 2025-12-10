import { GoogleGenAI } from "@google/genai";
import { stripBase64Prefix } from '../utils/imageUtils';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-2.5-flash-image';

interface GenerateImageParams {
  prompt: string;
  inputImageBase64?: string; // Optional: if provided, we edit this image
  mimeType?: string;
}

export const generateOrEditImage = async ({
  prompt,
  inputImageBase64,
  mimeType = 'image/png'
}: GenerateImageParams): Promise<string> => {
  try {
    const parts: any[] = [];

    // If input image exists, we are in "Edit" mode (or Image-to-Image mode)
    if (inputImageBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: stripBase64Prefix(inputImageBase64),
        },
      });
      // Prompt for editing
      parts.push({ text: prompt });
    } else {
      // "Generate" mode (Text-to-Image)
      parts.push({ text: prompt });
    }

    console.log(`Calling Gemini (${MODEL_NAME}) with prompt: "${prompt}"...`);

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts,
      },
    });

    // Check response for image data
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return `data:${mime};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data found in response.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
