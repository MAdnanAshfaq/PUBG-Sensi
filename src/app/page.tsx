'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Rocket, 
  Laptop, 
  Smartphone, 
  Zap, 
  RotateCw, 
  Crosshair, 
  Touchpad, 
  Info, 
  Flame, 
  Target, 
  Eye, 
  CheckCircle2, 
  ArrowDown, 
  TrendingUp, 
  MoveHorizontal, 
  ArrowLeft, 
  ArrowRight, 
  Wrench, 
  Loader2 
} from 'lucide-react';

interface WizardData {
  deviceTier: 'budget' | 'mid' | 'flagship';
  fps: 40 | 60 | 90 | 120;
  gyroMode: 'always_on' | 'scope_on' | 'off';
  fingerCount: number;
  playstyle: 'rusher' | 'sniper' | 'assaulter' | 'balanced';
  primaryProblem: 'recoil' | 'aim' | 'transfer' | 'close' | 'long';
}

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('CALCULATING BALANCES');
  
  const [formData, setFormData] = useState<WizardData>({
    deviceTier: 'mid',
    fps: 60,
    gyroMode: 'always_on',
    fingerCount: 4,
    playstyle: 'balanced',
    primaryProblem: 'recoil',
  });

  const nextStep = () => setStep((s) => Math.min(s + 1, 6));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const selectOption = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate tactical engine checklist
    const statuses = [
      'INITIALIZING SCANNER',
      'READING DEVICE SENSOR TIER',
      'CALCULATING FPS FRAME TIME COMPENSATIONS',
      'TAILORING FOR CLAW INDEX LAYOUT',
      'OPTIMIZING MIDPOINTS FOR PLAYSTYLE',
      'RESOLVING AIM CORRECTIONS LAYER',
      'FINALIZING DETAILED PROFILE',
    ];

    let statusIndex = 0;
    const interval = setInterval(() => {
      if (statusIndex < statuses.length - 1) {
        statusIndex++;
        setLoadingStatus(statuses[statusIndex]);
      }
    }, 400);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      clearInterval(interval);
      if (data.success && data.slug) {
        router.push(`/r/${data.slug}`);
      } else {
        alert('Failed to generate sensitivity profile. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      clearInterval(interval);
      console.error(error);
      alert('Network error. Check connection and retry.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full px-4 pt-8 pb-12 bg-background min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border-tactical/30 pb-4">
        <div className="flex items-center gap-2">
          <Shield className="text-primary-yellow animate-pulse w-7 h-7" />
          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tighter text-primary-yellow">AIMSYNC</h1>
            <p className="font-technical text-[10px] text-text-muted tracking-widest uppercase">PUBG/BGMI Tactical Configurator</p>
          </div>
        </div>
        <div className="font-technical text-sm text-primary-yellow border border-primary-yellow/30 px-3 py-1 bg-primary-yellow/5 rounded">
          STEP {step}/6
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-surface-dark h-1.5 rounded-full overflow-hidden my-4 border border-border-tactical/10">
        <div
          className="bg-primary-yellow h-full transition-all duration-300"
          style={{ width: `${(step / 6) * 100}%` }}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center py-6">
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-foreground">1. DEVICE HARDWARE SPEC</h2>
              <p className="text-sm text-text-muted">Choose your device hardware tier. AimSync adjusts Gyroscope sensitivity thresholds to filter sensor lag and latency.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'flagship', label: 'Flagship tier', desc: 'iPad Pro, iPhone Pro, ROG Phone, Snapdragon 8 Gen 2+. High-precision sensors.', icon: Rocket },
                { id: 'mid', label: 'Mid-range tier', desc: 'OnePlus Nord, Poco X series, Galaxy A. Standard responsive sensors.', icon: Laptop },
                { id: 'budget', label: 'Budget/Entry tier', desc: 'Under $200 devices. Higher gyroscope sensor latency; values are damped by 15%.', icon: Smartphone },
              ].map((opt) => {
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => selectOption('deviceTier', opt.id as any)}
                    className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all active:scale-[0.99] ${
                      formData.deviceTier === opt.id
                        ? 'bg-olive/10 border-primary-yellow shadow-[0_0_15px_rgba(255,215,0,0.15)]'
                        : 'bg-surface-card border-border-tactical/40 hover:border-text-muted/60'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg ${formData.deviceTier === opt.id ? 'bg-primary-yellow text-background' : 'bg-surface-hover text-text-muted'}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-headline text-lg font-bold uppercase tracking-wide text-foreground">{opt.label}</h3>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-foreground">2. TARGET FRAME RATE</h2>
              <p className="text-sm text-text-muted">Select your in-game framerate (FPS). Higher FPS allows for snappier tracking; lower FPS requires larger swipes.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 40, label: '40 FPS', desc: 'Ultra Settings (Medium)', mult: '-8% speed scale' },
                { id: 60, label: '60 FPS', desc: 'Extreme Settings', mult: 'Standard scale' },
                { id: 90, label: '90 FPS', desc: '90fps Mode', mult: '+10% speed scale' },
                { id: 120, label: '120 FPS', desc: '120fps Mode', mult: '+10% speed scale' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => selectOption('fps', opt.id as any)}
                  className={`flex flex-col justify-between p-4 rounded-xl border text-left h-32 transition-all active:scale-[0.99] ${
                    formData.fps === opt.id
                      ? 'bg-olive/10 border-primary-yellow shadow-[0_0_15px_rgba(255,215,0,0.15)]'
                      : 'bg-surface-card border-border-tactical/40 hover:border-text-muted/60'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-headline text-3xl font-extrabold text-foreground">{opt.id}</span>
                    <Zap className={`w-5 h-5 ${formData.fps === opt.id ? 'text-primary-yellow' : 'text-text-muted'}`} />
                  </div>
                  <div>
                    <h3 className="font-headline text-sm font-bold uppercase tracking-wide text-foreground">{opt.desc}</h3>
                    <p className="text-[10px] font-technical text-primary-yellow mt-1">{opt.mult}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-foreground">3. GYROSCOPE PREFERENCE</h2>
              <p className="text-sm text-text-muted">Using Gyroscope is critical for competitive recoil control in PUBG Mobile. Select your configuration.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'always_on', label: 'Always-on Gyroscope', desc: 'Highly Recommended. Gyroscope controls both camera look and weapon recoil tilting.', icon: RotateCw },
                { id: 'scope_on', label: 'Scope-only Gyroscope', desc: 'Gyroscope is only active when aiming down sights (ADS). Good for sniper players.', icon: Crosshair },
                { id: 'off', label: 'Disabled (Swipe only)', desc: 'Recoil is controlled entirely by sliding fingers on screen. Recommended to learn Gyro!', icon: Touchpad },
              ].map((opt) => {
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => selectOption('gyroMode', opt.id as any)}
                    className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all active:scale-[0.99] ${
                      formData.gyroMode === opt.id
                        ? 'bg-olive/10 border-primary-yellow shadow-[0_0_15px_rgba(255,215,0,0.15)]'
                        : 'bg-surface-card border-border-tactical/40 hover:border-text-muted/60'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg ${formData.gyroMode === opt.id ? 'bg-primary-yellow text-background' : 'bg-surface-hover text-text-muted'}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-headline text-lg font-bold uppercase tracking-wide text-foreground">{opt.label}</h3>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-foreground">4. FINGER LAYOUT CONFIG</h2>
              <p className="text-sm text-text-muted">Select how many fingers you use. Higher layouts (claw) benefit from faster swipe settings; thumbs need high precision.</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[2, 3, 4, 5].map((fingers) => (
                <button
                  key={fingers}
                  onClick={() => selectOption('fingerCount', fingers)}
                  className={`flex flex-col justify-between p-4 rounded-xl border text-center h-28 transition-all active:scale-[0.99] ${
                    formData.fingerCount === fingers
                      ? 'bg-olive/10 border-primary-yellow shadow-[0_0_15px_rgba(255,215,0,0.15)]'
                      : 'bg-surface-card border-border-tactical/40 hover:border-text-muted/60'
                  }`}
                >
                  <span className="font-headline text-3xl font-extrabold text-foreground">{fingers}</span>
                  <div className="space-y-1">
                    <span className="font-headline text-xs font-bold text-foreground">FINGERS</span>
                    <p className="text-[9px] font-technical text-text-muted uppercase">
                      {fingers === 2 ? 'Thumbs' : fingers + 'F Claw'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="bg-surface-card border border-border-tactical/20 rounded-xl p-4 flex gap-3 text-xs text-text-muted items-start">
              <Info className="w-5 h-5 text-primary-yellow flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Claw layout setups (4 or 5 fingers) allocate separate buttons for firing and scoping, allowing you to run higher camera rotation limits.
              </p>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-foreground">5. PRIMARY COMBAT ROLE</h2>
              <p className="text-sm text-text-muted">Your role dictates the scaling on scope groups. Snipers need stability; rushers need close-quarters speed.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'rusher', label: 'Entry Rusher', desc: 'Aggressive, CQB. Boosts close-range sights (+12%).', icon: Flame },
                { id: 'assaulter', label: 'Mid-Assaulter', desc: 'Rifle sprays, cover fires. Balanced, stable sprays.', icon: Target },
                { id: 'sniper', label: 'Bolt Sniper', desc: 'Long range precision. Lowers high scope speeds (-12%).', icon: Eye },
                { id: 'balanced', label: 'Flex Player', desc: 'Fills gaps. Direct midpoints, versatile.', icon: CheckCircle2 },
              ].map((opt) => {
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => selectOption('playstyle', opt.id as any)}
                    className={`flex flex-col justify-between p-4 rounded-xl border text-left h-36 transition-all active:scale-[0.99] ${
                      formData.playstyle === opt.id
                        ? 'bg-olive/10 border-primary-yellow shadow-[0_0_15px_rgba(255,215,0,0.15)]'
                        : 'bg-surface-card border-border-tactical/40 hover:border-text-muted/60'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <IconComponent className="w-5 h-5 text-text-muted" />
                      {formData.playstyle === opt.id && <span className="w-2 h-2 rounded-full bg-primary-yellow shadow-[0_0_8px_#ffd700]" />}
                    </div>
                    <div>
                      <h3 className="font-headline text-base font-bold uppercase tracking-wide text-foreground">{opt.label}</h3>
                      <p className="text-[10px] text-text-muted mt-1 leading-normal">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-headline text-2xl font-bold uppercase tracking-tight text-foreground">6. RECOIL OR AIM OBSTACLE</h2>
              <p className="text-sm text-text-muted">Identify your primary aim difficulty. The algorithm applies corrective multipliers to counter these specific issues.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'recoil', label: 'Sustained Recoil Control', desc: 'Struggling to keep crosshair from rising during spray. Applies +15% boost to Gyro and ADS mid-scopes (3x/4x).', icon: ArrowDown },
                { id: 'aim', label: 'Close Range Tracking', desc: 'Struggling to track players jumping or sliding close. Elevates 3rd person and red-dot speeds.', icon: TrendingUp },
                { id: 'transfer', label: 'Horizontal Spray Transfer', desc: 'Struggling to switch targets while spraying. Dampens ADS by -10% and boosts Gyro by +8%.', icon: MoveHorizontal },
                { id: 'close', label: 'Hipfire Reaction Speed', desc: 'Bullet spread is fine, but target acquisition is too slow. Boosts close range camera speeds.', icon: Zap },
                { id: 'long', label: 'Long Range Precision', desc: 'Struggling to align precise headshots on distant enemies. Dampens high optics.', icon: Crosshair },
              ].map((opt) => {
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => selectOption('primaryProblem', opt.id as any)}
                    className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all active:scale-[0.99] ${
                      formData.primaryProblem === opt.id
                        ? 'bg-olive/10 border-primary-yellow shadow-[0_0_15px_rgba(255,215,0,0.15)]'
                        : 'bg-surface-card border-border-tactical/40 hover:border-text-muted/60'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg ${formData.primaryProblem === opt.id ? 'bg-primary-yellow text-background' : 'bg-surface-hover text-text-muted'}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-headline text-base font-bold uppercase tracking-wide text-foreground">{opt.label}</h3>
                      <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="flex justify-between gap-4 border-t border-border-tactical/20 pt-6">
        <button
          onClick={prevStep}
          disabled={step === 1}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-headline font-bold text-base uppercase border transition-all ${
            step === 1
              ? 'border-border-tactical/20 text-text-muted/40 cursor-not-allowed'
              : 'border-border-tactical/50 text-foreground hover:bg-surface-hover active:scale-95'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          BACK
        </button>

        {step < 6 ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-headline font-bold text-base uppercase bg-foreground text-background hover:bg-foreground/90 transition-all active:scale-95 shadow-lg"
          >
            CONTINUE
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-headline font-extrabold text-base uppercase bg-primary-yellow text-background hover:bg-primary-yellow/90 transition-all active:scale-95 shadow-[0_4px_20px_rgba(255,215,0,0.3)] border border-primary-yellow/10"
          >
            GENERATE PROFILE
            <Wrench className="w-4 h-4" />
          </button>
        )}
      </footer>

      {/* Submitting Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="relative w-48 h-48 mb-8 flex items-center justify-center border border-border-tactical/30 rounded-full animate-pulse-glow">
            {/* Radar Scope simulation lines */}
            <div className="absolute w-[95%] h-[95%] border border-dashed border-primary-yellow/20 rounded-full animate-spin [animation-duration:15s]" />
            <div className="absolute w-[70%] h-[70%] border border-primary-yellow/10 rounded-full" />
            
            {/* The pulsing radar hand */}
            <div className="absolute inset-0 w-full h-full animate-scan rounded-full" />

            <Loader2 className="w-12 h-12 text-primary-yellow animate-spin" />
          </div>

          <div className="space-y-3 max-w-sm">
            <h3 className="font-headline text-3xl font-extrabold tracking-tighter text-primary-yellow">TACTICAL RESOLUTION ACTIVE</h3>
            <p className="font-technical text-xs text-primary-yellow border border-primary-yellow/30 px-3 py-1.5 bg-primary-yellow/5 rounded-md inline-block uppercase tracking-wider animate-pulse">
              {loadingStatus}...
            </p>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">
              AimSync is applying customized scale algorithms to construct your perfect sensitivity config profile.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
