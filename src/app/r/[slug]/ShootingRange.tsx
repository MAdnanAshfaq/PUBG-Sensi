'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Target, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ShootingRangeProps {
  adsValues: {
    no_scope_3rd: number;
    no_scope_1st: number;
    red_dot: number;
    scope_2x: number;
    scope_3x: number;
    scope_4x: number;
    scope_6x: number;
    scope_8x: number;
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

export default function ShootingRange({ adsValues }: ShootingRangeProps) {
  const [weapon, setWeapon] = useState<WeaponType>('m416');
  const [optic, setOptic] = useState<OpticType>('red_dot');
  const [bulletsLeft, setBulletsLeft] = useState(30);
  const [isShooting, setIsShooting] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [scoreSummary, setScoreSummary] = useState<{
    show: boolean;
    grade: string;
    accuracy: number;
    avgDistance: number;
    advice: string;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [recoilOffset, setRecoilOffset] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const shootIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isShootingRef = useRef(false);
  const targetDistanceRef = useRef(50); // meters

  // Weapon specs
  const weapons = {
    m416: {
      name: 'M416',
      magSize: 30,
      fireRate: 95, // ms
      verticalKick: 4.8,
      horizontalJitter: 2.2,
      baseInaccuracy: 4,
    },
    akm: {
      name: 'AKM',
      magSize: 30,
      fireRate: 115, // ms
      verticalKick: 8.5,
      horizontalJitter: 3.8,
      baseInaccuracy: 7,
    },
    awm: {
      name: 'AWM',
      magSize: 5,
      fireRate: 1200, // ms
      verticalKick: 38,
      horizontalJitter: 0.8,
      baseInaccuracy: 1.5,
    },
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

  const getOpticLabel = () => {
    switch (optic) {
      case 'red_dot': return 'Red Dot (50m)';
      case 'scope_3x': return '3x Scope (100m)';
      case 'scope_4x': return '4x Scope (150m)';
      case 'scope_6x': return '6x Scope (200m)';
    }
  };

  const getActiveSensitivity = () => {
    switch (optic) {
      case 'red_dot': return adsValues.red_dot;
      case 'scope_3x': return adsValues.scope_3x;
      case 'scope_4x': return adsValues.scope_4x;
      case 'scope_6x': return adsValues.scope_6x;
      default: return 50;
    }
  };

  // Reset target
  const handleReset = () => {
    setBulletsLeft(weapons[weapon].magSize);
    setHits([]);
    setRecoilOffset({ x: 0, y: 0 });
    setScoreSummary(null);
    setIsShooting(false);
    isShootingRef.current = false;
    if (shootIntervalRef.current) {
      clearInterval(shootIntervalRef.current);
      shootIntervalRef.current = null;
    }
  };

  // Reset target when weapon changes
  useEffect(() => {
    handleReset();
  }, [weapon, optic]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (shootIntervalRef.current) clearInterval(shootIntervalRef.current);
    };
  }, []);

  // Handle pointer drag (recoil control)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    pointerRef.current = { x, y };
    isDraggingRef.current = true;
    canvas.setPointerCapture(e.pointerId);

    // Single fire for Bolt-Action AWM on click
    if (weapon === 'awm' && !isShooting && bulletsLeft > 0 && !scoreSummary) {
      fireBullet();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const dx = x - pointerRef.current.x;
    const dy = y - pointerRef.current.y;
    
    pointerRef.current = { x, y };
    
    const adsSens = getActiveSensitivity();
    // Responsiveness scaling linked to slider value
    const sensitivityMultiplier = adsSens / 100;
    // Base scaling coefficient to balance mouse/swipe distance
    const dragMultiplier = 1.35; 

    setRecoilOffset(prev => ({
      x: Math.max(-180, Math.min(180, prev.x + dx * sensitivityMultiplier * dragMultiplier)),
      y: Math.max(-180, Math.min(180, prev.y + dy * sensitivityMultiplier * dragMultiplier))
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  // Draw simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#0c0e10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw Grid / Radar Background (Premium Vanguard Style)
      ctx.strokeStyle = 'rgba(77, 71, 50, 0.2)';
      ctx.lineWidth = 1;
      // Draw grid lines
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Range markers (stands/hills)
      ctx.fillStyle = 'rgba(77, 71, 50, 0.05)';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 30);
      ctx.lineTo(canvas.width, canvas.height - 30);
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Draw Target Board
      const zoom = getOpticZoom();
      const baseRadius = 80;
      const targetRadius = baseRadius * zoom;

      // Draw target stand shadow and pole
      ctx.fillStyle = '#1e2022';
      ctx.fillRect(centerX - 4, centerY, 8, canvas.height - centerY - 30);
      
      // Draw target rings (Standard PUBG circular range board)
      const ringColors = [
        { c: '#ffffff', border: '#cbd5e1', text: '#475569' }, // 1-2 Ring
        { c: '#ffffff', border: '#cbd5e1', text: '#475569' }, // 3-4 Ring
        { c: '#3b82f6', border: '#2563eb', text: '#ffffff' }, // 5-6 Ring
        { c: '#ef4444', border: '#dc2626', text: '#ffffff' }, // 7-8 Ring
        { c: '#f59e0b', border: '#d97706', text: '#1e293b' }, // 9-10 Ring (Bulls-Eye)
      ];

      for (let i = 0; i < 5; i++) {
        const radius = targetRadius * (1 - i * 0.2);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = ringColors[i].c;
        ctx.fill();
        ctx.strokeStyle = ringColors[i].border;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw ring numbers (scoring tags)
        if (radius > 15) {
          ctx.fillStyle = ringColors[i].border;
          ctx.font = `bold ${Math.round(8 * zoom + 3)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Top number
          ctx.fillText((10 - i * 2).toString(), centerX, centerY - radius + (8 * zoom));
          // Bottom number
          ctx.fillText((10 - i * 2).toString(), centerX, centerY + radius - (8 * zoom));
        }
      }

      // Draw inner core bulls-eye dot
      ctx.beginPath();
      ctx.arc(centerX, centerY, targetRadius * 0.05, 0, 2 * Math.PI);
      ctx.fillStyle = '#000000';
      ctx.fill();

      // Draw all previous bullet impacts (hits)
      hits.forEach((hit) => {
        // Impact dot
        ctx.beginPath();
        ctx.arc(centerX + hit.x, centerY + hit.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = hit.isBullsEye ? '#ffd700' : '#ef4444';
        ctx.fill();
        // Inner core of bullet hole
        ctx.beginPath();
        ctx.arc(centerX + hit.x, centerY + hit.y, 1.2, 0, 2 * Math.PI);
        ctx.fillStyle = '#27272a';
        ctx.fill();
        // Muted shock ring
        ctx.beginPath();
        ctx.arc(centerX + hit.x, centerY + hit.y, 6, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.stroke();
      });

      // Draw Reticle (Dynamic Position shifted by Recoil)
      const reticleX = centerX + recoilOffset.x;
      const reticleY = centerY + recoilOffset.y;

      ctx.strokeStyle = '#22c55e'; // Green crosshair
      ctx.lineWidth = 1.5;

      // Draw crosshair lines
      const lineLen = 8;
      const gap = 4;
      // Left
      ctx.beginPath();
      ctx.moveTo(reticleX - lineLen - gap, reticleY);
      ctx.lineTo(reticleX - gap, reticleY);
      ctx.stroke();
      // Right
      ctx.beginPath();
      ctx.moveTo(reticleX + gap, reticleY);
      ctx.lineTo(reticleX + lineLen + gap, reticleY);
      ctx.stroke();
      // Top
      ctx.beginPath();
      ctx.moveTo(reticleX, reticleY - lineLen - gap);
      ctx.lineTo(reticleX, reticleY - gap);
      ctx.stroke();
      // Bottom
      ctx.beginPath();
      ctx.moveTo(reticleX, reticleY + gap);
      ctx.lineTo(reticleX, reticleY + lineLen + gap);
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(reticleX, reticleY, 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#22c55e';
      ctx.fill();

      // If scope/optic is active, draw lens frame/shadow to look premium
      if (optic !== 'red_dot') {
        const borderGradient = ctx.createRadialGradient(
          centerX, centerY, centerY * 0.7, 
          centerX, centerY, centerY * 1.2
        );
        borderGradient.addColorStop(0, 'rgba(0,0,0,0)');
        borderGradient.addColorStop(0.5, 'rgba(0,0,0,0.5)');
        borderGradient.addColorStop(1, 'rgba(12,14,16,0.98)');
        
        ctx.fillStyle = borderGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw scope casing circular frame
        ctx.beginPath();
        ctx.arc(centerX, centerY, centerY * 0.9, 0, 2 * Math.PI);
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 15;
        ctx.stroke();

        ctx.font = '9px monospace';
        ctx.fillStyle = '#999077';
        ctx.fillText(getOpticLabel(), centerX, centerY - centerY * 0.82);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [recoilOffset, hits, optic, weapon]);

  // Fire a single bullet
  const fireBullet = () => {
    setBulletsLeft((prev) => {
      if (prev <= 0) return 0;
      
      const currentBullets = prev - 1;
      const specs = weapons[weapon];
      const zoom = getOpticZoom();
      
      // Calculate hit point relative to current reticle position
      // base inaccuracy spreads the bullet slightly
      const randomInaccuracyX = (Math.random() - 0.5) * specs.baseInaccuracy * 6 * (1 / zoom);
      const randomInaccuracyY = (Math.random() - 0.5) * specs.baseInaccuracy * 6 * (1 / zoom);

      const hitX = recoilOffset.x + randomInaccuracyX;
      const hitY = recoilOffset.y + randomInaccuracyY;

      // Distance from center of target
      const distance = Math.sqrt(hitX * hitX + hitY * hitY);
      
      // Calculate score based on distance and zoom
      // Bullseye radius is 20 * zoom
      const targetRadius = 80 * zoom;
      const isBullsEye = distance <= (targetRadius * 0.2); // within yellow ring
      
      let bulletScore = 0;
      if (distance <= targetRadius * 0.2) bulletScore = 10;
      else if (distance <= targetRadius * 0.4) bulletScore = 8;
      else if (distance <= targetRadius * 0.6) bulletScore = 6;
      else if (distance <= targetRadius * 0.8) bulletScore = 4;
      else if (distance <= targetRadius) bulletScore = 2;

      const newHit: Hit = {
        x: hitX,
        y: hitY,
        isBullsEye,
        score: bulletScore,
      };

      setHits((prevHits) => {
        const updated = [...prevHits, newHit];
        
        // If magazine is empty, calculate spray score summary
        if (currentBullets === 0) {
          setTimeout(() => {
            calculateSpraySummary(updated);
          }, 300);
        }
        return updated;
      });

      // Recoil kickback pushes crosshair UP (negative Y in canvas space) and jitter X
      const kickY = -specs.verticalKick * (1 / zoom);
      const jitterX = (Math.random() - 0.5) * specs.horizontalJitter * 2.5 * (1 / zoom);

      setRecoilOffset((prev) => ({
        x: Math.max(-180, Math.min(180, prev.x + jitterX)),
        // Cap climb-up to prevent scrolling off screen completely
        y: Math.max(-180, Math.min(180, prev.y + kickY)),
      }));

      return currentBullets;
    });
  };

  // Start continuous fire
  const startShooting = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (bulletsLeft <= 0 || scoreSummary || isShootingRef.current) return;
    
    // AWM is single fire, no automatic interval
    if (weapon === 'awm') {
      return;
    }

    setIsShooting(true);
    isShootingRef.current = true;
    
    // Fire first bullet immediately
    fireBullet();
    
    const specs = weapons[weapon];
    shootIntervalRef.current = setInterval(() => {
      if (isShootingRef.current) {
        fireBullet();
      }
    }, specs.fireRate);
  };

  const stopShooting = () => {
    setIsShooting(false);
    isShootingRef.current = false;
    if (shootIntervalRef.current) {
      clearInterval(shootIntervalRef.current);
      shootIntervalRef.current = null;
    }
  };

  // Calculate grade and advice
  const calculateSpraySummary = (finalHits: Hit[]) => {
    stopShooting();
    
    if (finalHits.length === 0) return;

    const total = finalHits.length;
    const avgDistance = finalHits.reduce((acc, curr) => acc + Math.sqrt(curr.x * curr.x + curr.y * curr.y), 0) / total;
    const onTargetCount = finalHits.filter(h => h.score > 0).length;
    const accuracy = Math.round((onTargetCount / total) * 100);

    let grade = 'C';
    let advice = '';
    const adsSens = getActiveSensitivity();

    if (accuracy >= 85 && avgDistance < 22) {
      grade = 'SSS';
      advice = `Outstanding spray control! Your ${getOpticLabel().split(' ')[0]} ADS sensitivity of ${adsSens}% is perfectly tuned to your physical swipe speed and screen response. Lock this setting in!`;
    } else if (accuracy >= 70 && avgDistance < 38) {
      grade = 'S';
      advice = `Excellent grouping. You controlled the vertical kick very well. Your sensitivity of ${adsSens}% is highly stable. Minor wrist drift adjustments will push this to championship tier.`;
    } else if (accuracy >= 50 && avgDistance < 60) {
      grade = 'A';
      advice = `Good spray grouping. The bullets are centered but showed slightly wider vertical drift. If you felt you were struggling to pull down, consider raising your ${getOpticLabel().split(' ')[0]} ADS slider by 3-5%.`;
    } else if (accuracy >= 30 && avgDistance < 90) {
      grade = 'B';
      advice = `Moderate recoil hold. The weapon climbed upwards. Try increasing your ADS sensitivity or practice a faster finger swipe downwards to counteract the climb.`;
    } else {
      grade = 'C';
      advice = `Heavy bullet climb detected. Your sensitivity might be too low, requiring excessive swipe space. Try increasing your ADS sensitivity slider by 10% and test again.`;
    }

    setScoreSummary({
      show: true,
      grade,
      accuracy,
      avgDistance: Math.round(avgDistance),
      advice,
    });
  };

  return (
    <div className="bg-[#1b2836]/75 border border-[#384b5c]/40 rounded-sm p-5 space-y-4 relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-[#384b5c]/30 pb-2">
        <h3 className="font-headline text-base font-extrabold text-[#9cd8ff] tracking-wide uppercase flex items-center gap-2 select-none">
          <Target className="w-5 h-5 text-primary-yellow animate-pulse" />
          INTERACTIVE SHOOTING RANGE
        </h3>
        <button
          onClick={handleReset}
          className="text-[9px] font-technical text-primary-yellow border border-primary-yellow/30 px-2 py-0.5 bg-primary-yellow/5 rounded hover:bg-primary-yellow/15 flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          RESET RANGE
        </button>
      </div>

      {/* Simulator Info Controls */}
      <div className="grid grid-cols-2 gap-3">
        {/* Weapon Selection */}
        <div className="space-y-1">
          <span className="text-[10px] text-text-muted uppercase tracking-wider block select-none">SELECT WEAPON</span>
          <div className="grid grid-cols-3 gap-1">
            {(['m416', 'akm', 'awm'] as WeaponType[]).map((w) => (
              <button
                key={w}
                onClick={() => setWeapon(w)}
                className={`text-[10px] py-1.5 font-headline font-bold rounded uppercase cursor-pointer transition-all border ${
                  weapon === w
                    ? 'bg-primary-yellow/15 border-primary-yellow text-primary-yellow'
                    : 'bg-[#121d28] border-white/5 text-[#a0b0c0] hover:text-white'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Optic Selection */}
        <div className="space-y-1">
          <span className="text-[10px] text-text-muted uppercase tracking-wider block select-none">SELECT OPTIC</span>
          <div className="grid grid-cols-4 gap-1">
            {(['red_dot', 'scope_3x', 'scope_4x', 'scope_6x'] as OpticType[]).map((o) => (
              <button
                key={o}
                onClick={() => setOptic(o)}
                className={`text-[9px] py-1.5 font-headline font-bold rounded uppercase cursor-pointer transition-all border ${
                  optic === o
                    ? 'bg-primary-yellow/15 border-primary-yellow text-primary-yellow'
                    : 'bg-[#121d28] border-white/5 text-[#a0b0c0] hover:text-white'
                }`}
              >
                {o.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The Interactive Canvas Area */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={450}
          height={260}
          className="w-full h-[260px] bg-[#0c0e10] border border-[#384b5c]/25 cursor-crosshair rounded-lg touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />

        {/* HUD Overlay inside Canvas */}
        <div className="absolute top-3 left-3 pointer-events-none select-none font-technical text-[10px] text-primary-yellow bg-[#0c0e10]/80 px-2.5 py-1 rounded border border-white/10 space-y-0.5">
          <div>WEAPON: <span className="font-bold text-white">{weapons[weapon].name}</span></div>
          <div>OPTIC: <span className="font-bold text-white uppercase">{optic.replace('_', ' ')}</span></div>
          <div>ADS SENS: <span className="font-bold text-white">{getActiveSensitivity()}%</span></div>
        </div>

        <div className="absolute top-3 right-3 pointer-events-none select-none font-technical text-[10px] text-primary-yellow bg-[#0c0e10]/80 px-2.5 py-1 rounded border border-white/10">
          MAGAZINE: <span className="font-bold text-white">{bulletsLeft} / {weapons[weapon].magSize}</span>
        </div>

        {/* Action Trigger overlay if not mobile */}
        {bulletsLeft > 0 && !isShooting && !scoreSummary && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 pointer-events-none select-none font-technical text-[9px] text-[#cbd5e1]/60 bg-[#0c0e10]/80 border border-white/5 px-3 py-1 rounded-full uppercase tracking-wider text-center animate-pulse">
            {weapon === 'awm' ? 'Tap target area to fire single shot' : 'Hold target or hold trigger button below to spray'}
          </div>
        )}

        {/* Results Screen Modal Card overlay */}
        {scoreSummary?.show && (
          <div className="absolute inset-0 bg-[#0c0e10]/95 flex flex-col justify-center items-center p-6 text-center space-y-4 border border-[#384b5c]/30 rounded-lg animate-fade-in">
            <div className="space-y-1">
              <span className="font-technical text-[9px] text-primary-yellow uppercase tracking-widest block font-black">
                SPRAY DIAGNOSIS RESOLVED
              </span>
              <h4 className="font-headline text-lg font-bold text-white uppercase tracking-tight">
                {weapons[weapon].name} Recoil Control Profile
              </h4>
            </div>

            {/* Big Grade Badge */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-primary-yellow/20 bg-primary-yellow/5 animate-pulse-glow" />
              <div className="font-headline text-5xl font-extrabold tracking-tighter text-primary-yellow animate-bounce">
                {scoreSummary.grade}
              </div>
            </div>

            {/* Grid Metrics */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs font-technical text-xs text-[#cbd5e1]">
              <div className="bg-[#1b2836]/65 border border-white/5 p-2 rounded">
                <div className="text-[10px] text-text-muted uppercase">HIT ACCURACY</div>
                <div className="font-bold text-white mt-0.5">{scoreSummary.accuracy}%</div>
              </div>
              <div className="bg-[#1b2836]/65 border border-white/5 p-2 rounded">
                <div className="text-[10px] text-text-muted uppercase">DRIFT CENTER</div>
                <div className="font-bold text-white mt-0.5">{scoreSummary.avgDistance}px</div>
              </div>
            </div>

            {/* Advice paragraph */}
            <p className="text-xs text-[#cbdbe6] leading-relaxed max-w-sm">
              {scoreSummary.advice}
            </p>

            <button
              onClick={handleReset}
              className="px-6 py-2 rounded-xl bg-primary-yellow text-background font-headline font-black tracking-wide text-xs uppercase active:scale-95 transition-all shadow-[0_4px_12px_rgba(255,215,0,0.2)] cursor-pointer"
            >
              TEST AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Trigger Button - crucial for touch screens */}
      {weapon !== 'awm' && !scoreSummary && (
        <div className="flex gap-2">
          <button
            onPointerDown={startShooting}
            onPointerUp={stopShooting}
            onPointerLeave={stopShooting}
            onTouchEnd={stopShooting}
            className={`flex-1 font-headline font-black py-4 px-4 rounded-xl flex items-center justify-center gap-2 select-none active:scale-95 transition-all text-base border cursor-pointer ${
              bulletsLeft <= 0
                ? 'bg-zinc-800 text-zinc-600 border-zinc-900/10 cursor-not-allowed'
                : isShooting
                ? 'bg-red-600/20 text-red-500 border-red-500/40 animate-pulse'
                : 'bg-primary-yellow text-background border-primary-yellow/20 shadow-[0_4px_16px_rgba(255,215,0,0.15)] hover:bg-white'
            }`}
            disabled={bulletsLeft <= 0}
          >
            {isShooting ? 'FIRING SPRAY... (DRAG ON TARGET)' : 'HOLD TO FIRE SPRAY'}
          </button>
        </div>
      )}
    </div>
  );
}
