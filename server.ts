import "dotenv/config";
import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Lazy initialization for Gemini client
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Convert 16-bit PCM Buffer to standard RIFF/WAV Buffer
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  // If already starts with RIFF, don't re-wrap
  if (pcmBuffer.length > 4 && pcmBuffer.toString("ascii", 0, 4) === "RIFF") {
    return pcmBuffer;
  }
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// TTS Endpoint using gemini-3.1-flash-tts-preview
app.post("/api/tts", async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, voiceName = "Kore", mode = "single", speakers } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      res.status(400).json({ error: "El texto para convertir a voz es requerido." });
      return;
    }

    const ai = getGemini();

    let speechConfig: any;
    if (mode === "multi" && Array.isArray(speakers) && speakers.length === 2) {
      speechConfig = {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: speakers[0].speaker || "Locutor 1",
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: speakers[0].voice || "Fenrir" },
              },
            },
            {
              speaker: speakers[1].speaker || "Locutor 2",
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: speakers[1].voice || "Kore" },
              },
            },
          ],
        },
      };
    } else {
      speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceName || "Kore", // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          },
        },
      };
    }

    // Call gemini-3.1-flash-tts-preview
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text.trim() }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig,
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(
      (p: any) => p.inlineData && p.inlineData.data
    );

    if (!audioPart || !audioPart.inlineData?.data) {
      res.status(502).json({
        error: "No se recibió audio generado del modelo de voz.",
      });
      return;
    }

    const rawData = audioPart.inlineData.data;
    const rawMimeType = audioPart.inlineData.mimeType || "audio/pcm;rate=24000";

    // Convert raw PCM to a clean WAV container for full browser compatibility
    const rawBuffer = Buffer.from(rawData, "base64");
    const wavBuffer = pcmToWav(rawBuffer, 24000, 1, 16);
    const wavBase64 = wavBuffer.toString("base64");

    res.json({
      audioBase64: wavBase64,
      mimeType: "audio/wav",
      rawMimeType,
      sampleRate: 24000,
      sizeBytes: wavBuffer.length,
    });
  } catch (error: any) {
    console.error("Error in /api/tts:", error);
    res.status(500).json({
      error: error?.message || "Error al procesar la síntesis de voz con gemini-3.1-flash-tts-preview",
    });
  }
});

// AI Chapter Script Generation using gemini-3.8-flash
app.post("/api/generate-chapter", async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic, category, tone, durationFormat, speakerStyle } = req.body;

    const ai = getGemini();

    const systemInstruction = `Eres el redactor jefe y productor del programa y podcast ciclista "Zona XC", el espacio definitivo de Mountain Bike Cross-Country (XCO, XCM, gravel y carreras por etapas).
Tu tarea es escribir el libreto/guion para un "Nuevo Capítulo" de Zona XC.

Pautas de redacción:
1. El guion debe sonar apasionado, técnico, ágil y envolvente, usando terminología real de XC (vatios, repecho explosivo, singletrack, rock garden, presiones de neumáticos en bar/psi, horquillas, bloqueo remoto, cadencia, dropouts, curvas ciegas, zona de avituallamiento).
2. Si el estilo de locución es "multi", escribe un diálogo dinámico entre dos comentaristas con etiquetas claras:
   "Marc: [texto apasionado de relato]"
   "Elena: [análisis técnico y telemetría]"
   Si es "single", escribe un monólogo fluido para un narrador épico o divulgador de Zona XC.
3. El texto generado debe ser perfecto para ser leído en voz alta por el modelo TTS (sin acrónimos confusos ni tablas, con puntuación que guíe la respiración y el ritmo).`;

    const prompt = `Escribe el libreto de un Nuevo Capítulo de Zona XC con los siguientes parámetros:
- Tema o Enfoque: ${topic || "Resumen de la Copa del Mundo XCO y claves de puesta a punto"}
- Categoría: ${category || "Crónica de Carrera"}
- Tono: ${tone || "Épico y Técnico"}
- Formato de duración: ${durationFormat || "Episodio conciso (aprox 120-180 palabras)"}
- Estilo de voces: ${speakerStyle === "multi" ? "Diálogo entre dos locutores (Marc y Elena)" : "Un solo narrador"}

Devuelve un objeto JSON con:
{
  "title": "Título impactante del capítulo (ej: Capítulo 14: La Trampa de Raíces en Nové Město)",
  "subtitle": "Breve sinopsis (máximo 15 palabras)",
  "category": "Categoría (Copa del Mundo, Técnica & Setup, Crónica de Ruta, Entrenamiento)",
  "tags": ["XC", "XCO", "..."],
  "speakerStyle": "${speakerStyle || "single"}",
  "script": "Texto completo listo para TTS",
  "highlights": ["Punto clave 1", "Punto clave 2", "Punto clave 3"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { script: text, title: "Nuevo Capítulo Zona XC", subtitle: topic || "Episodio especial" };
    }

    res.json(data);
  } catch (error: any) {
    console.error("Error in /api/generate-chapter:", error);
    res.status(500).json({
      error: error?.message || "Error al redactar el nuevo capítulo",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Zona XC Server listening on port ${PORT}`);
  });
}

startServer();
