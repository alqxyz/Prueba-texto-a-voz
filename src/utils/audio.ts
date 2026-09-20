/**
 * Audio helper utilities for Zona XC Text-to-Speech
 */

export function base64ToBlobUrl(base64: string, mimeType = "audio/wav"): string {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return URL.createObjectURL(blob);
}

export function downloadWavFile(base64: string, fileName: string) {
  const url = base64ToBlobUrl(base64, "audio/wav");
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".wav") ? fileName : `${fileName}.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function generateSyntheticWaveform(length = 32): number[] {
  const bars: number[] = [];
  for (let i = 0; i < length; i++) {
    // Generate organic sounding audio waveform heights
    const sin1 = Math.sin(i * 0.4);
    const sin2 = Math.cos(i * 0.7);
    const height = Math.abs(sin1 * 0.6 + sin2 * 0.4);
    bars.push(Math.max(0.15, Math.min(0.95, height)));
  }
  return bars;
}
