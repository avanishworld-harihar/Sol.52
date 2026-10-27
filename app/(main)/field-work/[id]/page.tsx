import { redirect } from "next/navigation";
import { FieldWorkDetail } from "@/components/field-work/field-work-detail";

export default async function FieldWorkLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id?.trim()) redirect("/field-work");
  return <FieldWorkDetail leadId={id.trim()} />;
}
