import React, { useState } from "react";
import {
  X,
  Sparkles,
  Loader2,
  Wand2,
  Volume2,
  Play,
  Pause,
  Download,
  Check,
  Radio,
  Mic,
  Users,
  AlertCircle,
} from "lucide-react";
import { Chapter, CategoryType, VoiceOption, AVAILABLE_VOICES } from "../types";
import { base64ToBlobUrl, downloadWavFile } from "../utils/audio";

interface NewChapterStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveChapter: (chapter: Chapter, autoPlay?: boolean) => void;
  nextChapterNumber: number;
  initialData?: Partial<Chapter> | null;
}

const CATEGORIES: CategoryType[] = [
  "Copa del Mundo XCO",
  "Técnica & Setup",
  "Rutas & Desafíos",
  "Entrenamiento & Vatios",
  "Material & Bicis",
];

const PROMPT_SUGGESTIONS = [
  {
    label: "Ataque en Copa del Mundo",
    prompt: "Ataque decisivo a dos curvas de meta en el circuito de Les Gets sobre barro y raíces.",
    category: "Copa del Mundo XCO" as CategoryType,
  },
  {
    label: "Debate de Suspensión 120mm",
    prompt: "Evolución de las bicis de XC hacia suspensiones de 120mm y geometrías más lanzadas.",
    category: "Técnica & Setup" as CategoryType,
  },
  {
    label: "Subida al Límite",
    prompt: "Crónica de un ascenso técnico empinado con terreno suelto, cadencia alta y 400 vatios sostenidos.",
    category: "Rutas & Desafíos" as CategoryType,
  },
  {
    label: "Estrategia de Nutrición",
    prompt: "Cómo asimilar 90 gramos de carbohidratos por hora en carreras largas de XC sin problemas digestivos.",
    category: "Entrenamiento & Vatios" as CategoryType,
  },
];

