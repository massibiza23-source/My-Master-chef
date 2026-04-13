import { useState, useEffect } from 'react';
import { 
  Utensils,
  Clock,
  Flame,
  Soup,
  Globe
} from 'lucide-react';
import { generateRecipeText, generateRecipeImage } from './lib/gemini';
import { Recipe, UserProfile } from './types';

// Components
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { IngredientsStep } from './components/IngredientsStep';
import { ProfileStep } from './components/ProfileStep';
import { RecipeView } from './components/RecipeView';
import { SavedRecipesView } from './components/SavedRecipesView';

export default function App() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [profile, setProfile] = useState<UserProfile>({
    likes: [],
    dislikes: [],
    intolerances: [],
    goal: 'gourmet',
    fusion: '',
    language: 'es',
    mealType: 'single'
  });
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('flavor_engine_recipes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter(r => r && typeof r === 'object' && r.name) : [];
      } catch (e) {
        console.error("Error parsing saved recipes", e);
        return [];
      }
    }
    return [];
  });
  const [showSaveFeedback, setShowSaveFeedback] = useState<'saved' | 'already' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Consultando al Chef IA...');
  const [step, setStep] = useState<'ingredients' | 'profile' | 'recipe' | 'saved'>('ingredients');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [recipeToDelete, setRecipeToDelete] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  // Handle URL share
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedRecipe = params.get('recipe');
    if (sharedRecipe) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(sharedRecipe))));
        setRecipe(decoded);
        setStep('recipe');
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("Error decoding shared recipe", e);
      }
    }
  }, []);

  const loadingMessages = [
    'Consultando al Chef IA...',
    'Analizando tu paladar...',
    'Buscando la fusión perfecta...',
    'Diseñando la presentación...',
    'Casi listo para servir...'
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[i]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const languages = [
    { id: 'es', label: 'Español', flag: '🇪🇸' },
    { id: 'en', label: 'English', flag: '🇬🇧' },
    { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { id: 'it', label: 'Italiano', flag: '🇮🇹' },
    { id: 'pt', label: 'Português', flag: '🇵🇹' },
  ] as const;

  const mealTypes = [
    { id: 'single', label: 'Plato Único', icon: Utensils },
    { id: 'lunch', label: 'Almuerzo', icon: Clock },
    { id: 'dinner', label: 'Cena', icon: Flame },
    { id: 'soup', label: 'Sopa', icon: Soup },
    { id: 'regional', label: 'Plato Regional', icon: Globe },
  ] as const;

  useEffect(() => {
    try {
      localStorage.setItem('flavor_engine_recipes', JSON.stringify(savedRecipes));
    } catch (e: any) {
      console.error("Error saving to localStorage", e);
    }
  }, [savedRecipes]);

  const addIngredient = () => {
    if (currentInput.trim() && !ingredients.includes(currentInput.trim())) {
      setIngredients([...ingredients, currentInput.trim()]);
      setCurrentInput('');
    }
  };

  const removeIngredient = (ing: string) => {
    setIngredients(ingredients.filter(i => i !== ing));
  };

  const handleGenerate = async () => {
    if (loading) return;
    if (ingredients.length === 0) {
      setError("Por favor, añade al menos un ingrediente.");
      return;
    }
    setLoading(true);
    setError(null);
    setRecipe(null);
    setStep('recipe');

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("TIMEOUT")), 120000)
    );

    try {
      const result = await Promise.race([
        generateRecipeText(ingredients, profile, savedRecipes.slice(0, 10).map(r => r.name)),
        timeoutPromise
      ]) as Recipe;

      if (!result || !result.name) throw new Error("EMPTY_RESPONSE");

      setRecipe(result);
      setLoading(false);
    } catch (err: any) {
      console.error("Error generating recipe:", err);
      setError("No pudimos contactar con el Chef. Por favor, inténtalo de nuevo.");
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!recipe || generatingImage) return;
    setGeneratingImage(true);
    try {
      const imageUrl = await generateRecipeImage(recipe.name, recipe.ingredients.map(i => i.item), recipe.history);
      if (imageUrl) {
        setRecipe(prev => prev ? { ...prev, imageUrl } : prev);
      }
    } catch (err) {
      console.error("Image generation failed:", err);
    } finally {
      setGeneratingImage(false);
    }
  };

  const saveRecipe = () => {
    if (recipe && recipe.name) {
      if (!savedRecipes.some(r => r.name === recipe.name)) {
        setSavedRecipes([recipe, ...savedRecipes]);
        setShowSaveFeedback('saved');
        setTimeout(() => setShowSaveFeedback(null), 3000);
      } else {
        setShowSaveFeedback('already');
        setTimeout(() => setShowSaveFeedback(null), 3000);
      }
    }
  };

  const deleteRecipe = (name: string) => {
    setSavedRecipes(savedRecipes.filter(r => r.name !== name));
  };

  const generateRecipeHtml = (r: Recipe) => {
    if (!r) return '';
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${r.name} - AI Flavor Engine</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
    <style>
        :root { --gold: #C08C5D; --charcoal: #1A1A1A; --cream: #FDFCFB; }
        body { font-family: 'Inter', sans-serif; background: var(--cream); color: var(--charcoal); padding: 40px 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 40px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.05); border: 1px solid rgba(192, 140, 93, 0.1); }
        .hero-image { width: 100%; height: 400px; object-fit: cover; display: block; }
        .hero-text { padding: 60px 40px 20px; text-align: center; }
        .hero-text.no-image { background: var(--charcoal); color: white; padding: 80px 40px; }
        h1 { font-family: 'Playfair Display', serif; font-size: 48px; margin: 0 0 20px 0; }
        .history { font-family: 'Playfair Display', serif; font-style: italic; opacity: 0.8; max-width: 600px; margin: 0 auto; }
        .content { padding: 0 60px 60px; }
        .main-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 60px; }
        @media (max-width: 768px) { .main-grid { grid-template-columns: 1fr; } .content { padding: 30px; } h1 { font-size: 32px; } }
        h2 { font-family: 'Playfair Display', serif; font-size: 24px; border-bottom: 1px solid rgba(192, 140, 93, 0.2); padding-bottom: 10px; margin-bottom: 30px; }
        .footer { text-align: center; padding: 40px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4em; opacity: 0.3; }
    </style>
