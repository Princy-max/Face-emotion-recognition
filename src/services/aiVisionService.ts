import { EmotionAnalysisResult, EmotionType, EMOTIONS } from '../types/emotion';

export interface GeminiEmotionResponse {
  primaryEmotion: EmotionType;
  confidence: number;
  probabilities: Record<EmotionType, number>;
  actionUnits: Array<{
    id: string;
    name: string;
    intensity: number;
    description: string;
  }>;
  valence: number;
  arousal: number;
  faceBoundingBox?: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  };
  microExpressions?: string;
  geometricObservations?: string;
}

/**
 * Capture current face ROI or whole video frame into a compressed JPEG base64 DataURL
 */
export function captureFrameBase64(
  source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  maxDimension: number = 400
): string | null {
  try {
    let sW = 640;
    let sH = 480;
    if ('videoWidth' in source && (source as HTMLVideoElement).videoWidth > 0) {
      sW = (source as HTMLVideoElement).videoWidth;
      sH = (source as HTMLVideoElement).videoHeight;
    } else if ('naturalWidth' in source && (source as HTMLImageElement).naturalWidth > 0) {
      sW = (source as HTMLImageElement).naturalWidth;
      sH = (source as HTMLImageElement).naturalHeight;
    } else if ('width' in source) {
      sW = (source as any).width || 640;
      sH = (source as any).height || 480;
    }

    const scale = Math.min(1.0, maxDimension / Math.max(sW, sH));
    const targetW = Math.max(64, Math.round(sW * scale));
    const targetH = Math.max(64, Math.round(sH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(source, 0, 0, targetW, targetH);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (err) {
    console.error('Failed to capture frame base64:', err);
    return null;
  }
}

/**
 * Perform Deep Vision FACS & Emotion Recognition using Gemini 3.8 Flash Vision model
 */
export async function analyzeEmotionWithGemini(
  base64Image: string
): Promise<GeminiEmotionResponse> {
  const response = await fetch('/api/gemini/analyze-emotion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64: base64Image }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.details || `Server error ${response.status}`);
  }

  const data = await response.json();

  // Validate and sanitize probabilities
  const sanitizedProbs: Record<EmotionType, number> = {} as any;
  let probSum = 0;
  for (const emotion of EMOTIONS) {
    const val = typeof data.probabilities?.[emotion] === 'number' ? data.probabilities[emotion] : 0.05;
    sanitizedProbs[emotion] = Math.max(0, val);
    probSum += sanitizedProbs[emotion];
  }

  // Normalize to 1.0
  if (probSum > 0) {
    for (const emotion of EMOTIONS) {
      sanitizedProbs[emotion] = parseFloat((sanitizedProbs[emotion] / probSum).toFixed(3));
    }
  }

  // Determine primary emotion
  let maxP = -1;
  let primary: EmotionType = 'neutral';
  for (const emotion of EMOTIONS) {
    if (sanitizedProbs[emotion] > maxP) {
      maxP = sanitizedProbs[emotion];
      primary = emotion;
    }
  }

  return {
    primaryEmotion: (data.primaryEmotion as EmotionType) || primary,
    confidence: typeof data.confidence === 'number' ? Math.min(1.0, data.confidence) : maxP,
    probabilities: sanitizedProbs,
    actionUnits: Array.isArray(data.actionUnits) ? data.actionUnits : [],
    valence: typeof data.valence === 'number' ? data.valence : 0,
    arousal: typeof data.arousal === 'number' ? data.arousal : 0,
    faceBoundingBox: data.faceBoundingBox,
    microExpressions: data.microExpressions || data.geometricObservations || 'Identified with Gemini Deep Vision FACS',
    geometricObservations: data.geometricObservations,
  };
}
