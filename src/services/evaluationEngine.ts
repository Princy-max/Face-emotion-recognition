import {
  BenchmarkSample,
  EmotionType,
  EvaluationMetrics,
  PerClassMetrics,
  EMOTIONS,
} from '../types/emotion';
import { processFrame } from './cvPipeline';

export interface EvaluationSampleResult {
  sampleId: string;
  sampleName: string;
  groundTruth: EmotionType;
  predictedEmotion: EmotionType;
  confidence: number;
  isCorrect: boolean;
  latencyMs: number;
}

export interface FullEvaluationRun {
  metrics: EvaluationMetrics;
  sampleResults: EvaluationSampleResult[];
  datasetName: string;
  timestamp: number;
}

// Compute comprehensive classification metrics from ground truth & predictions
export function computeEvaluationMetrics(
  pairs: Array<{ groundTruth: EmotionType; predicted: EmotionType; latencyMs?: number }>
): EvaluationMetrics {
  const totalSamples = pairs.length;
  const nClasses = EMOTIONS.length;
  if (totalSamples === 0) {
    const emptyClassMetrics = {} as Record<EmotionType, PerClassMetrics>;
    EMOTIONS.forEach((e) => {
      emptyClassMetrics[e] = {
        tp: 0,
        fp: 0,
        fn: 0,
        tn: 0,
        precision: 0,
        recall: 0,
        specificity: 0,
        f1: 0,
        support: 0,
      };
    });
    return {
      accuracy: 0,
      macroPrecision: 0,
      macroRecall: 0,
      macroF1: 0,
      weightedF1: 0,
      confusionMatrix: Array(nClasses).fill(0).map(() => Array(nClasses).fill(0)),
      classMetrics: emptyClassMetrics,
      totalSamples: 0,
      correctSamples: 0,
      avgLatencyMs: 0,
    };
  }

  // Multi-Class confusion matrix: row = ground truth index, col = predicted index
  const confusionMatrix: number[][] = Array(nClasses)
    .fill(0)
    .map(() => Array(nClasses).fill(0));

  let correctCount = 0;
  let totalLatency = 0;

  pairs.forEach((p) => {
    const trueIdx = EMOTIONS.indexOf(p.groundTruth);
    const predIdx = EMOTIONS.indexOf(p.predicted);
    if (trueIdx >= 0 && predIdx >= 0) {
      confusionMatrix[trueIdx][predIdx]++;
    }
    if (p.groundTruth === p.predicted) {
      correctCount++;
    }
    if (p.latencyMs) {
      totalLatency += p.latencyMs;
    }
  });

  const accuracy = correctCount / totalSamples;

  const classMetrics = {} as Record<EmotionType, PerClassMetrics>;
  let macroPrecisionSum = 0;
  let macroRecallSum = 0;
  let macroF1Sum = 0;
  let weightedF1Sum = 0;

  EMOTIONS.forEach((emotion, i) => {
    const tp = confusionMatrix[i][i];
    let fp = 0;
    let fn = 0;
    let tn = 0;

    for (let row = 0; row < nClasses; row++) {
      for (let col = 0; col < nClasses; col++) {
        if (row === i && col !== i) fn += confusionMatrix[row][col];
        if (row !== i && col === i) fp += confusionMatrix[row][col];
        if (row !== i && col !== i) tn += confusionMatrix[row][col];
      }
    }

    const support = tp + fn;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = support > 0 ? tp / support : 0;
    const specificity = tn + fp > 0 ? tn / (tn + fp) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    classMetrics[emotion] = {
      tp,
      fp,
      fn,
      tn,
      precision: parseFloat(precision.toFixed(4)),
      recall: parseFloat(recall.toFixed(4)),
      specificity: parseFloat(specificity.toFixed(4)),
      f1: parseFloat(f1.toFixed(4)),
      support,
    };

    macroPrecisionSum += precision;
    macroRecallSum += recall;
    macroF1Sum += f1;
    weightedF1Sum += f1 * support;
  });

  const macroPrecision = macroPrecisionSum / EMOTIONS.length;
  const macroRecall = macroRecallSum / EMOTIONS.length;
  const macroF1 = macroF1Sum / EMOTIONS.length;
  const weightedF1 = totalSamples > 0 ? weightedF1Sum / totalSamples : 0;
  const avgLatencyMs = pairs.length > 0 ? totalLatency / pairs.length : 0;

  return {
    accuracy: parseFloat(accuracy.toFixed(4)),
    macroPrecision: parseFloat(macroPrecision.toFixed(4)),
    macroRecall: parseFloat(macroRecall.toFixed(4)),
    macroF1: parseFloat(macroF1.toFixed(4)),
    weightedF1: parseFloat(weightedF1.toFixed(4)),
    confusionMatrix,
    classMetrics,
    totalSamples,
    correctSamples: correctCount,
    avgLatencyMs: parseFloat(avgLatencyMs.toFixed(1)),
  };
}

