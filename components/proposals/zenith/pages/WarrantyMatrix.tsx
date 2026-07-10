import type { ProposalData } from "@/lib/proposal-data";
import styles from "../zenith.module.css";

type Props = {
  warranty: ProposalData["warranty"];
};

function durationTone(duration: string): string {
  const years = Number((duration.match(/(\d+)\s*(?:year|yr)/i)?.[1] ?? "").trim());
  if (Number.isFinite(years) && years >= 25) return styles.textEmerald;
  if (/25|30/.test(duration)) return styles.textEmerald;
  return styles.textGold;
}

/** Clean warranty matrix — Pearl page. */
export function WarrantyMatrix({ warranty }: Props) {
  const rows = warranty?.rows ?? [];
  const highlights = warranty?.highlights ?? [];
  if (rows.length === 0 && highlights.length === 0) return null;

  return (
    <section className={styles.contentPage}>
      <h2 className={styles.sectionTitle}>Warranty & Assurance</h2>
      <div className={styles.goldRule} aria-hidden />
      {warranty.intro ? <p className={styles.sectionLead}>{warranty.intro}</p> : null}

      {highlights.length > 0 ? (
        <div className={styles.statRow}>
          {highlights.map((h) => (
            <div key={h.label} className={styles.statCard}>
              <p className={styles.statValue}>
                {h.value}
                <span className={styles.statUnit}>{h.unit}</span>
              </p>
              <p className={styles.statLabel}>{h.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {rows.length > 0 ? (
        <table className={styles.warrantyTable}>
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Duration</th>
              <th scope="col">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.item}-${row.duration}`}>
                <td>
                  <span className={styles.bomName}>{row.item}</span>
                  {row.by ? <span className={styles.bomBrand}>{row.by}</span> : null}
                </td>
                <td className={durationTone(row.duration)}>{row.duration}</td>
                <td className={styles.bomSpec}>{row.coverage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
