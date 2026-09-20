import React, { useState } from "react";
import { Mic, Play, Loader2, Volume2, CheckCircle2 } from "lucide-react";
import { AVAILABLE_VOICES, VoiceOption } from "../types";
import { base64ToBlobUrl } from "../utils/audio";

interface VoiceShowcaseProps {
  selectedVoice: VoiceOption;
  onSelectVoice: (voice: VoiceOption) => void;
}

export const VoiceShowcase: React.FC<VoiceShowcaseProps> = ({
  selectedVoice,
  onSelectVoice,
}) => {
  const [testingVoice, setTestingVoice] = useState<VoiceOption | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

  const handleTestVoice = async (voice: VoiceOption, e: React.MouseEvent) => {
    e.stopPropagation();

    // Stop current audio if playing
    if (activeAudio) {
      activeAudio.pause();
      setActiveAudio(null);
    }

    if (audioCache[voice]) {
      const audio = new Audio(audioCache[voice]);
      setActiveAudio(audio);
      audio.play();
      return;
    }

    setTestingVoice(voice);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `¡Hola ciclistas! Esta es la voz ${voice} transmitiendo en directo desde el circuito de Zona XC.`,
          voiceName: voice,
          mode: "single",
        }),
      });

      if (!res.ok) throw new Error("Error en la prueba de voz");
      const data = await res.json();
      if (data.audioBase64) {
        const url = base64ToBlobUrl(data.audioBase64);
        setAudioCache((prev) => ({ ...prev, [voice]: url }));
        const audio = new Audio(url);
        setActiveAudio(audio);
        audio.play();
      }
    } catch (err) {
      console.error("Test voice failed:", err);
    } finally {
      setTestingVoice(null);
    }
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Mic className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
            Voces de Cabina (Gemini TTS)
          </h2>
        </div>
        <span className="text-[11px] text-neutral-400 font-mono">
          gemini-3.1-flash-tts-preview
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {AVAILABLE_VOICES.map((v) => {
          const isSelected = selectedVoice === v.id;
          const isTesting = testingVoice === v.id;

          return (
            <div
              key={v.id}
              onClick={() => onSelectVoice(v.id)}
              className={`relative text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                isSelected
                  ? "bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10"
                  : "bg-neutral-950/70 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-bold text-sm text-neutral-100 flex items-center gap-1.5">
                    {v.name}
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </span>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                    {v.gender}
                  </span>
                </div>
                <p className="text-[11px] text-amber-300/80 font-medium line-clamp-1 mb-1">
                  {v.previewNote}
                </p>
                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                  {v.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-[10px] text-neutral-400">
                  {isSelected ? "Activa" : "Elegir"}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleTestVoice(v.id, e)}
                  disabled={isTesting}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium transition-colors cursor-pointer"
                  title="Escuchar muestra de voz"
                >
                  {isTesting ? (
                    <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                  ) : (
                    <Volume2 className="w-3 h-3 text-amber-400" />
                  )}
                  <span>Probar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
