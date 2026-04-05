import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Recipe, UserProfile } from "../types";

export async function generateRecipeText(
  ingredients: string[],
  profile: UserProfile,
  previousRecipes: string[] = []
): Promise<Recipe> {
  // Try multiple sources for the API key, prioritizing VITE_ for Vercel/Vite compatibility
  let envApiKey = "";
  try {
    // Safety check for process.env in browser environments
    if (typeof process !== 'undefined' && process.env) {
      envApiKey = process.env.GEMINI_API_KEY || (process.env as any).API_KEY || "";
    }
  } catch (e) {
    // process might not be defined
  }

  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || envApiKey;
                 
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Genera una receta única y creativa:
    Ingredientes disponibles: ${ingredients.join(", ")}
    Gustos del usuario: ${profile.likes.join(", ")}
    Evitar: ${profile.dislikes.join(", ")}
    Intolerancias: ${profile.intolerances.join(", ")}
    Objetivo: ${profile.goal}
    Tipo de comida: ${profile.mealType}
    Fusión cultural: ${profile.fusion || "Libre"}
    Idioma: ${profile.language}
    
    IMPORTANTE: No repitas ninguna de estas recetas que ya han sido generadas: ${previousRecipes.join(", ") || "Ninguna"}.
    Busca una combinación de sabores diferente y un nombre original.
    
    JSON:
    {
      "name": "Nombre corto y original",
      "history": "Inspiración (1 línea)",
      "prepTime": "Tiempo total (ej: 45 min)",
      "tricks": ["truco 1", "truco 2"],
      "courses": [{"title": "Entrante", "name": "Nombre", "description": "Breve"}],
      "ingredients": [{"item": "cantidad e ingrediente", "alternative": "opcional"}],
      "steps": ["paso corto 1"],
      "nutrition": {"calories": "kcal", "protein": "g", "carbs": "g", "fat": "g"},
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
              prepTime: { type: Type.STRING },
              tricks: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
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
              nutrition: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.STRING },
                  protein: { type: Type.STRING },
                  carbs: { type: Type.STRING },
                  fat: { type: Type.STRING }
                },
                required: ["calories", "protein", "carbs", "fat"]
              },
              chefTip: { type: Type.STRING }
            },
            required: ["name", "history", "prepTime", "tricks", "ingredients", "steps", "nutrition", "chefTip"]
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
  // Try multiple sources for the API key, prioritizing VITE_ for Vercel/Vite compatibility
  let envApiKey = "";
  try {
    // Safety check for process.env in browser environments
    if (typeof process !== 'undefined' && process.env) {
      envApiKey = process.env.GEMINI_API_KEY || (process.env as any).API_KEY || "";
    }
  } catch (e) {
    console.warn("[Chef IA] No se pudo acceder a process.env");
  }

  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || envApiKey;
                 
  if (!apiKey) {
    console.error("[Chef IA] No se encontró API Key. Asegúrate de configurar VITE_GEMINI_API_KEY en Vercel o usar el botón 'Tokens / API'.");
    return undefined;
  }
  
  console.log("[Chef IA] API Key detectada, procediendo con la generación...");
  const ai = new GoogleGenAI({ apiKey });

  const maxRetries = 2;
  let retryCount = 0;

  const executeImageRequest = async (): Promise<string | undefined> => {
    try {
      console.log(`[Chef IA] Iniciando generación de imagen para: ${recipeName}...`);
      
      // Intentar primero con gemini-2.5-flash-image
      const imageResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            {
              text: `A professional, high-end culinary photograph of a dish named "${recipeName}". 
                     Style: Minimalist, elegant, gourmet presentation, soft natural lighting, 
                     warm tones, shallow depth of field. The dish features: ${ingredients.join(", ")}.`
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      if (imageResponse.candidates?.[0]?.content?.parts) {
        for (const part of imageResponse.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            console.log("[Chef IA] Imagen generada con éxito (Gemini 2.5)");
            const mimeType = part.inlineData.mimeType || "image/png";
            const base64Data = part.inlineData.data.replace(/\s/g, ""); 
            return `data:${mimeType};base64,${base64Data}`;
          }
        }
      }
      
      throw new Error("No image data in response");

    } catch (imageError: any) {
      console.error("[Chef IA] Error en generación primaria:", imageError);
      
      const errorStr = String(imageError).toLowerCase();
      const is429 = errorStr.includes("429");
      const isPermissionDenied = errorStr.includes("permission") || errorStr.includes("403");
      
      if (isPermissionDenied) {
        console.warn("[Chef IA] Permiso denegado. Asegúrate de que tu API Key tenga habilitado el modelo Gemini 2.5 Flash Image.");
      }

      if (is429 && retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[Chef IA] Quota excedida, reintentando en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeImageRequest();
      }

      // Fallback a Imagen 4.0 (A veces tiene cuotas diferentes)
      try {
        console.log("[Chef IA] Intentando fallback con Imagen 4.0...");
        const imagenResponse = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: `A professional, high-end culinary photograph of a dish named "${recipeName}" with ${ingredients.join(", ")}. Gourmet presentation.`,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
          },
        });

        if (imagenResponse.generatedImages?.[0]?.image?.imageBytes) {
          console.log("[Chef IA] Imagen generada con éxito (Imagen 4.0)");
          const base64Data = imagenResponse.generatedImages[0].image.imageBytes.replace(/\s/g, "");
          return `data:image/jpeg;base64,${base64Data}`;
        }
      } catch (fallbackError) {
        console.error("[Chef IA] Fallback también falló:", fallbackError);
      }
    }
    return undefined;
  };

  return executeImageRequest();
}
