/** Executive Premium — plain-English page copy (presentation only). */

export const EP_COPY = {
  cover: {
    kicker: "Solar proposal",
    title: "Your home energy plan",
    subtitle: "A 25-year view of your electricity costs",
  },
  bill: {
    pageTitle: "Your electricity bill today",
    heroLabel: "What you pay for electricity in a year (estimate)",
  },
  requirement: {
    pageTitle: "Your power requirement",
    heroLabel: "How much of your use this system covers",
    heroSub: "Based on your stated monthly consumption and proposed system size.",
  },
  ledger: {
    pageTitle: "What you spend with and without solar",
    pageSub: "Total electricity-related cost over time (estimate).",
    differenceLabel: "Estimated saving over 25 years",
  },
  asset: {
    pageTitle: "What we propose for your roof",
    placeholder: "Site photo will be added after survey",
    horizonLine: (years: number) => `Designed for a ${years}-year operating life.`,
  },
  governance: {
    pageTitle: "How we stand behind your system",
  },
  investment: {
    pageTitle: "What it costs and what to do next",
    heroLabel: "Net amount after subsidy",
    outflow: "Monthly payment",
    return: "Monthly savings from solar",
    net: "Monthly net",
  },
} as const;

export const DEFAULT_OUTCOME_WORDS: [string, string, string] = [
  "Lower bills",
  "More control",
  "Long-term savings",
];
