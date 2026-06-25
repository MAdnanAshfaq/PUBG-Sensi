import AdUnit from '@/components/AdUnit';

export default function Guide2() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-white">
      <h1 className="text-3xl md:text-5xl font-headline font-black text-primary-yellow mb-6 uppercase tracking-wider leading-tight">
        Gyroscope Settings Explained: Should You Play Always On?
      </h1>
      <div className="text-sm font-technical text-text-muted mb-10 uppercase tracking-widest">
        Updated: 2024 • 5 Min Read
      </div>

      <div className="space-y-6 text-[#cbdbe6] leading-relaxed text-lg font-body">
        <p>When PUBG Mobile first launched, almost everyone played using their thumbs to swipe the screen. Today, nearly 100% of Tier-1 professional players use Gyroscope. If you aren't using it yet, you are at a massive disadvantage.</p>
        
        <h2 className="text-2xl font-bold text-white mt-10 mb-4">What is Gyroscope?</h2>
        <p>The gyroscope is a physical sensor inside your phone that detects rotation and tilt. In PUBG Mobile, turning it on means that physically tilting your phone downwards will pull your crosshair down in the game.</p>
        
        <AdUnit slot="1234567890" format="auto" className="my-8" />
        
        <h2 className="text-2xl font-bold text-white mt-10 mb-4">Always On vs. Scope On</h2>
        <p>You have two choices: <strong>Scope On</strong> (gyro only works when you open your scope) and <strong>Always On</strong> (gyro works all the time, even hip-firing).</p>
        
        <ul className="list-disc pl-6 space-y-3">
          <li><strong>Scope On:</strong> Great for beginners. It allows you to use your thumbs for running around and looking, but lets you use the precision of tilting to control 4x and 6x sprays.</li>
          <li><strong>Always On:</strong> The choice of pros. This allows you to track targets in close-range hip-fire combat (CQC) without your thumbs ever leaving the fire and crouch buttons.</li>
        </ul>
        
        <h2 className="text-2xl font-bold text-white mt-10 mb-4">The ADS Gyroscope Setting</h2>
        <p>Recently, PUBG Mobile introduced a split setting: <strong>Gyroscope Sensitivity</strong> and <strong>ADS Gyroscope Sensitivity</strong>.</p>
        
        <p>The standard Gyroscope setting controls how fast your camera moves when you are just looking around. The ADS Gyroscope setting controls how fast it moves <em>while you are actively shooting your gun</em>.</p>

        <AdUnit slot="0987654321" format="rectangle" className="my-8" />

        <p><strong>Pro Tip:</strong> Keep your ADS Gyroscope slightly higher than your normal Gyroscope. This ensures your crosshair stays stable while scanning for enemies, but gives you the extra speed needed to pull down hard when an AKM starts kicking upward.</p>

        <h2 className="text-2xl font-bold text-white mt-10 mb-4">How to Transition</h2>
        <p>If you are switching to Gyroscope for the first time, your screen will feel shaky. Do not quit! It takes roughly 3 to 7 days for your brain to build the muscle memory required to hold your phone steady. Start with low sensitivities (around 150-200%) and slowly work your way up to 300%+ as you get comfortable.</p>
      </div>
    </main>
  );
}
