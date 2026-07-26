import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SldPackPublicView } from "@/components/site-layout/sld-pack-public-view";
import { getSldPackByShareToken } from "@/lib/design-studio-sld-share";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const pack = await getSldPackByShareToken(token);
  if (!pack) return { title: "SLD pack" };
  return {
    title: `${pack.model.projectName} — SLD pack`,
    description: `Engineering SLD · ${pack.model.moduleCount} modules · ${pack.model.dcCapacityKwp} kWp`,
    robots: { index: false },
  };
}

export default async function SldPackPublicPage({ params }: PageProps) {
  const { token } = await params;
  const pack = await getSldPackByShareToken(token);
  if (!pack) notFound();
  return <SldPackPublicView model={pack.model} />;
}
