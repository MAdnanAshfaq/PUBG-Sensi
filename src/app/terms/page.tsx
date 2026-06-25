export default function Terms() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-white">
      <h1 className="text-3xl font-headline font-bold text-primary-yellow mb-6 uppercase tracking-wider">Terms of Service</h1>
      <div className="space-y-6 text-[#cbdbe6] leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-2">1. Acceptance of Terms</h2>
        <p>By accessing and using AimSync, you accept and agree to be bound by the terms and provisions of this agreement.</p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-2">2. Use of Service</h2>
        <p>AimSync provides a tool to calculate and suggest gaming sensitivity settings. These settings are suggestions and we do not guarantee improved in-game performance. You use these settings at your own risk.</p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-2">3. Intellectual Property</h2>
        <p>All content included on this site, such as text, graphics, logos, and software, is the property of AimSync or its content suppliers and is protected by international copyright laws. PUBG Mobile and BGMI are trademarks of their respective owners. We are not affiliated with Tencent, Krafton, or any official entity.</p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-2">4. Disclaimer of Warranties</h2>
        <p>The materials on AimSync's website are provided on an 'as is' basis. AimSync makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability.</p>
      </div>
    </main>
  );
}
