"use client";

import { WorkspaceStepCard, type WorkspaceTheme } from "@/components/proposal/workspace-mobile-ui";
import type { LucideIcon } from "lucide-react";

type Props = {
  step: number;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
};

export function CommercialStepSection({
  step,
  title,
  subtitle,
  icon,
  children,
  className,
  defaultOpen = true,
}: Props) {
  return (
    <WorkspaceStepCard
      step={step}
      title={title}
      subtitle={subtitle}
      icon={icon}
      theme={"commercial" satisfies WorkspaceTheme}
      defaultOpen={defaultOpen}
      className={className}
    >
      {children}
    </WorkspaceStepCard>
  );
}
