import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Plus,
  Search,
  Bike,
  Flame,
  Radio,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Volume2,
} from "lucide-react";
import { Header } from "./components/Header";
import { ChapterCard } from "./components/ChapterCard";
import { NewChapterStudio } from "./components/NewChapterStudio";
import { ChapterPlayer } from "./components/ChapterPlayer";
import { VoiceShowcase } from "./components/VoiceShowcase";
import { ScriptModal } from "./components/ScriptModal";
import { Chapter, VoiceOption } from "./types";
import { INITIAL_CHAPTERS } from "./data/chapters";
import { base64ToBlobUrl } from "./utils/audio";

const STORAGE_KEY = "zona_xc_chapters_v1";

export default function App() {
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load chapters from storage:", e);
    }
    return INITIAL_CHAPTERS;
  });

  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>("Kore");

  // Active Chapter & Player state
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [generatingTTSId, setGeneratingTTSId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Modals state
  const [isNewChapterOpen, setIsNewChapterOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Partial<Chapter> | null>(null);
  const [viewingScriptChapter, setViewingScriptChapter] = useState<Chapter | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Persist chapters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chapters));
    } catch (e) {
      console.warn("Unable to save chapters to localStorage:", e);
    }
  }, [chapters]);

  // Handle Play/Pause for a chapter
  const handlePlayChapter = async (chapter: Chapter) => {
    setGlobalError(null);

    // If it's already the current chapter and has audio
    if (currentChapter?.id === chapter.id && (chapter.audioBase64 || chapter.audioUrl)) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    // If chapter doesn't have audio yet, generate it via TTS!
    if (!chapter.audioBase64 && !chapter.audioUrl) {
      await handleGenerateTTSForChapter(chapter);
      return;
    }

    // Set as current and play
    const audioUrl = chapter.audioUrl || (chapter.audioBase64 ? base64ToBlobUrl(chapter.audioBase64) : null);
    if (!audioUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = (e) => {
      console.error("Audio playback error:", e);
      setGlobalError("Error al reproducir el archivo de audio.");
      setIsPlaying(false);
    };

    audioRef.current = audio;
    setCurrentChapter(chapter);
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        console.warn("Playback blocked by browser policy until interaction:", err);
        setIsPlaying(false);
      });
  };

  // Generate TTS for existing chapter on demand
  const handleGenerateTTSForChapter = async (chapter: Chapter) => {
    setGeneratingTTSId(chapter.id);
    setGlobalError(null);

    try {
      const payload: any = {
        text: chapter.script,
        voiceName: chapter.voiceName || selectedVoice,
        mode: chapter.mode,
      };

      if (chapter.mode === "multi") {
        payload.speakers = [
          { speaker: "Marc", voice: "Fenrir" },
          { speaker: "Elena", voice: "Kore" },
        ];
      }

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error || "Error al sintetizar el audio con gemini-3.1-flash-tts-preview.");
      }

      const data = await res.json();
      if (!data.audioBase64) {
        throw new Error("No se recibieron datos de audio del servidor.");
      }

      const url = base64ToBlobUrl(data.audioBase64);

      // Update chapter in state
      const updatedChapter: Chapter = {
        ...chapter,
        audioBase64: data.audioBase64,
        audioUrl: url,
      };

      setChapters((prev) =>
        prev.map((c) => (c.id === chapter.id ? updatedChapter : c))
      );

      // Play audio
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(url);
      audio.onended = () => setIsPlaying(false);
      audioRef.current = audio;
      setCurrentChapter(updatedChapter);
      audio.play().then(() => setIsPlaying(true));
    } catch (err: any) {
      console.error("TTS generation error:", err);
      setGlobalError(err?.message || "No se pudo generar la voz para este capítulo.");
    } finally {
      setGeneratingTTSId(null);
    }
  };

  const handleToggleActivePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const handleClosePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentChapter(null);
  };

  const handleSaveNewChapter = (newChapter: Chapter, autoPlay = true) => {
    setChapters((prev) => {
      const existsIndex = prev.findIndex((c) => c.id === newChapter.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = newChapter;
        return updated;
      }
      return [newChapter, ...prev];
    });

    if (autoPlay && (newChapter.audioBase64 || newChapter.audioUrl)) {
      handlePlayChapter(newChapter);
    }
  };

  const handleCloneToNew = (chapter: Chapter) => {
    setEditingChapter({
      ...chapter,
      id: undefined,
      chapterNumber: chapters.length + 1,
      title: `${chapter.title} (Edición)`,
      audioBase64: undefined,
      audioUrl: undefined,
      isCustom: true,
    });
    setIsNewChapterOpen(true);
  };

  // Categories list
  const categories = [
    "Todos",
    "Copa del Mundo XCO",
    "Técnica & Setup",
    "Rutas & Desafíos",
    "Entrenamiento & Vatios",
    "Material & Bicis",
  ];

  // Filter chapters
  const filteredChapters = chapters.filter((c) => {
    const matchesCategory =
      activeCategory === "Todos" || c.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.subtitle.toLowerCase().includes(q) ||
      c.script.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q)) ||
      (c.courseLocation && c.courseLocation.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  const nextChapterNum = chapters.reduce((max, c) => Math.max(max, c.chapterNumber), 0) + 1;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-neutral-950 pb-28">
      {/* Global Notification Banner if Error */}
      {globalError && (
        <div className="bg-red-500/15 border-b border-red-500/30 px-4 py-2.5 text-xs text-red-300 flex items-center justify-between">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{globalError}</span>
          </div>
          <button
            onClick={() => setGlobalError(null)}
            className="text-red-400 hover:text-white font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <Header
        onOpenNewChapter={() => {
          setEditingChapter(null);
          setIsNewChapterOpen(true);
        }}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        categories={categories}
        totalChapters={chapters.length}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 flex-1">
        {/* Hero Banner: Zona XC & Nuevo Capítulo CTA */}
        <section className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-neutral-950 p-6 sm:p-8 lg:p-10 shadow-2xl">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
              <Flame className="w-3.5 h-3.5" />
              <span>Mountain Bike Cross-Country en Audio</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-display mb-4 leading-tight">
              Vive cada curva y sprint de{" "}
              <span className="text-amber-500">Zona XC</span> con narración IA
            </h2>

            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed mb-6 max-w-2xl font-normal">
              Escucha crónicas inmersivas de la Copa del Mundo XCO, análisis de presiones y geometrías,
              o crea un <strong>Nuevo Capítulo</strong> con tu propio libreto y conviértelo al instante en voz
              realista con el modelo <span className="text-amber-300 font-mono font-semibold">gemini-3.1-flash-tts-preview</span>.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                id="btn-crear-nuevo-capitulo-hero"
                onClick={() => {
                  setEditingChapter(null);
                  setIsNewChapterOpen(true);
                }}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-extrabold text-sm shadow-xl shadow-amber-500/25 transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>Crear Nuevo Capítulo</span>
              </button>

              {chapters.length > 0 && (
                <button
                  type="button"
                  onClick={() => handlePlayChapter(chapters[0])}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-bold text-sm transition-all border border-neutral-700 cursor-pointer"
                >
                  <Radio className="w-4 h-4 text-amber-400" />
                  <span>Escuchar Último Capítulo</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Voice Selector Showcase */}
        <section>
          <VoiceShowcase
            selectedVoice={selectedVoice}
            onSelectVoice={setSelectedVoice}
          />
        </section>

        {/* Search & Filter Bar */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-display uppercase tracking-wider text-neutral-100 flex items-center gap-2">
              <Radio className="w-5 h-5 text-amber-500" />
              Episodios y Capítulos de Zona XC
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {filteredChapters.length} de {chapters.length} capítulos disponibles
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por circuito, tema o palabra clave..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </section>

        {/* Chapters Grid */}
        <section>
          {filteredChapters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
              {filteredChapters.map((ch) => (
                <ChapterCard
                  key={ch.id}
                  chapter={ch}
                  isPlaying={isPlaying && currentChapter?.id === ch.id}
                  isGeneratingTTS={generatingTTSId === ch.id}
                  onPlay={handlePlayChapter}
                  onViewScript={(c) => setViewingScriptChapter(c)}
                  onCloneToNew={handleCloneToNew}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-neutral-800 bg-neutral-900/30">
              <Bike className="w-12 h-12 mx-auto text-neutral-600 mb-3" />
              <h3 className="text-lg font-bold text-neutral-300 font-display">
                No encontramos capítulos con ese criterio
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
                Prueba buscando otro término o aprovecha para redactar un Nuevo Capítulo con IA.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("Todos");
                  setIsNewChapterOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nuevo Capítulo Ahora</span>
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Persistent Audio Player Bar */}
      <ChapterPlayer
        chapter={currentChapter}
        isPlaying={isPlaying}
        onTogglePlay={handleToggleActivePlay}
        onClose={handleClosePlayer}
        onOpenScript={(ch) => setViewingScriptChapter(ch)}
        audioRef={audioRef}
      />

      {/* Modal: New Chapter Studio */}
      <NewChapterStudio
        isOpen={isNewChapterOpen}
        onClose={() => {
          setIsNewChapterOpen(false);
          setEditingChapter(null);
        }}
        onSaveChapter={handleSaveNewChapter}
        nextChapterNumber={nextChapterNum}
        initialData={editingChapter}
      />

      {/* Modal: Script View & Copy */}
      <ScriptModal
        chapter={viewingScriptChapter}
        onClose={() => setViewingScriptChapter(null)}
        onSynthesizeTTS={(ch) => handleGenerateTTSForChapter(ch)}
        isGeneratingTTS={Boolean(viewingScriptChapter && generatingTTSId === viewingScriptChapter.id)}
      />
    </div>
  );
}
