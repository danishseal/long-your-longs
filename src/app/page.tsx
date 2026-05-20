import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Hero from "@/components/landing/hero";

const ASCIIAnimationComponent = dynamic(
  () => import("@/components/landing/ascii-animation"),
);

export const metadata: Metadata = {
  metadataBase: new URL("https://www.longyourlongs.fun"),
  title: "long your longs!",
  description: "We let you be perpetually optimistic on memes.",
  openGraph: {
    type: "website",
    url: "/",
    title: "long your longs!",
    description: "We let you be perpetually optimistic on memes.",
    images: [
      {
        url: "/embed.png",
        width: 1871,
        height: 625,
        alt: "Long your Longs preview image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "long your longs!",
    description: "We let you be perpetually optimistic on memes.",
    images: ["/embed.png"],
  },
  icons: {
    icon: "/assets/bar.webp",
  },
};

export default function Page() {
  return (
    <>
      <ASCIIAnimationComponent />
      <Hero />
    </>
  );
}