</head>
<body>
    <div class="container">
        ${r.imageUrl ? `<img src="${r.imageUrl}" class="hero-image">` : ''}
        <div class="hero-text ${!r.imageUrl ? 'no-image' : ''}">
            <h1>${r.name}</h1>
            <p class="history">"${r.history}"</p>
        </div>
        <div class="content">
            <div class="main-grid">
                <div>
                    <h2>Ingredientes</h2>
                    <ul>${r.ingredients.map(i => `<li><strong>${i.item}</strong>${i.alternative ? `<br><small>Alt: ${i.alternative}</small>` : ''}</li>`).join('')}</ul>
                </div>
                <div>
                    <h2>Preparación</h2>
                    ${r.steps.map((s, i) => `<div style="display:flex; gap:20px; margin-bottom:20px;"><div style="color:var(--gold); opacity:0.3; font-family:serif; font-size:24px;">${(i+1).toString().padStart(2,'0')}</div><div>${s}</div></div>`).join('')}
                    <div style="background:rgba(192,140,93,0.05); border-left:4px solid var(--gold); padding:30px; border-radius:0 20px 20px 0; margin-top:40px; font-style:italic; font-size:14px;">
                        <strong style="color:var(--gold); display:block; margin-bottom:10px; font-style:normal;">Consejo del Chef</strong>
                        ${r.chefTip}
                    </div>
                </div>
            </div>
        </div>
        <div class="footer">AI Flavor Engine &copy; 2026</div>
    </div>
