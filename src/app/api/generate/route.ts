import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateSensitivity, UserInputs } from '@/utils/ruleEngine';
import { getFallbackExplanations, FallbackExplanations } from '@/utils/fallbacks';
import { saveResult } from '@/utils/db';
import crypto from 'crypto';

// Enforce a timeout for the LLM call
const LLM_TIMEOUT_MS = 2800; // Under the 3s budget to allow response prep

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Destructure inputs and sanitize
    const inputs: UserInputs = {
      deviceTier: body.deviceTier || 'mid',
      fps: Number(body.fps) as any || 60,
      gyroMode: body.gyroMode || 'always_on',
      fingerCount: Number(body.fingerCount) || 4,
      playstyle: body.playstyle || 'balanced',
      primaryProblem: body.primaryProblem || 'recoil',
    };

    // 1. Deterministic Calculation
    const sensitivity = calculateSensitivity(inputs);

    // 2. Explanations Generation
    let explanations: FallbackExplanations;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found. Using fallback templates.');
      explanations = getFallbackExplanations(inputs.playstyle, inputs.primaryProblem, inputs.fingerCount);
    } else {
      try {
        // Enforce a strict timeout on the LLM request
        explanations = await Promise.race([
          callGeminiAPI(apiKey, inputs, sensitivity),
          new Promise<FallbackExplanations>((_, reject) =>
            setTimeout(() => reject(new Error('Gemini API call timed out')), LLM_TIMEOUT_MS)
          ),
        ]);
      } catch (err) {
        console.error('Failed to generate explanations via Gemini:', err);
        // Revert to fallbacks
        explanations = getFallbackExplanations(inputs.playstyle, inputs.primaryProblem, inputs.fingerCount);
      }
    }

    // 3. Generate share slug (8-char alphanumeric)
    const slug = crypto.randomBytes(4).toString('hex');

    // 4. Save to local database
    const saved = await saveResult(slug, inputs, sensitivity, explanations);

    return NextResponse.json({
      success: true,
      slug: saved.slug,
      result: saved,
    });
  } catch (error: any) {
    console.error('Error generating configuration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

async function callGeminiAPI(
  apiKey: string,
  inputs: UserInputs,
  values: any
): Promise<FallbackExplanations> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const prompt = `
    You are AimSync, a premium tactical sensitivity advisor for PUBG Mobile and BGMI.
    Based on the player's profile and calculated settings, generate professional, concise explanation sentences explaining WHY these configurations work best for them.
    
    PLAYER PROFILE:
    - Device Tier: ${inputs.deviceTier}
    - Frame Rate (FPS): ${inputs.fps} FPS
    - Gyroscope Usage: ${inputs.gyroMode}
    - Finger Count: ${inputs.fingerCount}-finger claw/thumb setup
    - Playstyle Bias: ${inputs.playstyle}
    - Primary Problem / Weak Point: ${inputs.primaryProblem}
    
    CALCULATED VALUES MIDPOINTS:
    - Camera settings (No Scope): ${values.camera.no_scope}%, (Red Dot): ${values.camera.red_dot}%
    - ADS settings (No Scope): ${values.ads.no_scope}%, (Red Dot): ${values.ads.red_dot}%
    ${values.gyro ? `- Gyro settings (No Scope): ${values.gyro.no_scope}%, (3x Scope): ${values.gyro.scope_3x}%` : '- Gyroscope: Disabled'}
    
    INSTRUCTIONS:
    - Explain specifically how the adjustments target their problem (${inputs.primaryProblem}) and support their playstyle (${inputs.playstyle}).
    - For ADS: describe how it helps pull-down recoil or horizontal transfers.
    - For Gyro: discuss device latency/wrist tilting adjustments.
    - Output MUST be a single JSON object.
    
    RESPONSE FORMAT SCHEMA (Enforce exactly):
    {
      "camera_explanation": "String explaining the camera navigation sensitivity rationale",
      "ads_explanation": "String explaining the ADS firing/recoil control rationale",
      "gyro_explanation": "String explaining the gyroscope tracking/wrist mechanics rationale (use 'Gyroscope is disabled' if gyroMode is off)",
      "ads_gyro_explanation": "String explaining the ADS-Gyro active firing control rationale (use 'Gyroscope is disabled' if gyroMode is off)"
    }
  `;

  const result = await model.generateContent(prompt);
  const textResponse = result.response.text();
  return JSON.parse(textResponse) as FallbackExplanations;
}
