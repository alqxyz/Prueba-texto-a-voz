export type CategoryType =
  | "Copa del Mundo XCO"
  | "Técnica & Setup"
  | "Rutas & Desafíos"
  | "Entrenamiento & Vatios"
  | "Material & Bicis";

export type VoiceOption = "Kore" | "Fenrir" | "Puck" | "Charon" | "Zephyr";

export interface SpeakerConfig {
  speaker: string;
  voice: VoiceOption;
}

export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  subtitle: string;
  category: CategoryType;
  script: string;
  audioBase64?: string;
  audioUrl?: string;
  voiceName: VoiceOption;
  mode: "single" | "multi";
  speakers?: [SpeakerConfig, SpeakerConfig];
  createdAt: string;
  durationSeconds?: number;
  durationLabel?: string;
  tags: string[];
  courseLocation?: string;
  isCustom?: boolean;
}

export interface VoiceInfo {
  id: VoiceOption;
  name: string;
  gender: "Femenina" | "Masculina" | "Neutral";
  description: string;
  previewNote: string;
}

export const AVAILABLE_VOICES: VoiceInfo[] = [
  {
    id: "Kore",
    name: "Kore",
    gender: "Femenina",
    description: "Voz equilibrada, cálida y enérgica, ideal para narración técnica y crónica.",
    previewNote: "Locutora Principal de Zona XC",
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    gender: "Masculina",
    description: "Tono grave, épico y potente, perfecto para relatos de carreras y descensos.",
    previewNote: "Relator Épico de Competición",
  },
  {
    id: "Puck",
    name: "Puck",
    gender: "Masculina",
    description: "Locución ágil, dinámica y entusiasta, con ritmo trepidante.",
    previewNote: "Comentarista de Pista & Pulsaciones",
  },
  {
    id: "Charon",
    name: "Charon",
    gender: "Masculina",
    description: "Voz profunda y serena, idónea para análisis de biomecánica y telemetría.",
    previewNote: "Analista de Telemetría",
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    gender: "Femenina",
    description: "Voz cristalina, fluida y moderna con dicción de estudio.",
    previewNote: "Especialista en Setup & Novedades",
  },
];
