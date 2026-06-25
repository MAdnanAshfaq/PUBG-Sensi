export default function About() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-white">
      <h1 className="text-3xl font-headline font-bold text-primary-yellow mb-6 uppercase tracking-wider">About AimSync</h1>
      <div className="space-y-6 text-[#cbdbe6] leading-relaxed">
        <p>AimSync was created to solve one of the most frustrating problems in mobile esports: finding the perfect sensitivity settings.</p>
        
        <p>For years, players have copied settings from professional players, YouTubers, and friends, only to find that their aim feels floaty, unresponsive, or impossible to control. The reason is simple: sensitivity is not universal.</p>
        
        <p>Your perfect sensitivity depends heavily on your specific device's touch sampling rate, display size, processor latency, and your personal grip style and finger layout.</p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-2">How It Works</h2>
        <p>AimSync uses advanced AI and a database of professional configurations to analyze your specific hardware (e.g., OnePlus 8 5G vs iPhone 13 Pro Max) and your playstyle (Rusher, Sniper, Assaulter). We then calculate baseline anchors tailored to your hardware and apply specific tuning rules to generate a highly customized sensitivity profile.</p>
        
        <p>We are constantly refining our algorithms to ensure that the values we provide serve as the absolute best starting point for dominating the battlefield.</p>
      </div>
    </main>
  );
}
