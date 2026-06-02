import { notFound, redirect } from "next/navigation";
import { buildProposalEditHref } from "@/lib/proposal-edit-url";
import { getProposalById } from "@/lib/proposals-store";

type PageProps = { params: Promise<{ id: string }> };

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Legacy /proposals/[id] URLs → proposal builder (no commercial BOM manage screen). */
export default async function ProposalManagePage({ params }: PageProps) {
  const { id } = await params;
  if (!id || !UUID_RX.test(id.trim())) notFound();

  const proposal = await getProposalById(id.trim());
  if (!proposal) notFound();

  redirect(
    buildProposalEditHref({
      leadId: proposal.lead_id,
      proposalId: proposal.id,
    })
  );
}
