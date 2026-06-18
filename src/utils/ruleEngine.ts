/**
 * ruleEngine.ts
 * 
 * Deterministic Sensitivity Calculation Engine for AimSync.
 * This file implements the mathematical optimizations specified in Section 5 of the SRS.
 * Given user inputs (device capability, FPS, gyroscope usage, playstyle, and weak points),
 * it returns a custom-tailored, clamped sensitivity profile.
 */

export type FpsSelection = 40 | 60 | 90 | 120;
export type GyroMode = 'always_on' | 'scope_on' | 'off';
export type DeviceTier = 'budget' | 'mid' | 'flagship';
export type Playstyle = 'rusher' | 'sniper' | 'assaulter' | 'balanced';
export type PrimaryProblem = 'recoil' | 'aim' | 'transfer' | 'close' | 'long';

export interface UserInputs {
  deviceTier: DeviceTier;
  fps: FpsSelection;
  gyroMode: GyroMode;
  fingerCount: number;
  playstyle: Playstyle;
  primaryProblem: PrimaryProblem;
}

export type ScopeTier = 'no_scope' | 'red_dot' | 'scope_2x' | 'scope_3x' | 'scope_4x' | 'scope_6x' | 'scope_8x';

export interface ScopeValues {
  no_scope: number;
  red_dot: number;
  scope_2x: number;
  scope_3x: number;
  scope_4x: number;
  scope_6x: number;
  scope_8x: number;
}

export interface SensitivityProfile {
  camera: ScopeValues;
  ads: ScopeValues;
  gyro: ScopeValues | null;
  adsGyro: ScopeValues | null;
}

interface RuleRange {
  min: number;
  max: number;
  mid: number;
}

// Section 5.1 Base Ranges
const BASE_CAMERA: Record<ScopeTier, RuleRange> = {
  no_scope: { min: 85, max: 150, mid: 105 },
  red_dot: { min: 30, max: 65, mid: 50 },
  scope_2x: { min: 25, max: 50, mid: 38 },
  scope_3x: { min: 20, max: 50, mid: 33 },
  scope_4x: { min: 15, max: 32, mid: 24 },
  scope_6x: { min: 10, max: 25, mid: 16 },
  scope_8x: { min: 6, max: 18, mid: 10 },
};

const BASE_ADS: Record<ScopeTier, RuleRange> = {
  no_scope: { min: 80, max: 130, mid: 95 },
  red_dot: { min: 30, max: 80, mid: 55 },
  scope_2x: { min: 25, max: 60, mid: 40 },
  scope_3x: { min: 20, max: 50, mid: 32 },
  scope_4x: { min: 15, max: 40, mid: 24 },
  scope_6x: { min: 8, max: 40, mid: 14 },
  scope_8x: { min: 5, max: 26, mid: 9 },
};

const BASE_GYRO: Record<ScopeTier, RuleRange> = {
  no_scope: { min: 240, max: 420, mid: 320 },
  red_dot: { min: 220, max: 400, mid: 300 },
  scope_2x: { min: 200, max: 360, mid: 280 },
  scope_3x: { min: 150, max: 320, mid: 220 },
  scope_4x: { min: 120, max: 290, mid: 170 },
  scope_6x: { min: 70, max: 250, mid: 110 },
  scope_8x: { min: 45, max: 200, mid: 70 },
};

/**
 * Calculates deterministic sensitivity values based on user configuration.
 */
export function calculateSensitivity(inputs: UserInputs): SensitivityProfile {
  const profile: SensitivityProfile = {
    camera: {} as ScopeValues,
    ads: {} as ScopeValues,
    gyro: inputs.gyroMode !== 'off' ? ({} as ScopeValues) : null,
    adsGyro: inputs.gyroMode !== 'off' ? ({} as ScopeValues) : null,
  };

  const scopes: ScopeTier[] = [
    'no_scope',
    'red_dot',
    'scope_2x',
    'scope_3x',
    'scope_4x',
    'scope_6x',
    'scope_8x',
  ];

  for (const scope of scopes) {
    // 1. Calculate Camera Sensitivity
    profile.camera[scope] = calculateScopeValue('camera', scope, BASE_CAMERA[scope], inputs);

    // 2. Calculate ADS Sensitivity
    profile.ads[scope] = calculateScopeValue('ads', scope, BASE_ADS[scope], inputs);

    // 3. Calculate Gyroscope & ADS Gyroscope Sensitivity (if enabled)
    if (profile.gyro && profile.adsGyro) {
      profile.gyro[scope] = calculateScopeValue('gyro', scope, BASE_GYRO[scope], inputs);
      // ADS Gyro in PUBG is typically identical or slightly adjusted from Gyro
      // Here we base it on Gyro values with a minor fine-tuning scaling
      profile.adsGyro[scope] = calculateScopeValue('ads_gyro', scope, BASE_GYRO[scope], inputs);
    }
  }

  return profile;
}

/**
 * Computes individual value with adjustments applied, then clamped.
 */
function calculateScopeValue(
  category: 'camera' | 'ads' | 'gyro' | 'ads_gyro',
  scope: ScopeTier,
  range: RuleRange,
  inputs: UserInputs
): number {
  let multiplier = 1.0;

  // FPS adjustments (Section 5.1.4)
  if (inputs.fps === 40) {
    multiplier *= 0.92;
  } else if (inputs.fps === 90 || inputs.fps === 120) {
    multiplier *= 1.10;
  }

  // Device Tier adjustments (cheaper gyro sensors have latency/noise)
  if (inputs.deviceTier === 'budget' && (category === 'gyro' || category === 'ads_gyro')) {
    multiplier *= 0.85;
  }

  // Finger counts adjustments
  if (inputs.fingerCount <= 3 && (category === 'camera' || category === 'ads')) {
    multiplier *= 0.95;
  } else if (inputs.fingerCount >= 5 && (category === 'camera' || category === 'ads')) {
    multiplier *= 1.05;
  }

  // Playstyle adjustments
  const isCloseRangeOptic = scope === 'no_scope' || scope === 'red_dot' || scope === 'scope_2x';
  const isLongRangeOptic = scope === 'scope_6x' || scope === 'scope_8x';

  if (inputs.playstyle === 'rusher' && isCloseRangeOptic) {
    multiplier *= 1.12;
  } else if (inputs.playstyle === 'sniper' && isLongRangeOptic) {
    if (category === 'camera' || category === 'ads') {
      multiplier *= 0.88;
    }
  }

  // Primary Problem adjustments
  if (inputs.primaryProblem === 'recoil') {
    if (category === 'gyro' || category === 'ads_gyro') {
      // Recoil control relies heavily on gyro adjustments for pull-down
      if (scope === 'scope_3x' || scope === 'scope_4x') {
        multiplier *= 1.15;
      }
    }
  } else if (inputs.primaryProblem === 'transfer') {
    if (category === 'ads') {
      multiplier *= 0.90; // Dampen ADS slightly for spray transfer stability
    } else if (category === 'gyro' || category === 'ads_gyro') {
      multiplier *= 1.08; // Keep gyro snappy for fast transfers
    }
  } else if (inputs.primaryProblem === 'close' && isCloseRangeOptic) {
    if (category === 'camera' || category === 'ads') {
      multiplier *= 1.10;
    }
  } else if (inputs.primaryProblem === 'long' && isLongRangeOptic) {
    if (category === 'camera' || category === 'ads') {
      multiplier *= 0.90;
    }
  }

  // Apply multiplier to midpoint and clamp between min and max bounds
  const calculated = Math.round(range.mid * multiplier);
  return Math.max(range.min, Math.min(range.max, calculated));
}
