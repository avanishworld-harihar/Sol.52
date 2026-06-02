import { redirect } from "next/navigation";
import { buildCustomerLeadEditHref } from "@/lib/customer-lead-edit-url";

type Props = { params: Promise<{ id: string }> };

/** Legacy `/customers/[id]` → lead edit modal on the Customers list (avoids detail-page errors). */
export default async function CustomerDetailRoute({ params }: Props) {
  const { id } = await params;
  if (!id?.trim()) redirect("/customers");
  redirect(buildCustomerLeadEditHref(id.trim()));
}
