export interface FallbackExplanations {
  camera_explanation: string;
  ads_explanation: string;
  gyro_explanation: string;
  ads_gyro_explanation: string;
}

export function getFallbackExplanations(
  playstyle: string,
  primaryProblem: string,
  fingerCount: number
): FallbackExplanations {
  let camera = '';
  let ads = '';
  let gyro = '';
  let ads_gyro = '';

  // Camera explanation based on playstyle/fingers
  if (playstyle === 'rusher') {
    camera = `Camera sensitivity is boosted for close-range combat. Since you play as a ${playstyle} with a ${fingerCount}-finger setup, you need high swipe speeds to rotate your camera instantly and track opponents jumping or sliding nearby.`;
  } else if (playstyle === 'sniper') {
    camera = `Camera sensitivity has been precision-tuned downward. This provides a stable, drift-free viewport when you scan the area with high-magnification scopes (6x/8x), preventing accidental over-swiping.`;
  } else {
    camera = `Your camera sensitivity is balanced to support both general navigation and sudden target acquisitions. It is optimized for a ${fingerCount}-finger control layout to give you steady swipe mechanics.`;
  }

  // ADS explanation based on problems
  if (primaryProblem === 'recoil') {
    ads = `ADS sensitivity has been adjusted to help with pull-down mechanics. Since recoil is your primary obstacle, these values give your thumb enough leverage to easily pull down the firing button and stabilize vertical muzzle climb.`;
  } else if (primaryProblem === 'transfer') {
    ads = `ADS sensitivity is slightly dampened. This prevents your crosshair from skipping when you transition or "spray transfer" from one target to another, ensuring a smoother horizontal sweep.`;
  } else {
    ads = `ADS sensitivity is tuned to match your firing swipe speed. It maintains control while spraying with mid-range optics, aligning with your ${playstyle} playstyle.`;
  }

  // Gyro explanation based on gyro usage and recoil
  if (primaryProblem === 'recoil') {
    gyro = `Gyroscope values are scaled up on mid-tier scopes (3x and 4x) by 15%. This allows you to tilt your device slightly to counter rapid vertical recoil, taking the strain off your screen-swiping finger.`;
  } else if (primaryProblem === 'close') {
    gyro = `Gyroscope sensitivity is elevated for close-quarters tracking. This ensures you can pivot your device rapidly to keep up with fast-moving targets without running out of screen space.`;
  } else {
    gyro = `Gyroscope settings are adjusted for reactive wrist tilts. They are optimized to match your device tier and give you fine-grained crosshair control without excessive jitter.`;
  }

  // ADS Gyro explanation
  if (primaryProblem === 'recoil') {
    ads_gyro = `ADS-Gyroscope values are set high. This ensures that when you press the fire button and tilt your phone simultaneously, the vertical compensation kicks in immediately to laser-focus your bullet grouping.`;
  } else {
    ads_gyro = `ADS-Gyroscope sensitivity is mirrored to your standard Gyroscope settings. This provides visual muscle-memory consistency when transitioning between scouting and full-auto spraying.`;
  }

  return {
    camera_explanation: camera,
    ads_explanation: ads,
    gyro_explanation: gyro,
    ads_gyro_explanation: ads_gyro,
  };
}
