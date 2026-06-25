'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Target, RefreshCw, X, Smartphone, AlertTriangle } from 'lucide-react';

interface ScopeState {
  no_scope_3rd: number;
  no_scope_1st: number;
  red_dot: number;
  scope_2x: number;
  scope_3x: number;
  scope_4x: number;
  scope_6x: number;
  scope_8x: number;
}

interface ShootingRangeProps {
  sensValues: {
    camera: ScopeState;
    ads: ScopeState;
    gyro: ScopeState | null;
    adsGyro: ScopeState | null;
  };
}

type WeaponType = 'm416' | 'akm' | 'awm';
type OpticType = 'red_dot' | 'scope_3x' | 'scope_4x' | 'scope_6x';

interface Hit {
  x: number;
  y: number;
  isBullsEye: boolean;
  score: number;
}

export default function ShootingRange({ sensValues }: ShootingRangeProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [weapon, setWeapon] = useState<WeaponType>('m416');
  const [optic, setOptic] = useState<OpticType>('red_dot');
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Check orientation
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const enterFullscreen = async () => {
    try {
      // Request gyro permission for iOS 13+
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState !== 'granted') {
          alert('Gyroscope permission denied. You can still play with touch swipe.');
        }
      }
      
      if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
        await (containerRef.current as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (e) {
      console.error('Fullscreen request failed', e);
      setIsFullscreen(true); // Fallback to simulated fullscreen (fixed positioning)
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if ((document as any).webkitFullscreenElement) {
        await (document as any).webkitExitFullscreen();
      }
    } catch (e) {}
    setIsFullscreen(false);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="bg-[#1b2836]/75 border border-[#384b5c]/40 rounded-sm p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-[#384b5c]/30 pb-2">
        <h3 className="font-headline text-base font-extrabold text-[#9cd8ff] tracking-wide uppercase flex items-center gap-2 select-none">
          <Target className="w-5 h-5 text-primary-yellow animate-pulse" />
          IMMERSIVE SHOOTING RANGE
        </h3>
      </div>
      <p className="text-xs text-[#cbdbe6] leading-relaxed">
        Test your actual sensitivity configuration in a simulated 3D environment. Includes real swipe scaling and gyroscope tracking.
      </p>

      <button
        onClick={enterFullscreen}
        className="w-full bg-primary-yellow text-background font-headline font-bold py-4 rounded-xl shadow-[0_4px_16px_rgba(255,215,0,0.25)] hover:bg-white active:scale-95 transition-all uppercase tracking-wide border border-primary-yellow/20 cursor-pointer"
      >
        ENTER SHOOTING RANGE
      </button>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div 
          ref={containerRef}
          className="fixed inset-0 z-50 bg-[#0c0e10] flex items-center justify-center overflow-hidden touch-none"
        >
          {isPortrait ? (
            <div className="text-center space-y-4 p-6 flex flex-col items-center">
              <Smartphone className="w-16 h-16 text-primary-yellow animate-pulse -rotate-90" />
              <h2 className="text-2xl font-headline font-black text-white uppercase tracking-widest">
                Rotate Your Device
              </h2>
              <p className="text-text-muted text-sm font-technical">
                The shooting range requires landscape orientation for dual-thumb control and accurate gyroscope mapping.
              </p>
              <button 
                onClick={exitFullscreen}
                className="mt-4 px-6 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10"
              >
                Exit Range
              </button>
            </div>
          ) : (
            <GameInstance 
              sensValues={sensValues} 
              weapon={weapon}
              setWeapon={setWeapon}
              optic={optic}
              setOptic={setOptic}
              onExit={exitFullscreen} 
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Game Instance Component (Only renders when in fullscreen landscape)
// ─────────────────────────────────────────────────────────────────────────────
function GameInstance({ 
  sensValues, 
  weapon, 
  setWeapon,
  optic, 
  setOptic,
  onExit 
}: { 
  sensValues: ShootingRangeProps['sensValues'], 
  weapon: WeaponType, 
  setWeapon: (w: WeaponType) => void,
  optic: OpticType, 
  setOptic: (o: OpticType) => void,
  onExit: () => void 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [bulletsLeft, setBulletsLeft] = useState(30);
  const [isFiring, setIsFiring] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [scoreSummary, setScoreSummary] = useState<any>(null);
  
  // Custom HUD positioning
  const [fireBtnPos, setFireBtnPos] = useState({ x: 40, y: typeof window !== 'undefined' ? window.innerHeight - 150 : 200 });
  const isDraggingFireBtnRef = useRef(false);

  // Crosshair position (virtual world space)
  const posRef = useRef({ x: 0, y: 0 });
  
  // Touch tracking for right half of screen
  const touchRef = useRef({ active: false, lastX: 0, lastY: 0, id: -1 });
  
  // Gyro tracking
  const lastGyroRef = useRef<{ alpha: number, beta: number, gamma: number } | null>(null);

  // Game loop & recoil
  const gameLoopRef = useRef<number>(0);
  const lastFireTimeRef = useRef<number>(0);
  const isFiringRef = useRef(false);

  const weapons = {
    m416: { name: 'M416', magSize: 30, fireRate: 95, vKick: 8.5, hJitter: 3.5, spread: 4 },
    akm: { name: 'AKM', magSize: 30, fireRate: 115, vKick: 13.5, hJitter: 5.5, spread: 6 },
    awm: { name: 'AWM', magSize: 5, fireRate: 1200, vKick: 50, hJitter: 1, spread: 1 },
  };

  const getOpticKey = (): keyof ScopeState => {
    switch (optic) {
      case 'red_dot': return 'red_dot';
      case 'scope_3x': return 'scope_3x';
      case 'scope_4x': return 'scope_4x';
      case 'scope_6x': return 'scope_6x';
      default: return 'red_dot';
    }
  };

  const getOpticZoom = () => {
    switch (optic) {
      case 'red_dot': return 1.2;
      case 'scope_3x': return 0.75;
      case 'scope_4x': return 0.55;
      case 'scope_6x': return 0.38;
      default: return 1.0;
    }
  };

  // ── DEVICE ORIENTATION (GYRO) ──────────────────────────────────────────────
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha === null || e.beta === null || e.gamma === null) return;
      
      const current = { alpha: e.alpha, beta: e.beta, gamma: e.gamma };
      
      if (lastGyroRef.current) {
        // Calculate delta (rough approximation, assuming landscape orientation)
        // In landscape, beta is tilt forward/back (vertical aim), gamma is twist (horizontal aim)
        // NOTE: DeviceOrientation math can get complex with quaternions, but for a 2D canvas 
        // simple deltas work okay for demonstration if device doesn't pass gimbal lock.
        
        let dBeta = current.beta - lastGyroRef.current.beta;
        let dGamma = current.gamma - lastGyroRef.current.gamma;

        // Handle wrap-around
        if (dBeta > 180) dBeta -= 360; else if (dBeta < -180) dBeta += 360;
        if (dGamma > 180) dGamma -= 360; else if (dGamma < -180) dGamma += 360;

        // Apply sensitivity
        const opticKey = getOpticKey();
        let gyroSens = 0;
        if (sensValues.gyro) {
          gyroSens = isFiringRef.current 
            ? (sensValues.adsGyro?.[opticKey] ?? 0) 
            : (sensValues.gyro?.[opticKey] ?? 0);
        }

        // Only apply if gyro is enabled and > 0
        if (gyroSens > 0) {
          // PUBG gyro scaling factor (tune this so 300% sens feels realistic)
          const gyroScale = (gyroSens / 100) * 8.0; 
          
          posRef.current.x += dBeta * gyroScale; // Mapping might need flip based on specific landscape orientation (left vs right)
          posRef.current.y += dGamma * gyroScale; 
          
          // Clamp to virtual world bounds
          posRef.current.x = Math.max(-1000, Math.min(1000, posRef.current.x));
          posRef.current.y = Math.max(-1000, Math.min(1000, posRef.current.y));
        }
      }
      
      lastGyroRef.current = current;
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [sensValues, optic]);


  // ── TOUCH / MOUSE SWIPE (CAMERA/ADS) ────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    let clientX = 0, clientY = 0, id = -1;
    if ('touches' in e) {
      // Find a touch on the right half of the screen
      const w = window.innerWidth;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.clientX > w / 2) {
          clientX = t.clientX;
          clientY = t.clientY;
          id = t.identifier;
          break;
        }
      }
      if (id === -1) return; // No touch on right half
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
      id = 0;
    }

    touchRef.current = { active: true, lastX: clientX, lastY: clientY, id };
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchRef.current.active) return;
    
    let clientX = 0, clientY = 0;
    if ('touches' in e) {
      const t = Array.from(e.changedTouches).find(t => t.identifier === touchRef.current.id);
      if (!t) return;
      clientX = t.clientX;
      clientY = t.clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const dx = clientX - touchRef.current.lastX;
    const dy = clientY - touchRef.current.lastY;

    touchRef.current.lastX = clientX;
    touchRef.current.lastY = clientY;

    // Apply sensitivity
    const opticKey = getOpticKey();
    const swipeSens = isFiringRef.current 
      ? sensValues.ads[opticKey] 
      : sensValues.camera[opticKey];

    // Swipe scaling factor
    const swipeScale = (swipeSens / 100) * 1.5;

    posRef.current.x += dx * swipeScale;
    posRef.current.y += dy * swipeScale;

    // Clamp
    posRef.current.x = Math.max(-1000, Math.min(1000, posRef.current.x));
    posRef.current.y = Math.max(-1000, Math.min(1000, posRef.current.y));
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e) {
      const t = Array.from(e.changedTouches).find(t => t.identifier === touchRef.current.id);
      if (t) touchRef.current.active = false;
    } else {
      touchRef.current.active = false;
    }
  };


  // ── FIRING & RECOIL LOGIC ──────────────────────────────────────────────────
  const startFiring = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e && e.cancelable) e.preventDefault(); // Prevent text selection and zoom
    if (bulletsLeft <= 0 || scoreSummary) return;
    setIsFiring(true);
    isFiringRef.current = true;
    lastFireTimeRef.current = performance.now();
    fireBullet();
  };

  const stopFiring = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e && e.cancelable) e.preventDefault();
    setIsFiring(false);
    isFiringRef.current = false;
  };

  const fireBullet = () => {
    setBulletsLeft((prev) => {
      if (prev <= 0) {
        if (prev === 1) finishMag(hits); // Calculate score if mag just emptied
        return 0;
      }

      const specs = weapons[weapon];
      const zoom = getOpticZoom();
      
      // Calculate hit location (center of screen, offset by base inaccuracy)
      const hitX = -posRef.current.x + (Math.random() - 0.5) * specs.spread * 6 * (1 / zoom);
      const hitY = -posRef.current.y + (Math.random() - 0.5) * specs.spread * 6 * (1 / zoom);

      const targetRadius = 100 * zoom;
      const distance = Math.sqrt(hitX * hitX + hitY * hitY);
      const isBullsEye = distance <= (targetRadius * 0.2);
      
      let score = 0;
      if (distance <= targetRadius * 0.2) score = 10;
      else if (distance <= targetRadius * 0.4) score = 8;
      else if (distance <= targetRadius * 0.6) score = 6;
      else if (distance <= targetRadius * 0.8) score = 4;
      else if (distance <= targetRadius) score = 2;

      const newHit = { x: hitX, y: hitY, isBullsEye, score };
      
      setHits(h => {
        const newHits = [...h, newHit];
        if (prev - 1 === 0) finishMag(newHits);
        return newHits;
      });

      // Apply Recoil (pushes reticle UP, which means virtual world moves DOWN relative to screen)
      const kickY = specs.vKick * (1 / zoom);
      const jitterX = (Math.random() - 0.5) * specs.hJitter * 2.5 * (1 / zoom);

      posRef.current.x += jitterX;
      posRef.current.y -= kickY; // Move view UP

      return prev - 1;
    });
  };

  const finishMag = (finalHits: Hit[]) => {
    stopFiring();
    if (finalHits.length === 0) return;

    const avgDist = finalHits.reduce((acc, h) => acc + Math.sqrt(h.x * h.x + h.y * h.y), 0) / finalHits.length;
    const onTarget = finalHits.filter(h => h.score > 0).length;
    const accuracy = Math.round((onTarget / finalHits.length) * 100);

    let grade = 'C';
    let advice = 'Heavy recoil climb. Pull down harder or increase ADS/Gyro sensitivity.';
    if (accuracy >= 85 && avgDist < 40) {
      grade = 'SSS'; advice = 'Perfect spray control! Settings are locked in.';
    } else if (accuracy >= 65 && avgDist < 70) {
      grade = 'S'; advice = 'Excellent control. Minor horizontal jitter remaining.';
    } else if (accuracy >= 45 && avgDist < 100) {
      grade = 'A'; advice = 'Good grouping. Slight vertical climb detected.';
    } else if (accuracy >= 25 && avgDist < 150) {
      grade = 'B'; advice = 'Moderate climb. Try increasing ADS/Gyro by 5-10%.';
    }

    setScoreSummary({ show: true, grade, accuracy, avgDist: Math.round(avgDist), advice });
  };

  const resetTarget = () => {
    setBulletsLeft(weapons[weapon].magSize);
    setHits([]);
    posRef.current = { x: 0, y: 0 };
    setScoreSummary(null);
  };

  // Draggable Fire Button Logic
  const handleFireBtnTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    // We only want to drag if we are touching a specific "drag handle" or maybe just two-finger drag?
    // Let's make it so if we hold it, it fires. If we want to move it, we drag a small handle next to it.
    // Or, we can just track touch move on the fire button.
  };


  // ── RENDER LOOP ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = (time: number) => {
      // Fire logic check
      if (isFiringRef.current && weapon !== 'awm') {
        const timeSinceFire = time - lastFireTimeRef.current;
        if (timeSinceFire > weapons[weapon].fireRate) {
          fireBullet();
          lastFireTimeRef.current = time;
        }
      }

      ctx.fillStyle = '#1e242a'; // Sky/background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Draw virtual world (target and hits)
      // They move opposite to camera position
      const targetX = cx + posRef.current.x;
      const targetY = cy + posRef.current.y;

      const zoom = getOpticZoom();
      const baseRadius = 100;
      const targetRadius = baseRadius * zoom;

      // Draw ground
      ctx.fillStyle = '#2a3138';
      ctx.beginPath();
      ctx.moveTo(0, cy + posRef.current.y + targetRadius + 20);
      ctx.lineTo(canvas.width, cy + posRef.current.y + targetRadius + 20);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.fill();

      // Draw Target Board Rings
      const ringColors = [
        { c: '#ffffff', border: '#cbd5e1' },
        { c: '#ffffff', border: '#cbd5e1' },
        { c: '#3b82f6', border: '#2563eb' },
        { c: '#ef4444', border: '#dc2626' },
        { c: '#f59e0b', border: '#d97706' }, // Bulls-Eye
      ];

      for (let i = 0; i < 5; i++) {
        const radius = targetRadius * (1 - i * 0.2);
        ctx.beginPath();
        ctx.arc(targetX, targetY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = ringColors[i].c;
        ctx.fill();
        ctx.strokeStyle = ringColors[i].border;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw Hits (fixed to target)
      hits.forEach((hit) => {
        const hX = targetX + hit.x;
        const hY = targetY + hit.y;
        
        ctx.beginPath();
        ctx.arc(hX, hY, 4, 0, 2 * Math.PI);
        ctx.fillStyle = hit.isBullsEye ? '#ffd700' : '#000000';
        ctx.fill();
      });

      // Draw Crosshair (Fixed in center of screen)
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      const gap = 6;
      const len = 12;

      ctx.beginPath(); ctx.moveTo(cx - gap - len, cy); ctx.lineTo(cx - gap, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + gap, cy); ctx.lineTo(cx + gap + len, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - gap - len); ctx.lineTo(cx, cy - gap); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + gap); ctx.lineTo(cx, cy + gap + len); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 2, 0, 2 * Math.PI); ctx.fillStyle = '#22c55e'; ctx.fill();

      // Scope Overlay
      if (optic !== 'red_dot') {
        const grad = ctx.createRadialGradient(cx, cy, cy * 0.6, cx, cy, cy * 1.2);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.95)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.arc(cx, cy, cy * 0.9, 0, 2 * Math.PI);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 40;
        ctx.stroke();
      }

      gameLoopRef.current = requestAnimationFrame(render);
    };

    gameLoopRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(gameLoopRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [optic, weapon, hits]);


  return (
    <div className="w-full h-full relative font-headline select-none touch-none">
      {/* Background Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 touch-none"
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none p-4">
        
        {/* Top Bar - Weapon & Optic Selectors */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="flex gap-4">
            <div className="bg-black/60 p-2 rounded-lg border border-white/10 backdrop-blur-md">
              <div className="text-[9px] text-primary-yellow tracking-widest uppercase mb-1">Weapon</div>
              <div className="flex gap-1">
                {(['m416', 'akm', 'awm'] as WeaponType[]).map(w => (
                  <button 
                    key={w}
                    onClick={() => setWeapon(w)}
                    className={`px-3 py-1 rounded text-xs font-black uppercase transition-colors ${weapon === w ? 'bg-primary-yellow text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    {weapons[w].name}
                  </button>
                ))}
              </div>
              <div className="text-xs text-white/70 mt-1">{bulletsLeft} / {weapons[weapon].magSize} Ammo</div>
            </div>

            <div className="bg-black/60 p-2 rounded-lg border border-white/10 backdrop-blur-md hidden sm:block">
              <div className="text-[9px] text-primary-yellow tracking-widest uppercase mb-1">Optic</div>
              <div className="flex gap-1">
                {(['red_dot', 'scope_3x', 'scope_4x', 'scope_6x'] as OpticType[]).map(o => (
                  <button 
                    key={o}
                    onClick={() => setOptic(o)}
                    className={`px-2 py-1 rounded text-xs font-black uppercase transition-colors ${optic === o ? 'bg-primary-yellow text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    {o.replace('scope_', '').replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={onExit}
            className="bg-red-500/80 text-white p-2 rounded font-bold uppercase hover:bg-red-600 shadow-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Draggable Fire Button Container */}
          <div 
            className="absolute pointer-events-auto flex flex-col items-center gap-2"
            style={{ left: fireBtnPos.x, top: fireBtnPos.y }}
          >
            {/* Drag Handle */}
            <div 
              className="w-10 h-3 bg-white/20 rounded-full cursor-move touch-none hover:bg-primary-yellow/50 active:bg-primary-yellow"
              onPointerDown={(e) => {
                const target = e.currentTarget;
                target.setPointerCapture(e.pointerId);
                isDraggingFireBtnRef.current = true;
              }}
              onPointerMove={(e) => {
                if (isDraggingFireBtnRef.current) {
                  setFireBtnPos(prev => ({
                    x: prev.x + e.movementX,
                    y: prev.y + e.movementY
                  }));
                }
              }}
              onPointerUp={(e) => {
                isDraggingFireBtnRef.current = false;
                e.currentTarget.releasePointerCapture(e.pointerId);
              }}
              onPointerCancel={(e) => {
                isDraggingFireBtnRef.current = false;
                e.currentTarget.releasePointerCapture(e.pointerId);
              }}
            />
            {/* The Fire Button itself */}
            <button
              onTouchStart={startFiring}
              onTouchEnd={stopFiring}
              onTouchCancel={stopFiring}
              onMouseDown={startFiring}
              onMouseUp={stopFiring}
              onMouseLeave={stopFiring}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 flex items-center justify-center font-black text-xl sm:text-2xl transition-all shadow-xl select-none touch-none ${
                bulletsLeft <= 0 ? 'bg-zinc-800 border-zinc-600 text-zinc-500' :
                isFiring ? 'bg-white border-red-500 text-red-500 scale-95' : 'bg-white/20 border-white text-white hover:bg-white/30'
              }`}
              style={{ backdropFilter: 'blur(4px)', WebkitUserSelect: 'none' }}
            >
              FIRE
            </button>
          </div>

          {/* Reload Button */}
          {bulletsLeft <= 0 && !scoreSummary && (
            <div className="absolute bottom-6 right-6 pointer-events-auto">
              <button 
                onClick={resetTarget}
                className="bg-primary-yellow text-black px-6 py-3 rounded-full font-black animate-pulse shadow-[0_0_20px_rgba(255,215,0,0.5)] flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" /> RELOAD
              </button>
            </div>
          )}

          <div className="text-white/30 text-xs tracking-[0.2em] pointer-events-none absolute bottom-4 right-1/4 sm:right-1/3">
            SWIPE RIGHT HALF TO AIM
          </div>
        </div>
      </div>

      {/* Score Modal */}
      {scoreSummary?.show && (
        <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center pointer-events-auto backdrop-blur-sm">
          <div className="bg-[#1b2836] border border-primary-yellow/50 rounded-xl p-8 max-w-md text-center shadow-2xl space-y-6">
            <div className="space-y-2">
              <div className="text-primary-yellow text-sm font-black tracking-widest uppercase">Spray Analysis</div>
              <div className="text-6xl font-black text-white">{scoreSummary.grade}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-left bg-black/30 p-4 rounded-lg">
              <div>
                <div className="text-white/50 text-xs">ACCURACY</div>
                <div className="text-white font-bold text-xl">{scoreSummary.accuracy}%</div>
              </div>
              <div>
                <div className="text-white/50 text-xs">DRIFT</div>
                <div className="text-white font-bold text-xl">{scoreSummary.avgDist}px</div>
              </div>
            </div>

            <p className="text-white/80 text-sm">{scoreSummary.advice}</p>

            <button
              onClick={resetTarget}
              className="w-full bg-primary-yellow text-black font-black py-4 rounded-lg hover:bg-white transition-colors"
            >
              PRACTICE AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
