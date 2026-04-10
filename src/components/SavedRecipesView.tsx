import { RotateCcw, Search, X, ArrowUpAZ, ArrowDownAZ, Download, Bookmark, ChefHat, ExternalLink, Share2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Recipe } from '../types';

interface SavedRecipesViewProps {
  savedRecipes: Recipe[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
  onDownloadAll: () => void;
  onViewRecipe: (r: Recipe) => void;
  onShare: (r: Recipe) => void;
  onDownload: (r: Recipe) => void;
  onDeleteRequest: (name: string) => void;
  setStep: (step: any) => void;
  recipeToDelete: string | null;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

export function SavedRecipesView({
  savedRecipes,
  searchTerm,
  setSearchTerm,
  sortOrder,
  setSortOrder,
  onDownloadAll,
  onViewRecipe,
  onShare,
  onDownload,
  onDeleteRequest,
  setStep,
  recipeToDelete,
  onConfirmDelete,
  onCancelDelete
}: SavedRecipesViewProps) {
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

  return (
    <div className="space-y-12" translate="no">
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
          
          {currentSaved.length > 0 && (
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
                  onClick={onDownloadAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all border border-gold/20 bg-charcoal text-white hover:bg-charcoal/90"
                >
                  <Download size={16} /> Descargar Todo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {currentSaved.length === 0 ? (
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
          {filtered.length === 0 && searchTerm ? (
            <div className="col-span-full text-center py-12">
              <Search size={32} className="mx-auto text-gold/20 mb-4" />
              <p className="text-charcoal/40 font-serif italic">No se encontraron recetas que coincidan con "{searchTerm}"</p>
            </div>
          ) : (
            filtered.map((r, idx) => (
              <div
                key={`${r.name}-${idx}`}
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
                      onClick={() => onViewRecipe(r)}
                      className="text-xs uppercase tracking-widest font-bold text-gold hover:text-terracotta transition-colors flex items-center gap-1"
                    >
                      Ver Detalle <ExternalLink size={12} />
                    </button>
                    <button 
                      onClick={() => onShare(r)}
                      className="text-xs uppercase tracking-widest font-bold text-charcoal/40 hover:text-charcoal transition-colors flex items-center gap-1"
                    >
                      Compartir <Share2 size={12} />
                    </button>
                    <button 
                      onClick={() => onDownload(r)}
                      className="text-xs uppercase tracking-widest font-bold text-charcoal/40 hover:text-charcoal transition-colors flex items-center gap-1"
                    >
                      Descargar <Download size={12} />
                    </button>
                  </div>
                  <button 
                    onClick={() => onDeleteRequest(r.name)}
                    className="text-terracotta/40 hover:text-terracotta transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recipeToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-charcoal/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl space-y-6 border border-gold/10">
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
                onClick={onConfirmDelete}
                className="w-full bg-terracotta text-white py-3 rounded-full text-sm font-medium hover:bg-red-700 transition-all"
              >
                Eliminar Permanentemente
              </button>
              <button
                onClick={onCancelDelete}
                className="w-full bg-charcoal/5 text-charcoal/60 py-3 rounded-full text-sm font-medium hover:bg-charcoal/10 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
