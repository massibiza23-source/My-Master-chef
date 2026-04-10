import { Sparkles, Utensils, Globe, Info, X, Leaf, Flame, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

interface ProfileStepProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  setStep: (step: any) => void;
  onGenerate: () => void;
  mealTypes: readonly { id: string, label: string, icon: any }[];
}

export function ProfileStep({
  profile,
  setProfile,
  setStep,
  onGenerate,
  mealTypes
}: ProfileStepProps) {
  return (
    <div className="space-y-12" translate="no">
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
          onClick={onGenerate}
          className="bg-gold text-white px-10 py-4 rounded-full text-lg font-medium shadow-xl shadow-gold/20 hover:bg-terracotta transition-all"
        >
          Generar Receta Única
        </button>
      </div>
    </div>
  );
}
