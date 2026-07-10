import type { ProposalBomItem } from "@/lib/proposal-data";
import styles from "../zenith.module.css";

type Props = {
  bom: ProposalBomItem[];
};

function warrantyTone(warranty: string): string {
  const years = Number((warranty.match(/(\d+)\s*(?:year|yr)/i)?.[1] ?? "").trim());
  if (Number.isFinite(years) && years >= 25) return styles.textEmerald;
  if (/25|30/.test(warranty)) return styles.textEmerald;
  return styles.textGold;
}

/** Grid of high-end engineering cards — Pearl page. */
export function TechnicalSpecs({ bom }: Props) {
  const items = Array.isArray(bom) ? bom : [];
  if (items.length === 0) return null;

  return (
    <section className={styles.contentPage}>
      <h2 className={styles.sectionTitle}>Technical Architecture</h2>
      <div className={styles.goldRule} aria-hidden />
      <p className={styles.sectionLead}>
        Tier-1 components selected for longevity, monitoring clarity, and quiet
        rooftop performance.
      </p>
      <div className={styles.grid}>
        {items.map((item, i) => (
          <article key={`${item.name}-${i}`} className={styles.techCard}>
            {item.brand ? <p className={styles.archLabel}>{item.brand}</p> : null}
            <h3 className={styles.cardHeader}>{item.name}</h3>
            <p className={styles.cardBody}>{item.spec || "—"}</p>
            {item.technicalPoints && item.technicalPoints.length > 0 ? (
              <ul className={styles.archPoints}>
                {item.technicalPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
            <span className={warrantyTone(item.warranty || "")}>
              {item.warranty || "—"}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
