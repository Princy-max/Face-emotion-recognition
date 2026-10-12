import { BenchmarkSample, EmotionType, EMOTIONS } from '../types/emotion';

// Generates an anatomically structured canvas facial expression image with realistic facial features
export function generateSyntheticFace(
  emotion: EmotionType,
  variant: number = 0,
  size: number = 256
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Skin tones for diversity
  const skinTones = [
    { base: '#E0AC69', shadow: '#C68B59', highlight: '#F1C27D' }, // Warm medium
    { base: '#FCD7B0', shadow: '#E0B58D', highlight: '#FFE5C8' }, // Fair warm
    { base: '#8D5524', shadow: '#6B3E19', highlight: '#A86832' }, // Deep dark
    { base: '#D9A066', shadow: '#BC8048', highlight: '#E7B885' }, // Tan
    { base: '#F1C27D', shadow: '#CF9B5F', highlight: '#F8D89C' }, // Olive fair
  ];
  const skin = skinTones[variant % skinTones.length];

  // Lighting angle & background
  const gradBg = ctx.createLinearGradient(0, 0, size, size);
  gradBg.addColorStop(0, '#1E293B');
  gradBg.addColorStop(1, '#0F172A');
  ctx.fillStyle = gradBg;
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2 + 10;
  const headW = size * 0.38;
  const headH = size * 0.48;

  // Neck
  ctx.fillStyle = skin.shadow;
  ctx.beginPath();
  ctx.moveTo(cx - headW * 0.45, cy + headH * 0.5);
  ctx.lineTo(cx + headW * 0.45, cy + headH * 0.5);
  ctx.lineTo(cx + headW * 0.65, size);
  ctx.lineTo(cx - headW * 0.65, size);
  ctx.closePath();
  ctx.fill();

  // Head Oval
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, headW, headH, 0, 0, Math.PI * 2);
  const headGrad = ctx.createRadialGradient(cx - headW * 0.2, cy - headH * 0.3, 10, cx, cy, headH);
  headGrad.addColorStop(0, skin.highlight);
  headGrad.addColorStop(0.7, skin.base);
  headGrad.addColorStop(1, skin.shadow);
  ctx.fillStyle = headGrad;
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.restore();

  // Emotion-specific parameter modulation
  let browY = cy - headH * 0.28;
  let browInY = browY;
  let browOutY = browY;
  let eyeOpenY = headH * 0.055;
  let mouthY = cy + headH * 0.48;
  let mouthW = headW * 0.55;
  let mouthCurve = 0; // + smile, - frown
  let mouthOpen = 2; // jaw drop
  let eyeBrowAngle = 0;

  switch (emotion) {
    case 'happy':
      browY -= 4;
      browInY = browY - 2;
      browOutY = browY;
      eyeOpenY *= 0.8; // squinting cheeks
      mouthCurve = 16;
      mouthW *= 1.25;
      mouthOpen = 8;
      break;
    case 'sad':
      browInY = browY - 8; // inner brows pulled up
      browOutY = browY + 4;
      eyeOpenY *= 0.75;
      mouthCurve = -12; // downturned corners
      mouthW *= 0.85;
      break;
    case 'angry':
      browInY = browY + 12; // furrowed down
      browOutY = browY - 6;
      eyeOpenY *= 0.7; // narrowed glare
      mouthCurve = -6;
      mouthW *= 0.9;
      break;
    case 'surprised':
      browInY = browY - 16; // high arch
      browOutY = browY - 14;
      eyeOpenY *= 1.45; // wide open
      mouthOpen = 22; // jaw drop
      mouthW *= 0.75;
      mouthCurve = 0;
      break;
    case 'fearful':
      browInY = browY - 12; // raised and flat
      browOutY = browY - 4;
      eyeOpenY *= 1.35;
      mouthW *= 1.2; // stretched lips
      mouthOpen = 10;
      mouthCurve = -4;
      break;
    case 'disgusted':
      browInY = browY + 6;
      browOutY = browY + 2;
      eyeOpenY *= 0.65; // squint
      mouthCurve = -8;
      mouthW *= 0.85;
      mouthY -= 4; // upper lip raised
      break;
    case 'shy':
      browY += 2;
      browInY = browY - 2;
      browOutY = browY;
      eyeOpenY *= 0.75; // lowered gaze
      mouthCurve = 8; // subtle coy smile
      mouthW *= 0.95;
      mouthOpen = 2;
      break;
    case 'nervous':
      browInY = browY - 8; // raised inner brow
      browOutY = browY + 2;
      eyeOpenY *= 1.15; // wide apprehensive eyes
      mouthCurve = 1;
      mouthW *= 1.25; // horizontally stretched tense lips
      mouthOpen = 1;
      break;
    case 'neutral':
    default:
      // default resting values
      break;
  }

  // Eyes coordinates
  const eyeDist = headW * 0.42;
  const eyeL = { x: cx - eyeDist, y: cy - headH * 0.12 };
  const eyeR = { x: cx + eyeDist, y: cy - headH * 0.12 };
  const eyeW = headW * 0.28;

  // Eyebrows
  ctx.strokeStyle = '#27170E';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';

  // Left Brow
  ctx.beginPath();
  ctx.moveTo(eyeL.x - eyeW * 0.7, browOutY);
  ctx.quadraticCurveTo(eyeL.x, (browInY + browOutY) / 2 - 4, eyeL.x + eyeW * 0.65, browInY);
  ctx.stroke();

  // Right Brow
  ctx.beginPath();
  ctx.moveTo(eyeR.x - eyeW * 0.65, browInY);
  ctx.quadraticCurveTo(eyeR.x, (browInY + browOutY) / 2 - 4, eyeR.x + eyeW * 0.7, browOutY);
  ctx.stroke();

  // Wrinkles for angry/disgust
  if (emotion === 'angry' || emotion === 'disgusted') {
    ctx.strokeStyle = skin.shadow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 6, browInY - 2);
    ctx.lineTo(cx - 6, browInY + 10);
    ctx.moveTo(cx + 6, browInY - 2);
    ctx.lineTo(cx + 6, browInY + 10);
    ctx.stroke();
  }

  // Eyes drawing (sclera + iris + pupil)
  [eyeL, eyeR].forEach((eyePt, idx) => {
    // Sclera
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(eyePt.x, eyePt.y, eyeW * 0.6, eyeOpenY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris
    ctx.fillStyle = '#4A3319';
    ctx.beginPath();
    ctx.arc(eyePt.x, eyePt.y, Math.min(eyeOpenY * 0.85, eyeW * 0.32), 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.arc(eyePt.x, eyePt.y, Math.min(eyeOpenY * 0.45, eyeW * 0.18), 0, Math.PI * 2);
    ctx.fill();

    // Catchlight highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(eyePt.x - 2, eyePt.y - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Upper eyelid line
    ctx.strokeStyle = '#1F1610';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(eyePt.x, eyePt.y, eyeW * 0.62, eyeOpenY * 1.05, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  });

  // Nose
  const noseY = cy + headH * 0.16;
  ctx.strokeStyle = skin.shadow;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - headH * 0.05);
  ctx.lineTo(cx - 3, noseY - 2);
  ctx.quadraticCurveTo(cx, noseY + 4, cx + 4, noseY);
  ctx.stroke();

  // Nostrils
  ctx.fillStyle = skin.shadow;
  ctx.beginPath();
  ctx.arc(cx - 8, noseY, 2, 0, Math.PI * 2);
  ctx.arc(cx + 8, noseY, 2, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.save();
  const mouthLeft = cx - mouthW * 0.5;
  const mouthRight = cx + mouthW * 0.5;
  const mouthCornerY = mouthY - mouthCurve;

  // Lip fill / cavity
  ctx.fillStyle = '#8B2E3E';
  ctx.beginPath();
  ctx.moveTo(mouthLeft, mouthCornerY);
  ctx.quadraticCurveTo(cx, mouthY - mouthOpen * 0.3, mouthRight, mouthCornerY);
  ctx.quadraticCurveTo(cx, mouthY + mouthOpen, mouthLeft, mouthCornerY);
  ctx.fill();

  // Teeth for open mouth (surprise or big smile)
  if (mouthOpen > 6) {
    ctx.fillStyle = '#FAFAFA';
    ctx.beginPath();
    ctx.rect(cx - mouthW * 0.3, mouthY - mouthOpen * 0.2, mouthW * 0.6, Math.min(mouthOpen * 0.5, 6));
    ctx.fill();
  }

  // Lip contour line
  ctx.strokeStyle = '#5E1B26';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(mouthLeft, mouthCornerY);
  ctx.quadraticCurveTo(cx, mouthY - mouthCurve * 0.5, mouthRight, mouthCornerY);
  ctx.stroke();
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.92);
}

// Generates a standardized suite of 35 diverse benchmark samples
export function getStandardBenchmarkSuite(): BenchmarkSample[] {
  const samples: BenchmarkSample[] = [];

  const descriptions: Record<EmotionType, string[]> = {
    happy: [
      'Genuine bilateral Duchenne smile with cheek elevation and crow’s feet',
      'Moderate joy expression with visible upper teeth dental arch',
      'Broad open-mouth celebratory joy with marked lip corner pulling',
      'Subtle contentment smile with relaxed eyelid contour',
      'Warm social smile with bilateral zygomaticus major contraction',
    ],
    sad: [
      'Grief expression with elevated medial eyebrows and lip corner depression',
      'Subtle melancholy with glazed stare and downcast lip corners',
      'Deep sorrow with pronounced AU1 inner brow raiser and chin wrinkle',
      'Quiet despondency with relaxed facial tone and lowered mouth corners',
      'Distressed sadness with corrugator knit and triangular inner brows',
    ],
    angry: [
      'Intense confrontation with lowered knit brows and tightened lip margin',
      'Seething displeasure with hardened stare and narrowed palpebral fissure',
      'Stern authority with sharp downward eyebrow vector and nasal flare',
      'Bilateral brow furrowing with clenched jaw and compressed lips',
      'Open-mouth anger with flared nostrils and exposed lower teeth',
    ],
    surprised: [
      'Sudden startle response with fully rounded eyes and dropped mandible',
      'Pleasant surprise with elevated brow arches and open mouth cavity',
      'Shock response with maximum sclera exposure and parted lips',
      'Mild surprise with arched eyebrows and relaxed parted teeth',
      'Pronounced awe with high forehead wrinkling and jaw descent',
    ],
    fearful: [
      'Acute fright with horizontally stretched lips and widened stare',
      'Anxious dread with raised flattened brows and tense mouth posture',
      'Startled apprehension with widened upper eyelids and tense neck line',
      'Alarm response with high inner brow tension and risorius activation',
      'Panic micro-expression with wide sclera and retracted lip corners',
    ],
    neutral: [
      'Calibrated baseline resting posture under uniform frontal illumination',
      'Neutral resting face with symmetric horizontal lip line and relaxed brows',
      'Attentive resting baseline with relaxed periorbital musculature',
      'Calm neutral expression with balanced facial planes and zero AU tension',
      'Standard reference face with horizontal eye axis and closed relaxed mouth',
    ],
    disgusted: [
      'Aversion reaction with wrinkled nose bridge and raised upper lip',
      'Nausea expression with squinted eyes and tongue retrusion cue',
      'Strong distaste with nasolabial furrow deepening and curled top lip',
      'Sensory rejection with elevated upper lip and narrowed eyes',
      'Disdainful grimace with unilateral nose wrinkling and raised lip margin',
    ],
    shy: [
      'Bashful coy expression with modest smile and downward head inclination',
      'Timid smile with averted gaze and lowered eyelashes',
      'Subtle blushing joy with averted eye contact and downward tilt',
      'Gentle self-conscious smile with demure posture',
      'Playful coyness with slight head turn down and subtle lip pull',
    ],
    nervous: [
      'Apprehensive tension with stretched horizontal lips and furrowed brow',
      'Anxious grimace with lip compression and heightened ocular tension',
      'Tense uncertainty with tightened corners and raised medial brows',
      'Edgy apprehension with rapid blink micro-cue and lip stretcher',
      'Uneasy guarded expression with pressed lips and alert stare',
    ],
  };

  EMOTIONS.forEach((emotion) => {
    for (let variant = 0; variant < 5; variant++) {
      const dataUrl = generateSyntheticFace(emotion, variant);
      samples.push({
        id: `bench-${emotion}-${variant + 1}`,
        name: `${emotion.toUpperCase()} - Sample ${variant + 1}`,
        groundTruth: emotion,
        imageDataUrl: dataUrl,
        source: 'built-in',
        description: descriptions[emotion][variant],
        metadata: {
          intensity: variant === 3 ? 'subtle' : variant === 2 ? 'pronounced' : 'moderate',
        },
      });
    }
  });

  return samples;
}
