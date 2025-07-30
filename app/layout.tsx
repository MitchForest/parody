import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Portfolio Roaster - Get Your Tech Portfolio Roasted",
  description: "Drop your tech portfolio URL and get savagely roasted by AI. Brutal comedy meets code reviews.",
  keywords: ["portfolio", "roast", "tech", "developer", "AI", "comedy", "humor"],
  authors: [{ name: "Portfolio Roaster" }],
  openGraph: {
    title: "Portfolio Roaster - Get Your Tech Portfolio Roasted",
    description: "Drop your tech portfolio URL and get savagely roasted by AI",
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
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-black`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
