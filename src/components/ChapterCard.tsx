import React from "react";
import {
  Play,
  Pause,
  Sparkles,
  Loader2,
  FileText,
  Download,
  Users,
  Mic,
  MapPin,
  Clock,
} from "lucide-react";
import { Chapter } from "../types";
import { downloadWavFile } from "../utils/audio";

interface ChapterCardProps {
  chapter: Chapter;
  isPlaying: boolean;
  isGeneratingTTS: boolean;
  onPlay: (chapter: Chapter) => void;
  onViewScript: (chapter: Chapter) => void;
  onCloneToNew: (chapter: Chapter) => void;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  isPlaying,
  isGeneratingTTS,
  onPlay,
  onViewScript,
  onCloneToNew,
}) => {
  const hasAudio = Boolean(chapter.audioBase64 || chapter.audioUrl);

  return (
    <div
      id={`chapter-card-${chapter.id}`}
      className={`group relative rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between ${
        isPlaying
          ? "bg-neutral-900 border-amber-500/60 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30"
          : "bg-neutral-900/70 hover:bg-neutral-900 border-neutral-800 hover:border-neutral-700"
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
              CAP. {chapter.chapterNumber < 10 ? `0${chapter.chapterNumber}` : chapter.chapterNumber}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700/60">
              {chapter.category}
            </span>
            {chapter.isCustom && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Creado por ti
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>{chapter.durationLabel || "45 seg"}</span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-lg font-bold text-neutral-100 group-hover:text-amber-400 transition-colors line-clamp-1 mb-1 font-display">
          {chapter.title}
        </h3>
        <p className="text-xs text-neutral-400 font-medium line-clamp-2 mb-3 leading-relaxed">
          {chapter.subtitle}
        </p>

        {/* Location & Voice Info */}
        <div className="flex items-center gap-3 text-xs text-neutral-400 mb-3.5 flex-wrap">
          {chapter.courseLocation && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500/80" />
              <span>{chapter.courseLocation}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            {chapter.mode === "multi" ? (
              <>
                <Users className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-neutral-300">Dúo Locución: Marc & Elena</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-neutral-300">Voz: {chapter.voiceName}</span>
              </>
            )}
          </div>
        </div>

        {/* Script Excerpt */}
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 text-xs text-neutral-400 mb-4 font-normal leading-relaxed italic line-clamp-3 relative">
          "{chapter.script}"
        </div>
      </div>

      {/* Card Actions */}
      <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2 flex-wrap">
        {/* Play / Generate Audio Button */}
        <button
          type="button"
          onClick={() => onPlay(chapter)}
          disabled={isGeneratingTTS}
          className={`flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide transition-all cursor-pointer ${
            isPlaying
              ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
              : hasAudio
              ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-100 hover:text-amber-400"
              : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 shadow-lg shadow-amber-500/20"
          }`}
        >
          {isGeneratingTTS ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-current" />
              <span>Generando Voz (TTS)...</span>
            </>
          ) : isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pausar Capítulo</span>
            </>
          ) : hasAudio ? (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Reproducir</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Sintetizar con TTS</span>
            </>
          )}
        </button>

        {/* Secondary Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onViewScript(chapter)}
            className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs transition-colors cursor-pointer"
            title="Leer libreto completo"
          >
            <FileText className="w-4 h-4" />
          </button>

          {hasAudio && chapter.audioBase64 && (
            <button
              type="button"
              onClick={() =>
                downloadWavFile(
                  chapter.audioBase64!,
                  `ZonaXC-${chapter.chapterNumber}-${chapter.title.replace(/\s+/g, "_")}`
                )
              }
              className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400 text-xs transition-colors cursor-pointer"
              title="Descargar audio WAV"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onCloneToNew(chapter)}
            className="px-2.5 py-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Usar como plantilla para Nuevo Capítulo"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
};
