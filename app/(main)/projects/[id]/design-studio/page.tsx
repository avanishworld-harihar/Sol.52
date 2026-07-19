import { DesignStudioClient } from "@/components/site-layout/design-studio-client";

type Props = { params: Promise<{ id: string }> };

export default async function DesignStudioPage({ params }: Props) {
  const { id } = await params;
  return <DesignStudioClient projectId={id} />;
}
