import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API routes FIRST
app.post("/api/generate-recipe", async (req, res) => {
  try {
    const { ingredients, profile, previousRecipes } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    const ai = new GoogleGenAI({ apiKey });

    const promptText = `
      Genera una receta única y creativa:
      Ingredientes disponibles: ${ingredients.join(", ")}
      Gustos del usuario: ${profile.likes.join(", ")}
      Evitar: ${profile.dislikes.join(", ")}
      Intolerancias: ${profile.intolerances.join(", ")}
      Objetivo: ${profile.goal}
      Tipo de comida: ${profile.mealType}
      Fusión cultural: ${profile.fusion || "Libre"}
      Idioma: ${profile.language}
      
      ${profile.mealType === 'regional' ? 'IMPORTANTE: Al ser un "Plato Regional", asegúrate de que la receta tenga una fuerte identidad de una región específica. Explica brevemente el origen regional en la sección "history".' : ''}
      
      IMPORTANTE: No repitas ninguna de estas recetas que ya han sido generadas: ${previousRecipes?.join(", ") || "Ninguna"}.
      Busca una combinación de sabores diferente y un nombre original.
    `;
    
    // Usamos gemini-3.1-pro-preview para razonamiento complejo y mayor calidad
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      config: {
        systemInstruction: "Eres un Chef Ejecutivo de alta cocina. Tu objetivo es crear recetas innovadoras y equilibradas. Sé profesional, claro y eficiente en tus explicaciones. Proporciona siempre un maridaje sugerido (vino, cóctel o bebida artesanal) que complemente los sabores del plato.",
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
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
            pairing: {
              type: Type.OBJECT,
              properties: {
                drink: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ["drink", "description"]
            },
            chefTip: { type: Type.STRING }
          },
          required: ["name", "history", "prepTime", "tricks", "ingredients", "steps", "nutrition", "pairing", "chefTip"]
        }
      }
    });

    res.json(JSON.parse(response.text!));
  } catch (error: any) {
    console.error("Error generating recipe:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/generate-image", async (req, res) => {
  try {
    const { recipeName, ingredients } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Food photography of a gourmet dish: ${recipeName}. 
                   Ingredients: ${ingredients?.slice(0, 5).join(", ")}. 
                   Style: Professional, appetizing, minimalist background, natural light, high resolution.`;

    const imageResponse = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: {
        parts: [
          {
            text: prompt
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      }
    });

    const parts = imageResponse.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          return res.json({ imageUrl: `data:image/png;base64,${part.inlineData.data}` });
        }
      }
    }
    
    // Fallback if no image generated
    const seed = encodeURIComponent(recipeName.toLowerCase().replace(/\s+/g, '-'));
    res.json({ imageUrl: `https://picsum.photos/seed/${seed}/1200/800`, isFallback: true });

  } catch (error: any) {
    console.error("Error generating image:", error);
    // Return a fallback image instead of an error to prevent breaking UI
    const recipeName = req.body.recipeName || "recipe";
    const seed = encodeURIComponent(recipeName.toLowerCase().replace(/\s+/g, '-'));
    res.json({ imageUrl: `https://picsum.photos/seed/${seed}/1200/800`, isFallback: true, error: error.message });
  }
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
