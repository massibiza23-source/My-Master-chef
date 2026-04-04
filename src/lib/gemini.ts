import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Recipe, UserProfile } from "../types";

export async function generateRecipeText(
  ingredients: string[],
  profile: UserProfile
): Promise<Recipe> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Genera una receta única:
    Ingredientes: ${ingredients.join(", ")}
    Gustos: ${profile.likes.join(", ")}
    Evitar: ${profile.dislikes.join(", ")}
    Intolerancias: ${profile.intolerances.join(", ")}
    Objetivo: ${profile.goal}
    Tipo: ${profile.mealType}
    Fusión: ${profile.fusion || "Libre"}
    Idioma: ${profile.language}
    
    JSON:
    {
      "name": "Nombre corto",
      "history": "Inspiración (1 línea)",
      "courses": [{"title": "Entrante", "name": "Nombre", "description": "Breve"}],
      "ingredients": [{"item": "cantidad e ingrediente", "alternative": "opcional"}],
      "steps": ["paso corto 1"],
      "chefTip": "Consejo breve"
    }
  `;

  const maxRetries = 3;
  let retryCount = 0;

  const executeRequest = async (): Promise<Recipe> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview", // Usando versión lite para mayor disponibilidad
        contents: prompt,
        config: {
          systemInstruction: "Eres un Chef Ejecutivo de alta cocina. Tu objetivo es crear recetas innovadoras y equilibradas. Sé profesional, claro y eficiente en tus explicaciones.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          maxOutputTokens: 2048,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              history: { type: Type.STRING },
              courses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["title", "name", "description"]
                }
              },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    alternative: { type: Type.STRING }
                  },
                  required: ["item"]
                }
              },
              steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              chefTip: { type: Type.STRING }
            },
            required: ["name", "history", "ingredients", "steps", "chefTip"]
          }
        }
      });

      if (!response.text) {
        throw new Error("No response text from AI");
      }

      return JSON.parse(response.text);
    } catch (error: any) {
      const is429 = error?.message?.includes("429") || String(error).includes("429");
      
      if (is429 && retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Retrying after 429 error (attempt ${retryCount})... waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeRequest();
      }
      
      throw error;
    }
  };

  return executeRequest();
}

export async function generateRecipeImage(recipeName: string, ingredients: string[]): Promise<string | undefined> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return undefined;
  const ai = new GoogleGenAI({ apiKey });

  const maxRetries = 2;
  let retryCount = 0;

  const executeImageRequest = async (): Promise<string | undefined> => {
    try {
      const imageResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: `A professional, high-end culinary photograph of a dish named "${recipeName}". 
                   Style: Minimalist, elegant, gourmet presentation, soft natural lighting, 
                   warm tones, shallow depth of field. The dish features: ${ingredients.join(", ")}.`,
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      if (imageResponse.candidates?.[0]?.content?.parts) {
        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
    } catch (imageError: any) {
      const is429 = imageError?.message?.includes("429") || String(imageError).includes("429");
      if (is429 && retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying image after 429 error (attempt ${retryCount})... waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeImageRequest();
      }
      console.error("Error generating image:", imageError);
    }
    return undefined;
  };

  return executeImageRequest();
}
