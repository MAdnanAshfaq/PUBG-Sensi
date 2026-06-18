import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ListChecks, AlertTriangle } from 'lucide-react';
import { getResult, isDatabaseConfigured } from '@/utils/db';
import SensitivityDashboard from './SensitivityDashboard';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getResult(slug);
  if (!result) {
    return {
      title: 'Config Not Found | AimSync',
      description: 'The requested PUBG Mobile sensitivity profile could not be found.',
    };
  }

  const device = result.inputs.deviceTier.toUpperCase();
  const playstyle = result.inputs.playstyle.toUpperCase();
  return {
    title: `AimSync Optimal Config | ${device} - ${playstyle}`,
    description: `Optimal sensitivity configurations for PUBG Mobile / BGMI calculated for ${device} at ${result.inputs.fps} FPS. View raw camera, ADS, and gyroscope settings.`,
  };
}

export default async function ResultPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getResult(slug);

  if (!result) {
    const dbConfigured = isDatabaseConfigured();
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-screen bg-background text-foreground">
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center border border-red-500/20 rounded-full bg-red-500/5">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="font-headline text-3xl font-extrabold text-foreground uppercase tracking-tight">CONFIGURATION NOT FOUND</h1>
        <p className="text-sm text-text-muted mt-2 max-w-sm leading-relaxed">
          The requested share link is invalid or has expired. Return to the onboarding wizard to calculate a fresh configuration.
        </p>

        {!dbConfigured && (
          <div className="mt-6 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-left max-w-md">
            <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              DATABASE NOT CONFIGURED
            </h4>
            <p className="text-[11px] text-[#cbdbe6] leading-relaxed">
              The application is running in <strong>local file storage mode</strong> because the <code>DATABASE_URL</code> environment variable is missing. 
              On Vercel and Render, local files are ephemeral and get deleted automatically on page refreshes or container recycles.
              <br /><br />
              <strong>To fix this:</strong> Please set the <code>DATABASE_URL</code> environment variable in your Vercel or Render project dashboard.
            </p>
          </div>
        )}

        <Link
          href="/"
          className="mt-6 px-6 py-3 rounded-xl bg-primary-yellow text-background font-headline font-bold text-sm tracking-wide uppercase active:scale-95 transition-all shadow-[0_4px_12px_rgba(255,215,0,0.15)]"
        >
          START SENSITIVITY WIZARD
        </Link>
      </div>
    );
  }


  const {
    deviceTier,
    fps,
    gyroMode,
    fingerCount,
    playstyle,
    primaryProblem,
    measuredSwipeSpeed,
    measuredLatencyMs,
    gyroStabilityScore
  } = result.inputs;

  return (
    <div className="flex-1 flex flex-col justify-between max-w-lg mx-auto w-full px-4 pt-6 pb-12 bg-background min-h-screen">
      {/* Title Header */}
      <header className="flex items-center justify-between border-b border-border-tactical/30 pb-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Shield className="w-7 h-7 text-primary-yellow" />
          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tighter text-primary-yellow">AIMSYNC</h1>
            <p className="font-technical text-[10px] text-text-muted tracking-widest uppercase">PUBG/BGMI Tactical Configurator</p>
          </div>
        </Link>
        <Link
          href="/"
          className="font-technical text-[11px] text-primary-yellow border border-primary-yellow/30 px-3 py-1 bg-primary-yellow/5 rounded hover:bg-primary-yellow/10"
        >
          RE-CALCULATE
        </Link>
      </header>

      {/* Target Spec Summary Details */}
      <section className="bg-surface-card border border-border-tactical/25 rounded-2xl p-4 my-6">
        <h3 className="font-headline text-xs font-bold text-text-muted tracking-widest uppercase mb-3 border-b border-border-tactical/20 pb-1.5 flex items-center gap-1.5">
          <ListChecks className="w-4 h-4 text-text-muted" />
          PLAYER PROFILE SPECS
        </h3>
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-technical text-foreground">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">HARDWARE</span>
            <span className="font-semibold uppercase">{deviceTier} TIER ({fps} FPS)</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">GYROSCOPE</span>
            <span className="font-semibold uppercase">{gyroMode.replace('_', ' ')}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">PLAYSTYLE</span>
            <span className="font-semibold uppercase">{playstyle}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">AIM OFFSET FIX</span>
            <span className="font-semibold uppercase">{primaryProblem} LIMIT</span>
          </div>
          {measuredLatencyMs !== undefined && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-text-muted uppercase tracking-wider">TOUCH RESPONSE</span>
              <span className="font-semibold uppercase text-primary-yellow">{measuredLatencyMs}ms ({(measuredLatencyMs < 80) ? 'ULTRA' : (measuredLatencyMs > 130) ? 'SLOW' : 'STANDARD'})</span>
            </div>
          )}
          {measuredSwipeSpeed !== undefined && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-text-muted uppercase tracking-wider">SWIPE GLIDE</span>
              <span className="font-semibold uppercase text-primary-yellow">{Math.round(measuredSwipeSpeed * 100)}% SPEED</span>
            </div>
          )}
          {gyroStabilityScore !== undefined && gyroMode !== 'off' && (
            <div className="flex flex-col gap-0.5 col-span-2">
              <span className="text-[10px] text-text-muted uppercase tracking-wider">GYRO SENSOR STABILITY</span>
              <span className="font-semibold uppercase text-primary-yellow">{Math.round(gyroStabilityScore * 100)}% ({(gyroStabilityScore > 0.9) ? 'EXCELLENT' : (gyroStabilityScore < 0.6) ? 'JITTERY' : 'STABLE'})</span>
            </div>
          )}
        </div>
      </section>

      {/* Interactive sensitivity Dashboard */}
      <main className="flex-1">
        <SensitivityDashboard result={result} />
      </main>

      {/* Footer Branding Info */}
      <footer className="mt-10 border-t border-border-tactical/20 pt-6 text-center text-[10px] font-technical text-text-muted space-y-1">
        <div>AIMSYNC SENSITIVITY SYSTEM &bull; VERSION 2.1.0</div>
        <div>ALL CONFIGURATIONS CLAMPED DETERMINISTICALLY</div>
      </footer>
    </div>
  );
}
