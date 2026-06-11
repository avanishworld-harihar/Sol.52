"use client";

type Props = {
  title: string;
  subtitle?: string;
  centered?: boolean;
  compact?: boolean;
};

export function EpPageHeader({ title, subtitle, centered = false, compact = false }: Props) {
  return (
    <header
      className={centered ? "text-center" : "text-left"}
      style={{ marginBottom: compact ? "var(--ep-space-4)" : "var(--ep-space-6)" }}
    >
      <h2 className="ep-title" style={{ fontWeight: 500 }}>
        {title}
      </h2>
      {subtitle ? (
        <p className="ep-body" style={{ color: "var(--ep-muted)", marginTop: "var(--ep-space-2)" }}>
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
