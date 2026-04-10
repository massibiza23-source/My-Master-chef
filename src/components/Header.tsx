import { ChefHat, Download, Bookmark } from 'lucide-react';
import { cn } from '../lib/utils';

interface HeaderProps {
  step: string;
  setStep: (step: any) => void;
  savedRecipesCount: number;
  language: string;
  setLanguage: (lang: any) => void;
  onReset: () => void;
  onDownloadAll: () => void;
  onOpenSaved: () => void;
  languages: readonly { id: string, label: string, flag: string }[];
}

export function Header({ 
  step, 
  setStep, 
  savedRecipesCount, 
  language, 
  setLanguage, 
  onReset, 
  onDownloadAll,
  onOpenSaved,
  languages 
}: HeaderProps) {
  return (
    <header className="py-8 px-6 border-b border-gold/10 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-50" translate="no">
      <div className="flex items-center gap-3 cursor-pointer" onClick={onReset}>
        <div className="w-10 h-10 bg-charcoal rounded-full flex items-center justify-center text-gold">
          <ChefHat size={24} />
        </div>
        <h1 className="text-2xl font-serif tracking-tight text-charcoal">
          AI Flavor <span className="text-gold">Engine</span>
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-transparent text-xs font-medium uppercase tracking-widest text-charcoal/60 outline-none cursor-pointer hover:text-gold transition-colors"
        >
          {languages.map(lang => (
            <option key={lang.id} value={lang.id}>{lang.flag} {lang.label}</option>
          ))}
        </select>
        <nav className="flex gap-4 md:gap-8 text-xs font-medium uppercase tracking-widest text-charcoal/60">
          {savedRecipesCount > 0 && (
            <button 
              onClick={onDownloadAll}
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
            onClick={onOpenSaved} 
            className={cn("hover:text-gold transition-colors flex items-center gap-2", step === 'saved' && "text-gold")}
          >
            <Bookmark size={14} />
            <span className="hidden sm:inline">Mi Recetario</span>
            {savedRecipesCount > 0 && (
              <span className="bg-gold text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {savedRecipesCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
