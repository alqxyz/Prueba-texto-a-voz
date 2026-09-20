import React, { useState } from "react";
import { X, Copy, Check, Volume2, Mic, Users, MapPin } from "lucide-react";
import { Chapter } from "../types";

interface ScriptModalProps {
  chapter: Chapter | null;
  onClose: () => void;
  onSynthesizeTTS: (chapter: Chapter) => void;
  isGeneratingTTS: boolean;
}

export const ScriptModal: React.FC<ScriptModalProps> = ({
  chapter,
  onClose,
  onSynthesizeTTS,
  isGeneratingTTS,
}) => {
  const [copied, setCopied] = useState(false);

  if (!chapter) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(chapter.script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                CAP. {chapter.chapterNumber}
              </span>
              <span className="text-xs text-neutral-400 font-semibold">
                {chapter.category}
              </span>
            </div>
            <h3 className="text-lg font-bold text-neutral-100 font-display">
              {chapter.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              {chapter.mode === "multi" ? (
                <div className="flex items-center gap-1 text-orange-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>Dúo Locución: Marc & Elena</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-400">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Narrador: Voz {chapter.voiceName}</span>
                </div>
              )}
              {chapter.courseLocation && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-neutral-500" />
                    <span>{chapter.courseLocation}</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Libreto</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-5 text-sm sm:text-base text-neutral-200 leading-relaxed whitespace-pre-line font-mono">
            {chapter.script}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Síntesis con Gemini TTS (24.000 Hz)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={() => onSynthesizeTTS(chapter)}
              disabled={isGeneratingTTS}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              <span>{chapter.audioBase64 ? "Re-sintetizar Voz" : "Sintetizar Voz con TTS"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
