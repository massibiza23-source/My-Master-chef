import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChefHat, 
  Plus, 
  X, 
  Sparkles, 
  Flame, 
  Leaf, 
  Clock, 
  Utensils,
  Soup,
  Globe,
  ArrowRight,
  Info,
  ShoppingCart,
  RotateCcw,
  Bookmark,
  Share2,
  Trash2,
  ExternalLink,
  Download,
  ArrowUpAZ,
  ArrowDownAZ,
  Search
} from 'lucide-react';
import { cn } from './lib/utils';
import { generateRecipeText, generateRecipeImage } from './lib/gemini';
import { Recipe, UserProfile } from './types';

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
        // Use a more robust decoding for UTF-8
        const decoded = JSON.parse(decodeURIComponent(escape(atob(sharedRecipe))));
        setRecipe(decoded);
        setStep('recipe');
        // Clear the URL parameter without refreshing
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

  // Load saved recipes from localStorage (Already handled in useState initializer)
  // Save recipes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('flavor_engine_recipes', JSON.stringify(savedRecipes));
    } catch (e: any) {
      console.error("Error saving to localStorage", e);
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        // If storage is full, try to save without images for older recipes or warn the user
        console.warn("LocalStorage quota exceeded. Try deleting some recipes.");
      }
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
      setError("Por favor, añade al menos un ingrediente para que el Chef pueda trabajar.");
      return;
    }
    setLoading(true);
    setError(null);
    setRecipe(null); // Clear previous recipe
    setStep('recipe');

    // Timeout of 120 seconds for the text generation
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("TIMEOUT")), 120000)
    );

    try {
      const result = await Promise.race([
        generateRecipeText(ingredients, profile, (Array.isArray(savedRecipes) ? savedRecipes : []).filter(r => r && r.name).slice(0, 10).map(r => r.name)),
        timeoutPromise
      ]) as Recipe;

      if (!result || !result.name) {
        throw new Error("EMPTY_RESPONSE");
      }

      setRecipe(result);
      setLoading(false); // Show text immediately
    } catch (err: any) {
      console.error("Error generating recipe:", err);
      
      const message = err?.message || "";
      const errStr = String(err).toLowerCase();
      
      const is403 = message.includes('403') || errStr.includes('403');
      const is429 = message.includes('429') || errStr.includes('429');
      const isTimeout = message === "TIMEOUT";
      const isEmpty = message === "EMPTY_RESPONSE";
      const isNoKey = message.includes("API Key not found") || errStr.includes("api key not found");

      if (isNoKey) {
        setError("No se encontró la clave API de Gemini. Si estás en Vercel, asegúrate de haber configurado la variable de entorno GEMINI_API_KEY en el panel de control del proyecto.");
      } else if (is403) {
        setError("Error de permisos (403). Por favor, verifica que tu clave API tenga acceso al modelo.");
      } else if (is429) {
        setError("Límite de cuota alcanzado (429). Si has esperado y el error persiste, es posible que hayas agotado tu cuota diaria gratuita de la API de Gemini.");
      } else if (isTimeout) {
        setError("La IA está tardando demasiado en responder. Por favor, inténtalo de nuevo.");
      } else if (isEmpty) {
        setError("El Chef IA devolvió una respuesta vacía. Por favor, inténtalo de nuevo con otros ingredientes.");
      } else {
        setError("No pudimos contactar con el Chef. Por favor, inténtalo de nuevo.");
      }
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!recipe || !Array.isArray(recipe.ingredients) || generatingImage) return;
    const currentRecipeName = recipe.name;
    setGeneratingImage(true);
    try {
      const imageUrl = await generateRecipeImage(recipe.name, recipe.ingredients.map(i => i.item));
      if (imageUrl) {
        setRecipe(prev => {
          if (prev && prev.name === currentRecipeName) {
            return { ...prev, imageUrl };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Manual image generation failed:", err);
    } finally {
      setGeneratingImage(false);
    }
  };

  const saveRecipe = () => {
    if (recipe && recipe.name) {
      const currentSaved = Array.isArray(savedRecipes) ? savedRecipes : [];
      if (!currentSaved.some(r => r && r.name === recipe.name)) {
        setSavedRecipes([recipe, ...currentSaved]);
        setShowSaveFeedback('saved');
        setTimeout(() => setShowSaveFeedback(null), 3000);
      } else {
        setShowSaveFeedback('already');
        setTimeout(() => setShowSaveFeedback(null), 3000);
      }
    }
  };

  const downloadAllAsHtml = () => {
    if (savedRecipes.length === 0) return;
    
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi Recetario Completo - AI Flavor Engine</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
    <style>
        :root { --gold: #C08C5D; --charcoal: #1A1A1A; --cream: #FDFCFB; }
        body { font-family: 'Inter', sans-serif; background: var(--cream); padding: 40px 20px; }
        .recipe-card { background: white; border-radius: 30px; padding: 40px; margin-bottom: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid rgba(192, 140, 93, 0.1); page-break-inside: avoid; }
        h1 { font-family: 'Playfair Display', serif; color: var(--gold); text-align: center; margin-bottom: 60px; }
        h2 { font-family: 'Playfair Display', serif; font-size: 32px; margin-top: 0; }
        .history { font-style: italic; color: #666; margin-bottom: 20px; }
        .section-title { text-transform: uppercase; letter-spacing: 0.2em; font-size: 12px; color: var(--gold); font-weight: bold; margin: 30px 0 15px; }
        ul, ol { padding-left: 20px; }
        li { margin-bottom: 8px; }
        .footer { text-align: center; font-size: 12px; color: #999; margin-top: 60px; }
    </style>
</head>
<body>
    <h1>Mi Recetario Personal</h1>
    ${savedRecipes.map(r => {
      if (!r || !r.name) return '';
      return `
    <div class="recipe-card">
        <h2>${r.name}</h2>
        <p class="history">${r.history || ''}</p>
        
        <div class="section-title">Ingredientes</div>
        <ul>
            ${(r.ingredients || []).map(i => `<li>${i.item || ''}${i.alternative ? ` (Opcional: ${i.alternative})` : ''}</li>`).join('')}
        </ul>
        
        <div class="section-title">Pasos</div>
        <ol>
            ${(r.steps || []).map(s => `<li>${s}</li>`).join('')}
        </ol>
        
        ${r.tricks && r.tricks.length > 0 ? `
        <div class="section-title">Trucos</div>
        <ul>
            ${r.tricks.map(t => `<li>${t}</li>`).join('')}
        </ul>
        ` : ''}
        
        <div class="section-title">Consejo del Chef</div>
        <p>${r.chefTip || ''}</p>
    </div>
    `;
    }).join('')}
    <div class="footer">Generado por AI Flavor Engine &copy; 2026</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mi-recetario-completo.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteRecipe = (name: string) => {
    setSavedRecipes(savedRecipes.filter(r => r && r.name && r.name !== name));
  };

  const generateRecipeHtml = (r: Recipe) => {
    if (!r) return '';
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${r.name || 'Receta'} - AI Flavor Engine</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
    <style>
        :root {
            --gold: #C08C5D;
            --charcoal: #1A1A1A;
            --cream: #FDFCFB;
            --terracotta: #8E443D;
        }
        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--cream);
            color: var(--charcoal);
            margin: 0;
            padding: 40px 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 40px;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0,0,0,0.05);
            border: 1px solid rgba(192, 140, 93, 0.1);
        }
        .hero-image {
            width: 100%;
            height: 400px;
            object-fit: cover;
            display: block;
        }
        .hero-text {
            padding: 60px 40px 20px;
            text-align: center;
            background: white;
        }
        .hero-text.no-image {
            background: var(--charcoal);
            color: white;
            padding: 80px 40px;
        }
        .tag {
            text-transform: uppercase;
            letter-spacing: 0.3em;
            font-size: 10px;
            color: var(--gold);
            font-weight: bold;
            margin-bottom: 20px;
            display: block;
        }
        h1 {
            font-family: 'Playfair Display', serif;
            font-size: 48px;
            margin: 0 0 20px 0;
        }
        .history {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            opacity: 0.8;
            max-width: 600px;
            margin: 0 auto;
        }
        .content {
            padding: 0 60px 60px;
        }
        .menu-box {
            background: rgba(192, 140, 93, 0.05);
            border: 1px solid rgba(192, 140, 93, 0.1);
            border-radius: 30px;
            padding: 40px;
            margin-bottom: 60px;
            text-align: center;
        }
        .menu-title {
            text-transform: uppercase;
            letter-spacing: 0.3em;
            font-size: 12px;
            color: var(--gold);
            margin-bottom: 30px;
            display: block;
        }
        .courses-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
        }
        .course-item span {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: rgba(192, 140, 93, 0.6);
            font-weight: bold;
        }
        .course-item h3 {
            font-family: 'Playfair Display', serif;
            font-size: 20px;
            margin: 10px 0;
        }
        .course-item p {
            font-size: 13px;
            opacity: 0.6;
            margin: 0;
        }
        .main-grid {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 60px;
        }
        @media (max-width: 768px) {
            .main-grid { grid-template-columns: 1fr; }
            .content { padding: 30px; }
            h1 { font-size: 32px; }
        }
        h2 {
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            border-bottom: 1px solid rgba(192, 140, 93, 0.2);
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        ul {
            list-style: none;
            padding: 0;
        }
        li {
            margin-bottom: 15px;
            font-size: 14px;
        }
        .step {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
        }
        .step-num {
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            color: var(--gold);
            opacity: 0.3;
        }
        .tip-box {
            background: rgba(192, 140, 93, 0.05);
            border-left: 4px solid var(--gold);
            padding: 30px;
            border-radius: 0 20px 20px 0;
            margin-top: 40px;
            font-style: italic;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            padding: 40px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.4em;
            opacity: 0.3;
        }
    </style>
</head>
<body>
    <div class="container">
        ${r.imageUrl ? `<img src="${r.imageUrl}" alt="${r.name || ''}" class="hero-image">` : ''}
        <div class="hero-text ${!r.imageUrl ? 'no-image' : ''}">
            <span class="tag">Creación Exclusiva</span>
            <h1>${r.name || 'Receta'}</h1>
            <div style="display:flex; justify-content:center; gap:20px; margin-bottom:20px; font-size:12px; font-weight:bold; color:var(--gold); text-transform:uppercase; letter-spacing:0.1em;">
                <span>⏱️ ${r.prepTime || 'N/A'}</span>
                <span>🔥 ${r.nutrition?.calories || 'N/A'}</span>
            </div>
            <p class="history">"${r.history || ''}"</p>
        </div>
        <div class="content">
            ${r.courses && r.courses.length > 0 ? `
            <div class="menu-box">
                <span class="menu-title">Menú Degustación</span>
                <div class="courses-grid">
                    ${r.courses.map(c => `
                    <div class="course-item">
                        <span>${c.title || ''}</span>
                        <h3>${c.name || ''}</h3>
                        <p>${c.description || ''}</p>
                    </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <div class="main-grid">
                <div>
                    <h2>Ingredientes</h2>
                    <ul>
                        ${(r.ingredients || []).map(i => `<li><strong>${i.item || ''}</strong>${i.alternative ? `<br><small style="color:var(--gold)">Alt: ${i.alternative}</small>` : ''}</li>`).join('')}
                    </ul>
                </div>
                <div>
                    <h2>Preparación</h2>
                    ${(r.steps || []).map((s, i) => `
                    <div class="step">
                        <div class="step-num">${(i + 1).toString().padStart(2, '0')}</div>
                        <div class="step-text">${s}</div>
                    </div>
                    `).join('')}
                    <div class="tip-box">
                        <strong style="color:var(--gold); display:block; margin-bottom:10px; font-style:normal;">Consejo del Chef</strong>
                        ${r.chefTip || ''}
                        
                        ${r.tricks && r.tricks.length > 0 ? `
                        <hr style="border:0; border-top:1px solid rgba(192, 140, 93, 0.1); margin:20px 0;">
                        <strong style="color:var(--gold); display:block; margin-bottom:10px; font-style:normal;">Trucos Maestros</strong>
                        <ul style="padding-left:15px; margin:0;">
                            ${r.tricks.map(t => `<li>${t}</li>`).join('')}
                        </ul>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
        <div class="footer">AI Flavor Engine &copy; 2026</div>
    </div>
</body>
</html>
    `;
  };

  const shareWhatsApp = async (r: Recipe) => {
    if (!r) return;
    // Try native sharing of the HTML file first (Mobile)
    const html = generateRecipeHtml(r);
    const fileName = `${(r.name || 'receta').toLowerCase().replace(/\s+/g, '-')}.html`;
    const file = new File([html], fileName, { type: 'text/html' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Menú: ${r.name || 'Receta'}`,
          text: 'Mira este menú gourmet que he creado.',
        });
        return;
      } catch (err) {
        console.error("Error sharing file:", err);
      }
    }

    // Fallback to Direct Link + Text (Desktop or unsupported browsers)
    let shareUrl = '';
    try {
      // Create a copy without the image to avoid exceeding URL length limits
      const { imageUrl, ...recipeWithoutImage } = r;
      shareUrl = `${window.location.origin}${window.location.pathname}?recipe=${btoa(unescape(encodeURIComponent(JSON.stringify(recipeWithoutImage))))}`;
    } catch (e) {
      console.error("Error generating share URL", e);
    }
    
    let text = `🌟 *${(r.name || 'Receta').toUpperCase()}* 🌟\n`;
    text += `_"${r.history || ''}"_\n\n`;
    text += `⏱️ *Tiempo:* ${r.prepTime || 'N/A'}\n`;
    text += `🔥 *Calorías:* ${r.nutrition?.calories || 'N/A'}\n\n`;
    
    if (r.courses && r.courses.length > 0) {
      text += `🍽️ *MENÚ DEGUSTACIÓN*\n`;
      text += `━━━━━━━━━━━━━━━━━━\n`;
      r.courses.forEach(c => {
        text += `*${(c.title || '').toUpperCase()}*\n`;
        text += `✨ ${c.name || ''}\n`;
        text += `_${c.description || ''}_\n\n`;
      });
      text += `━━━━━━━━━━━━━━━━━━\n\n`;
    }

    if (r.tricks && r.tricks.length > 0) {
      text += `💡 *TRUCOS MAESTROS:*\n`;
      r.tricks.forEach(t => text += `• ${t}\n`);
      text += `\n`;
    }

    if (shareUrl) {
      text += `👨‍🍳 *PREPARACIÓN Y DETALLES:*\n`;
      text += `${shareUrl}\n\n`;
    }
    
    text += `_Generado por AI Flavor Engine_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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

  const reset = () => {
    setRecipe(null);
    setStep('ingredients');
  };

  const ingredientSuggestions = [
    { 
      category: 'Proteínas', 
      items: ['Pollo', 'Ternera', 'Salmón', 'Atún', 'Huevo', 'Tofu', 'Cerdo', 'Cordero', 'Gambas'] 
    },
    { 
      category: 'Vegetales', 
      items: ['Cebolla', 'Ajo', 'Tomate', 'Zanahoria', 'Pimiento', 'Brócoli', 'Espinacas', 'Patata', 'Calabacín'] 
    },
    { 
      category: 'Legumbres', 
      items: ['Garbanzos', 'Guisantes', 'Lentejas', 'Alubias', 'Habas'] 
    },
    { 
      category: 'Frutas', 
      items: ['Limón', 'Manzana', 'Aguacate', 'Naranja', 'Fresa', 'Plátano', 'Mango', 'Piña'] 
    },
    { 
      category: 'Despensa', 
      items: ['Arroz', 'Pasta', 'Harina', 'Miel', 'Aceite de Oliva', 'Vinagre', 'Salsa de Soja', 'Leche de Coco'] 
    },
    { 
      category: 'Caldos y Bases', 
      items: ['Caldo de Pollo', 'Caldo de Verduras', 'Miso', 'Dashi', 'Vino Blanco', 'Crema de Leche', 'Tomate Triturado'] 
    }
  ];

  const addSuggestedIngredient = (item: string) => {
    if (!ingredients.includes(item)) {
      setIngredients([...ingredients, item]);
    }
  };

  return (
    <div className="min-h-screen bg-cream selection:bg-gold/30">
      {/* Header */}
      <header className="py-8 px-6 border-b border-gold/10 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={reset}>
          <div className="w-10 h-10 bg-charcoal rounded-full flex items-center justify-center text-gold">
            <ChefHat size={24} />
          </div>
          <h1 className="text-2xl font-serif tracking-tight text-charcoal">
            AI Flavor <span className="text-gold">Engine</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={profile.language}
            onChange={(e) => setProfile({ ...profile, language: e.target.value as any })}
            className="bg-transparent text-xs font-medium uppercase tracking-widest text-charcoal/60 outline-none cursor-pointer hover:text-gold transition-colors"
          >
            {languages.map(lang => (
              <option key={lang.id} value={lang.id}>{lang.flag} {lang.label}</option>
            ))}
          </select>
          <nav className="flex gap-4 md:gap-8 text-xs font-medium uppercase tracking-widest text-charcoal/60">
            {savedRecipes.length > 0 && (
              <button 
                onClick={downloadAllAsHtml}
                className="hidden md:flex items-center gap-2 hover:text-gold transition-colors"
                title="Descargar todo mi recetario"
              >
                <Download size={14} /> Descargar
              </button>
            )}
            <button 
              onClick={() => setStep('ingredients')} 
              className={cn("hover:text-gold transition-colors", step !== 'saved' && "text-gold")}
            >
              Crear
            </button>
            <button 
              onClick={() => { setStep('saved'); setSearchTerm(''); }} 
              className={cn("hover:text-gold transition-colors flex items-center gap-2", step === 'saved' && "text-gold")}
            >
              <Bookmark size={14} />
              <span className="hidden sm:inline">Mi Recetario</span>
              {savedRecipes.length > 0 && (
                <span className="bg-gold text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {savedRecipes.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 'ingredients' && (
            <motion.div
              key="step-ingredients"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Quick Access Recetario */}
              {savedRecipes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium uppercase tracking-widest text-gold flex items-center gap-2">
                      <Bookmark size={14} />
                      Tus Creaciones Guardadas
                    </h3>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={downloadAllAsHtml}
                        className="text-[10px] uppercase tracking-widest font-bold text-charcoal/40 hover:text-gold transition-colors flex items-center gap-1"
                        title="Descargar todo mi recetario"
                      >
                        <Download size={12} /> Descargar Todo
                      </button>
                      <button 
                        onClick={() => { setStep('saved'); setSearchTerm(''); }}
                        className="text-xs text-charcoal/40 hover:text-gold transition-colors flex items-center gap-1"
                      >
                        Ver todo <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    {(Array.isArray(savedRecipes) ? [...savedRecipes] : [])
                      .filter(r => r && typeof r.name === 'string')
                      .sort((a, b) => {
                        if (!a || !b || typeof a.name !== 'string' || typeof b.name !== 'string') return 0;
                        return sortOrder === 'asc' 
                          ? a.name.localeCompare(b.name) 
                          : b.name.localeCompare(a.name);
                      })
                      .slice(0, 5)
                      .map((r, idx) => (
                        <motion.div
                          key={`${r.name}-${idx}`}
                          whileHover={{ y: -4 }}
                          onClick={() => { setRecipe(r); setStep('recipe'); }}
                          className="flex-shrink-0 w-48 bg-white rounded-2xl overflow-hidden shadow-sm border border-gold/5 cursor-pointer group"
                        >
                          <div className="h-24 relative">
                            {r.imageUrl ? (
                              <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full bg-charcoal/5 flex items-center justify-center text-gold/20">
                                <ChefHat size={24} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
                            <p className="absolute bottom-2 left-3 right-3 text-xs font-serif text-white truncate">{r.name}</p>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              )}

              <div className="text-center space-y-4">
                <h2 className="text-4xl md:text-5xl font-serif text-charcoal leading-tight">
                  ¿Qué tienes en tu <br /> <span className="italic text-gold">despensa</span> hoy?
                </h2>
                <p className="text-charcoal/60 max-w-md mx-auto">
                  Introduce los ingredientes que tienes a mano y deja que nuestra IA cree una obra maestra culinaria.
                </p>
              </div>

              <div className="relative max-w-xl mx-auto">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
                  placeholder="Ej: Salmón, Miso, Espárragos..."
                  className="w-full bg-white border-b-2 border-gold/20 focus:border-gold outline-none py-4 px-2 text-xl font-serif transition-colors placeholder:text-charcoal/20"
                />
                <button
                  onClick={addIngredient}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gold text-white rounded-full flex items-center justify-center hover:bg-terracotta transition-colors shadow-lg shadow-gold/20"
                >
                  <Plus size={24} />
                </button>
              </div>

              {/* Ingredient Suggestions */}
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold/60 mb-2">
                  <Sparkles size={14} />
                  Sugerencias del Chef
                </div>
                <div className="space-y-4">
                  {ingredientSuggestions.map((cat) => (
                    <div key={cat.category} className="space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-charcoal/30 font-bold">{cat.category}</p>
                      <div className="flex flex-wrap gap-2">
                        {cat.items.map((item) => (
                          <button
                            key={item}
                            onClick={() => addSuggestedIngredient(item)}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs transition-all border",
                              ingredients.includes(item)
                                ? "bg-gold text-white border-gold shadow-md"
                                : "bg-white text-charcoal/60 border-gold/10 hover:border-gold/30"
                            )}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center min-h-[60px]">
                {ingredients.map((ing) => (
                  <motion.span
                    key={ing}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="px-4 py-2 bg-white border border-gold/10 rounded-full text-sm flex items-center gap-2 shadow-sm"
                  >
                    {ing}
                    <button onClick={() => removeIngredient(ing)} className="text-terracotta hover:text-red-600">
                      <X size={14} />
                    </button>
                  </motion.span>
                ))}
              </div>

              <div className="flex flex-col items-center gap-4 pt-8">
                <button
                  disabled={ingredients.length === 0}
                  onClick={() => setStep('profile')}
                  className={cn(
                    "group flex items-center gap-3 px-8 py-4 rounded-full text-lg font-medium tracking-wide transition-all",
                    ingredients.length > 0 
                      ? "bg-charcoal text-white hover:bg-charcoal/90 shadow-xl" 
                      : "bg-charcoal/10 text-charcoal/30 cursor-not-allowed"
                  )}
                >
                  Configurar Paladar
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                
                {savedRecipes.length > 0 && (
                  <div className="w-full max-w-md mt-8 p-6 bg-white/40 backdrop-blur-md rounded-3xl border border-gold/20 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center text-gold">
                        <Bookmark size={20} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-serif text-charcoal">Tu Recetario Personal</h4>
                        <p className="text-[10px] text-charcoal/40 uppercase tracking-widest">{savedRecipes.length} creaciones guardadas</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setStep('saved')}
                      className="w-full bg-white text-gold border border-gold/30 hover:bg-gold hover:text-white transition-all py-3 rounded-full text-xs font-medium uppercase tracking-widest"
                    >
                      Abrir Mi Recetario
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 'profile' && (
            <motion.div
              key="step-profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-serif text-charcoal">Personaliza tu <span className="text-gold">Experiencia</span></h2>
                <p className="text-charcoal/60">Ajusta los detalles para que la receta sea perfecta para ti.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-12">
                {/* Goal Selection */}
                <div className="space-y-10">
                  <div className="space-y-6">
                    <h3 className="text-xl font-serif flex items-center gap-2">
                      <Sparkles size={20} className="text-gold" />
                      Objetivo Culinario
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'healthy', label: 'Saludable', icon: Leaf },
                        { id: 'indulgent', label: 'Indulgente', icon: Flame },
                        { id: 'fast', label: 'Rápido', icon: Clock },
                        { id: 'gourmet', label: 'Gourmet', icon: Utensils },
                      ].map((goal) => (
                        <button
                          key={goal.id}
                          onClick={() => setProfile({ ...profile, goal: goal.id as any })}
                          className={cn(
                            "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                            profile.goal === goal.id 
                              ? "border-gold bg-gold/5 text-gold" 
                              : "border-gold/10 bg-white text-charcoal/40 hover:border-gold/30"
                          )}
                        >
                          <goal.icon size={24} />
                          <span className="text-sm font-medium uppercase tracking-widest">{goal.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-serif flex items-center gap-2">
                      <Utensils size={20} className="text-gold" />
                      Tipo de Comida
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {mealTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setProfile({ ...profile, mealType: type.id as any })}
                          className={cn(
                            "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                            profile.mealType === type.id 
                              ? "border-gold bg-gold/5 text-gold" 
                              : "border-gold/10 bg-white text-charcoal/40 hover:border-gold/30"
                          )}
                        >
                          <type.icon size={20} />
                          <span className="text-[10px] font-medium uppercase tracking-widest">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Fusion & Preferences */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-serif flex items-center gap-2">
                      <Globe size={20} className="text-gold" />
                      Fusión o Región
                    </h3>
                    <input
                      type="text"
                      value={profile.fusion}
                      onChange={(e) => setProfile({ ...profile, fusion: e.target.value })}
                      placeholder="Ej: Mediterránea, Gallega, México + Japón..."
                      className="w-full bg-white border border-gold/20 rounded-xl py-3 px-4 outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-serif flex items-center gap-2">
                      <Sparkles size={20} className="text-gold" />
                      Ingredientes Favoritos
                    </h3>
                    <input
                      type="text"
                      placeholder="Ej: Trufa, Albahaca, Queso..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if (val) {
                            setProfile({ ...profile, likes: [...profile.likes, val] });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                      className="w-full bg-white border border-gold/20 rounded-xl py-3 px-4 outline-none focus:border-gold transition-colors"
                    />
                    <div className="flex flex-wrap gap-2">
                      {profile.likes.map(item => (
                        <span key={item} className="text-xs bg-gold/10 text-gold px-3 py-1 rounded-full flex items-center gap-1">
                          {item}
                          <X size={10} className="cursor-pointer" onClick={() => setProfile({...profile, likes: profile.likes.filter(i => i !== item)})} />
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-serif flex items-center gap-2">
                      <Info size={20} className="text-gold" />
                      Restricciones
                    </h3>
                    <input
                      type="text"
                      placeholder="Alergias o ingredientes a evitar..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if (val) {
                            setProfile({ ...profile, intolerances: [...profile.intolerances, val] });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                      className="w-full bg-white border border-gold/20 rounded-xl py-3 px-4 outline-none focus:border-gold transition-colors"
                    />
                    <div className="flex flex-wrap gap-2">
                      {profile.intolerances.map(item => (
                        <span key={item} className="text-xs bg-terracotta/10 text-terracotta px-3 py-1 rounded-full flex items-center gap-1">
                          {item}
                          <X size={10} className="cursor-pointer" onClick={() => setProfile({...profile, intolerances: profile.intolerances.filter(i => i !== item)})} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-8">
                <button onClick={() => setStep('ingredients')} className="text-charcoal/40 hover:text-charcoal transition-colors font-medium">
                  Volver
                </button>
                <button
                  onClick={handleGenerate}
                  className="bg-gold text-white px-10 py-4 rounded-full text-lg font-medium shadow-xl shadow-gold/20 hover:bg-terracotta transition-all"
                >
                  Generar Receta Única
                </button>
              </div>
            </motion.div>
          )}

          {step === 'recipe' && (
            <motion.div
              key="step-recipe"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-12"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-8">
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="w-24 h-24 border-t-2 border-gold rounded-full"
                    />
                    <ChefHat className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold" size={32} />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-serif italic text-charcoal">{loadingMessage}</h3>
                    <p className="text-charcoal/40 animate-pulse uppercase tracking-widest text-[10px]">Creando tu experiencia gourmet</p>
                  </div>
                  <button 
                    onClick={() => setLoading(false)}
                    className="text-xs text-charcoal/30 hover:text-gold transition-colors uppercase tracking-widest font-medium"
                  >
                    Cancelar Generación
                  </button>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                  <div className="w-16 h-16 bg-terracotta/10 rounded-full flex items-center justify-center text-terracotta">
                    <RotateCcw size={32} />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-serif text-charcoal">¡Ups! Algo salió mal</h3>
                    <p className="text-charcoal/60">{error}</p>
                  </div>
                  <button
                    onClick={handleGenerate}
                    className="bg-gold text-white px-8 py-3 rounded-full font-medium shadow-lg hover:bg-terracotta transition-all"
                  >
                    Reintentar Generación
                  </button>
                  <button onClick={reset} className="text-charcoal/40 text-sm hover:text-charcoal transition-colors">
                    Volver al inicio
                  </button>
                </div>
              ) : recipe ? (
                <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gold/5">
                  {/* Recipe Image */}
                  {recipe.imageUrl ? (
                    <div className="w-full h-[400px] md:h-[500px] relative overflow-hidden">
                      <img 
                        src={recipe.imageUrl} 
                        alt={recipe.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={() => {
                          console.error("Image failed to load");
                          // If it fails, we can either show a placeholder or clear the URL
                          setRecipe(prev => prev ? { ...prev, imageUrl: undefined } : null);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-charcoal py-12 flex flex-col items-center justify-center space-y-6">
                      <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center text-gold">
                        <ChefHat size={40} />
                      </div>
                      <button
                        onClick={handleGenerateImage}
                        disabled={generatingImage}
                        className="bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {generatingImage ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                            Generando Imagen...
                          </>
                        ) : (
                          <>
                            <Globe size={16} />
                            Generar Imagen del Plato
                          </>
                        )}
                      </button>
                      <p className="text-white/30 text-[10px] uppercase tracking-widest">Evita sobrecarga de tokens generando la imagen por separado</p>
                    </div>
                  )}

                  {/* Recipe Title & Intro */}
                  <div className={cn(
                    "p-8 md:p-12 text-center space-y-6",
                    !recipe.imageUrl && "bg-charcoal text-white pt-4 pb-12"
                  )}>
                    <div>
                      <span className="text-gold text-xs uppercase tracking-[0.3em] font-medium mb-4 block">Creación Exclusiva</span>
                      <h2 className={cn(
                        "text-4xl md:text-6xl font-serif mb-6",
                        recipe.imageUrl ? "text-charcoal" : "text-white"
                      )}>{recipe.name}</h2>
                      <div className="flex justify-center items-center gap-6 mb-6">
                        <div className={cn(
                          "flex items-center gap-2 text-xs font-bold uppercase tracking-widest",
                          recipe.imageUrl ? "text-gold" : "text-gold/80"
                        )}>
                          <Clock size={14} />
                          {recipe.prepTime}
                        </div>
                        <div className={cn(
                          "flex items-center gap-2 text-xs font-bold uppercase tracking-widest",
                          recipe.imageUrl ? "text-gold" : "text-gold/80"
                        )}>
                          <Flame size={14} />
                          {recipe.nutrition.calories}
                        </div>
                      </div>
                      <p className={cn(
                        "italic max-w-2xl mx-auto leading-relaxed",
                        recipe.imageUrl ? "text-charcoal/60" : "text-white/60"
                      )}>
                        "{recipe.history}"
                      </p>
                    </div>
                  </div>

                  <div className="px-8 md:px-12 pb-12 space-y-12">
                    {/* Multi-course Menu */}
                    {recipe.courses && recipe.courses.length > 0 && (
                      <div className="bg-gold/5 rounded-3xl p-8 border border-gold/10">
                        <h3 className="text-xs uppercase tracking-[0.3em] font-medium text-gold mb-8 text-center">Menú Degustación</h3>
                        <div className="grid md:grid-cols-3 gap-8">
                          {recipe.courses.map((course, idx) => (
                            <div key={idx} className="space-y-3 text-center md:text-left">
                              <span className="text-[10px] uppercase tracking-widest text-gold/60 font-bold">{course.title}</span>
                              <h4 className="text-xl font-serif text-charcoal">{course.name}</h4>
                              <p className="text-sm text-charcoal/60 leading-relaxed">{course.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-12">
                    {/* Sidebar: Ingredients */}
                    <div className="space-y-10">
                      <div className="space-y-6">
                        <h3 className="text-xl font-serif border-b border-gold/20 pb-2">Ingredientes</h3>
                        <ul className="space-y-4">
                          {recipe.ingredients.map((ing, idx) => (
                            <li key={idx} className="text-sm">
                              <p className="font-medium text-charcoal">{ing.item}</p>
                              {ing.alternative && (
                                <p className="text-xs text-gold mt-1 italic">Alt: {ing.alternative}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Main Content: Preparation */}
                    <div className="md:col-span-2 space-y-10">
                      <div className="space-y-8">
                        <h3 className="text-2xl font-serif flex items-center gap-3">
                          <Flame size={24} className="text-terracotta" />
                          Preparación
                        </h3>
                        <div className="space-y-8">
                          {recipe.steps.map((step, idx) => (
                            <div key={idx} className="flex gap-6">
                              <span className="text-gold font-serif text-2xl opacity-30 shrink-0">{(idx + 1).toString().padStart(2, '0')}</span>
                              <p className="text-charcoal/80 leading-relaxed pt-1">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gold/5 border-l-4 border-gold p-8 rounded-r-2xl space-y-6">
                        <div className="space-y-3">
                          <h4 className="font-serif text-lg flex items-center gap-2 text-gold">
                            <Sparkles size={18} />
                            Consejo del Chef
                          </h4>
                          <p className="text-charcoal/70 italic text-sm leading-relaxed">
                            {recipe.chefTip}
                          </p>
                        </div>
                        
                        {recipe.tricks && recipe.tricks.length > 0 && (
                          <div className="space-y-3 pt-4 border-t border-gold/10">
                            <h4 className="font-serif text-lg flex items-center gap-2 text-gold">
                              <Flame size={18} />
                              Trucos Maestros
                            </h4>
                            <ul className="space-y-2">
                              {recipe.tricks.map((trick, idx) => (
                                <li key={idx} className="text-sm text-charcoal/70 flex gap-2">
                                  <span className="text-gold">•</span>
                                  {trick}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 pt-8">
                        <button 
                          onClick={saveRecipe}
                          className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all",
                            (Array.isArray(savedRecipes) ? savedRecipes : []).some(r => r && r.name === recipe.name)
                              ? "bg-gold text-white"
                              : "bg-charcoal text-white hover:bg-charcoal/90"
                          )}
                        >
                          {showSaveFeedback === 'saved' ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-2"
                            >
                              <Sparkles size={18} />
                              ¡Guardada!
                            </motion.div>
                          ) : showSaveFeedback === 'already' ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-2"
                            >
                              <Bookmark size={18} />
                              Ya en el recetario
                            </motion.div>
                          ) : (
                            <>
                              <Bookmark size={18} />
                              {savedRecipes.some(r => r && r.name === recipe.name) ? "Guardada" : "Guardar Receta"}
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => shareWhatsApp(recipe)}
                          className="flex items-center gap-2 border border-gold/30 text-gold px-6 py-3 rounded-full text-sm font-medium hover:bg-gold/5 transition-all"
                        >
                          <Share2 size={18} />
                          WhatsApp
                        </button>
                        <button 
                          onClick={() => downloadAsHtml(recipe)}
                          className="flex items-center gap-2 border border-gold/30 text-gold px-6 py-3 rounded-full text-sm font-medium hover:bg-gold/5 transition-all"
                        >
                          <Download size={18} />
                          Descargar Menú
                        </button>
                        <button onClick={reset} className="flex items-center gap-2 text-charcoal/40 px-6 py-3 rounded-full text-sm font-medium hover:text-charcoal transition-all">
                          <RotateCcw size={18} />
                          Nueva
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center text-gold">
                  <ChefHat size={32} />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-serif text-charcoal">No hay receta para mostrar</h3>
                  <p className="text-charcoal/60">Parece que el Chef se ha tomado un descanso.</p>
                </div>
                <button onClick={reset} className="bg-gold text-white px-8 py-3 rounded-full font-medium shadow-lg hover:bg-terracotta transition-all">
                  Volver al inicio
                </button>
              </div>
            )}
          </motion.div>
        )}
          {step === 'saved' && (
            <motion.div
              key="step-saved"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex flex-col items-center space-y-8">
                <button 
                  onClick={() => setStep('ingredients')}
                  className="text-charcoal/40 hover:text-gold transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                >
                  <RotateCcw size={14} />
                  Volver al Generador
                </button>

                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-serif text-charcoal">Mi <span className="text-gold">Recetario</span></h2>
                  <p className="text-charcoal/60">Tu colección personal de creaciones culinarias.</p>
                  
                  {(Array.isArray(savedRecipes) ? savedRecipes : []).length > 0 && (
                  <div className="max-w-md mx-auto space-y-4 pt-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/40" size={18} />
                      <input 
                        type="text"
                        placeholder="Buscar por nombre o ingrediente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-12 py-3 rounded-full border border-gold/20 focus:border-gold focus:ring-2 focus:ring-gold/10 outline-none transition-all text-sm"
                      />
                      {searchTerm && (
                        <button 
                          onClick={() => setSearchTerm('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/40 hover:text-gold transition-colors"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                    <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => setSortOrder('asc')}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all border border-gold/20",
                          sortOrder === 'asc' ? "bg-gold text-white" : "bg-white text-gold hover:bg-gold/5"
                        )}
                      >
                        <ArrowUpAZ size={16} /> A-Z
                      </button>
                      <button 
                        onClick={() => setSortOrder('desc')}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all border border-gold/20",
                          sortOrder === 'desc' ? "bg-gold text-white" : "bg-white text-gold hover:bg-gold/5"
                        )}
                      >
                        <ArrowDownAZ size={16} /> Z-A
                      </button>
                      <button 
                        onClick={downloadAllAsHtml}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all border border-gold/20 bg-charcoal text-white hover:bg-charcoal/90"
                      >
                        <Download size={16} /> Descargar Todo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(!Array.isArray(savedRecipes) || savedRecipes.length === 0) ? (
                <div className="text-center py-20 border-2 border-dashed border-gold/20 rounded-[2rem] space-y-6">
                  <Bookmark size={48} className="mx-auto text-gold/20" />
                  <p className="text-charcoal/40 font-serif italic text-xl">Aún no has guardado ninguna receta.</p>
                  <button 
                    onClick={() => setStep('ingredients')}
                    className="bg-charcoal text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-charcoal/90 transition-all"
                  >
                    Empezar a Crear
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  {(() => {
                    const currentSaved = Array.isArray(savedRecipes) ? savedRecipes : [];
                    const filtered = currentSaved
                      .filter(r => {
                        if (!r || typeof r.name !== 'string' || !Array.isArray(r.ingredients)) return false;
                        const search = searchTerm.toLowerCase();
                        return r.name.toLowerCase().includes(search) || 
                               r.ingredients.some(i => i && typeof i.item === 'string' && i.item.toLowerCase().includes(search));
                      })
                      .sort((a, b) => {
                        if (!a || !b || typeof a.name !== 'string' || typeof b.name !== 'string') return 0;
                        return sortOrder === 'asc' 
                          ? a.name.localeCompare(b.name) 
                          : b.name.localeCompare(a.name);
                      });
                    
                    if (filtered.length === 0 && searchTerm) {
                      return (
                        <div className="col-span-full text-center py-12">
                          <Search size={32} className="mx-auto text-gold/20 mb-4" />
                          <p className="text-charcoal/40 font-serif italic">No se encontraron recetas que coincidan con "{searchTerm}"</p>
                        </div>
                      );
                    }

                    return filtered.map((r, idx) => (
                      <motion.div
                        key={`${r.name}-${idx}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gold/5 group"
                      >
                        <div className="h-48 relative overflow-hidden">
                          {r.imageUrl ? (
                            <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-charcoal flex items-center justify-center text-gold/20">
                              <ChefHat size={48} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />
                          <h3 className="absolute bottom-4 left-6 right-6 text-xl font-serif text-white">{r.name}</h3>
                        </div>
                        <div className="p-6 flex justify-between items-center">
                          <div className="flex gap-4">
                            <button 
                              onClick={() => { setRecipe(r); setStep('recipe'); }}
                              className="text-xs uppercase tracking-widest font-bold text-gold hover:text-terracotta transition-colors flex items-center gap-1"
                            >
                              Ver Detalle <ExternalLink size={12} />
                            </button>
                            <button 
                              onClick={() => shareWhatsApp(r)}
                              className="text-xs uppercase tracking-widest font-bold text-charcoal/40 hover:text-charcoal transition-colors flex items-center gap-1"
                            >
                              Compartir <Share2 size={12} />
                            </button>
                            <button 
                              onClick={() => downloadAsHtml(r)}
                              className="text-xs uppercase tracking-widest font-bold text-charcoal/40 hover:text-charcoal transition-colors flex items-center gap-1"
                            >
                              Descargar <Download size={12} />
                            </button>
                          </div>
                          <button 
                            onClick={() => setRecipeToDelete(r.name)}
                            className="text-terracotta/40 hover:text-terracotta transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </motion.div>
                    ));
                  })()}
                </div>
              )}

              {/* Delete Confirmation Modal */}
              <AnimatePresence>
                {recipeToDelete && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-charcoal/60 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl space-y-6 border border-gold/10"
                    >
                      <div className="w-16 h-16 bg-terracotta/10 rounded-full flex items-center justify-center text-terracotta mx-auto">
                        <Trash2 size={32} />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-serif text-charcoal">¿Eliminar receta?</h3>
                        <p className="text-sm text-charcoal/60">
                          Estás a punto de eliminar <span className="font-bold text-charcoal">"{recipeToDelete}"</span>. Esta acción no se puede deshacer.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => {
                            deleteRecipe(recipeToDelete);
                            setRecipeToDelete(null);
                          }}
                          className="w-full bg-terracotta text-white py-3 rounded-full text-sm font-medium hover:bg-red-700 transition-all"
                        >
                          Eliminar Permanentemente
                        </button>
                        <button
                          onClick={() => setRecipeToDelete(null)}
                          className="w-full bg-charcoal/5 text-charcoal/60 py-3 rounded-full text-sm font-medium hover:bg-charcoal/10 transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gold/10 text-center space-y-4">
        <p className="text-xs uppercase tracking-[0.4em] text-charcoal/30">AI Flavor Engine &copy; 2026</p>
        <p className="text-serif italic text-gold/60 text-sm">Elevando el arte de cocinar en casa.</p>
      </footer>
    </div>
  );
}
