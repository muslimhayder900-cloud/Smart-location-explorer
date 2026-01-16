
import { GoogleGenAI } from "@google/genai";
import { Location, GeminiResponse, GroundingChunk } from "../types";

export const callGeminiWithMaps = async (
  prompt: string,
  location?: Location
): Promise<GeminiResponse> => {
  // استخدام مفتاح API من البيئة
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const config: any = {
    // دمج بحث جوجل مع الخرائط للحصول على أفضل النتائج
    tools: [{ googleMaps: {} }, { googleSearch: {} }],
    systemInstruction: "أنت مساعد ذكي متخصص في استكشاف المواقع المحلية. استخدم أدوات الخرائط والبحث لتقديم أدق المعلومات عن الأماكن. يجب أن تكون جميع إجاباتك باللغة العربية. عند ذكر أماكن، اذكر تفاصيل مفيدة مثل العنوان أو ميزة خاصة.",
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
      model: "gemini-2.5-flash", 
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
      } else if (chunk.web) {
        return {
          web: {
            uri: chunk.web.uri,
            title: chunk.web.title
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
