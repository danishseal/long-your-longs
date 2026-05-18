import dynamic from "next/dynamic";
import Hero from "@/components/hero";

const ASCIIAnimationComponent = dynamic(
  () => import("@/components/ascii-animation"),
);

export default function Home() {
  return (
    <>
      <ASCIIAnimationComponent />
      <Hero />
    </>
  );
}
