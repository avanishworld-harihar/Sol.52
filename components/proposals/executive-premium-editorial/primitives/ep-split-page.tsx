import type { ReactNode } from "react";

type Props = {
  sidebar: ReactNode;
  children: ReactNode;
  mainClassName?: string;
};

export function EpSplitPage({ sidebar, children, mainClassName = "" }: Props) {
  return (
    <section className="ep-ed-page">
      <aside className="ep-ed-sidebar">{sidebar}</aside>
      <div className={`ep-ed-main ${mainClassName}`.trim()}>{children}</div>
    </section>
  );
}
