import type { Metadata } from "next";
import TokenDetailClient from "./TokenDetailClient";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug.slice(0, 8)}... | Long Your Longs`,
    description: "Perp-backed launch.",
  };
}

export default async function TokenPage({ params }: PageProps) {
  const { slug } = await params;
  return <TokenDetailClient slug={slug} />;
}
