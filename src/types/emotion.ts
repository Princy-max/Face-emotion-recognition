export type EmotionType =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'fearful'
  | 'neutral'
  | 'disgusted'
  | 'shy'
  | 'nervous';

export const EMOTIONS: EmotionType[] = [
  'happy',
  'sad',
  'angry',
  'surprised',
  'fearful',
  'neutral',
  'disgusted',
  'shy',
  'nervous',
];

export interface EmotionMeta {
  type: EmotionType;
  label: string;
  emoji: string;
  color: string;
  bgLight: string;
  borderColor: string;
  valence: number; // Russell's circumplex: -1 to 1
  arousal: number; // Russell's circumplex: -1 to 1
  keyAUs: string[];
  description: string;
}

export const EMOTION_METAS: Record<EmotionType, EmotionMeta> = {
  happy: {
    type: 'happy',
    label: 'Happy',
    emoji: '😊',
    color: '#10B981', // emerald
    bgLight: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10B981',
    valence: 0.8,
    arousal: 0.4,
    keyAUs: ['AU6 Cheek Raiser', 'AU12 Lip Corner Puller'],
    description: 'Elevated lip corners, cheek raising, crinkling around eyes (Duchenne smile).',
  },
  sad: {
    type: 'sad',
    label: 'Sad',
    emoji: '😢',
    color: '#3B82F6', // blue
    bgLight: 'rgba(59, 130, 246, 0.12)',
    borderColor: '#3B82F6',
    valence: -0.7,
    arousal: -0.4,
    keyAUs: ['AU1 Inner Brow Raiser', 'AU4 Brow Lowerer', 'AU15 Lip Depressor'],
    description: 'Inner eyebrows drawn upward and together, downturned lip corners, drooping eyelids.',
  },
  angry: {
    type: 'angry',
    label: 'Angry',
    emoji: '😠',
    color: '#EF4444', // red
    bgLight: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#EF4444',
    valence: -0.7,
    arousal: 0.7,
    keyAUs: ['AU4 Brow Lowerer', 'AU5 Upper Lid Raiser', 'AU23 Lip Tightener'],
    description: 'Eyebrows drawn down and inward (furrowed), hard stare, tightened lip borders.',
  },
  surprised: {
    type: 'surprised',
    label: 'Surprised',
    emoji: '😲',
    color: '#F59E0B', // amber
    bgLight: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#F59E0B',
    valence: 0.3,
    arousal: 0.85,
    keyAUs: ['AU1 Inner Brow Raiser', 'AU2 Outer Brow Raiser', 'AU5 Lid Raiser', 'AU26 Jaw Drop'],
    description: 'Eyebrows arched and raised, wide eyes with visible sclera, jaw dropped open.',
  },
  fearful: {
    type: 'fearful',
    label: 'Fearful',
    emoji: '😨',
    color: '#8B5CF6', // purple
    bgLight: 'rgba(139, 92, 246, 0.12)',
    borderColor: '#8B5CF6',
    valence: -0.65,
    arousal: 0.8,
    keyAUs: ['AU1 Inner Brow Raiser', 'AU2 Outer Brow Raiser', 'AU4 Brow Lowerer', 'AU20 Lip Stretcher'],
    description: 'Eyebrows raised and drawn together, upper eyelids raised, lips stretched horizontally.',
  },
  neutral: {
    type: 'neutral',
    label: 'Neutral',
    emoji: '😐',
    color: '#64748B', // slate
    bgLight: 'rgba(100, 116, 139, 0.12)',
    borderColor: '#64748B',
    valence: 0.0,
    arousal: 0.0,
    keyAUs: ['AU0 Baseline Resting State'],
    description: 'Relaxed facial musculature without significant action unit activation or tension.',
  },
  disgusted: {
    type: 'disgusted',
    label: 'Disgusted',
    emoji: '🤢',
    color: '#14B8A6', // teal
    bgLight: 'rgba(20, 184, 166, 0.12)',
    borderColor: '#14B8A6',
    valence: -0.6,
    arousal: 0.3,
    keyAUs: ['AU9 Nose Wrinkler', 'AU10 Upper Lip Raiser'],
    description: 'Nose bridge wrinkled, upper lip raised, furrowed brow with narrowed eyes.',
  },
  shy: {
    type: 'shy',
    label: 'Shy / Coy',
    emoji: '🙈',
    color: '#F472B6', // pink
    bgLight: 'rgba(244, 114, 182, 0.12)',
    borderColor: '#F472B6',
    valence: 0.35,
    arousal: -0.2,
    keyAUs: ['AU12 Lip Corner Puller (subtle)', 'AU54 Head Turn Down', 'AU64 Eyes Downward'],
    description: 'Subtle repressed smile with head tilted down, averted downward gaze and cheek blushing.',
  },
  nervous: {
    type: 'nervous',
    label: 'Nervous',
    emoji: '😬',
    color: '#FB923C', // orange
    bgLight: 'rgba(251, 146, 60, 0.12)',
    borderColor: '#FB923C',
    valence: -0.45,
    arousal: 0.75,
    keyAUs: ['AU14 Dimpler', 'AU20 Lip Stretcher', 'AU23 Lip Tightener', 'AU4 Brow Lowerer'],
    description: 'Tightly stretched or compressed lips, tense jaw, raised inner brows, rapid micro-expressions.',
  },
};