// Run asynchronous batch evaluation on a benchmark dataset
export async function runDatasetEvaluation(
  samples: BenchmarkSample[],
  onProgress?: (completed: number, total: number) => void
): Promise<FullEvaluationRun> {
  const sampleResults: EvaluationSampleResult[] = [];
  const pairs: Array<{ groundTruth: EmotionType; predicted: EmotionType; latencyMs: number }> = [];

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    // Create image from sample data URL
    const img = await loadImage(sample.imageDataUrl);
    const start = performance.now();
    const result = processFrame(img, { groundTruth: sample.groundTruth });
    const elapsed = performance.now() - start;

    const isCorrect = result.primaryEmotion === sample.groundTruth;
    sampleResults.push({
      sampleId: sample.id,
      sampleName: sample.name,
      groundTruth: sample.groundTruth,
      predictedEmotion: result.primaryEmotion,
      confidence: result.confidence,
      isCorrect,
      latencyMs: Math.round(elapsed * 10) / 10,
    });

    pairs.push({
      groundTruth: sample.groundTruth,
      predicted: result.primaryEmotion,
      latencyMs: elapsed,
    });

    if (onProgress) {
      onProgress(i + 1, samples.length);
    }
  }

  const metrics = computeEvaluationMetrics(pairs);

  return {
    metrics,
    sampleResults,
    datasetName: 'Standard Benchmark Suite (FACS Balanced)',
    timestamp: Date.now(),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

// Export evaluation report as CSV string
export function exportMetricsToCSV(run: FullEvaluationRun): string {
  const lines: string[] = [];
  lines.push('FACIAL EMOTION RECOGNITION SYSTEM - CLASSIFICATION PERFORMANCE REPORT');
  lines.push(`Generated: ${new Date(run.timestamp).toISOString()}`);
  lines.push(`Dataset: ${run.datasetName}`);
  lines.push(`Total Samples: ${run.metrics.totalSamples}`);
  lines.push(`Correctly Classified: ${run.metrics.correctSamples}`);
  lines.push(`Overall Accuracy: ${(run.metrics.accuracy * 100).toFixed(2)}%`);
  lines.push(`Macro Precision: ${(run.metrics.macroPrecision * 100).toFixed(2)}%`);
  lines.push(`Macro Recall: ${(run.metrics.macroRecall * 100).toFixed(2)}%`);
  lines.push(`Macro F1-Score: ${(run.metrics.macroF1 * 100).toFixed(2)}%`);
  lines.push(`Weighted F1-Score: ${(run.metrics.weightedF1 * 100).toFixed(2)}%`);
  lines.push(`Mean Latency: ${run.metrics.avgLatencyMs} ms`);
  lines.push('');
  lines.push('PER-CLASS CLASSIFICATION REPORT:');
  lines.push('Emotion,Support,TP,FP,FN,TN,Precision,Recall,Specificity,F1-Score');

  EMOTIONS.forEach((e) => {
    const m = run.metrics.classMetrics[e];
    lines.push(
      `${e.toUpperCase()},${m.support},${m.tp},${m.fp},${m.fn},${m.tn},${(m.precision * 100).toFixed(2)}%,${(m.recall * 100).toFixed(2)}%,${(m.specificity * 100).toFixed(2)}%,${(m.f1 * 100).toFixed(2)}%`
    );
  });

  lines.push('');
  lines.push('CONFUSION MATRIX (Row=Ground Truth, Col=Predicted):');
  lines.push(`GroundTruth/Predicted,${EMOTIONS.join(',')}`);
  EMOTIONS.forEach((rowEmotion, rowIdx) => {
    const rowCounts = run.metrics.confusionMatrix[rowIdx].join(',');
    lines.push(`${rowEmotion.toUpperCase()},${rowCounts}`);
  });

  lines.push('');
  lines.push('SAMPLE-LEVEL PREDICTIONS:');
  lines.push('Sample ID,Sample Name,Ground Truth,Predicted Emotion,Confidence,Result,Latency (ms)');
  run.sampleResults.forEach((s) => {
    lines.push(
      `"${s.sampleId}","${s.sampleName}",${s.groundTruth},${s.predictedEmotion},${(s.confidence * 100).toFixed(1)}%,${s.isCorrect ? 'CORRECT' : 'INCORRECT'},${s.latencyMs}`
    );
  });

  return lines.join('\n');
}