export const NewChapterStudio: React.FC<NewChapterStudioProps> = ({
  isOpen,
  onClose,
  onSaveChapter,
  nextChapterNumber,
  initialData,
}) => {
  const [chapterNumber, setChapterNumber] = useState<number>(
    initialData?.chapterNumber || nextChapterNumber
  );
  const [title, setTitle] = useState<string>(
    initialData?.title || `Capítulo ${nextChapterNumber}: `
  );
  const [subtitle, setSubtitle] = useState<string>(initialData?.subtitle || "");
  const [category, setCategory] = useState<CategoryType>(
    initialData?.category || "Copa del Mundo XCO"
  );
  const [location, setLocation] = useState<string>(
    initialData?.courseLocation || "Circuito Zona XC"
  );
  const [voiceName, setVoiceName] = useState<VoiceOption>(
    initialData?.voiceName || "Kore"
  );
  const [mode, setMode] = useState<"single" | "multi">(
    initialData?.mode || "single"
  );
  const [script, setScript] = useState<string>(initialData?.script || "");

  // AI Script generation state
  const [aiTopic, setAiTopic] = useState<string>("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // TTS audio generation state
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [generatedAudioBase64, setGeneratedAudioBase64] = useState<string | null>(
    initialData?.audioBase64 || null
  );
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(
    initialData?.audioBase64 ? base64ToBlobUrl(initialData.audioBase64) : null
  );
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewAudioObj, setPreviewAudioObj] = useState<HTMLAudioElement | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle AI Script Generation
  const handleGenerateScriptWithAI = async (selectedPrompt?: string) => {
    const topicToUse = selectedPrompt || aiTopic;
    if (!topicToUse.trim()) {
      setErrorMessage("Escribe una temática o elige una sugerencia para generar el libreto.");
      return;
    }
    setErrorMessage(null);
    setIsGeneratingScript(true);

    try {
      const res = await fetch("/api/generate-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicToUse,
          category,
          speakerStyle: mode,
          tone: "Apasionado, técnico y dinámico",
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo generar el libreto con la IA.");
      }

      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.subtitle) setSubtitle(data.subtitle);
      if (data.script) setScript(data.script);
      if (data.category && CATEGORIES.includes(data.category)) {
        setCategory(data.category);
      }
      // Clear previous generated audio since script changed
      setGeneratedAudioBase64(null);
      setPreviewAudioUrl(null);
    } catch (err: any) {
      setErrorMessage(err?.message || "Error al conectar con el redactor de IA.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Handle TTS with gemini-3.1-flash-tts-preview
  const handleGenerateTTS = async () => {
    if (!script.trim()) {
      setErrorMessage("Ingresa el texto o libreto del capítulo para generar la voz.");
      return;
    }

    setErrorMessage(null);
    setIsGeneratingTTS(true);

    // Stop current preview
    if (previewAudioObj) {
      previewAudioObj.pause();
      setIsPlayingPreview(false);
    }

    try {
      const payload: any = {
        text: script.trim(),
        voiceName,
        mode,
      };

      if (mode === "multi") {
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
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData?.error || "Error al generar la voz con gemini-3.1-flash-tts-preview."
        );
      }

      const data = await res.json();
      if (data.audioBase64) {
        setGeneratedAudioBase64(data.audioBase64);
        const url = base64ToBlobUrl(data.audioBase64);
        setPreviewAudioUrl(url);

        // Auto play preview
        const audio = new Audio(url);
        audio.onended = () => setIsPlayingPreview(false);
        setPreviewAudioObj(audio);
        audio.play();
        setIsPlayingPreview(true);
      } else {
        throw new Error("La respuesta no contiene datos de audio válidos.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocurrió un error en la síntesis de voz TTS.");
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  const handleTogglePreviewPlay = () => {
    if (!previewAudioUrl) return;

    if (isPlayingPreview && previewAudioObj) {
      previewAudioObj.pause();
      setIsPlayingPreview(false);
    } else {
      let audio = previewAudioObj;
      if (!audio) {
        audio = new Audio(previewAudioUrl);
        audio.onended = () => setIsPlayingPreview(false);
        setPreviewAudioObj(audio);
      }
      audio.play();
      setIsPlayingPreview(true);
    }
  };

  const handleSave = (autoPlay = true) => {
    if (!title.trim()) {
      setErrorMessage("Por favor ingresa un título para el capítulo.");
      return;
    }
    if (!script.trim()) {
      setErrorMessage("El libreto no puede estar vacío.");
      return;
    }

    // Approximate duration
    const words = script.trim().split(/\s+/).length;
    const estSeconds = Math.max(15, Math.round((words / 140) * 60));
    const durationLabel = `${estSeconds} seg`;

    const newChapter: Chapter = {
      id: initialData?.id || `cap-custom-${Date.now()}`,
      chapterNumber,
      title: title.trim(),
      subtitle: subtitle.trim() || `Capítulo especial de Zona XC`,
      category,
      script: script.trim(),
      audioBase64: generatedAudioBase64 || undefined,
      audioUrl: previewAudioUrl || undefined,
      voiceName,
      mode,
      speakers:
        mode === "multi"
          ? [
              { speaker: "Marc", voice: "Fenrir" },
              { speaker: "Elena", voice: "Kore" },
            ]
          : undefined,
      createdAt: new Date().toISOString().split("T")[0],
      durationSeconds: estSeconds,
      durationLabel,
      tags: ["Zona XC", category.split(" ")[0], "Cross-Country"],
      courseLocation: location.trim() || "Circuito Zona XC",
      isCustom: true,
    };

    onSaveChapter(newChapter, autoPlay);
    onClose();
  };

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.round((wordCount / 140) * 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-md overflow-y-auto">
      <div
        id="nuevo-capitulo-modal"
        className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
                Nuevo Capítulo <span className="text-amber-500">Zona XC</span>
              </h2>
              <p className="text-xs text-neutral-400">
                Redacción y locución con síntesis de voz{" "}
                <code className="text-amber-300 font-mono">gemini-3.1-flash-tts-preview</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-neutral-200">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick AI Script Inspiration Bar */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Asistente de Redacción Zona XC (Gemini)
              </span>
              <span className="text-[11px] text-neutral-400">
                Inspírate con 1 clic
              </span>
            </div>

            <div className="flex gap-2 flex-wrap mb-3">
              {PROMPT_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCategory(item.category);
                    setAiTopic(item.prompt);
                    handleGenerateScriptWithAI(item.prompt);
                  }}
                  disabled={isGeneratingScript}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-amber-300 text-xs transition-colors border border-neutral-700/80 cursor-pointer disabled:opacity-50"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Escribe una idea (ej: Purgado de frenos antes de la etapa reina en los Alpes)..."
                className="flex-1 bg-neutral-950/80 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleGenerateScriptWithAI()}
                disabled={isGeneratingScript}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingScript ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                <span>{isGeneratingScript ? "Redactando..." : "Redactar"}</span>
              </button>
            </div>
          </div>

          {/* Chapter Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Nº Capítulo
              </label>
              <input
                type="number"
                min={1}
                value={chapterNumber}
                onChange={(e) => setChapterNumber(parseInt(e.target.value) || 1)}
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Ubicación / Pista
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Mont-Sainte-Anne, Canadá"
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-12">
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Título del Capítulo
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Capítulo 5: La Batalla en las Raíces de Mont-Sainte-Anne"
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-12">
              <label className="block text-xs font-semibold text-neutral-400 mb-1">
                Subtítulo / Sinopsis
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Breve resumen del episodio..."
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Voice Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-amber-400" />
                Configuración de Voces TTS
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode("single")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    mode === "single"
                      ? "bg-amber-500 text-neutral-950"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  Narrador Solitario
                </button>
                <button
                  type="button"
                  onClick={() => setMode("multi")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 ${
                    mode === "multi"
                      ? "bg-amber-500 text-neutral-950"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  <Users className="w-3 h-3" />
                  Dúo de Locutores (Marc & Elena)
                </button>
              </div>
            </div>

            {mode === "single" ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {AVAILABLE_VOICES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setVoiceName(v.id);
                      setGeneratedAudioBase64(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      voiceName === v.id
                        ? "bg-amber-500/15 border-amber-500/60 text-amber-300"
                        : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>{v.name}</span>
                      <span className="text-[10px] opacity-70">{v.gender}</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                      {v.previewNote}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-300 flex items-center justify-between">
                <div>
                  <strong className="text-amber-400">Modo Diálogo de Cabina:</strong>
                  <span className="ml-2 text-neutral-400">
                    Locutor 1: <strong className="text-white">Marc</strong> (Voz Fenrir) • Locutor 2:{" "}
                    <strong className="text-white">Elena</strong> (Voz Kore)
                  </span>
                </div>
                <span className="text-[11px] text-amber-400 font-mono">
                  multiSpeakerVoiceConfig
                </span>
              </div>
            )}
          </div>

          {/* Script Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                Libreto / Guion para Locución
              </label>
              <div className="text-[11px] text-neutral-400 space-x-2">
                <span>{wordCount} palabras</span>
                <span>•</span>
                <span>Est. ~{estimatedSeconds}s de audio</span>
              </div>
            </div>
            <textarea
              rows={5}
              value={script}
              onChange={(e) => {
                setScript(e.target.value);
                setGeneratedAudioBase64(null);
              }}
              placeholder={
                mode === "multi"
                  ? "Marc: ¡Bienvenidos a Zona XC!\nElena: Hoy analizamos el circuito técnico de Val di Sole..."
                  : "Escribe aquí la crónica, análisis técnico o sensaciones del capítulo que leerá el narrador de Zona XC..."
              }
              className="w-full bg-neutral-950/90 border border-neutral-800 rounded-2xl p-4 text-xs sm:text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 leading-relaxed font-mono"
            />
          </div>

          {/* TTS Audio Generator Section */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  Generador de Audio TTS
                </h4>
                <p className="text-xs text-neutral-400">
                  Convierte este guion en audio realista con{" "}
                  <span className="text-amber-300 font-mono">
                    gemini-3.1-flash-tts-preview
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-generar-tts"
                  onClick={handleGenerateTTS}
                  disabled={isGeneratingTTS || !script.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingTTS ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sintetizando Audio...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{generatedAudioBase64 ? "Re-generar Audio TTS" : "Sintetizar Audio con TTS"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generated Audio Preview Player if available */}
            {generatedAudioBase64 && (
              <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-3 bg-neutral-900/60 p-3 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleTogglePreviewPlay}
                    className="p-2 rounded-lg bg-amber-500 text-neutral-950 hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    {isPlayingPreview ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                  </button>
                  <div className="text-xs">
                    <span className="font-bold text-neutral-200">
                      Audio Generado con Éxito
                    </span>
                    <p className="text-[11px] text-amber-400/80">
                      Formato WAV PCM 24.000 Hz • Listo para emisión
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    downloadWavFile(
                      generatedAudioBase64,
                      `ZonaXC-Capitulo-${chapterNumber}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar WAV</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between gap-3 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Guardar Borrador
            </button>
            <button
              type="button"
              id="btn-guardar-y-emitir"
              onClick={() => handleSave(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 text-xs font-bold shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar y Emitir Capítulo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
