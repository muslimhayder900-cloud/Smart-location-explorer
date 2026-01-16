
import { GoogleGenAI } from "@google/genai";
import { Location, GeminiResponse, GroundingChunk } from "../types";

export const callGeminiWithMaps = async (
  prompt: string,
  location?: Location
): Promise<GeminiResponse> => {
  // استخدام مفتاح API من البيئة
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const config: any = {
    tools: [{ googleMaps: {} }],
    systemInstruction: "أنت مساعد ذكي متخصص في استكشاف المواقع المحلية. يجب أن تكون جميع إجاباتك باللغة العربية الواضحة. قدم توصيات محددة بناءً على بيانات خرائط جوجل.",
  };

  if (location) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // استخدام اسم النموذج الصحيح لدعم الخرائط
      contents: prompt,
      config: config,
    });

    const text = response.text || "لم أتمكن من العثور على نتائج دقيقة حالياً.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources: GroundingChunk[] = chunks.map((chunk: any) => {
      if (chunk.maps) {
        return {
          maps: {
            uri: chunk.maps.uri,
            title: chunk.maps.title
          }
        };
      }
      return null;
    }).filter(Boolean) as GroundingChunk[];

    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
