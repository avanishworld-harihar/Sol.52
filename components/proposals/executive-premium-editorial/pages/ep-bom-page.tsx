import { EpSplitPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-split-page";
import type { EditorialBomRow } from "@/lib/executive-premium-editorial/types";

type Props = {
  flowNodes: { title: string; sub: string; complete?: boolean }[];
  bomRows: EditorialBomRow[];
};

const WARR_CLASS: Record<EditorialBomRow["warranty_tone"], string> = {
  green: "ep-ed-warr-green",
  blue: "ep-ed-warr-blue",
  copper: "ep-ed-warr-copper",
  muted: "ep-ed-warr-muted",
};

export function EpBomPage({ flowNodes, bomRows }: Props) {
  return (
    <EpSplitPage
      sidebar={
        <>
          <h2>04. How It Works</h2>
          <div style={{ marginTop: "40px" }}>
            {flowNodes.map((node, i) => {
              const isLast = i === flowNodes.length - 1;
              return (
                <div key={node.title} className="ep-ed-v-flow-node" style={isLast ? { marginBottom: 0 } : undefined}>
                  <div
                    className="ep-ed-v-flow-dot"
                    style={node.complete ? { backgroundColor: "#10B981" } : undefined}
                  />
                  {!isLast ? <div className="ep-ed-v-flow-line" /> : null}
                  <p
                    className="ep-ed-v-flow-title"
                    style={node.complete ? { color: "#10B981" } : undefined}
                  >
                    {node.title}
                  </p>
                  <p className="ep-ed-v-flow-sub">{node.sub}</p>
                </div>
              );
            })}
          </div>
        </>
      }
    >
      <h1 className="ep-ed-h1">System Parts.</h1>
      <p className="ep-ed-subtitle">We use only top-quality, certified parts designed to last 25 years.</p>

      <div className="ep-ed-editorial-list">
        {bomRows.map((row, i) => {
          const isLast = i === bomRows.length - 1;
          return (
            <div key={row.name} className="ep-ed-editorial-item">
              <div className="ep-ed-editorial-col-left" style={isLast ? { borderBottom: "none" } : undefined}>
                <p className="ep-ed-comp-name">{row.name}</p>
                <p className="ep-ed-comp-brand">{row.brand}</p>
              </div>
              <div className="ep-ed-editorial-col-right" style={isLast ? { borderBottom: "none" } : undefined}>
                <p className="ep-ed-comp-spec">{row.spec}</p>
                <p className={`ep-ed-comp-warr ${WARR_CLASS[row.warranty_tone]}`}>{row.warranty}</p>
              </div>
            </div>
          );
        })}
      </div>
    </EpSplitPage>
  );
}
