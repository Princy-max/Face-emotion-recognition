import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));

// Initialize GoogleGenAI client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Deep Vision Emotion Analysis using Gemini 3.8 Flash
app.post('/api/gemini/analyze-emotion', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'Missing imageBase64 in request body' });
      return;
    }

    // Strip data url prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const systemInstruction = `You are an expert Computer Vision and Facial Expression Coding System (FACS) specialist.
Analyze the human facial expression in the provided image.
Classify the facial expression into the emotion classes: happy, sad, angry, surprised, fearful, neutral, disgusted, shy, nervous.
Assign confidence scores summing to 1.0 (or 100%).
Identify active Facial Action Units (AU) based on Paul Ekman's FACS (e.g. AU1, AU2, AU4, AU5, AU6, AU9, AU10, AU12, AU14, AU15, AU20, AU23, AU25, AU26, AU54, AU64).
- Happy: cheek raiser (AU6), lip corner puller (AU12).
- Sad: inner brow raiser (AU1), brow lowerer (AU4), lip corner depressor (AU15).
- Disgusted: nose wrinkler (AU9), upper lip raiser (AU10), squint.
- Shy: subtle smile (AU12), downward head tilt (AU54), averted gaze/eyes down (AU64).
- Nervous: lip stretcher (AU20), lip tightener/dimpler (AU14, AU23), inner brow tension (AU1), tense mouth.
Estimate emotional Valence (-1.0 to 1.0) and Arousal (-1.0 to 1.0) according to Russell's Circumplex Model.
Return valid JSON according to the schema.`;

    // Try resilient model candidates: gemini-3.1-flash-lite is fastest and highly available, fallback to gemini-3.8-flash
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let response: any = null;
    let lastErr: any = null;

    for (const model of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: 'Analyze the facial expression, Action Units, emotional coordinates, and emotion confidence distribution for this face.',
              },
            ],
          },
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                primaryEmotion: {
                  type: Type.STRING,
                  description: 'The dominant emotion: happy, sad, angry, surprised, fearful, neutral, disgusted, shy, or nervous',
                },
                confidence: {
                  type: Type.NUMBER,
                  description: 'Confidence of the primary emotion between 0.0 and 1.0',
                },
                probabilities: {
                  type: Type.OBJECT,
                  properties: {
                    happy: { type: Type.NUMBER },
                    sad: { type: Type.NUMBER },
                    angry: { type: Type.NUMBER },
                    surprised: { type: Type.NUMBER },
                    fearful: { type: Type.NUMBER },
                    neutral: { type: Type.NUMBER },
                    disgusted: { type: Type.NUMBER },
                    shy: { type: Type.NUMBER },
                    nervous: { type: Type.NUMBER },
                  },
                  required: ['happy', 'sad', 'angry', 'surprised', 'fearful', 'neutral', 'disgusted', 'shy', 'nervous'],
                },
                actionUnits: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: 'e.g. AU12, AU4, AU6' },
                      name: { type: Type.STRING, description: 'Action Unit anatomical name' },
                      intensity: { type: Type.NUMBER, description: 'Activation intensity from 0.0 to 1.0' },
                      description: { type: Type.STRING, description: 'Visual facial cue observed' },
                    },
                    required: ['id', 'name', 'intensity', 'description'],
                  },
                },
                valence: {
                  type: Type.NUMBER,
                  description: 'Valence coordinate from -1.0 (unpleasant) to 1.0 (pleasant)',
                },
                arousal: {
                  type: Type.NUMBER,
                  description: 'Arousal coordinate from -1.0 (passive/calm) to 1.0 (activated/high energy)',
                },
                faceBoundingBox: {
                  type: Type.OBJECT,
                  description: 'Normalized bounding box of the primary face detected in the image (values 0-1000)',
                  properties: {
                    ymin: { type: Type.NUMBER, description: 'Top edge normalized from 0 to 1000' },
                    xmin: { type: Type.NUMBER, description: 'Left edge normalized from 0 to 1000' },
                    ymax: { type: Type.NUMBER, description: 'Bottom edge normalized from 0 to 1000' },
                    xmax: { type: Type.NUMBER, description: 'Right edge normalized from 0 to 1000' },
                  },
                  required: ['ymin', 'xmin', 'ymax', 'xmax'],
                },
                microExpressions: {
                  type: Type.STRING,
                  description: 'Subtle or transient micro-expression cues observed',
                },
                geometricObservations: {
                  type: Type.STRING,
                  description: 'Observations regarding mouth curvature, eye opening, and brow knitting',
                },
              },
              required: ['primaryEmotion', 'confidence', 'probabilities', 'actionUnits', 'valence', 'arousal'],
            },
          },
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        lastErr = err;
        console.warn(`Model ${model} unavailable, trying next candidate...`, err.message?.slice(0, 80));
      }
    }

    if (!response || !response.text) {
      throw lastErr || new Error('All vision model candidates were unavailable');
    }

    const jsonText = response.text?.trim() || '{}';
    const parsed = JSON.parse(jsonText);
    res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing emotion with Gemini:', error);
    res.status(500).json({
      error: 'Failed to analyze emotion via Gemini Vision',
      details: error.message || 'Unknown error',
    });
  }
});

// Configure Vite middleware in development or serve static in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Emotion Recognition server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
