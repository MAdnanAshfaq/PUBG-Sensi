export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-white">
      <h1 className="text-3xl font-headline font-bold text-primary-yellow mb-6 uppercase tracking-wider">Privacy Policy</h1>
      <div className="space-y-6 text-[#cbdbe6] leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-2">1. Information We Collect</h2>
        <p>AimSync does not require you to create an account or provide personal information to use the sensitivity generator. We temporarily process the device and playstyle parameters you select to generate your unique sensitivity configuration.</p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-2">2. Cookies and Tracking</h2>
        <p>We use local storage in your browser to save your progress through the configuration wizard. We also use Google AdSense to display advertisements, which may use cookies to serve ads based on your prior visits to this or other websites.</p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-2">3. Google AdSense</h2>
        <p>Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet. Users may opt out of personalized advertising by visiting Google Ads Settings.</p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-2">4. Third-Party Links</h2>
        <p>Our website may contain links to third-party sites. We have no control over the privacy practices or content of these sites.</p>
        
        <h2 className="text-xl font-bold text-white mt-8 mb-2">5. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us via our official support channels.</p>
      </div>
    </main>
  );
}
