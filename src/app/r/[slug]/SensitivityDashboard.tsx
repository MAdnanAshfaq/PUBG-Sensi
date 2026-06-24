'use client';

import { useState } from 'react';
import { 
  Copy, 
  Check, 
  Share2, 
  Lightbulb, 
  RotateCcw, 
  Target,
  Settings,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Info
} from 'lucide-react';
import { SavedResult } from '@/utils/db';
import ShootingRange from './ShootingRange';
import TrainingPlan from './TrainingPlan';

interface SensitivityDashboardProps {
  result: SavedResult;
}

type TabType = 'camera' | 'ads' | 'gyro' | 'adsGyro';

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

export default function SensitivityDashboard({ result }: SensitivityDashboardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<TabType>('camera');
  const [isSimpleView, setIsSimpleView] = useState(true);

  // Feedback states
  const [feedbackOption, setFeedbackOption] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Editable sensitivity values initialized from server calculated settings
  const [sensValues, setSensValues] = useState<{
    camera: ScopeState;
    ads: ScopeState;
    gyro: ScopeState | null;
    adsGyro: ScopeState | null;
  }>(() => {
    const initCategory = (catValues: any) => {
      if (!catValues) return null;
      return {
        no_scope_3rd: catValues.no_scope,
        no_scope_1st: catValues.no_scope,
        red_dot: catValues.red_dot,
        scope_2x: catValues.scope_2x,
        scope_3x: catValues.scope_3x,
        scope_4x: catValues.scope_4x,
        scope_6x: catValues.scope_6x,
        scope_8x: catValues.scope_8x,
      };
    };

    return {
      camera: initCategory(result.values.camera)!,
      ads: initCategory(result.values.ads)!,
      gyro: initCategory(result.values.gyro),
      adsGyro: initCategory(result.values.adsGyro),
    };
  });

  const hasGyro = result.inputs.gyroMode !== 'off';

  // Handle slider updates
  const handleSliderChange = (category: TabType, scopeKey: string, val: number) => {
    setSensValues((prev) => {
      const updated = { ...prev };
      if (updated[category]) {
        (updated[category] as any)[scopeKey] = val;
      }
      return updated;
    });
  };

  // Reset entire category/card to server calculated default
  const handleResetCategory = (category: TabType) => {
    setSensValues((prev) => {
      const updated = { ...prev };
      const defaultCat = (result.values as any)[category];
      if (defaultCat) {
        updated[category] = {
          no_scope_3rd: defaultCat.no_scope,
          no_scope_1st: defaultCat.no_scope,
          red_dot: defaultCat.red_dot,
          scope_2x: defaultCat.scope_2x,
          scope_3x: defaultCat.scope_3x,
          scope_4x: defaultCat.scope_4x,
          scope_6x: defaultCat.scope_6x,
          scope_8x: defaultCat.scope_8x,
        };
      }
      return updated;
    });
  };

  // Check if a category has been modified from default
  const isCategoryModified = (category: TabType) => {
    const current = sensValues[category];
    const defaultCat = (result.values as any)[category];
    if (!current || !defaultCat) return false;
    return (
      current.no_scope_3rd !== defaultCat.no_scope ||
      current.no_scope_1st !== defaultCat.no_scope ||
      current.red_dot !== defaultCat.red_dot ||
      current.scope_2x !== defaultCat.scope_2x ||
      current.scope_3x !== defaultCat.scope_3x ||
      current.scope_4x !== defaultCat.scope_4x ||
      current.scope_6x !== defaultCat.scope_6x ||
      current.scope_8x !== defaultCat.scope_8x
    );
  };

  // Copy share link
  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Copy config settings block
  const copyConfigText = () => {
    let text = `=== AimSync Sensitivity Configuration ===\n`;
    text += `Device: ${result.inputs.deviceTier.toUpperCase()} | FPS: ${result.inputs.fps} | Finger Layout: ${result.inputs.fingerCount} Fingers\n`;
    text += `Combat Playstyle: ${result.inputs.playstyle.toUpperCase()} | Corrective Tuning: ${result.inputs.primaryProblem.toUpperCase()}\n\n`;

    const formatBlock = (title: string, values: ScopeState | null) => {
      if (!values) return '';
      let block = `[${title} Sensitivity]\n`;
      block += `3rd Person No Scope: ${values.no_scope_3rd}%\n`;
      block += `1st Person No Scope: ${values.no_scope_1st}%\n`;
      block += `Red Dot, Holo, Aim Assist: ${values.red_dot}%\n`;
      block += `2x Scope: ${values.scope_2x}%\n`;
      block += `3x Scope: ${values.scope_3x}%\n`;
      block += `4x Scope: ${values.scope_4x}%\n`;
      block += `6x Scope: ${values.scope_6x}%\n`;
      block += `8x Scope: ${values.scope_8x}%\n\n`;
      return block;
    };

    text += formatBlock('Camera', sensValues.camera);
    text += formatBlock('ADS (Firing)', sensValues.ads);
    if (sensValues.gyro) text += formatBlock('Gyroscope', sensValues.gyro);
    if (sensValues.adsGyro) text += formatBlock('ADS Gyroscope', sensValues.adsGyro);

    text += `Generated by AimSync Configurator`;

    navigator.clipboard.writeText(text);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  // Submit player calibration feedback
  const submitFeedback = async (score: string) => {
    setFeedbackOption(score);
    setSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: result.slug,
          score: score,
        }),
      });
      if (res.ok) {
        setFeedbackSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Get explanation text for active analysis tab
  const getActiveExplanation = () => {
    switch (activeAnalysisTab) {
      case 'camera':
        return result.explanations.camera_explanation;
      case 'ads':
        return result.explanations.ads_explanation;
      case 'gyro':
        return result.explanations.gyro_explanation || 'Gyroscope is disabled.';
      case 'adsGyro':
        return result.explanations.ads_gyro_explanation || 'Gyroscope is disabled.';
      default:
        return '';
    }
  };

  // Render a PUBG-style sensitivity card containing two columns of sliders (Exact Replica)
  const renderSensCard = (
    category: TabType,
    title: string,
    desc: string,
    maxVal: number
  ) => {
    const values = sensValues[category];
    if (!values) return null;

    const modified = isCategoryModified(category);

    const renderSlider = (scopeKey: string, label: string) => {
      const currentVal = (values as any)[scopeKey];
      const pct = ((currentVal - 1) / (maxVal - 1)) * 100;

      return (
        <div key={scopeKey} className="space-y-2">
          {/* Label Row */}
          <div className="flex justify-between items-center">
            <span className="text-[13px] font-normal text-[#e2e8f0] font-body select-none">
              {label}
            </span>
            <span className="text-[13px] font-semibold text-[#e2e8f0] font-body select-none">
              {currentVal}%
            </span>
          </div>

          {/* Controls Row */}
          <div className="slider-container flex items-center gap-3">
            {/* Minus Button */}
            <button
              onClick={() => handleSliderChange(category, scopeKey, Math.max(1, currentVal - 1))}
              className="control-btn w-8 h-8 bg-[#121d28] border border-white/20 text-white hover:bg-[#1a2b3c] active:bg-[#2a3b4d] flex items-center justify-center font-normal rounded-none cursor-pointer select-none transition-all text-lg"
            >
              −
            </button>

            {/* Slider track container */}
            <div className="slider-track flex-grow h-1 bg-[#0d161f] relative flex items-center">
              <input
                type="range"
                min="1"
                max={maxVal}
                value={currentVal}
                onChange={(e) => handleSliderChange(category, scopeKey, Number(e.target.value))}
                className="pubg-slider"
                style={{
                  background: `linear-gradient(to right, #4a6375 0%, #4a6375 ${pct}%, #0d161f ${pct}%, #0d161f 100%)`
                }}
              />
            </div>

            {/* Plus Button */}
            <button
              onClick={() => handleSliderChange(category, scopeKey, Math.min(maxVal, currentVal + 1))}
              className="control-btn w-8 h-8 bg-[#121d28] border border-white/20 text-white hover:bg-[#1a2b3c] active:bg-[#2a3b4d] flex items-center justify-center font-normal rounded-none cursor-pointer select-none transition-all text-lg"
            >
              +
            </button>
          </div>
        </div>
      );
    };

    return (
      <div className="settings-overlay bg-[#1b2836]/85 border border-white/10 backdrop-blur-[4px] rounded-none p-6 md:p-8 space-y-6 shadow-2xl relative">
        <div className="flex justify-between items-start border-b border-[#384b5c]/20 pb-3">
          <div>
            <h3 className="header-title text-[15px] font-headline font-bold uppercase tracking-wider text-white select-none">
              {title}
            </h3>
            <p className="header-desc text-[11px] text-[#a0b0c0] mt-0.5 select-none leading-relaxed">
              {desc}
            </p>
          </div>
          {modified && (
            <button
              onClick={() => handleResetCategory(category)}
              className="text-[9px] font-technical text-primary-yellow hover:underline flex items-center gap-1 cursor-pointer"
              title="Reset entire card to optimal default values"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              RESET
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {/* Left Column */}
          <div className="space-y-8">
            {renderSlider('no_scope_3rd', '3rd Person No Scope')}
            {renderSlider('red_dot', 'Red Dot, Holographic, Aim Assist')}
            {!isSimpleView && renderSlider('scope_3x', '3x Scope, Win94')}
            {!isSimpleView && renderSlider('scope_6x', '6x Scope')}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {!isSimpleView && renderSlider('no_scope_1st', '1st Person No Scope')}
            {!isSimpleView && renderSlider('scope_2x', '2x Scope')}
            {renderSlider('scope_4x', '4x Scope, VSS')}
            {!isSimpleView && renderSlider('scope_8x', '8x Scope')}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons Header */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={copyConfigText}
          className="flex-1 bg-primary-yellow text-background font-headline font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(255,215,0,0.25)] hover:bg-white active:scale-95 transition-all text-base border border-primary-yellow/20 cursor-pointer"
        >
          {copiedConfig ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copiedConfig ? 'COPIED CONFIGURATION!' : 'COPY ALL CONFIG'}
        </button>

        <button
          onClick={copyShareLink}
          className="flex-1 bg-surface-card hover:bg-surface-hover text-foreground font-headline font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 border border-border-tactical/40 active:scale-95 transition-all text-base cursor-pointer"
        >
          {copiedLink ? <Check className="w-5 h-5 text-primary-yellow" /> : <Share2 className="w-5 h-5" />}
          {copiedLink ? 'LINK COPIED!' : 'COPY SHARE LINK'}
        </button>
      </div>

      {/* Dynamic Tactical Analysis Panel with Sub-Tabs */}
      <div className="bg-[#1b2836]/75 border border-[#384b5c]/40 rounded-sm p-5 space-y-4 shadow-2xl relative">
        <div className="flex border-b border-[#384b5c]/30 pb-2 overflow-x-auto no-scrollbar gap-2">
          <div className="bg-primary-yellow/15 p-1 rounded-lg h-fit text-primary-yellow flex-shrink-0 mr-1 animate-pulse">
            <Lightbulb className="w-4 h-4" />
          </div>
          {[
            { id: 'camera', label: 'LOOK ANALYSIS' },
            { id: 'ads', label: 'ADS RECOIL ANALYSIS' },
            { id: 'gyro', label: 'GYRO ANALYSIS', show: hasGyro },
          ].map(
            (tab) =>
              (tab.show !== false) && (
                <button
                  key={tab.id}
                  onClick={() => setActiveAnalysisTab(tab.id as TabType)}
                  className={`text-[10px] font-headline font-bold tracking-widest px-2.5 py-1 transition-all rounded cursor-pointer ${
                    activeAnalysisTab === tab.id
                      ? 'bg-primary-yellow/20 text-primary-yellow border border-primary-yellow/30'
                      : 'text-[#a0b0c0] hover:text-foreground border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              )
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs text-[#cbdbe6] leading-relaxed select-none">
            {getActiveExplanation()}
          </p>
        </div>
      </div>

      {/* Toggle View Mode & Sensitivity Cards Stack */}
      <div className="space-y-4">
        {/* Toggle Bar */}
        <div className="flex justify-between items-center bg-[#1b2836]/50 border border-[#384b5c]/25 rounded p-3">
          <div>
            <span className="text-xs font-headline font-extrabold tracking-widest text-[#9cd8ff] uppercase block select-none">
              SENSITIVITY DIAL MODE
            </span>
            <span className="text-[10px] text-text-muted uppercase tracking-wider block select-none mt-0.5">
              {isSimpleView ? 'Essential scopes only (No scope, Red Dot, 4x)' : 'Full tactical layout (All scopes active)'}
            </span>
          </div>
          <div className="flex bg-[#0c0e10] p-1 rounded border border-white/5 gap-1">
            <button
              onClick={() => setIsSimpleView(true)}
              className={`text-[9px] font-headline font-black tracking-wider px-3 py-1.5 transition-all rounded cursor-pointer ${
                isSimpleView
                  ? 'bg-primary-yellow text-background shadow-[0_2px_6px_rgba(255,215,0,0.2)]'
                  : 'text-[#a0b0c0] hover:text-white'
              }`}
            >
              SIMPLE VIEW
            </button>
            <button
              onClick={() => setIsSimpleView(false)}
              className={`text-[9px] font-headline font-black tracking-wider px-3 py-1.5 transition-all rounded cursor-pointer ${
                !isSimpleView
                  ? 'bg-primary-yellow text-background shadow-[0_2px_6px_rgba(255,215,0,0.2)]'
                  : 'text-[#a0b0c0] hover:text-white'
              }`}
            >
              FULL VIEW
            </button>
          </div>
        </div>

        {/* PUBG Mobile Themed Sensitivity Cards Stack (Exact Replica) */}
        <div className="space-y-5">
          {renderSensCard(
            'camera', 
            'Camera Sensitivity', 
            '(Affects the sensitivity of the camera when the screen is swiped without firing.)', 
            200
          )}
          
          {renderSensCard(
            'ads', 
            'ADS Sensitivity', 
            '(Affects the sensitivity of the camera when the screen is swiped while firing. Can be used to control vertical barrel climb.)', 
            200
          )}

          {hasGyro && renderSensCard(
            'gyro', 
            'Gyroscope Sensitivity', 
            '(Adjusts camera view movement speed based on physical device tilting/rotation.)', 
            400
          )}

          {hasGyro && renderSensCard(
            'adsGyro', 
            'ADS Gyroscope Sensitivity', 
            '(Adjusts camera view movement speed based on device tilting during full auto firing.)', 
            400
          )}
        </div>
      </div>

      {/* Manual Entry Visual Guide */}
      <div className="bg-[#1b2836]/75 border border-[#384b5c]/40 rounded-sm p-5 space-y-4">
        <div className="flex border-b border-[#384b5c]/30 pb-2 gap-2 items-center">
          <Settings className="w-5 h-5 text-primary-yellow" />
          <h3 className="font-headline text-base font-extrabold text-[#9cd8ff] tracking-wide uppercase select-none">
            HOW TO MANUALLY ENTER VALUES IN-GAME
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-technical text-xs">
          <div className="bg-[#121d28] border border-white/5 p-3.5 rounded space-y-2">
            <div className="text-[10px] text-primary-yellow font-black uppercase">01 / OPEN SETTINGS</div>
            <p className="text-[11px] text-[#cbdbe6] leading-relaxed">
              Launch PUBG Mobile/BGMI, tap the bottom right menu drawer, and select <strong>Settings</strong>.
            </p>
          </div>
          <div className="bg-[#121d28] border border-white/5 p-3.5 rounded space-y-2">
            <div className="text-[10px] text-primary-yellow font-black uppercase">02 / SENSITIVITY TAB</div>
            <p className="text-[11px] text-[#cbdbe6] leading-relaxed">
              Navigate to the <strong>Sensitivity</strong> tab and ensure you choose the <strong>Customize</strong> layout plan.
            </p>
          </div>
          <div className="bg-[#121d28] border border-white/5 p-3.5 rounded space-y-2">
            <div className="text-[10px] text-primary-yellow font-black uppercase">03 / APPLY VALUES</div>
            <p className="text-[11px] text-[#cbdbe6] leading-relaxed">
              Find the matching slider sections (Camera, ADS, Gyro) and slide them to match your calibration profile.
            </p>
          </div>
          <div className="bg-[#121d28] border border-white/5 p-3.5 rounded space-y-2">
            <div className="text-[10px] text-primary-yellow font-black uppercase">04 / PRACTICE</div>
            <p className="text-[11px] text-[#cbdbe6] leading-relaxed">
              Step into the <strong>Training Ground</strong> to build muscle memory using the personalized plan below.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Shooting Range Simulator */}
      <ShootingRange adsValues={sensValues.ads} />

      {/* AimSync Calibration Engine Feedback Control */}
      <div className="bg-[#1b2836]/75 border border-[#384b5c]/40 rounded-sm p-5 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#384b5c]/30 pb-2">
          <Info className="w-5 h-5 text-primary-yellow" />
          <h3 className="font-headline text-base font-extrabold text-[#9cd8ff] tracking-wide uppercase select-none">
            ENGINE CALIBRATION RATING
          </h3>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-center md:text-left">
            <p className="text-xs text-[#cbdbe6] font-body">
              How does this calculated sensitivity feel in the simulator or in-game?
            </p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-technical">
              Your anonymous signal helps calibrate our deep aim calculations.
            </p>
          </div>
          
          <div className="shrink-0 flex gap-2">
            {feedbackSubmitted ? (
              <div className="bg-green-600/10 border border-green-500/30 text-green-400 px-4 py-2 text-xs font-technical uppercase rounded flex items-center gap-1.5 select-none animate-fade-in">
                <Check className="w-4 h-4" />
                Feedback Registered! Thank You!
              </div>
            ) : (
              <>
                <button
                  disabled={submittingFeedback}
                  onClick={() => submitFeedback('too_slow')}
                  className={`px-3 py-2 text-[10px] font-technical bg-[#121d28] hover:bg-[#1b2836] border border-white/5 text-[#cbd5e1] hover:text-white rounded transition-all cursor-pointer ${feedbackOption === 'too_slow' ? 'border-primary-yellow text-primary-yellow' : ''}`}
                >
                  🐌 TOO SLOW
                </button>
                <button
                  disabled={submittingFeedback}
                  onClick={() => submitFeedback('perfect')}
                  className={`px-3 py-2 text-[10px] font-technical bg-[#121d28] hover:bg-[#1b2836] border border-white/5 text-[#cbd5e1] hover:text-white rounded transition-all cursor-pointer ${feedbackOption === 'perfect' ? 'border-green-500 text-green-400' : ''}`}
                >
                  🎯 PERFECT
                </button>
                <button
                  disabled={submittingFeedback}
                  onClick={() => submitFeedback('too_fast')}
                  className={`px-3 py-2 text-[10px] font-technical bg-[#121d28] hover:bg-[#1b2836] border border-white/5 text-[#cbd5e1] hover:text-white rounded transition-all cursor-pointer ${feedbackOption === 'too_fast' ? 'border-primary-yellow text-primary-yellow' : ''}`}
                >
                  ⚡ TOO FAST
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 7-Day Tactical Training Plan */}
      <TrainingPlan result={result} />
    </div>
  );
}
