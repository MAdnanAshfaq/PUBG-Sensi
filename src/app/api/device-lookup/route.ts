import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface DeviceLookupResult {
  deviceModel: string;
  deviceTier: 'budget' | 'mid' | 'flagship';
  measuredLatencyMs: number;
  measuredSwipeSpeed: number;
  gyroStabilityScore: number;
  chipset: string;
  displayHz: number;
  touchSamplingHz: number;
  gyroSensor: string;
  summary: string;
}

export async function POST(req: NextRequest) {
  try {
    const { deviceModel } = await req.json();

    if (!deviceModel || typeof deviceModel !== 'string' || deviceModel.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Device model is required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Gemini API not configured.' }, { status: 500 });
    }

    const result = await lookupDeviceWithGemini(apiKey, deviceModel.trim());
    return NextResponse.json({ success: true, device: result });

  } catch (error: any) {
    console.error('[DeviceLookup] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to look up device.' },
      { status: 500 }
    );
  }
}

async function lookupDeviceWithGemini(apiKey: string, deviceModel: string): Promise<DeviceLookupResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  const prompt = `
You are a mobile hardware research expert with deep knowledge of Android and iOS devices used for gaming.

The user has entered this device name: "${deviceModel}"

Your task: Research this exact device model and provide precise hardware specifications that affect PUBG Mobile / BGMI gameplay performance, specifically:
1. Touch screen sampling rate and touch response latency
2. Gyroscope sensor model and noise characteristics  
3. Chipset performance tier and gaming stability
4. Display refresh rate and rendering smoothness

Based on your research, output calibration values formatted for a sensitivity optimization system:

- measuredLatencyMs: The typical touch input-to-display latency for this device in milliseconds (typical range: 50–200ms)
  - Flagship AMOLED (e.g. LTPO, 120hz+): 50–80ms
  - Mid-range AMOLED (60-90hz): 80–120ms
  - Budget LCD: 120–180ms

- measuredSwipeSpeed: A multiplier (0.80–1.25) representing how this device's screen surface and digitizer translate swipe speed
  - Devices with high touch sampling rate (240Hz+) and smooth glass: 1.10–1.25
  - Standard mid-range: 0.95–1.05
  - Budget low sampling rate: 0.80–0.90

- gyroStabilityScore: A score from 0.0 to 1.0 representing the quality and stability of this device's gyroscope sensor
  - Premium Sony/Bosch sensors in flagships: 0.90–0.98
  - Standard mid-range sensors: 0.70–0.85
  - Budget noisy sensors: 0.50–0.65

- deviceTier: "flagship" if Snapdragon 8 Gen 1+/Apple A15+/Dimensity 9000+, "mid" if Snapdragon 7xx/Dimensity 8xx/Exynos 1xxx, "budget" otherwise

RESPOND WITH EXACTLY THIS JSON (no other text):
{
  "deviceModel": "<corrected official device name>",
  "deviceTier": "<flagship|mid|budget>",
  "measuredLatencyMs": <integer 50-200>,
  "measuredSwipeSpeed": <float 0.80-1.25, 2 decimal places>,
  "gyroStabilityScore": <float 0.00-1.00, 2 decimal places>,
  "chipset": "<chipset name e.g. Snapdragon 8 Gen 2>",
  "displayHz": <integer display refresh rate>,
  "touchSamplingHz": <integer touch sampling rate in Hz>,
  "gyroSensor": "<gyro sensor model or description e.g. Bosch BMI160>",
  "summary": "<2-sentence expert summary of this device's gaming performance characteristics and why these calibration values were chosen>"
}
  `.trim();

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  const parsed: DeviceLookupResult = JSON.parse(clean);

  // Safety clamps
  parsed.measuredLatencyMs    = Math.max(40,  Math.min(220,  Math.round(parsed.measuredLatencyMs)));
  parsed.measuredSwipeSpeed   = Math.max(0.80, Math.min(1.25, parseFloat(parsed.measuredSwipeSpeed.toFixed(2))));
  parsed.gyroStabilityScore   = Math.max(0.0,  Math.min(1.0,  parseFloat(parsed.gyroStabilityScore.toFixed(2))));

  return parsed;
}
