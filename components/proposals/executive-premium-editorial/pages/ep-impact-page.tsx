import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["impact"];
};

type ImpactIconName = "air" | "forest";

function ImpactIcon({ name }: { name: ImpactIconName }) {
  const common = {
    width: 32,
    height: 32,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "air") {
    return (
      <svg {...common} aria-hidden>
        <path d="M9.5 6.5a3 3 0 1 1 0 6" />
        <path d="M5 10.5H14a3 3 0 1 0 0-6" />
        <path d="M6.5 17.5a2.5 2.5 0 1 1 0 5" />
        <path d="M4 20h11a2.5 2.5 0 1 0 0-5" />
      </svg>
    );
  }

  return (
    <svg {...common} aria-hidden>
      <path d="M12 22v-7" />
      <path d="M9 15h6" />
      <path d="M12 15c-3-2.5-5-5-5-8a5 5 0 0 1 10 0c0 3-2 5.5-5 8Z" />
      <path d="M8 11c-1.5 1-2.5 2.2-2.5 3.5" />
      <path d="M16 11c1.5 1 2.5 2.2 2.5 3.5" />
    </svg>
  );
}

const IMPACT_STORIES: Array<{
  id: string;
  icon: ImpactIconName;
  headline: string;
  proof: (d: Props["data"]) => string;
  body: string;
}> = [
  {
    id: "air",
    icon: "air",
    headline: "Your children will breathe cleaner air.",
    proof: (d) =>
      `${d.co2_tons.toLocaleString("en-IN")} tons of coal smoke never burned for your home.`,
    body: "Every unit from your roof is power without chimney smoke — cleaner skies for the family you are building for.",
  },
  {
    id: "forest",
    icon: "forest",
    headline: "Equivalent to planting an entire mini forest.",
    proof: (d) =>
      `${d.trees.toLocaleString("en-IN")} trees worth of natural carbon absorption — on your rooftop.`,
    body: "Nature would need a small woodland to do what your solar system achieves quietly, year after year.",
  },
];

export function EpImpactPage({ data }: Props) {
  return (
    <EpLuxuryPage>
      <div className="ep-gl-section-tag">03 / Ecological Retention</div>
      <h1 className="ep-gl-h1">A Gift Beyond Electricity.</h1>
      <p className="ep-gl-lead">
        Solar is not only a bill saver — it is cleaner air, greener land, and a safer planet for the next generation.
      </p>

      <div className="ep-gl-impact-hero">
        <div className="ep-gl-impact-hero-stat">
          <div className="ep-gl-impact-hero-icon">
            <ImpactIcon name="air" />
          </div>
          <p className="ep-gl-impact-hero-value">{data.co2_tons.toLocaleString("en-IN")}</p>
          <p className="ep-gl-impact-hero-label">Tons CO₂ avoided</p>
        </div>
        <div className="ep-gl-impact-hero-divider" aria-hidden />
        <div className="ep-gl-impact-hero-stat">
          <div className="ep-gl-impact-hero-icon">
            <ImpactIcon name="forest" />
          </div>
          <p className="ep-gl-impact-hero-value">{data.trees.toLocaleString("en-IN")}</p>
          <p className="ep-gl-impact-hero-label">Tree equivalent</p>
        </div>
      </div>

      <div className="ep-gl-impact-stories">
        {IMPACT_STORIES.map((story, index) => (
          <article key={story.id} className="ep-gl-impact-story">
            <span className="ep-gl-impact-story-index">0{index + 1}</span>
            <div className="ep-gl-impact-story-icon">
              <ImpactIcon name={story.icon} />
            </div>
            <div className="ep-gl-impact-story-content">
              <h2 className="ep-gl-impact-story-headline">{story.headline}</h2>
              <p className="ep-gl-impact-story-proof">{story.proof(data)}</p>
              <p className="ep-gl-impact-story-body">{story.body}</p>
            </div>
          </article>
        ))}
      </div>
    </EpLuxuryPage>
  );
}
