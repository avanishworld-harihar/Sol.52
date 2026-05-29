import { Suspense } from "react";
import { CustomerDetailPage } from "@/components/customers/customer-detail-page";

type Props = { params: Promise<{ id: string }> };

export default async function CustomerDetailRoute({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<CustomerDetailSkeleton />}>
      <CustomerDetailPage leadId={id} />
    </Suspense>
  );
}

function CustomerDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      <div className="h-28 rounded-2xl bg-slate-200/80 dark:bg-white/5" />
      <div className="h-48 rounded-2xl bg-slate-200/80 dark:bg-white/5" />
      <div className="h-40 rounded-2xl bg-slate-200/80 dark:bg-white/5" />
    </div>
  );
}
