import { EmotionProbabilities, EmotionType, EMOTIONS } from '../types/emotion';

export interface HistoryRecord {
  timestamp: number;
  emotion: EmotionType;
  confidence: number;
  probabilities: EmotionProbabilities;
  valence: number;
  arousal: number;
}

export class TemporalFilter {
  private smoothedProbs: EmotionProbabilities | null = null;
  private alpha: number; // Smoothing factor (0 = all past, 1 = no smoothing)
  private history: HistoryRecord[] = [];
  private maxHistoryLength: number;

  constructor(alpha: number = 0.35, maxHistory: number = 100) {
    this.alpha = alpha;
    this.maxHistoryLength = maxHistory;
  }

  public setAlpha(alpha: number) {
    this.alpha = Math.max(0.05, Math.min(1.0, alpha));
  }

  public smooth(
    rawProbs: EmotionProbabilities,
    valence: number,
    arousal: number
  ): {
    smoothedProbs: EmotionProbabilities;
    primaryEmotion: EmotionType;
    confidence: number;
  } {
    if (!this.smoothedProbs) {
      this.smoothedProbs = { ...rawProbs };
    } else {
      let sum = 0;
      for (const emotion of EMOTIONS) {
        const prev = this.smoothedProbs[emotion];
        const curr = rawProbs[emotion];
        const val = prev * (1 - this.alpha) + curr * this.alpha;
        this.smoothedProbs[emotion] = val;
        sum += val;
      }
      // Re-normalize to ensure sum === 1.0
      if (sum > 0) {
        for (const emotion of EMOTIONS) {
          this.smoothedProbs[emotion] = parseFloat((this.smoothedProbs[emotion] / sum).toFixed(4));
        }
      }
    }

    // Determine primary emotion from smoothed distribution
    let maxVal = -1;
    let primary: EmotionType = 'neutral';
    for (const emotion of EMOTIONS) {
      if (this.smoothedProbs[emotion] > maxVal) {
        maxVal = this.smoothedProbs[emotion];
        primary = emotion;
      }
    }

    // Append to history buffer
    this.history.push({
      timestamp: Date.now(),
      emotion: primary,
      confidence: maxVal,
      probabilities: { ...this.smoothedProbs },
      valence,
      arousal,
    });

    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }

    return {
      smoothedProbs: { ...this.smoothedProbs },
      primaryEmotion: primary,
      confidence: maxVal,
    };
  }

  public getHistory(): HistoryRecord[] {
    return this.history;
  }

  public reset() {
    this.smoothedProbs = null;
    this.history = [];
  }
}
