import { EMOTIONS, EmotionType } from '../types/emotion';
import { generateSyntheticFace } from './benchmarkDataset';

// Generates an animated video Blob URL using Canvas + MediaRecorder
export function generateDemoVideoBlob(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const size = 320;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Pre-render face keyframes including Happy, Sad, Disgusted, Shy, Nervous, etc.
      const emotionSequence: EmotionType[] = ['neutral', 'happy', 'sad', 'disgusted', 'shy', 'nervous', 'surprised', 'angry'];
      const keyframeImgs: HTMLImageElement[] = [];
      let loadedCount = 0;

      emotionSequence.forEach((em, i) => {
        const img = new Image();
        img.onload = () => {
          loadedCount++;
          if (loadedCount === emotionSequence.length) {
            startRecording();
          }
        };
        img.onerror = () => {
          reject(new Error('Failed to load demo face frames'));
        };
        img.src = generateSyntheticFace(em, i % 3, size);
        keyframeImgs.push(img);
      });

      function startRecording() {
        const fps = 25;
        const durationPerEmotion = 1.2; // seconds
        const totalDuration = emotionSequence.length * durationPerEmotion;
        const totalFrames = Math.round(totalDuration * fps);

        let stream: MediaStream;
        try {
          stream = canvas.captureStream(fps);
        } catch (e) {
          reject(new Error('captureStream not supported in this browser'));
          return;
        }

        let mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
          }
        }

        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 1500000,
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          resolve(url);
        };

        recorder.start();

        let currentFrame = 0;
        const interval = setInterval(() => {
          if (currentFrame >= totalFrames) {
            clearInterval(interval);
            recorder.stop();
            return;
          }

          const progress = currentFrame / totalFrames;
          const currentStage = Math.floor(progress * emotionSequence.length);
          const nextStage = Math.min(emotionSequence.length - 1, currentStage + 1);
          const stageT = (progress * emotionSequence.length) % 1;

          // Cross-fade blend between current and next stage images
          ctx.clearRect(0, 0, size, size);
          ctx.globalAlpha = 1.0;
          if (keyframeImgs[currentStage]) {
            ctx.drawImage(keyframeImgs[currentStage], 0, 0, size, size);
          }
          if (keyframeImgs[nextStage] && stageT > 0) {
            ctx.globalAlpha = stageT;
            ctx.drawImage(keyframeImgs[nextStage], 0, 0, size, size);
          }
          ctx.globalAlpha = 1.0;

          // Timecode indicator
          ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
          ctx.fillRect(8, 8, 120, 20);
          ctx.fillStyle = '#06B6D4';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText(`DEMO ${(currentFrame / fps).toFixed(1)}s`, 14, 22);

          currentFrame++;
        }, 1000 / fps);
      }
    } catch (err) {
      reject(err);
    }
  });
}
