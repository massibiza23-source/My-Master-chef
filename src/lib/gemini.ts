import { Recipe, UserProfile } from "../types";

export async function generateRecipeText(
  ingredients: string[],
  profile: UserProfile,
  previousRecipes: string[] = []
): Promise<Recipe> {
  const response = await fetch("/api/generate-recipe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ingredients,
      profile,
      previousRecipes,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate recipe");
  }

  return response.json();
}

export async function generateRecipeImage(
  recipeName: string, 
  ingredients: string[], 
  history?: string
): Promise<string | undefined> {
  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipeName,
        ingredients,
        history,
      }),
    });

    if (!response.ok) {
      console.warn("Server generation failed, using fallback.");
      const seed = encodeURIComponent(recipeName.toLowerCase().replace(/\s+/g, '-'));
      return `https://picsum.photos/seed/${seed}/1200/800`;
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Error calling image API:", error);
    const seed = encodeURIComponent(recipeName.toLowerCase().replace(/\s+/g, '-'));
    return `https://picsum.photos/seed/${seed}/1200/800`;
  }
}
