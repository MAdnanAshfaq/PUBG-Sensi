import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateSensitivity, UserInputs, SensitivityProfile } from '@/utils/ruleEngine';
import { getFallbackExplanations, FallbackExplanations } from '@/utils/fallbacks';
import { saveResult } from '@/utils/db';
import crypto from 'crypto';

// Gemini has 60s, but we want a response under 12s for good UX
const LLM_TIMEOUT_MS = 12000;

// ─────────────────────────────────────────────────────────────────────────────
// Type that Gemini must return
// ─────────────────────────────────────────────────────────────────────────────
interface GeminiFullResponse {
  sensitivity: {
    camera: {
      no_scope: number; red_dot: number; scope_2x: number;
      scope_3x: number; scope_4x: number; scope_6x: number; scope_8x: number;
    };
    ads: {
      no_scope: number; red_dot: number; scope_2x: number;
      scope_3x: number; scope_4x: number; scope_6x: number; scope_8x: number;
    };
    gyro: {
      no_scope: number; red_dot: number; scope_2x: number;
      scope_3x: number; scope_4x: number; scope_6x: number; scope_8x: number;
    } | null;
    adsGyro: {
      no_scope: number; red_dot: number; scope_2x: number;
      scope_3x: number; scope_4x: number; scope_6x: number; scope_8x: number;
    } | null;
  };
  explanations: {
    camera_explanation: string;
    ads_explanation: string;
    gyro_explanation: string;
    ads_gyro_explanation: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/generate
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const inputs: UserInputs = {
      deviceTier:          body.deviceTier          || 'mid',
      fps:                 (Number(body.fps) as any) || 60,
      gyroMode:            body.gyroMode            || 'always_on',
      fingerCount:         Number(body.fingerCount)  || 4,
      playstyle:           body.playstyle            || 'balanced',
      primaryProblem:      body.primaryProblem       || 'recoil',
      measuredSwipeSpeed:  body.measuredSwipeSpeed  !== undefined ? Number(body.measuredSwipeSpeed)  : undefined,
      measuredLatencyMs:   body.measuredLatencyMs   !== undefined ? Number(body.measuredLatencyMs)   : undefined,
      gyroStabilityScore:  body.gyroStabilityScore  !== undefined ? Number(body.gyroStabilityScore)  : undefined,
    };

    const apiKey = process.env.GEMINI_API_KEY;

    let sensitivity: SensitivityProfile;
    let explanations: FallbackExplanations;

    if (!apiKey) {
      // ── No API key: pure deterministic fallback ──────────────────────────
      console.warn('[AimSync] No GEMINI_API_KEY – using rule engine + fallback templates.');
      sensitivity   = calculateSensitivity(inputs);
      explanations  = getFallbackExplanations(inputs.playstyle, inputs.primaryProblem, inputs.fingerCount);

    } else {
      // ── Gemini is the primary brain ───────────────────────────────────────
      try {
        const geminiResult = await Promise.race([
          callGeminiExpert(apiKey, inputs),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Gemini timed out')), LLM_TIMEOUT_MS)
          ),
        ]);

        // Use Gemini's numbers directly
        sensitivity  = geminiResult.sensitivity as SensitivityProfile;
        explanations = geminiResult.explanations;

      } catch (err) {
        // ── Gemini failed: fall back to deterministic engine ─────────────
        console.error('[AimSync] Gemini call failed, falling back to rule engine:', err);
        sensitivity  = calculateSensitivity(inputs);
        explanations = getFallbackExplanations(inputs.playstyle, inputs.primaryProblem, inputs.fingerCount);
      }
    }

    const slug  = crypto.randomBytes(4).toString('hex');
    const saved = await saveResult(slug, inputs, sensitivity, explanations);

