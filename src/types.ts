export interface Ingredient {
  id: string;
  name: string;
}

export interface Course {
  title: string;
  name: string;
  description: string;
}

export interface Recipe {
  name: string;
  history: string;
  ingredients: {
    item: string;
    alternative?: string;
  }[];
  steps: string[];
  nutrition: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };
  prepTime: string;
  tricks: string[];
  chefTip: string;
  imageUrl?: string;
  courses?: Course[];
}

export interface UserProfile {
  likes: string[];
  dislikes: string[];
  intolerances: string[];
  goal: 'healthy' | 'indulgent' | 'fast' | 'gourmet';
  fusion?: string;
  language: 'es' | 'en' | 'de' | 'it' | 'pt';
  mealType: 'single' | 'lunch' | 'dinner' | 'soup';
}
