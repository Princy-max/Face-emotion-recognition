import React from 'react';
import {
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Eye,
  Smile,
  Activity,
  ScanFace,
  Info,
} from 'lucide-react';
import {
  EmotionAnalysisResult,
  EMOTION_METAS,
  ActionUnit,
  GeometricFeatures,
} from '../types/emotion';

interface PreprocessingStudioProps {
  currentResult: EmotionAnalysisResult | null;
  onSelectSampleForAnalysis?: () => void;
}

export const PreprocessingStudio: React.FC<PreprocessingStudioProps> = ({
  currentResult,
}) => {
  if (!currentResult) {
    return (
      <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800">
        <ScanFace className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">No Face Data Available</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Start the camera or select a sample image from the Live Recognition tab to inspect the preprocessing transformations and extracted features.
        </p>
      </div>
    );
  }

  const { preprocessing, boundingBox, geometricFeatures, actionUnits, primaryEmotion, confidence } =
    currentResult;
  const meta = EMOTION_METAS[primaryEmotion];

  // Pipeline step definition
  const pipelineSteps = [
    {
      step: 1,
      title: 'Face ROI Detection',
      desc: 'Skin chrominance segmentation in YCbCr color space with multi-scale candidate bounding box extraction.',
      image: preprocessing?.rawImageThumb || null,
      badge: `${boundingBox.width}×${boundingBox.height} px`,
    },
    {
      step: 2,
      title: 'Spatial Alignment & Crop',
      desc: 'Interpolated affine transformation to normalize facial roll angle and scale to canonical 128×128 pixel grid.',
      image: preprocessing?.alignedFaceCrop || null,
      badge: '128×128 Normalized',
    },
    {
      step: 3,
      title: 'Grayscale Luma Isolation',
      desc: 'Perceptual luminance conversion (Y = 0.299R + 0.587G + 0.114B) removing chromatic variations.',
      image: preprocessing?.grayscale || null,
      badge: '8-Bit Monochromatic',
    },
    {
      step: 4,
      title: 'Histogram Equalization (CLAHE)',
      desc: 'Dynamic cumulative distribution equalization to normalize extreme shadows and uneven lighting.',
      image: preprocessing?.histogramEqualized || null,
      badge: 'Uniform CDF',
    },
    {
      step: 5,
      title: 'Gradient & Edge Feature Map',
      desc: 'Dual 3×3 Sobel spatial derivative filters (|G| = √(Gx² + Gy²)) isolating muscular contraction lines.',
      image: preprocessing?.gradientSobel || null,
      badge: 'Sobel 1st Order',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-slate-900/90 rounded-xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-1">
            Facial Preprocessing & Feature Extraction Stage
          </div>
          <h2 className="text-xl font-bold text-white">
            Sequential Visual Pipeline & Morphometric Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Raw frames undergo spatial normalization, photometric equalization, and directional gradient filtering before landmark regression and Action Unit classification.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-2xl">{meta.emoji}</span>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Predicted State</div>
            <div className="text-sm font-bold text-white capitalize">{meta.label} ({(confidence * 100).toFixed(1)}%)</div>
          </div>
        </div>
      </div>

      {/* 5-Step Visual Transformation Pipeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>5-Stage Image Preprocessing Pipeline</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">Latency: {currentResult.inferenceLatencyMs} ms</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {pipelineSteps.map((step, idx) => (
            <div
              key={step.step}
              className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex flex-col justify-between relative group hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-400 font-mono">
                    0{step.step}.
                  </span>
                  <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                    {step.badge}
                  </span>
                </div>

                <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden border border-slate-800 mb-3 flex items-center justify-center">
                  {step.image ? (
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-xs text-slate-600 font-mono">Processed</div>
                  )}
                </div>

                <h4 className="text-xs font-semibold text-white mb-1">{step.title}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
              </div>

              {idx < pipelineSteps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-700">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feature Extraction Section: FACS Action Units & Geometric Ratios */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FACS Action Units (7 columns) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Facial Action Coding System (FACS) Action Units
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Quantified anatomical muscular activations responsible for primary emotional expressions.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {actionUnits.map((au) => {
              const pct = (au.intensity * 100).toFixed(0);
              const isActive = au.intensity > 0.3;

              return (
                <div
                  key={au.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    isActive
                      ? 'bg-slate-950/80 border-cyan-500/30'
                      : 'bg-slate-950/40 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400">{au.id}</span>
                      <span className="text-white font-medium">{au.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-300 tabular-nums">
                      {pct}%
                    </span>
                  </div>

                  {/* Progress Meter */}
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isActive ? 'bg-cyan-400' : 'bg-slate-700'
                      }`}
                      style={{ width: `${Math.max(2, au.intensity * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate pr-2">{au.description}</span>
                    <span className="shrink-0 text-[10px] text-slate-500 uppercase font-mono">
                      Associated: {au.dominantEmotions.join(', ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Morphometric Geometric Ratios (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              Anthropometric Geometric Metrics
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Normalized spatial proportions derived from 68 landmark coordinates.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[11px]">Eye Aspect Ratio (EAR)</div>
                  <div className="text-[10px] text-slate-500">Aperture openness (blink / surprise)</div>
                </div>
                <div className="text-right">
                  <div className="text-cyan-400 font-bold tabular-nums text-sm">
                    {geometricFeatures.earAvg.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    L: {geometricFeatures.earLeft} | R: {geometricFeatures.earRight}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[11px]">Mouth Aspect Ratio (MAR)</div>
                  <div className="text-[10px] text-slate-500">Vertical aperture (jaw drop)</div>
                </div>
                <div className="text-right">
                  <div className="text-cyan-400 font-bold tabular-nums text-sm">
                    {geometricFeatures.mar.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {geometricFeatures.mar > 0.4 ? 'Jaw Displaced' : 'Lips Closed'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[11px]">Smile Curvature Index</div>
                  <div className="text-[10px] text-slate-500">Mouth corner elevation / depression</div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-bold tabular-nums text-sm ${
                      geometricFeatures.smileCurvature > 0
                        ? 'text-emerald-400'
                        : geometricFeatures.smileCurvature < 0
                        ? 'text-blue-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {geometricFeatures.smileCurvature > 0
                      ? `+${geometricFeatures.smileCurvature}`
                      : geometricFeatures.smileCurvature}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {geometricFeatures.smileCurvature > 5
                      ? 'Elevated Smile'
                      : geometricFeatures.smileCurvature < -5
                      ? 'Downturned Depress'
                      : 'Horizontal Resting'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[11px]">Eyebrow Furrow Ratio</div>
                  <div className="text-[10px] text-slate-500">Medial brow distance / head width</div>
                </div>
                <div className="text-right">
                  <div className="text-cyan-400 font-bold tabular-nums text-sm">
                    {geometricFeatures.browFurrow.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {geometricFeatures.browFurrow < 0.22 ? 'Furrowed (Anger)' : 'Normal Arch'}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[11px]">Bilateral Facial Symmetry</div>
                  <div className="text-[10px] text-slate-500">Hemispheric coordinate correlation</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold tabular-nums text-sm">
                    {(geometricFeatures.symmetry * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-500">Symmetric</div>
                </div>
              </div>
            </div>
          </div>

          {/* Theoretical Foundations Note */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>FACS Classification Logic</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Ekman & Friesen’s Facial Action Coding System (1978) defines facial movement by anatomical action units rather than subjective emotion labels. Combining AU12 (Zygomaticus major) + AU6 (Orbicularis oculi) produces the authentic Duchenne joy expression, while AU4 (Corrugator) + AU15 (Depressor anguli oris) defines clinical sadness.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
