import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const aeonik = localFont({
  src: "../public/aeonik-trial/New Aeonik Trials/AeonikTRIAL-Regular.otf",
  variable: "--font-aeonik",
  weight: "500",
  display: "swap",
});

export const metadata: Metadata = {
  title: "long your longs",
  description: "We let you be perpetually optimistic on memes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ minHeight: "100vh" }}>
      <body
        style={{ minHeight: "100vh", margin: 0, padding: 0 }}
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${aeonik.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
