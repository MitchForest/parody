import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Parody Generator - AI-Powered Website Parodies",
  description: "Transform any website screenshot into hilarious parodies using AI. Upload, prompt, and generate instantly.",
  keywords: ["AI", "parody", "website", "generator", "humor", "meme"],
  authors: [{ name: "Parody Generator" }],
  openGraph: {
    title: "Parody Generator - AI-Powered Website Parodies",
    description: "Transform any website screenshot into hilarious parodies using AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900`}>
        <div className="relative min-h-screen">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="relative z-10">
            {children}
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
