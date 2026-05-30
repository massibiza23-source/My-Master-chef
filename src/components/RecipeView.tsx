import { ChefHat, Globe, Clock, Flame, Sparkles, Bookmark, Share2, Download, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { Recipe } from '../types';

interface RecipeViewProps {
  recipe: Recipe | null;
  loading: boolean;
  error: string | null;
  loadingMessage: string;
  generatingImage: boolean;
  showSaveFeedback: 'saved' | 'already' | null;
  savedRecipes: Recipe[];
  onGenerateImage: () => void;
  onSave: () => void;
  onShare: (r: Recipe) => void;
  onDownload: (r: Recipe) => void;
  onReset: () => void;
  onRetry: () => void;
  onCancel: () => void;
}

export function RecipeView({
  recipe,
  loading,
  error,
  loadingMessage,
  generatingImage,
  showSaveFeedback,
  savedRecipes,
  onGenerateImage,
  onSave,
  onShare,
  onDownload,
  onReset,
  onRetry,
  onCancel
}: RecipeViewProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8" translate="no">
        <div className="relative">
          <div className="w-24 h-24 border-t-2 border-gold rounded-full animate-spin" />
          <ChefHat className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold" size={32} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-serif italic text-charcoal">{loadingMessage}</h3>
          <p className="text-charcoal/40 animate-pulse uppercase tracking-widest text-[10px]">Creando tu experiencia gourmet</p>
        </div>
        <button 
          onClick={onCancel}
          className="text-xs text-charcoal/30 hover:text-gold transition-colors uppercase tracking-widest font-medium"
        >
          Cancelar Generación
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6" translate="no">
        <div className="w-16 h-16 bg-terracotta/10 rounded-full flex items-center justify-center text-terracotta">
          <RotateCcw size={32} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-serif text-charcoal">¡Ups! Algo salió mal</h3>
          <p className="text-charcoal/60">{error}</p>
        </div>
        <button
          onClick={onRetry}
          className="bg-gold text-white px-8 py-3 rounded-full font-medium shadow-lg hover:bg-terracotta transition-all"
        >
          Reintentar Generación
        </button>
        <button onClick={onReset} className="text-charcoal/40 text-sm hover:text-charcoal transition-colors">
          Volver al inicio
        </button>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6" translate="no">
        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center text-gold">
          <ChefHat size={32} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-serif text-charcoal">No hay receta para mostrar</h3>
          <p className="text-charcoal/60">Parece que el Chef se ha tomado un descanso.</p>
        </div>
        <button onClick={onReset} className="bg-gold text-white px-8 py-3 rounded-full font-medium shadow-lg hover:bg-terracotta transition-all">
          Volver al inicio
        </button>
      </div>
    );
  }

  const isSaved = savedRecipes.some(r => r && r.name === recipe.name);

  return (
    <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gold/5" translate="no">
      {/* Recipe Image Container */}
      <div className="w-full relative overflow-hidden h-[400px] md:h-[500px] bg-charcoal">
        {!recipe.imageUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 p-8 z-10">
            <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center text-gold">
              <ChefHat size={40} />
            </div>
            <button
              onClick={onGenerateImage}
              disabled={generatingImage}
              className="bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {generatingImage ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  Generando Imagen...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Globe size={16} />
                  Generar Imagen del Plato
                </span>
              )}
            </button>
            <p className="text-white/30 text-[10px] uppercase tracking-widest text-center">Evita sobrecarga de tokens generando la imagen por separado</p>
          </div>
        )}
        
        <img 
          src={recipe.imageUrl || ''} 
          alt={recipe.name} 
          className={cn(
            "w-full h-full object-cover transition-opacity duration-700",
            recipe.imageUrl ? "opacity-100" : "opacity-0"
          )}
          referrerPolicy="no-referrer"
        />
      </div>

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
              {recipe.prepTime || "N/A"}
            </div>
            <div className={cn(
              "flex items-center gap-2 text-xs font-bold uppercase tracking-widest",
              recipe.imageUrl ? "text-gold" : "text-gold/80"
            )}>
              <Flame size={14} />
              {recipe.nutrition?.calories || "N/A"}
            </div>
          </div>
          <p className={cn(
            "italic max-w-2xl mx-auto leading-relaxed",
            recipe.imageUrl ? "text-charcoal/60" : "text-white/60"
          )}>
            "{recipe.history || ""}"
          </p>
        </div>
      </div>

      <div className="px-8 md:px-12 pb-12 space-y-12">
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
                onClick={onSave}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all",
                  isSaved ? "bg-gold text-white" : "bg-charcoal text-white hover:bg-charcoal/90"
                )}
              >
                {showSaveFeedback === 'saved' ? (
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} />
                    ¡Guardada!
                  </div>
                ) : showSaveFeedback === 'already' ? (
                  <div className="flex items-center gap-2">
                    <Bookmark size={18} />
                    Ya en el recetario
                  </div>
                ) : (
                  <>
                    <Bookmark size={18} />
                    {isSaved ? "Guardada" : "Guardar Receta"}
                  </>
                )}
              </button>
              <button 
                onClick={() => onShare(recipe)}
                className="flex items-center gap-2 border border-gold/30 text-gold px-6 py-3 rounded-full text-sm font-medium hover:bg-gold/5 transition-all"
              >
                <Share2 size={18} />
                WhatsApp
              </button>
              <button 
                onClick={() => onDownload(recipe)}
                className="flex items-center gap-2 border border-gold/30 text-gold px-6 py-3 rounded-full text-sm font-medium hover:bg-gold/5 transition-all"
              >
                <Download size={18} />
                Descargar Menú
              </button>
              <button onClick={onReset} className="flex items-center gap-2 text-charcoal/40 px-6 py-3 rounded-full text-sm font-medium hover:text-charcoal transition-all">
                <RotateCcw size={18} />
                Nueva
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
