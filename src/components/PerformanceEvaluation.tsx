import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Download,
  Play,
  Upload,
  RefreshCw,
  Sliders,
  HelpCircle,
  Filter,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import {
  BenchmarkSample,
  EmotionType,
  EvaluationMetrics,
  EMOTIONS,
  EMOTION_METAS,
} from '../types/emotion';
import {
  FullEvaluationRun,
  exportMetricsToCSV,
} from '../services/evaluationEngine';

interface PerformanceEvaluationProps {
  evaluationRun: FullEvaluationRun | null;
  onRunEvaluation: () => Promise<void>;
  isRunning: boolean;
  progress: { completed: number; total: number };
  onAddCustomSample: (sample: BenchmarkSample) => void;
  onSelectSampleForStudio: (sample: BenchmarkSample) => void;
}

export const PerformanceEvaluation: React.FC<PerformanceEvaluationProps> = ({
  evaluationRun,
  onRunEvaluation,
  isRunning,
  progress,
  onAddCustomSample,
  onSelectSampleForStudio,
}) => {
  const [matrixViewMode, setMatrixViewMode] = useState<'counts' | 'percentages'>('percentages');
  const [sampleFilter, setSampleFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  // Custom Sample Upload Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [customSampleName, setCustomSampleName] = useState<string>('');
  const [customGroundTruth, setCustomGroundTruth] = useState<EmotionType>('happy');
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);

  const metrics: EvaluationMetrics | undefined = evaluationRun?.metrics;

  const handleExportCSV = () => {
    if (!evaluationRun) return;
    const csvContent = exportMetricsToCSV(evaluationRun);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `facial_emotion_evaluation_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (!evaluationRun) return;
    const jsonStr = JSON.stringify(evaluationRun, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `facial_emotion_evaluation_run_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCustomImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!customSampleName) {
      setCustomSampleName(file.name.replace(/\.[^/.]+$/, ''));
    }

    const isVideo =
      file.type.startsWith('video/') ||
      /\.(mp4|webm|mov|ogg|m4v|mkv|avi)$/i.test(file.name);

    if (isVideo) {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      const url = URL.createObjectURL(file);
      video.src = url;

      video.onloadeddata = () => {
        video.currentTime = Math.min(1.0, (video.duration || 1) * 0.3);
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCustomImagePreview(dataUrl);
        URL.revokeObjectURL(url);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
      };
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitCustomSample = () => {
    if (!customImagePreview) return;
    const newSample: BenchmarkSample = {
      id: `custom-${Date.now()}`,
      name: customSampleName || `Custom ${customGroundTruth.toUpperCase()}`,
      groundTruth: customGroundTruth,
      imageDataUrl: customImagePreview,
      source: 'custom',
      description: 'User-provided annotated facial sample for validation',
      metadata: { intensity: 'moderate' },
    };
    onAddCustomSample(newSample);
    setIsUploadModalOpen(false);
    setCustomImagePreview(null);
    setCustomSampleName('');
  };

  const filteredSamples = evaluationRun?.sampleResults.filter((s) => {
    if (sampleFilter === 'correct') return s.isCorrect;
    if (sampleFilter === 'incorrect') return !s.isCorrect;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top Action & Benchmark Controller */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1">
            Empirical Model Evaluation Bench
          </div>
          <h2 className="text-xl font-bold text-white">
            Classification Performance & Statistical Rigor
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Evaluate multi-class generalization across 7 universal emotion categories. Measures Accuracy, Macro Precision, Macro Recall, and F1-Scores against standardized ground truth.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => onRunEvaluation()}
            disabled={isRunning}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
              isRunning
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>
                  Testing {progress.completed}/{progress.total}...
                </span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Evaluation Benchmark</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Add Test Sample</span>
          </button>

          {evaluationRun && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportCSV}
                className="px-3 py-2.5 rounded-lg text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download CSV Report"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleExportJSON}
                className="px-3 py-2.5 rounded-lg text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download JSON Report"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar when running */}
      {isRunning && (
        <div className="bg-slate-900 p-4 rounded-xl border border-cyan-500/30">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-cyan-300">
              Evaluating Benchmark Images...
            </span>
            <span className="font-mono text-cyan-400 tabular-nums">
              {progress.completed} of {progress.total} (
              {Math.round((progress.completed / (progress.total || 1)) * 100)}%)
            </span>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-150"
              style={{
                width: `${(progress.completed / (progress.total || 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* 4 Primary Metric Scorecards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Accuracy */}
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 relative overflow-hidden">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Overall Accuracy
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-cyan-400 tabular-nums">
                {(metrics.accuracy * 100).toFixed(2)}%
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              {metrics.correctSamples} / {metrics.totalSamples} correct samples
            </div>
          </div>

          {/* Macro Precision */}
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 relative overflow-hidden">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Macro Precision
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                {(metrics.macroPrecision * 100).toFixed(2)}%
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              TP / (TP + FP) unweighted
            </div>
          </div>

          {/* Macro Recall */}
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 relative overflow-hidden">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Macro Recall
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-blue-400 tabular-nums">
                {(metrics.macroRecall * 100).toFixed(2)}%
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Sensitivity across 7 classes
            </div>
          </div>

          {/* Macro F1-Score */}
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 relative overflow-hidden">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Macro F1-Score
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-purple-400 tabular-nums">
                {(metrics.macroF1 * 100).toFixed(2)}%
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-1">
              Weighted F1: {(metrics.weightedF1 * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      {/* Confusion Matrix Section */}
      {metrics && (
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-semibold text-white">
                Multi-Class Confusion Matrix ({EMOTIONS.length}×{EMOTIONS.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rows represent true ground-truth classes. Columns represent predicted classes. Diagonal cells represent correct classifications.
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
              <button
                onClick={() => setMatrixViewMode('percentages')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  matrixViewMode === 'percentages'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Row Normalized %
              </button>
              <button
                onClick={() => setMatrixViewMode('counts')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  matrixViewMode === 'counts'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sample Counts
              </button>
            </div>
          </div>

          {/* Matrix Grid Container */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[720px]">
              {/* Predicted Axis Label */}
              <div className="text-center text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400 mb-2">
                Predicted Class &rarr;
              </div>

              <div
                className="grid gap-1.5 text-xs font-mono"
                style={{ gridTemplateColumns: `110px repeat(${EMOTIONS.length}, minmax(0, 1fr))` }}
              >
                {/* Header Top-Left empty corner */}
                <div className="p-2 text-[10px] text-slate-500 uppercase font-semibold flex items-center justify-center">
                  True \ Pred
                </div>

                {/* Column Headers */}
                {EMOTIONS.map((colEmotion) => (
                  <div
                    key={colEmotion}
                    className="p-2 text-center font-bold text-slate-300 capitalize truncate"
                    title={colEmotion}
                  >
                    {colEmotion.slice(0, 4)}
                  </div>
                ))}

                {/* Matrix Rows */}
                {EMOTIONS.map((rowEmotion, rowIdx) => {
                  const rowTotal = metrics.confusionMatrix[rowIdx].reduce((a, b) => a + b, 0);

                  return (
                    <React.Fragment key={rowEmotion}>
                      {/* Row Label (Ground Truth) */}
                      <div className="p-2 font-bold text-slate-300 capitalize flex items-center justify-between">
                        <span>{rowEmotion}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({rowTotal})
                        </span>
                      </div>

                      {/* Cell Values */}
                      {EMOTIONS.map((colEmotion, colIdx) => {
                        const count = metrics.confusionMatrix[rowIdx][colIdx];
                        const pct = rowTotal > 0 ? (count / rowTotal) * 100 : 0;
                        const isDiagonal = rowIdx === colIdx;
                        const isSelected =
                          selectedCell?.row === rowIdx && selectedCell?.col === colIdx;

                        // Cell Heatmap Color
                        let cellBg = 'bg-slate-950/40 border-slate-900';
                        let textColor = 'text-slate-600';

                        if (isDiagonal) {
                          if (pct >= 80) {
                            cellBg = 'bg-cyan-500/30 border-cyan-500/50';
                            textColor = 'text-cyan-200 font-bold';
                          } else if (pct >= 50) {
                            cellBg = 'bg-cyan-500/20 border-cyan-500/30';
                            textColor = 'text-cyan-300 font-bold';
                          } else if (pct > 0) {
                            cellBg = 'bg-cyan-500/10 border-cyan-500/20';
                            textColor = 'text-cyan-400';
                          }
                        } else if (count > 0) {
                          cellBg = 'bg-rose-500/15 border-rose-500/30';
                          textColor = 'text-rose-300 font-medium';
                        }

                        return (
                          <button
                            key={`${rowIdx}-${colIdx}`}
                            onClick={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                            className={`p-2.5 rounded border text-center transition-all cursor-pointer relative group ${cellBg} ${
                              isSelected ? 'ring-2 ring-cyan-400 z-10' : ''
                            }`}
                            title={`True: ${rowEmotion}, Pred: ${colEmotion} - Count: ${count} (${pct.toFixed(1)}%)`}
                          >
                            <span className={`tabular-nums ${textColor}`}>
                              {matrixViewMode === 'percentages' ? `${pct.toFixed(0)}%` : count}
                            </span>
                          </button>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Cell Inspector */}
          {selectedCell && (
            <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400">Inspecting Cell: </span>
                <span className="font-bold text-white capitalize">
                  True {EMOTIONS[selectedCell.row]}
                </span>
                <span className="text-slate-500"> predicted as </span>
                <span className="font-bold text-cyan-400 capitalize">
                  {EMOTIONS[selectedCell.col]}
                </span>
              </div>
              <div className="font-mono text-slate-300">
                Count: {metrics.confusionMatrix[selectedCell.row][selectedCell.col]} samples
              </div>
            </div>
          )}
        </div>
      )}

      {/* Per-Class Classification Report Table */}
      {metrics && (
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                Detailed Classification Report (Per Emotion Class)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Precision = TP / (TP + FP) · Recall = TP / (TP + FN) · F1 = 2 · (P · R) / (P + R)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                  <th className="py-3 px-3">Class</th>
                  <th className="py-3 px-3">Support</th>
                  <th className="py-3 px-3">TP</th>
                  <th className="py-3 px-3">FP</th>
                  <th className="py-3 px-3">FN</th>
                  <th className="py-3 px-3">Precision</th>
                  <th className="py-3 px-3">Recall</th>
                  <th className="py-3 px-3">Specificity</th>
                  <th className="py-3 px-3">F1-Score</th>
                  <th className="py-3 px-3 w-32">F1 Meter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {EMOTIONS.map((emotion) => {
                  const m = metrics.classMetrics[emotion];
                  const meta = EMOTION_METAS[emotion];

                  return (
                    <tr key={emotion} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-white capitalize flex items-center gap-2">
                        <span>{meta.emoji}</span>
                        <span>{meta.label}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 tabular-nums">{m.support}</td>
                      <td className="py-3 px-3 text-emerald-400 tabular-nums font-semibold">
                        {m.tp}
                      </td>
                      <td className="py-3 px-3 text-rose-400 tabular-nums">{m.fp}</td>
                      <td className="py-3 px-3 text-amber-400 tabular-nums">{m.fn}</td>
                      <td className="py-3 px-3 text-slate-200 tabular-nums">
                        {(m.precision * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-slate-200 tabular-nums">
                        {(m.recall * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-slate-400 tabular-nums">
                        {(m.specificity * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-cyan-400 font-bold tabular-nums">
                        {(m.f1 * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-3">
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${Math.max(2, m.f1 * 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-700 font-mono font-bold text-slate-200">
                <tr>
                  <td className="py-3 px-3 uppercase">Macro Average</td>
                  <td className="py-3 px-3">{metrics.totalSamples}</td>
                  <td className="py-3 px-3 text-emerald-400">{metrics.correctSamples}</td>
                  <td className="py-3 px-3">-</td>
                  <td className="py-3 px-3">-</td>
                  <td className="py-3 px-3 text-emerald-400">
                    {(metrics.macroPrecision * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-blue-400">
                    {(metrics.macroRecall * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-3">-</td>
                  <td className="py-3 px-3 text-cyan-400 font-bold">
                    {(metrics.macroF1 * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-3">
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${metrics.macroF1 * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Sample-by-Sample Inspection Table */}
      {evaluationRun && (
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                Sample-Level Verification Log ({evaluationRun.sampleResults.length} cases)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect individual predictions, ground truth alignment, and inference latency.
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
              <button
                onClick={() => setSampleFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  sampleFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({evaluationRun.sampleResults.length})
              </button>
              <button
                onClick={() => setSampleFilter('correct')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  sampleFilter === 'correct'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Correct ({metrics?.correctSamples})
              </button>
              <button
                onClick={() => setSampleFilter('incorrect')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  sampleFilter === 'incorrect'
                    ? 'bg-slate-800 text-rose-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Errors ({(metrics?.totalSamples || 0) - (metrics?.correctSamples || 0)})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 scrollbar-thin">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Sample</th>
                  <th className="py-2.5 px-3">Ground Truth</th>
                  <th className="py-2.5 px-3">Predicted Class</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredSamples?.map((sample) => (
                  <tr key={sample.sampleId} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-300 font-medium">{sample.sampleName}</td>
                    <td className="py-2 px-3 capitalize text-slate-200">
                      {EMOTION_METAS[sample.groundTruth].emoji} {sample.groundTruth}
                    </td>
                    <td className="py-2 px-3 capitalize font-bold text-white">
                      {EMOTION_METAS[sample.predictedEmotion].emoji} {sample.predictedEmotion}
                    </td>
                    <td className="py-2 px-3 tabular-nums text-slate-300">
                      {(sample.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3">
                      {sample.isCorrect ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>MATCH</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1 font-bold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>MISMATCH</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 tabular-nums text-slate-400">{sample.latencyMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Custom Labeled Test Sample Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Add Annotated Test Sample</h3>
            <p className="text-xs text-slate-400">
              Upload an image and specify its ground truth emotion to add it to the active benchmark dataset.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Sample Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Subject-42 High Joy"
                  value={customSampleName}
                  onChange={(e) => setCustomSampleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Ground Truth Emotion
                </label>
                <select
                  value={customGroundTruth}
                  onChange={(e) => setCustomGroundTruth(e.target.value as EmotionType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 capitalize"
                >
                  {EMOTIONS.map((e) => (
                    <option key={e} value={e}>
                      {EMOTION_METAS[e].emoji} {EMOTION_METAS[e].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Face Video or Photo
                </label>
                <input
                  type="file"
                  accept="video/*,image/*,.mp4,.webm,.mov,.m4v,.mkv,.avi"
                  onChange={handleCustomImageFile}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-300 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              {customImagePreview && (
                <div className="w-28 h-28 mx-auto rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                  <img
                    src={customImagePreview}
                    alt="Custom Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitCustomSample}
                disabled={!customImagePreview}
                className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer ${
                  customImagePreview
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Save & Add to Dataset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
