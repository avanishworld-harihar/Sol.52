import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignPackPublicView } from "@/components/site-layout/design-pack-public-view";
import { getDesignPackByShareToken } from "@/lib/design-studio-pack-share";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const pack = await getDesignPackByShareToken(token);
  if (!pack) return { title: "Design pack" };
  return {
    title: `${pack.model.projectName} — Design pack`,
    description: `Site design summary · ${pack.model.panelCount} panels · ${pack.model.dcCapacityKw} kW DC`,
    robots: { index: false },
  };
}

export default async function DesignPackPublicPage({ params }: PageProps) {
  const { token } = await params;
  const pack = await getDesignPackByShareToken(token);
  if (!pack) notFound();
  return <DesignPackPublicView model={pack.model} />;
}