</body>
</html>`;
  };

  const downloadAsHtml = (r: Recipe) => {
    const html = generateRecipeHtml(r);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${r.name.toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllAsHtml = () => {
    if (savedRecipes.length === 0) return;
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mi Recetario Completo</title>
    <style>
        body { font-family: sans-serif; background: #FDFCFB; padding: 40px; }
        .card { background: white; border-radius: 20px; padding: 30px; margin-bottom: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        h1 { color: #C08C5D; text-align: center; }
    </style>
</head>
<body>
    <h1>Mi Recetario Personal</h1>
    ${savedRecipes.map(r => `<div class="card"><h2>${r.name}</h2><p>${r.history}</p></div>`).join('')}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mi-recetario-completo.html`;
    a.click();
  };

  const shareWhatsApp = (r: Recipe) => {
    const text = `🌟 *${r.name.toUpperCase()}* 🌟\n\nGenerado por AI Flavor Engine`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const reset = () => {
    setRecipe(null);
    setStep('ingredients');
    setError(null);
  };

  const ingredientSuggestions = [
    { category: 'Proteínas', items: ['Pollo', 'Ternera', 'Salmón', 'Tofu', 'Gambas'] },
    { category: 'Vegetales', items: ['Cebolla', 'Ajo', 'Tomate', 'Brócoli', 'Espinacas'] },
    { category: 'Despensa', items: ['Arroz', 'Pasta', 'Miel', 'Aceite de Oliva', 'Salsa de Soja'] }
  ];

  const addSuggestedIngredient = (item: string) => {
    if (!ingredients.includes(item)) setIngredients([...ingredients, item]);
  };

  return (
    <div className="min-h-screen bg-cream selection:bg-gold/30" translate="no">
      <Header 
        step={step}
        setStep={setStep}
        savedRecipesCount={savedRecipes.length}
        language={profile.language}
        setLanguage={(lang) => setProfile({ ...profile, language: lang })}
        onReset={reset}
        onDownloadAll={downloadAllAsHtml}
        onOpenSaved={() => { setStep('saved'); setSearchTerm(''); }}
        languages={languages}
      />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="relative">
          {step === 'ingredients' && (
            <IngredientsStep 
              ingredients={ingredients}
              currentInput={currentInput}
              setCurrentInput={setCurrentInput}
              addIngredient={addIngredient}
              removeIngredient={removeIngredient}
              addSuggestedIngredient={addSuggestedIngredient}
              ingredientSuggestions={ingredientSuggestions}
              savedRecipes={savedRecipes}
              setStep={setStep}
              setRecipe={setRecipe}
              onDownloadAll={downloadAllAsHtml}
            />
          )}

          {step === 'profile' && (
            <ProfileStep 
              profile={profile}
              setProfile={setProfile}
              setStep={setStep}
              onGenerate={handleGenerate}
              mealTypes={mealTypes}
            />
          )}

          {step === 'recipe' && (
            <RecipeView 
              recipe={recipe}
              loading={loading}
              error={error}
              loadingMessage={loadingMessage}
              generatingImage={generatingImage}
              showSaveFeedback={showSaveFeedback}
              savedRecipes={savedRecipes}
              onGenerateImage={handleGenerateImage}
              onSave={saveRecipe}
              onShare={shareWhatsApp}
              onDownload={downloadAsHtml}
              onReset={reset}
              onRetry={handleGenerate}
              onCancel={() => setLoading(false)}
            />
          )}

          {step === 'saved' && (
            <SavedRecipesView 
              savedRecipes={savedRecipes}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              onDownloadAll={downloadAllAsHtml}
              onViewRecipe={(r) => { setRecipe(r); setStep('recipe'); }}
              onShare={shareWhatsApp}
              onDownload={downloadAsHtml}
              onDeleteRequest={setRecipeToDelete}
              setStep={setStep}
              recipeToDelete={recipeToDelete}
              onConfirmDelete={() => { deleteRecipe(recipeToDelete!); setRecipeToDelete(null); }}
              onCancelDelete={() => setRecipeToDelete(null)}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
