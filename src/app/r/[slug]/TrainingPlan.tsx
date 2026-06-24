'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, CheckSquare, Square, Award, Flame, AlertCircle } from 'lucide-react';
import { SavedResult } from '@/utils/db';

interface TrainingPlanProps {
  result: SavedResult;
}

interface Drill {
  name: string;
  focus: string;
  duration: string;
  target: string;
  guide: string;
}

export default function TrainingPlan({ result }: TrainingPlanProps) {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [completedDrills, setCompletedDrills] = useState<Record<string, boolean>>({});

  const primaryProblem = result.inputs.primaryProblem || 'balanced';
  const playstyle = result.inputs.playstyle || 'balanced';

  // Load completed state from localstorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`aimsync_completed_drills_${result.slug}`);
      if (saved) {
        setCompletedDrills(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load completed drills:', e);
    }
  }, [result.slug]);

  // Handle checking a drill
  const handleToggleDrill = (dayIndex: number, drillIndex: number) => {
    const key = `${result.slug}_day${dayIndex}_drill${drillIndex}`;
    const updated = {
      ...completedDrills,
      [key]: !completedDrills[key],
    };
    setCompletedDrills(updated);
    try {
      localStorage.setItem(`aimsync_completed_drills_${result.slug}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save completed drills:', e);
    }
  };

  // Generate personalized plan based on user problem
  const getPersonalizedDrills = (day: number): Drill[] => {
    // We custom craft 2 solid drills per day based on their primary issue
    if (primaryProblem === 'recoil' || primaryProblem === 'all') {
      switch (day) {
        case 1:
          return [
            {
              name: 'Scope In & Spray Transition',
              focus: 'Target Snapping & Initial Pull-down',
              duration: '15 Minutes',
              target: 'Land first 5 bullets within the 9-ring consistently',
              guide: 'Head to the training ground. Stand at 15m. Run left/right, stop suddenly, open scope (Red Dot or 3x) and fire a short 5-round burst. Focus on pulling down immediately as you fire.',
            },
            {
              name: 'Vertical Drag Hold',
              focus: 'Consistent Drag Rate Calibration',
              duration: '15 Minutes',
              target: 'Keep a full 30-round spray grouped within the 7-ring circle',
              guide: 'Equip your primary weapon (M416 or AKM) with a Red Dot. Stand at 45m. Fire a full 30-round magazine on a stationary target. Maintain a continuous drag down. Adjust slider speed if it climbs too high.',
            },
          ];
        case 2:
          return [
            {
              name: 'Crouch Recoil Dampening',
              focus: 'Recoil Spread Reduction',
              duration: '10 Minutes',
              target: 'Reduce spray circle diameter by 30% compared to standing',
              guide: 'Stand at 75m. Practice crouch spraying. Notice how crouching reduces both vertical and horizontal bounce. Practice: sprint -> slide/crouch -> open scope -> spray 15 rounds.',
            },
            {
              name: 'Mid-Range scope pull',
              focus: '3x / 4x Scope Drag Scaling',
              duration: '20 Minutes',
              target: 'Achieve stable control over 15-round mid-range bursts',
              guide: 'Switch to a 3x or 4x scope. Stand at 80m. Practice pulling down harder. Because the scope zooms in, the visual recoil is magnified. Tweak your 3x and 4x ADS sliders by 2% if control is too stiff.',
            },
          ];
        case 3:
          return [
            {
              name: 'Gyro-Only Vertical Restraint',
              focus: 'Motion Sensor Recoil Alignment',
              duration: '15 Minutes',
              target: 'Spray 30 bullets using only device tilting (fingers off slide)',
              guide: 'If Gyroscope is enabled, hold device steadily. Start shooting and gently tilt your device forward/downward to compensate for vertical recoil. Keep your thumb still to calibrate motion muscle memory.',
            },
            {
              name: 'Drift correction bursts',
              focus: 'Horizontal Jitter Containment',
              duration: '15 Minutes',
              target: 'Maintain bullet groupings within the blue ring on targets',
              guide: 'Spray 10-round bursts at 50m. Since horizontal recoil is random, focus on resetting your spray or using micro tilt/drag adjustments when the gun starts shaking left or right.',
            },
          ];
        case 4:
          return [
            {
              name: 'Scope-Swapping Challenge',
              focus: 'Multi-Optic Adaptability',
              duration: '20 Minutes',
              target: 'Fire 3 magazines back-to-back using Red Dot, then 3x, then 4x',
              guide: 'Fire 30 rounds at 50m with Red Dot. Swap instantly to 3x, step back to 80m, fire 30 rounds. Swap to 4x, step back to 120m, fire 30 rounds. Learn the different dragging speeds needed for each optic.',
            },
            {
              name: 'Burst tap recovery',
              focus: 'Scope Recovery Center alignment',
              duration: '10 Minutes',
              target: 'Fire fast single-taps with SLR or Mini-14 without scope jumping',
              guide: 'Equip a DMR. Stand at 150m. Fire with a rhythm of one shot every 0.4 seconds. Focus on waiting for the reticle to fall back to the exact center before clicking again.',
            },
          ];
        case 5:
          return [
            {
              name: 'Moving Vehicle Spray Transfer',
              focus: 'Fast Tracking with Recoil Control',
              duration: '15 Minutes',
              target: 'Keep crosshair on moving targets while spraying 20 rounds',
              guide: 'Aim at the moving vehicle targets in the training ground. Scoped in with 3x, start spraying while dragging both downwards (to control recoil) and sideways (to lead the target).',
            },
            {
              name: 'Crouch peeking bursts',
              focus: 'Angle Advantage Recoil control',
              duration: '15 Minutes',
              target: 'Lean peek and spray 10 bullets within the target grid',
              guide: 'Stand behind a cover post. Peek/lean left, crouch, open scope, and fire a fast 10-round burst. Recover to cover. Repeat on the right side. Focus on recoil control from a leaning position.',
            },
          ];
        case 6:
          return [
            {
              name: 'Horizontal Sweep Transfer',
              focus: 'Target Transition in one spray',
              duration: '20 Minutes',
              target: 'Hit 3 separate boards in a single continuous 30-round magazine',
              guide: 'Line up 3 target boards at 30m. Start spraying the left target (10 rounds), snap horizontal to the center target (10 rounds), then snap to the right target (10 rounds) without letting go of fire.',
            },
            {
              name: 'Aim punch simulation',
              focus: 'Panic recoil recovery',
              duration: '10 Minutes',
              target: 'Re-center crosshair quickly after manual screen disruptions',
              guide: 'Fire a spray. Halfway through, flick your thumb hard in a random direction, then try to immediately pull the crosshair back to the target center while still spraying.',
            },
          ];
        case 7:
          return [
            {
              name: 'The 100m Laser Challenge',
              focus: 'Ultimate Recoil Mastery',
              duration: '20 Minutes',
              target: 'Land 70%+ of a full spray inside the target rings at 100m',
              guide: 'Equip a fully-loaded M416 with a 6x scope (zoomed down to 3x). Stand at 100m. Crouch, scope in, and spray the target. Tweak your final 3x ADS slider by 1-2% if you feel any minor stiffness.',
            },
            {
              name: 'Simulator test spray',
              focus: 'Virtual calibration review',
              duration: '15 Minutes',
              target: 'Achieve S or SSS Grade in the interactive shooting range below',
              guide: 'Head to the Shooting Range simulator at the bottom of this dashboard. Select AKM and Red Dot. Fire sprays and pull down. Confirm that the physical feeling matches your in-game setup.',
            },
          ];
      }
    } else if (primaryProblem === 'aim' || primaryProblem === 'close') {
      switch (day) {
        case 1:
          return [
            {
              name: 'Jiggle Hipfire Lock',
              focus: 'Close-quarters tracking & movement',
              duration: '15 Minutes',
              target: 'Keep hipfire reticle on target center while moving rapidly',
              guide: 'Stand 5m from a target board. Move left and right rapidly (jiggling). Keep your crosshair locked directly on the head/center of the target without letting it drift off.',
            },
            {
              name: 'Reflex Hipfire Snap',
              focus: 'Blind Target Acquisition',
              duration: '15 Minutes',
              target: 'Snap hipfire crosshair to random targets under 0.4 seconds',
              guide: 'Stand in the center of the target group. Look away, then quickly turn around, locate a target, and snap your hipfire crosshair directly onto it. Fire a 3-round burst.',
            },
          ];
        case 2:
          return [
            {
              name: 'ADS Snapping drills',
              focus: 'Optic Opening Precision',
              duration: '20 Minutes',
              target: 'Crosshair is on target the exact millisecond you scope in',
              guide: 'Aim at a target with hipfire, then tap scope. Your scope reticle should land exactly on target. Practice snapping to different targets (15m, 30m, 50m) and immediately scoping in.',
            },
            {
              name: 'Moving board track',
              focus: 'Linear speed compensation',
              duration: '15 Minutes',
              target: 'Keep crosshair static on moving board for 30 seconds',
              guide: 'Do not shoot. Scope in on a moving training ground target. Follow it left and right using only your swipe or gyro. Keep the reticle dead center. Align your movement speed to the board.',
            },
          ];
        case 3:
          return [
            {
              name: 'Close Fight Jiggle-Fire',
              focus: 'CQB spray control while moving',
              duration: '15 Minutes',
              target: 'Land 20/30 hipfire bullets on a 10m target while jiggling',
              guide: 'Practice jiggling left and right while firing full auto hipfire. Drag down lightly on the screen to counter the natural hipfire vertical spread. Focus on keeping your movement unpredictable.',
            },
            {
              name: 'Instant Crouch Peek snap',
              focus: 'Cover peeking headshots',
              duration: '15 Minutes',
              target: 'Peek cover, scope headshot, and unpeek in under 1 second',
              guide: 'Stand behind a box. Crouch. Tap Peek, open scope, snap to a target\'s head, fire a 2-round burst, and tap Peek again to hide. Do this repeatedly to build cover reflex.',
            },
          ];
        case 4:
          return [
            {
              name: 'Vertical Elevation Aiming',
              focus: 'High ground target snapping',
              duration: '15 Minutes',
              target: 'Quick snap between low ground and high ground targets',
              guide: 'Find an elevated target or building ledge in the training range. Practice snapping your aim from ground level up to the roof targets. Calibrate your vertical Camera sensitivity.',
            },
            {
              name: 'Hipfire to ADS switch',
              focus: 'Dynamic combat transition',
              duration: '15 Minutes',
              target: 'Start spray with hipfire, transition to ADS smoothly mid-spray',
              guide: 'Initiate a spray on a close target (10m) with hipfire. After 5 bullets, tap the scope button and continue spraying on a further target (25m) without stopping fire. Perfect for handling sudden rusher snaps.',
            },
          ];
        case 5:
          return [
            {
              name: 'Gyro Tracking Micro-adjustment',
              focus: 'Precision tilt target lock',
              duration: '20 Minutes',
              target: 'Follow small target adjustments without finger swipe',
              guide: 'Use Gyroscope. Stand at 50m. Follow moving target heads. Tilt your wrist slightly left and right. Gyroscope is much more effective than fingers for micro-tracking at speed.',
            },
            {
              name: 'Flick shot snap',
              focus: 'Muscle memory distance scaling',
              duration: '15 Minutes',
              target: 'Flick crosshair to target and stop instantly without sliding past',
              guide: 'Aim at target A. Quickly swipe your finger to flick onto target B. If your crosshair goes past target B, your Camera sensitivity is too high. If it stops short, it is too low.',
            },
          ];
        case 6:
          return [
            {
              name: 'Shotgun Quick-peeking',
              focus: 'Single-shot snap accuracy',
              duration: '15 Minutes',
              target: 'Land a full shotgun spread on target torso via jump-peeking',
              guide: 'Equip DBS or S12K. Practice run, jump, peek around a corner, fire, and immediately fall back. Teaches instant target acquisition and crosshair placement before firing.',
            },
            {
              name: 'Target sweep and snap',
              focus: 'Horizontal snap target transfers',
              duration: '15 Minutes',
              target: 'Eliminate 3 target boards at different angles in under 2 seconds',
              guide: 'Stand where targets are spread out. Practice flicking from one target to another, firing a single tap on each. Maintain a clean, snappy rhythm.',
            },
          ];
        case 7:
          return [
            {
              name: 'Arena TDM Drill Run',
              focus: 'Real combat application',
              duration: '30 Minutes',
              target: 'Win 2 Arena games with a K/D ratio above 2.0',
              guide: 'Queue for Arena TDM. Apply all hipfire tracking, jiggle shooting, and snap-scoping techniques. Focus on crosshair placement: keep your reticle at chest/head level even before peeking.',
            },
            {
              name: 'Reaction speed target check',
              focus: 'Final snap review',
              duration: '10 Minutes',
              target: 'Land S-tier score in the simulator on AKM at 50m',
              guide: 'Play the interactive range below. Focus on instant snap alignment. Keep the bullets packed close to the bulls-eye using your calibrated sensitivities.',
            },
          ];
      }
    } else if (primaryProblem === 'transfer') {
      switch (day) {
        case 1:
          return [
            {
              name: 'Target Sweep Bursts',
              focus: 'Horizontal layout snapping',
              duration: '15 Minutes',
              target: 'Flick between 2 targets smoothly',
              guide: 'Stand at 30m. Aim at Target A, fire a 5-round burst, then quickly drag/tilt your crosshair horizontally to Target B and fire another 5-round burst in one swift movement.',
            },
            {
              name: 'Linear Glide tracking',
              focus: 'Horizontal swipe speed calibration',
              duration: '15 Minutes',
              target: 'Keep crosshair stuck on moving cars in training grounds',
              guide: 'Align your finger swipe speed to follow vehicles moving horizontally across your viewport. Do not overshoot. Focus on maintaining a steady speed.',
            },
          ];
        case 2:
          return [
            {
              name: '3-Target Sweep Spray',
              focus: 'Continuous spray transition',
              duration: '20 Minutes',
              target: 'Distribute 30 bullets evenly across 3 targets in one spray',
              guide: 'Equip M416 with Red Dot. Stand at 20m. Shoot Target A (10 rounds), sweep to Target B (10 rounds), sweep to Target C (10 rounds) in one continuous spray without releasing fire.',
            },
            {
              name: 'Gyroscope Horizontal Tilt',
              focus: 'Wrist rotation sweeps',
              duration: '15 Minutes',
              target: 'Sweep targets using only device tilting',
              guide: 'Enable Gyro scope. Zoom in. Glide your crosshair horizontally from target to target by rotating your body or wrists. Reduces finger swiping friction and preserves finger real estate.',
            },
          ];
        default:
          return [
            {
              name: 'Dynamic Target Acquisition',
              focus: 'Multidirectional aiming sweeps',
              duration: '15 Minutes',
              target: 'Transition aim vertically and horizontally consecutively',
              guide: 'Stand in the center of the training yard. Aim at a ground target, sweep to an elevated target, then sweep to a far-right target. Calibrate spatial muscle awareness.',
            },
            {
              name: 'Custom Spray Transfer calibration',
              focus: 'Tuning sweep speeds',
              duration: '15 Minutes',
              target: 'Clean stop on targets during high speed sprays',
              guide: 'Tweak your ADS and Camera sliders by 2% increments if you notice you consistently overshoot or undershoot targets when transitioning between them during a spray.',
            },
          ];
      }
    } else {
      // Default / Sniping / Balanced Profile
      switch (day) {
        case 1:
          return [
            {
              name: 'Muscle Memory Foundation',
              focus: 'Adapting to calculated parameters',
              duration: '15 Minutes',
              target: 'Get comfortable with new look and scope sensitivities',
              guide: 'Equip your favorite rifle with Red Dot. Shoot targets at close range (10m - 30m). Run, slide, look around, and fire. Build baseline familiarity with the new speed.',
            },
            {
              name: 'ADS Recoil Adaptation',
              focus: 'Vertical hold calibration',
              duration: '15 Minutes',
              target: 'Hold a tight bullet grouping on a 30m target',
              guide: 'Stand at 30m. Practice full auto sprays. Notice how much physical finger pull or device tilt is required to counter the recoil. Tweak the ADS values if you feel too loose or stiff.',
            },
          ];
        case 2:
          return [
            {
              name: 'Optic Transition Drills',
              focus: 'Aim scaling across different zooms',
              duration: '20 Minutes',
              target: 'Successfully operate Red Dot, 3x, and 4x in sequence',
              guide: 'Perform 15-round sprays at targets using a Red Dot, then switch to a 3x, then a 4x. Practice adapting your finger drag pressure to match each scope\'s unique zoom factor.',
            },
            {
              name: 'Jiggle Hipfire tracking',
              focus: 'Close-range evasiveness & tracking',
              duration: '10 Minutes',
              target: 'Keep hipfire reticle centered on target while moving left/right',
              guide: 'Stand 10m from target. Move left/right in rapid jiggles while shooting hipfire. Focus on controlling the crosshair center using your thumb or gyroscope.',
            },
          ];
        case 3:
          return [
            {
              name: 'Lean Peek Burst Control',
              focus: 'Leaning recoil adjustment',
              duration: '15 Minutes',
              target: 'Shoot a stable 10-round spray from a peek angle',
              guide: 'Hide behind cover. Lean left, crouch, scope in, and spray 10 bullets. Cover. Lean right, crouch, scope in, and spray 10 bullets. Notice how leaning alters vertical climb.',
            },
            {
              name: 'DMR Cadence Tapping',
              focus: 'DMR recoil recovery timing',
              duration: '15 Minutes',
              target: 'Shoot Mini-14 at 150m with zero drift between shots',
              guide: 'Equip a DMR with a 4x/6x scope. Stand at 150m. Practice tapping target heads. Maintain a rhythm (one shot per 0.4s) to allow the scope to recover back to center naturally.',
            },
          ];
        case 4:
          return [
            {
              name: 'Bolt-Action headshot snap',
              focus: 'Sniper snap precision',
              duration: '20 Minutes',
              target: 'Land bolt-action headshots on targets at 150m under 1.2s',
              guide: 'Equip Kar98k or AWM with 6x/8x. Zoom in. Aim, target the head, click, and chamber the next round. Practice quick snapping to target heads from a neutral looking position.',
            },
            {
              name: 'Long-range moving target lead',
              focus: 'Predictive aim tracking',
              duration: '15 Minutes',
              target: 'Land single taps on moving target boards at 100m',
              guide: 'Shoot slightly in front of moving targets (lead the shot) so that the target runs directly into the bullet path. Account for the bullet travel time.',
            },
          ];
        case 5:
          return [
            {
              name: 'Spray Transfer sweeps',
              focus: 'Continuous spray target transitions',
              duration: '15 Minutes',
              target: 'Transition bullets between two targets in one spray',
              guide: 'Stand at 30m. Shoot target A (15 rounds), then swipe horizontally mid-spray to hit target B (15 rounds) without stopping fire.',
            },
            {
              name: 'Gyro motion calibration',
              focus: 'Wrist tilting micro-aim',
              duration: '15 Minutes',
              target: 'Perform minor scope adjustments using only wrist tilts',
              guide: 'Use Gyroscope. Hold the scope steady on target. Perform micro adjustments to follow small targets using wrist tilt only, keeping thumbs static on screen.',
            },
          ];
        case 6:
          return [
            {
              name: 'Obstacle jump snaps',
              focus: 'Airborne aim alignment',
              duration: '15 Minutes',
              target: 'Snap onto target the instant you jump over a box',
              guide: 'Run toward a low obstacle, jump over it, scope in mid-air, and shoot the target immediately upon landing. Calibrate your spatial alignment.',
            },
            {
              name: 'Rapid Reflex turns',
              focus: '180-degree camera spin',
              duration: '15 Minutes',
              target: 'Turn 180 degrees and lock onto a target instantly',
              guide: 'Run forward, drag screen to rotate 180 degrees backwards, scope in, and fire. Tweak Camera (Free Look) sensitivity if you overshoot or undershoot.',
            },
          ];
        case 7:
          return [
            {
              name: 'Full Match Simulator Run',
              focus: 'Calibrated combat assessment',
              duration: '25 Minutes',
              target: 'Get a clean, high score in the interactive range',
              guide: 'Play the shooting simulator below. Swap between M416 and AKM. Shoot sprays and check your accuracy. Confirm that the sensitivities feel perfectly customized to your hands.',
            },
            {
              name: 'Combat test run',
              focus: 'Battlegrounds validation',
              duration: '20 Minutes',
              target: 'Secure a top-10 placement in a classic match',
              guide: 'Play a classic match. Pay attention to how your close combat and long range sprays feel. If you feel any minor discomfort, perform micro-adjustments of 1-2% in settings.',
            },
          ];
      }
    }

    return [
      {
        name: 'Baseline Crosshair Control',
        focus: 'Look and Recoil Adaptation',
        duration: '15 Minutes',
        target: 'Calibrate aim settings',
        guide: 'Fire 10-round bursts at targets at 30m range using Red Dot. Adjust look and drag speeds as needed.',
      },
      {
        name: 'Aim Snapping Exercises',
        focus: 'Target acquisition tracking',
        duration: '10 Minutes',
        target: 'Instant crosshair snap',
        guide: 'Practice snapping onto target boards and firing. Focus on muscle memory.',
      },
    ];
  };

  const drills = getPersonalizedDrills(activeDay);

  const getDrillCompletionKey = (dayIndex: number, drillIndex: number) => {
    return `${result.slug}_day${dayIndex}_drill${drillIndex}`;
  };

  const getCompletedCount = () => {
    let count = 0;
    for (let day = 1; day <= 7; day++) {
      for (let drill = 0; drill < 2; drill++) {
        if (completedDrills[getDrillCompletionKey(day, drill)]) {
          count++;
        }
      }
    }
    return count;
  };

  const completedCount = getCompletedCount();
  const progressPercent = Math.round((completedCount / 14) * 100);

  return (
    <div className="bg-[#1b2836]/75 border border-[#384b5c]/40 rounded-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#384b5c]/30 pb-2">
        <div>
          <h3 className="font-headline text-base font-extrabold text-[#9cd8ff] tracking-wide uppercase flex items-center gap-2 select-none">
            <BookOpen className="w-5 h-5 text-primary-yellow" />
            7-DAY TACTICAL IMPROVEMENT PLAN
          </h3>
          <p className="text-[10px] text-text-muted uppercase tracking-wider select-none">
            Drills customized for <span className="text-white font-bold">{playstyle}</span> playstyle & <span className="text-white font-bold">{primaryProblem}</span> problem
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs font-technical text-[#cbdbe6] flex items-center gap-1.5 justify-end">
            <Flame className="w-4.5 h-4.5 text-primary-yellow animate-pulse" />
            <span>PROGRESS: <span className="font-black text-primary-yellow">{completedCount} / 14</span> Drills</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#0c0e10] h-2 rounded-full overflow-hidden border border-white/5">
        <div 
          className="bg-primary-yellow h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,215,0,0.5)]" 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>

      {/* Days Tabs Selection */}
      <div className="grid grid-cols-7 gap-1">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          // Check if all drills for this day are completed
          const d1 = completedDrills[getDrillCompletionKey(day, 0)];
          const d2 = completedDrills[getDrillCompletionKey(day, 1)];
          const isDayDone = d1 && d2;

          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`py-2 text-center rounded transition-all cursor-pointer border font-headline font-bold text-xs ${
                activeDay === day
                  ? 'bg-primary-yellow text-background border-primary-yellow font-black shadow-[0_0_10px_rgba(255,215,0,0.15)]'
                  : isDayDone
                  ? 'bg-[#1b2836]/20 border-green-600/30 text-green-500 hover:bg-[#1b2836]/50'
                  : 'bg-[#121d28] border-white/5 text-[#a0b0c0] hover:text-white hover:border-white/10'
              }`}
            >
              DAY {day}
              {isDayDone && <span className="block text-[8px] text-green-400">DONE</span>}
            </button>
          );
        })}
      </div>

      {/* Drills Content List */}
      <div className="space-y-3.5 mt-2">
        {drills.map((drill, index) => {
          const isDone = !!completedDrills[getDrillCompletionKey(activeDay, index)];
          return (
            <div 
              key={index}
              onClick={() => handleToggleDrill(activeDay, index)}
              className={`bg-[#121d28]/70 border rounded-lg p-4 cursor-pointer transition-all hover:bg-[#1b2836]/40 flex gap-4 items-start select-none ${
                isDone 
                  ? 'border-green-600/30 shadow-[inset_0_0_15px_rgba(22,163,74,0.05)]' 
                  : 'border-[#384b5c]/25 hover:border-primary-yellow/20'
              }`}
            >
              {/* Checkbox Icon */}
              <div className="mt-0.5 shrink-0 text-primary-yellow hover:text-white transition-colors">
                {isDone ? (
                  <CheckSquare className="w-5.5 h-5.5 text-green-500" />
                ) : (
                  <Square className="w-5.5 h-5.5 text-text-muted" />
                )}
              </div>

              {/* Drill Info */}
              <div className="space-y-1.5 flex-1">
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <h4 className={`font-headline text-sm font-extrabold tracking-wide uppercase transition-colors ${isDone ? 'text-zinc-500 line-through' : 'text-white'}`}>
                    {drill.name}
                  </h4>
                  <span className="text-[9px] font-technical bg-white/5 border border-white/10 px-2 py-0.5 rounded text-primary-yellow uppercase tracking-widest">
                    {drill.duration}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] font-technical text-[#cbd5e1]/80">
                  <div>
                    <span className="text-[#a0b0c0] uppercase block">FOCUS AREA:</span>
                    <span className="font-bold text-white uppercase">{drill.focus}</span>
                  </div>
                  <div>
                    <span className="text-[#a0b0c0] uppercase block">DAILY TARGET:</span>
                    <span className="font-bold text-white uppercase">{drill.target}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#384b5c]/15">
                  <span className="text-[10px] font-technical text-[#a0b0c0] uppercase block mb-1">DRILL GUIDE:</span>
                  <p className={`text-xs leading-relaxed transition-colors ${isDone ? 'text-zinc-500' : 'text-[#cbdbe6]'}`}>
                    {drill.guide}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Tip Banner */}
      <div className="bg-[#121d28]/40 border border-[#384b5c]/20 rounded p-3 flex gap-2.5 items-start">
        <AlertCircle className="w-4.5 h-4.5 text-primary-yellow shrink-0 mt-0.5" />
        <p className="text-[10px] font-technical text-[#a0b0c0] leading-relaxed">
          <span className="text-white font-bold block mb-0.5">TACTICAL ADVICE:</span>
          For best results, complete these drills in the PUBG Mobile/BGMI training area at the start of your gaming session. Consistent training builds permanent muscle memory faster than long, irregular sessions.
        </p>
      </div>
    </div>
  );
}
