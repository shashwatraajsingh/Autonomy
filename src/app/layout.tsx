import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Autonomy | The Financial Operating System for AI Agents",
  description: "Govern, budget, and secure autonomous AI agents before they touch real money. Built on Polygon with x402 protocol.",
  keywords: ["AI agents", "blockchain", "Polygon", "x402", "governance", "smart contracts", "ERC-4337", "Web3"],
  authors: [{ name: "Autonomy Team" }],
  openGraph: {
    title: "Autonomy | The Financial Operating System for AI Agents",
    description: "Govern, budget, and secure autonomous AI agents before they touch real money.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Autonomy | The Financial Operating System for AI Agents",
    description: "Govern, budget, and secure autonomous AI agents before they touch real money.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
