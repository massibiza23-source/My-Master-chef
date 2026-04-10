import { Plus, X, Sparkles, Bookmark, ArrowRight, ChefHat, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { Recipe } from '../types';

interface IngredientsStepProps {
  ingredients: string[];
  currentInput: string;
  setCurrentInput: (val: string) => void;
  addIngredient: () => void;
  removeIngredient: (ing: string) => void;
  addSuggestedIngredient: (item: string) => void;
  ingredientSuggestions: { category: string, items: string[] }[];
  savedRecipes: Recipe[];
  setStep: (step: any) => void;
  setRecipe: (recipe: Recipe) => void;
  onDownloadAll: () => void;
}

export function IngredientsStep({
  ingredients,
  currentInput,
  setCurrentInput,
  addIngredient,
  removeIngredient,
  addSuggestedIngredient,
  ingredientSuggestions,
  savedRecipes,
  setStep,
  setRecipe,
  onDownloadAll
}: IngredientsStepProps) {
  return (
    <div className="space-y-12" translate="no">
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
                onClick={onDownloadAll}
                className="text-[10px] uppercase tracking-widest font-bold text-charcoal/40 hover:text-gold transition-colors flex items-center gap-1"
                title="Descargar todo mi recetario"
              >
                <Download size={12} /> Descargar Todo
              </button>
              <button 
                onClick={() => setStep('saved')}
                className="text-xs text-charcoal/40 hover:text-gold transition-colors flex items-center gap-1"
              >
                Ver todo <ArrowRight size={12} />
              </button>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {savedRecipes.slice(0, 5).map((r, idx) => (
              <div
                key={`${r.name}-${idx}`}
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
              </div>
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
          <span
            key={ing}
            className="px-4 py-2 bg-white border border-gold/10 rounded-full text-sm flex items-center gap-2 shadow-sm"
          >
            {ing}
            <button onClick={() => removeIngredient(ing)} className="text-terracotta hover:text-red-600">
              <X size={14} />
            </button>
          </span>
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
    </div>
  );
}
