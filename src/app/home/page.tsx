import type { Metadata } from "next";
import HomePage from "../home-page";

export const metadata: Metadata = {
  title: "Long Your Longs",
  description: "Launch and discover tokens on Long Your Longs.",
};

export default function Page() {
  return <HomePage />;
}
