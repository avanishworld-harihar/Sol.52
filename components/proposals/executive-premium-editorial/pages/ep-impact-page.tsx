import { EpLuxuryPage } from "@/components/proposals/executive-premium-editorial/primitives/ep-luxury-page";
import type { ExecutivePremiumEditorialModel } from "@/lib/executive-premium-editorial/types";

type Props = {
  data: ExecutivePremiumEditorialModel["impact"];
};

const IMPACT_STORIES = [
  {
    id: "air",
    headline: "Your children will breathe cleaner air.",
    proof: (d: Props["data"]) =>
      `${d.co2_tons.toLocaleString("en-IN")} tons of coal smoke never burned for your home.`,
    body: "Every unit from your roof is power without chimney smoke — cleaner skies for the family you are building for.",
  },
  {
    id: "forest",
    headline: "Equivalent to planting an entire mini forest.",
    proof: (d: Props["data"]) =>
      `${d.trees.toLocaleString("en-IN")} trees worth of natural carbon absorption — on your rooftop.`,
    body: "Nature would need a small woodland to do what your solar system achieves quietly, year after year.",
  },
  {
    id: "car",
    headline: "Petrol car ko 25 saal ke liye replace kar diya.",
    proof: (d: Props["data"]) =>
      `Jaise ek family car ${d.petrol_car_years_equivalent.toLocaleString("en-IN")}+ saal road par na ho — utna pollution bachaya.`,
    body: "Your home runs on sunlight instead of fossil miles — a quieter, cleaner way to power daily life.",
  },
] as const;

export function EpImpactPage({ data }: Props) {
  return (
    <EpLuxuryPage>
      <div className="ep-gl-section-tag">03 / Ecological Retention</div>
      <h1 className="ep-gl-h1">A Gift Beyond Electricity.</h1>
      <p className="ep-gl-lead">
        Solar is not only a bill saver — it is cleaner air, greener land, and a safer planet for the next generation.
      </p>

      <div className="ep-gl-impact-stories">
        {IMPACT_STORIES.map((story, index) => (
          <article key={story.id} className="ep-gl-impact-story">
            <span className="ep-gl-impact-story-index">0{index + 1}</span>
            <h2 className="ep-gl-impact-story-headline">{story.headline}</h2>
            <p className="ep-gl-impact-story-proof">{story.proof(data)}</p>
            <p className="ep-gl-impact-story-body">{story.body}</p>
          </article>
        ))}
      </div>
    </EpLuxuryPage>
  );
}
