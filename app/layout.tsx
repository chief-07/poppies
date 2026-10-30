import type { Metadata, Viewport } from "next";
import { Frank_Ruhl_Libre, Inter } from "next/font/google";
import "./globals.css";

const frankRuhl = Frank_Ruhl_Libre({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-frank-ruhl",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Poppies",
  description: "A Culturally Grounded Character & World-Building Studio Powered by Qloo",
};

export const viewport: Viewport = {
  themeColor: "#182a1d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${frankRuhl.variable} ${inter.variable} bg-[#182a1d]`}>
      <body className="antialiased bg-[#182a1d] text-[#f7f7d9] selection:bg-poppy-crimson selection:text-white min-h-[100dvh]">
        {children}
      </body>
    </html>
  );
}
