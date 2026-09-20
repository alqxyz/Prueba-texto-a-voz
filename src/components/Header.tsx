import React from "react";
import { Bike, Sparkles, Radio, Plus, Volume2 } from "lucide-react";

interface HeaderProps {
  onOpenNewChapter: () => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  categories: string[];
  totalChapters: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewChapter,
  activeCategory,
  onSelectCategory,
  categories,
  totalChapters,
}) => {
  return (
    <header className="border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20 text-neutral-950 font-black">
              <Bike className="w-6 h-6 stroke-[2.2]" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border-2 border-neutral-950"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-wider font-display uppercase text-white flex items-center gap-1.5">
                  Zona <span className="text-amber-500">XC</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-800 text-amber-400 border border-amber-500/20">
                  <Radio className="w-3 h-3 animate-pulse text-amber-400" />
                  TTS Studio
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-medium">
                Crónicas, telemetría y relatos de Cross-Country con voz de IA
              </p>
            </div>
          </div>

          {/* Actions & TTS Info */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Modelo TTS: <strong className="text-amber-300 font-mono">gemini-3.1-flash-tts-preview</strong>
              </span>
            </div>

            <button
              id="btn-nuevo-capitulo-header"
              onClick={onOpenNewChapter}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Capítulo</span>
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" />
            Capítulos ({totalChapters}):
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/40"
                  : "bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
