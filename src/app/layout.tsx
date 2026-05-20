import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import "./globals.css";

const siteFont = localFont({
  src: [
    {
      path: "../../public/Aeonik-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/Aeonik-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-site",
  display: "swap",
});

const montaguSlab = localFont({
  src: "../../public/MontaguSlab-VariableFont.ttf",
  variable: "--font-montagu-slab",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Long Your Longs - Launchpad",
  description: "Launch and discover tokens on Long Your Longs.",
  icons: {
    icon: "/green-belan.png",
    shortcut: "/green-belan.png",
    apple: "/green-belan.png",
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
      className={`${siteFont.variable} ${montaguSlab.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#f5f2ed]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
