import Link from 'next/link';

export default function GuidesHub() {
  const guides = [
    {
      title: "The Best Sensitivity Settings for PUBG Mobile (2024)",
      slug: "best-sensitivity-pubg-mobile",
      description: "Stop copying YouTubers and find out how to actually find the best settings for your device."
    },
    {
      title: "Gyroscope Settings Explained: Should You Always On?",
      slug: "gyroscope-settings-explained",
      description: "A deep dive into PUBG Mobile's gyroscope settings and how it impacts recoil control and close combat."
    },
    // We can add more later
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 text-white">
      <h1 className="text-4xl font-headline font-bold text-primary-yellow mb-8 uppercase tracking-wider">Tactical Guides & Resources</h1>
      <p className="text-[#cbdbe6] mb-10 text-lg">Master your aim, understand the mechanics, and optimize your device for maximum performance.</p>
      
      <div className="grid gap-6">
        {guides.map(guide => (
          <Link key={guide.slug} href={`/guides/${guide.slug}`} className="block">
            <div className="bg-[#1b2836]/75 border border-[#384b5c]/40 rounded-lg p-6 hover:bg-[#1b2836] transition-colors cursor-pointer group">
              <h2 className="text-xl font-headline font-bold text-[#9cd8ff] mb-2 group-hover:text-primary-yellow transition-colors">{guide.title}</h2>
              <p className="text-[#cbdbe6] text-sm">{guide.description}</p>
              <div className="mt-4 text-xs font-technical tracking-widest text-primary-yellow">READ GUIDE →</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
