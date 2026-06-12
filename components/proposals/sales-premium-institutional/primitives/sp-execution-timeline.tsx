"use client";

import type { InstitutionalTimelineStep } from "@/lib/sales-premium-institutional/types";

type Props = {
  steps: InstitutionalTimelineStep[];
};

export function SpExecutionTimeline({ steps }: Props) {
  return (
    <div className="sp-timeline-container">
      {steps.map((step) => (
        <div key={step.day_label} className="sp-timeline-step">
          <div className="sp-step-line" aria-hidden />
          <div className={`sp-step-dot${step.complete ? " sp-step-dot--complete" : ""}`} />
          <div
            className="sp-step-title"
            style={step.complete ? { color: "#059669" } : undefined}
          >
            {step.day_label}: {step.title}
          </div>
          <div className="sp-step-desc">{step.description}</div>
        </div>
      ))}
    </div>
  );
}
