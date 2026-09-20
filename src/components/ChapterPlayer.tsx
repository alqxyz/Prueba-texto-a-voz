import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  FileText,
  Download,
  X,
  Radio,
  Sparkles,
} from "lucide-react";
import { Chapter } from "../types";
import { formatTime, downloadWavFile, generateSyntheticWaveform } from "../utils/audio";

interface ChapterPlayerProps {
  chapter: Chapter | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  onOpenScript: (chapter: Chapter) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export const ChapterPlayer: React.FC<ChapterPlayerProps> = ({
  chapter,
  isPlaying,
  onTogglePlay,
  onClose,
  onOpenScript,
  audioRef,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const waveformBars = useRef(generateSyntheticWaveform(28)).current;

  // Sync audio progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [audioRef, chapter]);

  if (!chapter) return null;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(audioRef.current.duration || 60, audioRef.current.currentTime + seconds)
      );
    }
  };

  const handleToggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      if (val === 0) setIsMuted(true);
      else if (isMuted) setIsMuted(false);
    }
  };

  const handleCycleRate = () => {
    const rates = [1, 1.25, 1.5, 0.85];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const effectiveDuration = duration > 0 ? duration : chapter.durationSeconds || 45;

  return (
    <div
      id="zona-xc-active-player"
      className="fixed bottom-0 inset-x-0 z-50 p-2 sm:p-4 pointer-events-none"
    >
      <div className="max-w-5xl mx-auto bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/80 rounded-2xl shadow-2xl p-3 sm:p-4 text-neutral-100 pointer-events-auto ring-1 ring-amber-500/20">
        <div className="flex flex-col gap-2.5">
          {/* Top Row: Track info & controls */}
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            {/* Left: Chapter identity */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-neutral-950 font-black shrink-0 shadow-md">
                <Radio className="w-5 h-5" />
                {isPlaying && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">
                    CAP. {chapter.chapterNumber}
                  </span>
                  <span className="text-[11px] text-neutral-400 truncate">
                    {chapter.category}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-neutral-100 truncate font-display">
                  {chapter.title}
                </h4>
              </div>
            </div>

            {/* Middle: Playback buttons */}
            <div className="flex items-center gap-2 sm:gap-3 mx-auto order-3 sm:order-2 w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => handleSkip(-10)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Retroceder 10 segundos"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onTogglePlay}
                className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 flex items-center justify-center shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
                title={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSkip(10)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Adelantar 10 segundos"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCycleRate}
                className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-mono text-xs font-bold transition-colors cursor-pointer"
                title="Velocidad de reproducción"
              >
                {playbackRate}x
              </button>
            </div>

            {/* Right: Audio options & Close */}
            <div className="flex items-center gap-2 order-2 sm:order-3">
              {/* Volume */}
              <div className="hidden md:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="p-1.5 rounded text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                />
              </div>

              <button
                type="button"
                onClick={() => onOpenScript(chapter)}
                className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs transition-colors cursor-pointer"
                title="Leer libreto"
              >
                <FileText className="w-4 h-4" />
              </button>

              {chapter.audioBase64 && (
                <button
                  type="button"
                  onClick={() =>
                    downloadWavFile(
                      chapter.audioBase64!,
                      `ZonaXC-Capitulo-${chapter.chapterNumber}`
                    )
                  }
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400 text-xs transition-colors cursor-pointer"
                  title="Descargar audio WAV"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Cerrar reproductor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Row: Scrub Timeline & Waveform visualizer */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-neutral-400 w-9 text-right">
              {formatTime(currentTime)}
            </span>

            {/* Timeline Scrub Slider */}
            <div className="relative flex-1 flex items-center group">
              <input
                type="range"
                min={0}
                max={effectiveDuration}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 group-hover:h-2 transition-all"
              />
            </div>

            <span className="text-[11px] font-mono text-neutral-400 w-9">
              {formatTime(effectiveDuration)}
            </span>

            {/* Synthetic Waveform reactive preview */}
            <div className="hidden lg:flex items-center gap-0.5 h-4 ml-2">
              {waveformBars.map((height, i) => {
                const isActive = (currentTime / effectiveDuration) * waveformBars.length > i;
                return (
                  <span
                    key={i}
                    style={{
                      height: `${Math.round(height * 16)}px`,
                      animationDelay: `${(i % 5) * 0.15}s`,
                    }}
                    className={`w-0.5 rounded-full transition-colors ${
                      isPlaying
                        ? "animate-wave-bar bg-amber-400"
                        : isActive
                        ? "bg-amber-500/80"
                        : "bg-neutral-700"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