    return NextResponse.json({ success: true, slug: saved.slug, result: saved });

  } catch (error: any) {
    console.error('[AimSync] Fatal error in /api/generate:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// callGeminiExpert
// Sends the full pro-analyst prompt and expects a structured JSON containing
// BOTH the sensitivity values AND the expert explanations.
// ─────────────────────────────────────────────────────────────────────────────
async function callGeminiExpert(
  apiKey: string,
  inputs: UserInputs,
): Promise<GeminiFullResponse> {

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  // ── Encode hardware calibration context ─────────────────────────────────
  const calibrationContext = buildCalibrationContext(inputs);

  const prompt = `
You are a professional esports analyst, PUBG Mobile / BGMI sensitivity expert, and deep research AI.
Your mission is to generate the BEST POSSIBLE, tournament-grade sensitivity configuration for a real player
based on every piece of hardware and behavioral data provided.

════════════════════════════════════════════════
PLAYER HARDWARE & PREFERENCE PROFILE
════════════════════════════════════════════════

1. DEVICE TIER:          ${inputs.deviceTier.toUpperCase()} (${deviceTierDescription(inputs.deviceTier)})
2. TARGET FRAME RATE:    ${inputs.fps} FPS
3. GYROSCOPE MODE:       ${inputs.gyroMode === 'always_on' ? 'Always On (full gyro combat active)' : inputs.gyroMode === 'scope_on' ? 'Scope-Only (gyro activates when ADS)' : 'Disabled (finger-only control)'}
4. FINGER LAYOUT:        ${inputs.fingerCount}-finger claw/thumb setup
5. COMBAT ROLE:          ${inputs.playstyle.toUpperCase()} (${playstyleDescription(inputs.playstyle)})
6. WEAK POINTS:          ${inputs.primaryProblem === 'all' ? 'ALL (Recoil, Aim, Spray Transfer, Close Fight, Long Range)' : inputs.primaryProblem.toUpperCase()}

${calibrationContext}

════════════════════════════════════════════════
RESEARCH & OPTIMIZATION REQUIREMENTS
════════════════════════════════════════════════

STEP 1 – DEVICE RESEARCH:
- Factor in how ${inputs.deviceTier} devices handle touch sampling rate, gyroscope sensor noise, and FPS stability.
- ${inputs.fps >= 90 ? `At ${inputs.fps} FPS the touch polling and gyro readings are faster – sensitivity values should reflect this precision advantage.` : `At ${inputs.fps} FPS there is moderate frame delay – compensate with slightly lower values to prevent overshooting.`}
- ${inputs.deviceTier === 'budget' ? 'Budget gyro sensors are noisy – scale gyro values conservatively to reduce jitter.' : inputs.deviceTier === 'flagship' ? 'Flagship sensors are precise – gyro can be set higher to leverage the clean signal.' : 'Mid-tier devices have acceptable sensors – moderate gyro with slight noise headroom.'}

STEP 2 – PRO PLAYER RESEARCH & OPTIMIZATION:
- Research and apply sensitivity ranges used by top BGMI / PUBG Mobile pro players (e.g. Jonathan, Mortal, Scout, Neyoo, Aman, Zgod, Destro etc.) for ${inputs.playstyle} playstyles.
- Consider that pro players at ${inputs.fps} FPS on ${inputs.deviceTier} devices commonly use specific ranges for each scope tier.
- Optimize for: zero-recoil sprays, fast snap aim, spray transfer control, close CQB tracking, stable long-range precision.

STEP 3 – PERSONALIZATION FOR THIS SPECIFIC PLAYER:
- Their primary weakness is: ${inputs.primaryProblem === 'all' ? 'ALL areas – create a universal setup that balances all aspects' : inputs.primaryProblem}.
- Their playstyle bias is: ${inputs.playstyle}.
- ${inputs.gyroMode !== 'off' ? `Gyroscope is ON – factor in real wrist tilt control for recoil compensation and micro-adjustments.` : `Gyroscope is OFF – all control is finger-based, camera and ADS must compensate fully.`}
- ${inputs.fingerCount >= 5 ? `${inputs.fingerCount}-finger claw unlocks faster scope access and dedicated fire buttons – allow slightly higher sensitivities.` : inputs.fingerCount <= 2 ? `${inputs.fingerCount}-finger setup requires slower, more deliberate swipes – keep sensitivities conservative.` : `${inputs.fingerCount}-finger setup is standard – use balanced sensitivity ranges.`}

════════════════════════════════════════════════
VALID SENSITIVITY RANGES (PUBG Mobile / BGMI)
════════════════════════════════════════════════
You MUST stay within these ranges. Values outside them are invalid in-game:

Camera:
  No Scope:  85–150  |  Red Dot / Holo: 30–65  |  2x: 25–50  |  3x: 20–50  |  4x: 15–32  |  6x: 10–25  |  8x: 6–18

ADS:
  No Scope:  80–130  |  Red Dot / Holo: 30–80  |  2x: 25–60  |  3x: 20–50  |  4x: 15–40  |  6x: 8–40   |  8x: 5–26

Gyroscope (if active):
  No Scope:  240–420 |  Red Dot / Holo: 220–400 |  2x: 200–360 |  3x: 150–320 |  4x: 120–290 |  6x: 70–250 |  8x: 45–200

ADS Gyroscope (if active, mirrors Gyroscope with fine-tuning):
  Same ranges as Gyroscope above.

════════════════════════════════════════════════
OUTPUT FORMAT – RESPOND WITH EXACTLY THIS JSON
════════════════════════════════════════════════
{
  "sensitivity": {
    "camera": {
      "no_scope": <integer>,
      "red_dot": <integer>,
      "scope_2x": <integer>,
      "scope_3x": <integer>,
      "scope_4x": <integer>,
      "scope_6x": <integer>,
      "scope_8x": <integer>
    },
    "ads": {
      "no_scope": <integer>,
      "red_dot": <integer>,
      "scope_2x": <integer>,
      "scope_3x": <integer>,
      "scope_4x": <integer>,
      "scope_6x": <integer>,
      "scope_8x": <integer>
    },
    "gyro": ${inputs.gyroMode !== 'off' ? `{
      "no_scope": <integer>,
      "red_dot": <integer>,
      "scope_2x": <integer>,
      "scope_3x": <integer>,
      "scope_4x": <integer>,
      "scope_6x": <integer>,
      "scope_8x": <integer>
    }` : 'null'},
    "adsGyro": ${inputs.gyroMode !== 'off' ? `{
      "no_scope": <integer>,
      "red_dot": <integer>,
      "scope_2x": <integer>,
      "scope_3x": <integer>,
      "scope_4x": <integer>,
      "scope_6x": <integer>,
      "scope_8x": <integer>
    }` : 'null'}
  },
  "explanations": {
    "camera_explanation": "<2-3 sentence expert explanation: why these camera values suit their playstyle, FPS, finger count, and device tier. Be specific and actionable.>",
    "ads_explanation": "<2-3 sentence expert explanation: how the ADS values address their primary weakness (${inputs.primaryProblem}), support their combat role, and control recoil/spray transfer. Be specific.>",
    "gyro_explanation": "${inputs.gyroMode !== 'off' ? '<2-3 sentence expert explanation: how the gyro values leverage their device sensor quality and FPS for recoil pull-down and wrist micro-adjustment. Reference specific scope tiers.>' : 'Gyroscope is disabled for this player.'}",
    "ads_gyro_explanation": "${inputs.gyroMode !== 'off' ? '<2-3 sentence expert explanation: how ADS-Gyro interacts with fire button timing for maximum recoil compensation during active sprays. Be specific to their weak points.>' : 'Gyroscope is disabled for this player.'}"
  }
}

CRITICAL RULES:
- ALL integer values must be within the valid ranges listed above. DO NOT exceed them.
- If gyroMode is "off", gyro and adsGyro MUST be null in JSON.
- Do NOT add any text outside the JSON object.
- Make the explanations read like expert coaching – specific, insightful, and actionable.
  `.trim();

  const result = await model.generateContent(prompt);
  const text   = result.response.text();

  // Strip markdown code fences if Gemini wraps the JSON
  const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  const parsed: GeminiFullResponse = JSON.parse(clean);

  // Safety: clamp all values to valid PUBG ranges in case Gemini drifts
  parsed.sensitivity = clampSensitivityProfile(parsed.sensitivity, inputs.gyroMode !== 'off');

  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildCalibrationContext(inputs: UserInputs): string {
  const lines: string[] = ['7. HARDWARE CALIBRATION RESULTS (measured on this device):'];

  if (inputs.measuredSwipeSpeed !== undefined) {
    const label = inputs.measuredSwipeSpeed < 0.85
      ? 'SLOW – user swipes slowly and deliberately'
      : inputs.measuredSwipeSpeed > 1.15
      ? 'FAST – user swipes with high speed and aggression'
      : 'NORMAL – user swipe speed is average';
    lines.push(`   Swipe Speed Multiplier: ${inputs.measuredSwipeSpeed.toFixed(3)} (${label})`);
  }

  if (inputs.measuredLatencyMs !== undefined) {
    const label = inputs.measuredLatencyMs > 130
      ? 'HIGH LATENCY – screen response is sluggish, may need compensation'
      : inputs.measuredLatencyMs < 80
      ? 'LOW LATENCY – extremely responsive screen, precision is maximized'
      : 'NORMAL LATENCY – standard screen response';
    lines.push(`   Touch Latency: ${inputs.measuredLatencyMs}ms (${label})`);
  }

  if (inputs.gyroStabilityScore !== undefined) {
    const label = inputs.gyroStabilityScore < 0.6
      ? 'UNSTABLE – gyro sensor shows significant jitter / noise'
      : inputs.gyroStabilityScore > 0.9
      ? 'VERY STABLE – gyro sensor is clean and precise'
      : 'MODERATE – acceptable gyro stability with minor noise';
    lines.push(`   Gyro Stability Score: ${(inputs.gyroStabilityScore * 100).toFixed(0)}% (${label})`);
  }

  if (lines.length === 1) {
    return '7. HARDWARE CALIBRATION: Not performed (calibration steps were skipped).';
  }
  return lines.join('\n');
}

function deviceTierDescription(tier: string): string {
  switch (tier) {
    case 'flagship': return 'High-end flagship – fast processor, stable 90/120fps, precise gyro sensor';
    case 'mid':      return 'Mid-range device – consistent 60fps performance, decent gyro accuracy';
    case 'budget':   return 'Budget device – may have frame drops, gyro sensor noise, touch latency';
    default:         return tier;
  }
}

function playstyleDescription(playstyle: string): string {
  switch (playstyle) {
    case 'rusher':    return 'Aggressive close-range, fast rotation, hipfire specialist';
    case 'sniper':    return 'Long-range precision, slow methodical scanning, bolt-action snaps';
    case 'assaulter': return 'Mid-range hybrid, spray control, holds compounds';
    case 'balanced':  return 'All-around utility player, adapts to any range';
    default:          return playstyle;
  }
}

// Clamp Gemini output to valid PUBG Mobile in-game ranges
function clampSensitivityProfile(s: GeminiFullResponse['sensitivity'], gyroActive: boolean): GeminiFullResponse['sensitivity'] {
  const clampCamera = (v: number, scope: string) => {
    const ranges: Record<string, [number,number]> = {
      no_scope: [85,150], red_dot: [30,65], scope_2x: [25,50],
      scope_3x: [20,50],  scope_4x: [15,32], scope_6x: [10,25], scope_8x: [6,18],
    };
    const [min, max] = ranges[scope] || [1,400];
    return Math.max(min, Math.min(max, Math.round(v)));
  };
  const clampAds = (v: number, scope: string) => {
    const ranges: Record<string, [number,number]> = {
      no_scope: [80,130], red_dot: [30,80], scope_2x: [25,60],
      scope_3x: [20,50],  scope_4x: [15,40], scope_6x: [8,40], scope_8x: [5,26],
    };
    const [min, max] = ranges[scope] || [1,400];
    return Math.max(min, Math.min(max, Math.round(v)));
  };
  const clampGyro = (v: number, scope: string) => {
    const ranges: Record<string, [number,number]> = {
      no_scope: [240,420], red_dot: [220,400], scope_2x: [200,360],
      scope_3x: [150,320], scope_4x: [120,290], scope_6x: [70,250], scope_8x: [45,200],
    };
    const [min, max] = ranges[scope] || [1,500];
    return Math.max(min, Math.min(max, Math.round(v)));
  };

  const scopes = ['no_scope','red_dot','scope_2x','scope_3x','scope_4x','scope_6x','scope_8x'] as const;

  for (const sc of scopes) {
    s.camera[sc] = clampCamera(s.camera[sc], sc);
    s.ads[sc]    = clampAds(s.ads[sc], sc);
    if (gyroActive && s.gyro && s.adsGyro) {
      s.gyro[sc]    = clampGyro(s.gyro[sc], sc);
      s.adsGyro[sc] = clampGyro(s.adsGyro[sc], sc);
    }
  }
  return s;
}
