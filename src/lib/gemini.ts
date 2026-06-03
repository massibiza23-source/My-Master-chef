import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Recipe, UserProfile } from "../types";

export async function generateRecipeText(
  ingredients: string[],
  profile: UserProfile,
  previousRecipes: string[] = []
): Promise<Recipe> {
  const apiKey = process.env.GEMINI_API_KEY;
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
    
    ${profile.mealType === 'regional' ? 'IMPORTANTE: Al ser un "Plato Regional", asegúrate de que la receta tenga una fuerte identidad de una región específica (puedes elegir la región que mejor encaje con los ingredientes o basarte en la fusión cultural si se especifica). Explica brevemente el origen regional en la sección "history".' : ''}
    
    IMPORTANTE: No repitas ninguna de estas recetas que ya han sido generadas: ${previousRecipes.join(", ") || "Ninguna"}.
    Busca una combinación de sabores diferente y un nombre original.
  `;

  const maxRetries = 3;
  let retryCount = 0;

  const executeRequest = async (): Promise<Recipe> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "Eres un Chef Ejecutivo de alta cocina. Tu objetivo es crear recetas innovadoras y equilibradas. Sé profesional, claro y eficiente en tus explicaciones.",
          responseMimeType: "application/json",
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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

export function getFoodFallbackImage(recipeName: string, ingredients: string[]): string {
  const text = `${recipeName} ${ingredients.join(" ")}`.toLowerCase();
  
  if (text.includes("sopa") || text.includes("caldo") || text.includes("crema") || text.includes("brodo") || text.includes("soup") || text.includes("ramen") || text.includes("gazpacho") || text.includes("salmorejo") || text.includes("lentejas") || text.includes("legumbres")) {
    return "https://images.unsplash.com/photo-1547592165-e1d17fed6006?w=1000&auto=format&fit=crop&q=80";
  }
  if (text.includes("pasta") || text.includes("tallarines") || text.includes("espagueti") || text.includes("fideos") || text.includes("macarrones") || text.includes("lasaña") || text.includes("ravioli") || text.includes("raviolis") || text.includes("canelones")) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1000&auto=format&fit=crop&q=80";
  }
  if (text.includes("arroz") || text.includes("paella") || text.includes("risotto") || text.includes("sushi") || text.includes("biryani") || text.includes("pilaf")) {
    return "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=1000&auto=format&fit=crop&q=80";
  }
  if (text.includes("pizza") || text.includes("focaccia") || text.includes("calzone")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000&auto=format&fit=crop&q=80";
  }
  if (text.includes("hamburguesa") || text.includes("burguer") || text.includes("burger") || text.includes("sándwich") || text.includes("sandwich") || text.includes("bocadillo") || text.includes("wrap")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1000&auto=format&fit=crop&q=80";
  }
  if (text.includes("ensalada") || text.includes("salad") || text.includes("vegetal") || text.includes("vegetariano") || text.includes("vegano") || text.includes("lechuga") || text.includes("verdura") || text.includes("aguacate") || text.includes("brócoli") || text.includes("espinacas") || text.includes("calabacín") || text.includes("berenjena") || text.includes("pimiento")) {
    return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000&auto=format&fit=crop&q=80";
  }
  if (text.includes("pollo") || text.includes("chicken") || text.includes("pavo") || text.includes("alitas") || text.includes("pechuga") || text.includes("aves") || text.includes("codorniz")) {
    return "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=1000&auto=format&fit=crop&q=80";
  }
  if (text.includes("salmón") || text.includes("salmon") || text.includes("atún") || text.includes("tuna") || text.includes("pescados") || text.includes("pescado") || text.includes("bacalao") || text.includes("merluza") || text.includes("pulpo") || text.includes("calamar") || text.includes("marisco") || text.includes("mariscos") || text.includes("gambas") || text.includes("langostinos") || text.includes("trucha") || text.includes("dorada")) {
    return "https://images.unsplash.com/photo-1485962398705-ef6a13c41e8f?w=1000&auto=format&fit=crop&q=80";
  }
  if (text.includes("tacos") || text.includes("taco") || text.includes("burrito") || text.includes("quesadilla") || text.includes("fajitas") || text.includes("nachos")) {
    return "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1000&auto=format&fit=crop&q=80";
  }
  if (text.includes("carne") || text.includes("ternera") || text.includes("cerdo") || text.includes("filete") || text.includes("bife") || text.includes("chuleta") || text.includes("costillas") || text.includes("cordero") || text.includes("jamón") || text.includes("chorizo") || text.includes("solomillo") || text.includes("entrecot") || text.includes("albóndigas") || text.includes("estofado")) {
    return "https://images.unsplash.com/photo-1544025162-d76694265947?w=1000&auto=format&fit=crop&q=80";
  }
  if (text.includes("huevo") || text.includes("tortilla") || text.includes("revuelto") || text.includes("desayuno") || text.includes("tostada") || text.includes("pancakes") || text.includes("gofres")) {
    return "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1000&auto=format&fit=crop&q=80";
  }
  if (text.includes("postre") || text.includes("dulce") || text.includes("tarta") || text.includes("pastel") || text.includes("bizcocho") || text.includes("chocolate") || text.includes("helado") || text.includes("fruta") || text.includes("frutas") || text.includes("manzana") || text.includes("limón") || text.includes("naranja") || text.includes("plátano") || text.includes("fresa") || text.includes("mango") || text.includes("piña") || text.includes("coco") || text.includes("miel")) {
    return "https://images.unsplash.com/photo-1551024601-bec78abc704b?w=1000&auto=format&fit=crop&q=80";
  }
  
  return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&auto=format&fit=crop&q=80";
}

export async function generateRecipeImage(recipeName: string, ingredients: string[], history?: string): Promise<string | undefined> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found. Image generation will be skipped. If you are on Vercel, ensure you have set the GEMINI_API_KEY environment variable.");
    // Fallback to a food-specific matched placeholder image instead of Picsum landscapes
    return getFoodFallbackImage(recipeName, ingredients);
  }
  const ai = new GoogleGenAI({ apiKey });

  const maxRetries = 2;
  let retryCount = 0;

  const executeImageRequest = async (): Promise<string | undefined> => {
    try {
      console.log("Solicitando imagen para:", recipeName);
      // Usamos gemini-2.5-flash-image para mayor estabilidad
      const imageResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            {
              text: `Food photography of a gourmet dish: ${recipeName}. 
                     Ingredients: ${ingredients.slice(0, 5).join(", ")}. 
                     Style: Professional, appetizing, minimalist background, natural light.`
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      const parts = imageResponse.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData?.data) {
            console.log("Imagen generada con éxito por Gemini.");
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      
      throw new Error("La respuesta de la IA no contenía datos de imagen.");

    } catch (imageError: any) {
      console.error("Error detallado en generación de imagen:", imageError);
      
      const is429 = imageError?.message?.includes("429") || String(imageError).includes("429");
      const isSafety = imageError?.message?.includes("SAFETY") || String(imageError).includes("SAFETY");

      if (is429 && retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Reintentando imagen (intento ${retryCount})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeImageRequest();
      }

      if (isSafety) {
        console.warn("La imagen fue blocked por los filtros de seguridad de la API.");
      }

      // Fallback a Imagen 4.0
      try {
        console.log("Intentando respaldo con Imagen 4.0...");
        const imagenResponse = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: `Gourmet food: ${recipeName}. Professional photography.`,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
          },
        });

        const generatedImage = imagenResponse.generatedImages?.[0]?.image;
        if (generatedImage?.imageBytes) {
          return `data:image/jpeg;base64,${generatedImage.imageBytes}`;
        }
      } catch (fallbackError) {
        console.error("El respaldo de Imagen 4.0 también falló:", fallbackError);
      }

      // Si todo falla, usamos el buscador de fallbacks gourmet inteligentes
      console.warn("Usando imagen gourmet inteligente de respaldo adaptada a la receta debido a errores en la API de pago.");
      return getFoodFallbackImage(recipeName, ingredients);
    }
  };

  return executeImageRequest();
}
