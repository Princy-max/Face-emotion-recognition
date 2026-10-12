import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header, NavTab } from './components/Header';
import { LiveStudio } from './components/LiveStudio';
import { PerformanceEvaluation } from './components/PerformanceEvaluation';
import {
  BenchmarkSample,
  EmotionAnalysisResult,
} from './types/emotion';
import {
  getStandardBenchmarkSuite,
} from './services/benchmarkDataset';
import {
  FullEvaluationRun,
  runDatasetEvaluation,
} from './services/evaluationEngine';
import { TemporalFilter } from './services/temporalFilter';
import { processFrame } from './services/cvPipeline';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('studio');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<EmotionAnalysisResult | null>(null);
  const [engine, setEngine] = useState<'edge-cv' | 'deep-vision'>('edge-cv');

  const initialSamples = useMemo(() => getStandardBenchmarkSuite(), []);
  const [benchmarkSamples, setBenchmarkSamples] = useState<BenchmarkSample[]>(initialSamples);

  // Evaluation Run state
  const [evaluationRun, setEvaluationRun] = useState<FullEvaluationRun | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalProgress, setEvalProgress] = useState<{ completed: number; total: number }>({
    completed: 0,
    total: initialSamples.length,
  });

  // Persistent Temporal Filter instance
  const temporalFilter = useMemo(() => new TemporalFilter(0.35, 120), []);

  // Run full evaluation suite
  const handleRunEvaluation = useCallback(async () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setEvalProgress({ completed: 0, total: benchmarkSamples.length });

    try {
      const run = await runDatasetEvaluation(benchmarkSamples, (completed, total) => {
        setEvalProgress({ completed, total });
      });
      setEvaluationRun(run);
    } catch (err) {
      console.error('Evaluation run failed:', err);
    } finally {
      setIsEvaluating(false);
    }
  }, [benchmarkSamples, isEvaluating]);

  // Initial evaluation run on mount so metrics are immediately accessible
  useEffect(() => {
    handleRunEvaluation();
  }, []);

  const handleToggleCamera = useCallback(() => {
    setIsCameraActive((prev) => !prev);
  }, []);

  const handleAddCustomSample = useCallback((sample: BenchmarkSample) => {
    setBenchmarkSamples((prev) => [sample, ...prev]);
  }, []);

  const handleSelectSample = useCallback((sample: BenchmarkSample) => {
    const img = new Image();
    img.onload = () => {
      const res = processFrame(img, { generateThumbs: true, groundTruth: sample.groundTruth });
      setCurrentResult(res);
    };
    img.src = sample.imageDataUrl;
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Clean 3-Zone Navigation Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCameraActive={isCameraActive}
        onToggleCamera={handleToggleCamera}
      />

      {/* Main Studio & Evaluation Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'studio' && (
          <LiveStudio
            currentResult={currentResult}
            onUpdateResult={setCurrentResult}
            isCameraActive={isCameraActive}
            onToggleCamera={handleToggleCamera}
            temporalFilter={temporalFilter}
            benchmarkSamples={benchmarkSamples}
            onSelectSample={handleSelectSample}
            engine={engine}
            onChangeEngine={setEngine}
          />
        )}

        {activeTab === 'evaluation' && (
          <PerformanceEvaluation
            evaluationRun={evaluationRun}
            onRunEvaluation={handleRunEvaluation}
            isRunning={isEvaluating}
            progress={evalProgress}
            onAddCustomSample={handleAddCustomSample}
            onSelectSampleForStudio={(sample) => {
              handleSelectSample(sample);
              setActiveTab('studio');
            }}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Real-Time Facial Emotion Recognition System · Adaptive Feature Tracking & Deep Vision
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>7 Universal Classes</span>
            <span aria-hidden="true">·</span>
            <span>Eye & Face Part Detection Bars</span>
            <span aria-hidden="true">·</span>
            <span>Accuracy, Precision, Recall & F1 Benchmarks</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
