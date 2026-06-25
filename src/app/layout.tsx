import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AimSync — PUBG Mobile & BGMI Sensitivity Generator",
  description: "Get your perfect PUBG Mobile and BGMI sensitivity settings in seconds. AI-powered and personalized for your device, playstyle, and FPS.",
  openGraph: {
    title: "AimSync — PUBG Mobile & BGMI Sensitivity Generator",
    description: "Free AI-powered sensitivity calculator for PUBG Mobile and BGMI.",
    url: "https://pubg-sensi.vercel.app",
    siteName: "AimSync",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        <footer className="w-full bg-[#0a0f14] border-t border-[#384b5c]/30 py-8 mt-auto">
          <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-[#a0b0c0] text-sm text-center md:text-left">
              <p>&copy; {new Date().getFullYear()} AimSync. All rights reserved.</p>
              <p className="text-xs mt-1">Not affiliated with PUBG Mobile, BGMI, Tencent, or Krafton.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm font-technical uppercase tracking-widest">
              <a href="/guides" className="text-primary-yellow hover:text-white transition-colors">Guides</a>
              <a href="/about" className="text-primary-yellow hover:text-white transition-colors">About</a>
              <a href="/privacy-policy" className="text-primary-yellow hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="text-primary-yellow hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
