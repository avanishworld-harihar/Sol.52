import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CustomerDetailPage } from "@/components/customers/customer-detail-page";

type Props = { params: Promise<{ id: string }> };

export default async function CustomerDetailRoute({ params }: Props) {
  const { id } = await params;
  const leadId = id?.trim();
  if (!leadId) redirect("/customers");

  return (
    <Suspense
      fallback={
        <p className="py-8 text-center text-sm font-semibold text-muted-foreground">Loading…</p>
      }
    >
      <CustomerDetailPage leadId={leadId} />
    </Suspense>
  );
}
