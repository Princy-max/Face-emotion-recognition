import React from 'react';
import {
  Compass,
  Activity,
  History,
  TrendingUp,
  Clock,
  Info,
} from 'lucide-react';
import {
  EmotionAnalysisResult,
  EMOTIONS,
  EMOTION_METAS,
  EmotionType,
} from '../types/emotion';
import { HistoryRecord } from '../services/temporalFilter';

interface AffectiveAnalyticsProps {
  currentResult: EmotionAnalysisResult | null;
  history: HistoryRecord[];
}

export const AffectiveAnalytics: React.FC<AffectiveAnalyticsProps> = ({
  currentResult,
  history,
}) => {
  const valence = currentResult?.valence ?? 0;
  const arousal = currentResult?.arousal ?? 0;
  const primaryEmotion = currentResult?.primaryEmotion ?? 'neutral';
  const meta = EMOTION_METAS[primaryEmotion];

  // Map [-1, 1] coordinates to SVG [0, 360] coordinate system
  const toSvgX = (v: number) => 180 + v * 150;
  const toSvgY = (a: number) => 180 - a * 150; // Invert Y for cartesian

  // Compute session time distribution across emotions
  const emotionCounts: Record<EmotionType, number> = {} as any;
  EMOTIONS.forEach((e) => {
    emotionCounts[e] = 0;
  });

  history.forEach((h) => {
    if (typeof emotionCounts[h.emotion] === 'number') {
      emotionCounts[h.emotion]++;
    }
  });

  const totalHistoryCount = Math.max(1, history.length);

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1">
            Dimensional Affective Psychology
          </div>
          <h2 className="text-xl font-bold text-white">
            Russell's 2D Circumplex Model of Affect & Emotional Trajectory
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Continuous mapping of facial expressions along continuous orthographic axes of Valence (Pleasantness vs Aversion) and Arousal (Physiological Activation vs Deactivation).
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono shrink-0">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Valence (x)</span>
            <span
              className={`font-bold tabular-nums text-sm ${
                valence > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {valence > 0 ? `+${valence}` : valence}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Arousal (y)</span>
            <span
              className={`font-bold tabular-nums text-sm ${
                arousal > 0 ? 'text-amber-400' : 'text-blue-400'
              }`}
            >
              {arousal > 0 ? `+${arousal}` : arousal}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: 2D Circumplex Space & Rolling Emotion Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Russell's Circumplex Coordinate Canvas (6 columns) */}
        <div className="lg:col-span-6 bg-slate-900 rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Affective Space (Valence vs Arousal)</span>
            </h3>
            <span className="text-xs font-mono text-slate-500">Continuous 2D Plane</span>
          </div>

          <div className="relative aspect-square max-w-[420px] mx-auto bg-slate-950 rounded-xl border border-slate-800 overflow-hidden p-2">
            <svg viewBox="0 0 360 360" className="w-full h-full">
              {/* Outer boundary circles */}
              <circle cx="180" cy="180" r="150" fill="none" stroke="#1E293B" strokeWidth="1.5" />
              <circle cx="180" cy="180" r="100" fill="none" stroke="#1E293B" strokeDasharray="3,3" />
              <circle cx="180" cy="180" r="50" fill="none" stroke="#1E293B" strokeDasharray="3,3" />

              {/* Quadrant Tinting */}
              {/* Q1: Top-Right (Pleasant / Activated) */}
              <rect x="180" y="30" width="150" height="150" fill="rgba(16, 185, 129, 0.03)" />
              {/* Q2: Top-Left (Unpleasant / Activated) */}
              <rect x="30" y="30" width="150" height="150" fill="rgba(239, 68, 68, 0.03)" />
              {/* Q3: Bottom-Left (Unpleasant / Deactivated) */}
              <rect x="30" y="180" width="150" height="150" fill="rgba(59, 130, 246, 0.03)" />
              {/* Q4: Bottom-Right (Pleasant / Deactivated) */}
              <rect x="180" y="180" width="150" height="150" fill="rgba(20, 184, 166, 0.03)" />

              {/* Axes lines */}
              <line x1="30" y1="180" x2="330" y2="180" stroke="#334155" strokeWidth="1.5" />
              <line x1="180" y1="30" x2="180" y2="330" stroke="#334155" strokeWidth="1.5" />

              {/* Axis Labels */}
              <text x="325" y="174" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="end">
                + VALENCE (Pleasant)
              </text>
              <text x="35" y="174" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="start">
                - VALENCE (Unpleasant)
              </text>
              <text x="185" y="44" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="start">
                + AROUSAL (Activated)
              </text>
              <text x="185" y="325" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="start">
                - AROUSAL (Deactivated)
              </text>

              {/* Emotion Anchor Points */}
              {EMOTIONS.map((e) => {
                const em = EMOTION_METAS[e];
                const ex = toSvgX(em.valence);
                const ey = toSvgY(em.arousal);
                const isCurrent = primaryEmotion === e;

                return (
                  <g key={e} className="transition-all">
                    <circle
                      cx={ex}
                      cy={ey}
                      r={isCurrent ? 7 : 4}
                      fill={em.color}
                      opacity={isCurrent ? 1 : 0.6}
                    />
                    <text
                      x={ex}
                      y={ey + (em.arousal > 0 ? -10 : 15)}
                      fill={isCurrent ? '#FFFFFF' : '#94A3B8'}
                      fontSize={isCurrent ? '11' : '9'}
                      fontWeight={isCurrent ? 'bold' : 'normal'}
                      fontFamily="sans-serif"
                      textAnchor="middle"
                    >
                      {em.emoji} {em.label}
                    </text>
                  </g>
                );
              })}

              {/* Historical Trajectory Path */}
              {history.length > 1 && (
                <polyline
                  points={history
                    .slice(-25)
                    .map((h) => `${toSvgX(h.valence)},${toSvgY(h.arousal)}`)
                    .join(' ')}
                  fill="none"
                  stroke="rgba(6, 182, 212, 0.4)"
                  strokeWidth="2"
                  strokeDasharray="2,2"
                />
              )}

              {/* Current Live Cursor with Glow */}
              <circle
                cx={toSvgX(valence)}
                cy={toSvgY(arousal)}
                r="12"
                fill="none"
                stroke={meta.color}
                strokeWidth="2"
                className="animate-ping opacity-60"
              />
              <circle
                cx={toSvgX(valence)}
                cy={toSvgY(arousal)}
                r="6"
                fill={meta.color}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-emerald-400 font-semibold block">Q1: High Energy Joy</span>
              Excitement, Delight, Happiness
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-rose-400 font-semibold block">Q2: Tense Arousal</span>
              Anger, Fear, Frustration
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-blue-400 font-semibold block">Q3: Low Energy Negative</span>
              Sadness, Grief, Despair
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-teal-400 font-semibold block">Q4: Low Energy Positive</span>
              Calm, Serenity, Contentment
            </div>
          </div>
        </div>

        {/* Rolling Time-Series Trajectory & Session Distribution (6 columns) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Time Series Ribbon */}
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Rolling Emotion Trajectory (Last 60 Frames)</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">Live Temporal Window</span>
            </div>

            {/* Time Series Canvas Simulation */}
            <div className="h-44 bg-slate-950 rounded-xl border border-slate-800 p-3 relative flex flex-col justify-between">
              {history.length > 2 ? (
                <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="w-full h-full">
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="300" y2="30" stroke="#1E293B" strokeWidth="0.5" />
                  <line x1="0" y1="60" x2="300" y2="60" stroke="#1E293B" strokeWidth="0.5" />
                  <line x1="0" y1="90" x2="300" y2="90" stroke="#1E293B" strokeWidth="0.5" />

                  {/* Draw Confidence curve for primary emotion */}
                  <polyline
                    points={history
                      .slice(-40)
                      .map((h, i, arr) => {
                        const x = (i / (arr.length - 1 || 1)) * 300;
                        const y = 110 - h.confidence * 95;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke={meta.color}
                    strokeWidth="2.5"
                  />

                  {/* Valence Line (dashed cyan) */}
                  <polyline
                    points={history
                      .slice(-40)
                      .map((h, i, arr) => {
                        const x = (i / (arr.length - 1 || 1)) * 300;
                        const y = 60 - h.valence * 45;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#06B6D4"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                  />
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-slate-500">
                  Capturing temporal frames...
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  <span>Primary Confidence %</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Valence Metric</span>
                </span>
                <span>Past 60 Frames &rarr;</span>
              </div>
            </div>
          </div>

          {/* Session Emotion State Distribution */}
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Session Temporal Distribution</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Aggregate percentage of time spent in each emotion during the active session.
            </p>

            {/* Segmented Cumulative Bar */}
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex mb-4 border border-slate-800">
              {EMOTIONS.map((e) => {
                const count = emotionCounts[e];
                const pct = (count / totalHistoryCount) * 100;
                if (pct <= 0) return null;
                return (
                  <div
                    key={e}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: EMOTION_METAS[e].color,
                    }}
                    title={`${EMOTION_METAS[e].label}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
            </div>

            {/* Grid breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {EMOTIONS.map((e) => {
                const count = emotionCounts[e];
                const pct = ((count / totalHistoryCount) * 100).toFixed(1);
                const em = EMOTION_METAS[e];

                return (
                  <div
                    key={e}
                    className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span>{em.emoji}</span>
                      <span className="capitalize">{em.label}</span>
                    </span>
                    <span className="font-bold tabular-nums text-slate-200">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