export type EmotionProbabilities = Record<EmotionType, number>;

export interface ActionUnit {
  id: string; // e.g. 'AU12'
  name: string; // e.g. 'Lip Corner Puller'
  intensity: number; // 0.0 to 1.0
  description: string;
  dominantEmotions: EmotionType[];
}

export interface GeometricFeatures {
  earLeft: number; // Eye aspect ratio (left)
  earRight: number; // Eye aspect ratio (right)
  earAvg: number;
  mar: number; // Mouth aspect ratio (openness)
  browFurrow: number; // Distance between inner brows normalized
  browRaise: number; // Height of brows relative to eyes
  smileCurvature: number; // Mouth corner elevation (+ smile, - frown)
  lipWidth: number; // Normalized mouth width
  symmetry: number; // Left-right facial symmetry (0-1)
}

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface LandmarkPoint {
  x: number;
  y: number;
}

export interface PreprocessingThumbnails {
  rawImageThumb: string;
  alignedFaceCrop: string;
  grayscale: string;
  histogramEqualized: string;
  gradientSobel: string;
}

export interface FacialPartBox {
  id: 'leftEye' | 'rightEye' | 'nose' | 'mouth' | 'brows';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  status: string;
}

export interface FacialBaseline {
  smile: number;
  browRaise: number;
  mouthOpen: number;
  calibrated: boolean;
}

export interface FaceAlignmentInfo {
  headTiltDeg: number;
  distanceCategory: 'Optimal' | 'Close Range' | 'Far Range';
  positionStatus: string;
  faceTracked: boolean;
}

export interface EmotionAnalysisResult {
  primaryEmotion: EmotionType;
  confidence: number;
  probabilities: EmotionProbabilities;
  actionUnits: ActionUnit[];
  geometricFeatures: GeometricFeatures;
  valence: number;
  arousal: number;
  boundingBox: FaceBoundingBox;
  landmarks: LandmarkPoint[];
  partBoxes?: FacialPartBox[];
  alignmentInfo?: FaceAlignmentInfo;
  preprocessing?: PreprocessingThumbnails;
  inferenceLatencyMs: number;
  engine: 'edge-cv' | 'deep-vision';
  timestamp: number;
  microExpressions?: string;
}

export interface PerClassMetrics {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number;
  recall: number;
  specificity: number;
  f1: number;
  support: number;
}

export interface EvaluationMetrics {
  accuracy: number;
  macroPrecision: number;
  macroRecall: number;
  macroF1: number;
  weightedF1: number;
  confusionMatrix: number[][]; // 7x7 matrix: row = true, col = pred
  classMetrics: Record<EmotionType, PerClassMetrics>;
  totalSamples: number;
  correctSamples: number;
  avgLatencyMs: number;
}

export interface BenchmarkSample {
  id: string;
  name: string;
  groundTruth: EmotionType;
  imageDataUrl: string;
  source: 'built-in' | 'custom' | 'captured';
  description: string;
  metadata?: {
    gender?: string;
    lighting?: string;
    intensity?: 'subtle' | 'moderate' | 'pronounced';
  };
}
