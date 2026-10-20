import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${frankRuhl.variable} ${inter.variable}`}>
      <body className="antialiased selection:bg-poppy-crimson selection:text-white">
        {children}
      </body>
    </html>
  );
}
