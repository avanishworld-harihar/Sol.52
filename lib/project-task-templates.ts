/**
 * Sol.52 — Phase 3A Project Task Templates.
 *
 * Default advisory checklist tasks seeded when a project enters a new stage.
 * is_template = true on seeded rows. Teams add custom tasks with is_template = false.
 *
 * Philosophy: tasks are ADVISORY in Phase 3. Stage advance shows a warning if
 * blocking tasks are incomplete, but does NOT prevent progression.
 * is_blocking flag reserved for Phase 4 enforcement per org setting.
 */

import type { ProjectStageId } from "@/lib/project-stages";

export type TaskStage = ProjectStageId | "general";

export interface TaskTemplate {
  title: string;
  description: string | null;
  is_blocking: boolean;
  sort_order: number;
}

const TASK_TEMPLATES: Record<TaskStage, TaskTemplate[]> = {
  survey: [
    {
      title: "Capture GPS location at site",
      description: "Use the GPS capture button in the Survey form.",
      is_blocking: true,
      sort_order: 1,
    },
    {
      title: "Take roof photos (minimum 4 angles)",
      description: "Front, back, left, right. Upload in Survey → Photos section.",
      is_blocking: true,
      sort_order: 2,
    },
    {
      title: "Measure usable shadow-free roof area (sqft)",
      description: "Required for accurate system sizing.",
      is_blocking: true,
      sort_order: 3,
    },
    {
      title: "Record consumer number and sanction load",
      description: "From the electricity meter or bill.",
      is_blocking: true,
      sort_order: 4,
    },
    {
      title: "Photograph electricity meter and DB board",
      description: "Upload in Survey → Photos section.",
      is_blocking: false,
      sort_order: 5,
    },
    {
      title: "Inspect existing earthing",
      description: "Check earthing continuity and note in Survey form.",
      is_blocking: false,
      sort_order: 6,
    },
    {
      title: "Note roof type and condition",
      description: "RCC / Tin / Asbestos — affects structure design cost.",
      is_blocking: false,
      sort_order: 7,
    },
    {
      title: "Check transformer distance from site",
      description: "Required for net metering feasibility.",
      is_blocking: false,
      sort_order: 8,
    },
  ],

  design: [
    {
      title: "Prepare Single Line Diagram (SLD)",
      description: "Upload SLD PDF in Design → Documents.",
      is_blocking: true,
      sort_order: 1,
    },
    {
      title: "Prepare panel layout drawing",
      description: "Upload layout in Design → Documents.",
      is_blocking: true,
      sort_order: 2,
    },
    {
      title: "Finalize panel brand, model and wattage",
      description: "Update in Design form — required for BOM.",
      is_blocking: true,
      sort_order: 3,
    },
    {
      title: "Finalize inverter brand, model and kW",
      description: "Update in Design form.",
      is_blocking: true,
      sort_order: 4,
    },
    {
      title: "Calculate annual yield estimate (kWh)",
      description: "Add in Design form. Used for ROI presentation.",
      is_blocking: false,
      sort_order: 5,
    },
    {
      title: "Customer design sign-off",
      description: "Get verbal or written confirmation before approval stage.",
      is_blocking: false,
      sort_order: 6,
    },
  ],

  approval: [
    {
      title: "Submit net metering application to DISCOM",
      description: "Record DISCOM application number in project. Update NM sub-status.",
      is_blocking: true,
      sort_order: 1,
    },
    {
      title: "Attach all required documents",
      description: "Aadhaar, PAN, electricity bill, SLD, layout drawing.",
      is_blocking: true,
      sort_order: 2,
    },
    {
      title: "Track DISCOM application status",
      description: "Update NM sub-status regularly.",
      is_blocking: false,
      sort_order: 3,
    },
    {
      title: "Receive sanction / feasibility letter",
      description: "Upload in Documents vault under Approval Documents.",
      is_blocking: true,
      sort_order: 4,
    },
    {
      title: "Confirm load enhancement (if required)",
      description: "Check if DISCOM requires a load upgrade.",
      is_blocking: false,
      sort_order: 5,
    },
  ],

  installation: [
    {
      title: "Material dispatched from warehouse",
      description: "Record dispatch. Sub-stage: Material Dispatched.",
      is_blocking: true,
      sort_order: 1,
    },
    {
      title: "Confirm site material delivery",
      description: "Get delivery confirmation. Sub-stage: Material Delivered.",
      is_blocking: true,
      sort_order: 2,
    },
    {
      title: "Structure installation complete",
      description: "Sub-stage: Structure Installed.",
      is_blocking: true,
      sort_order: 3,
    },
    {
      title: "Module (panel) mounting complete",
      description: "Sub-stage: Modules Installed.",
      is_blocking: true,
      sort_order: 4,
    },
    {
      title: "Electrical wiring and DB work complete",
      description: "Sub-stage: Electrical Work.",
      is_blocking: true,
      sort_order: 5,
    },
    {
      title: "Commissioning and test run",
      description: "System live test. Sub-stage: Commissioning. Upload commissioning photos.",
      is_blocking: true,
      sort_order: 6,
    },
    {
      title: "Take post-installation photos",
      description: "Full system + roof photos. Required for subsidy claim.",
      is_blocking: false,
      sort_order: 7,
    },
  ],

  net_metering: [
    {
      title: "File net metering application",
      description: "NM sub-status: Application Filed.",
      is_blocking: true,
      sort_order: 1,
    },
    {
      title: "Submit all supporting documents",
      description: "NM sub-status: Documents Submitted.",
      is_blocking: true,
      sort_order: 2,
    },
    {
      title: "DISCOM inspection coordination",
      description: "NM sub-status: Inspection Pending.",
      is_blocking: true,
      sort_order: 3,
    },
    {
      title: "Bi-directional meter installation",
      description: "NM sub-status: Meter Installed.",
      is_blocking: true,
      sort_order: 4,
    },
    {
      title: "Confirm net metering / export activated",
      description: "NM sub-status: Export Enabled.",
      is_blocking: true,
      sort_order: 5,
    },
    {
      title: "Capture meter serial number",
      description: "Update meter_serial_no in project.",
      is_blocking: false,
      sort_order: 6,
    },
  ],

  completed: [
    {
      title: "Prepare handover documentation",
      description: "System specs sheet, warranty cards, AMC terms.",
      is_blocking: false,
      sort_order: 1,
    },
    {
      title: "Customer handover and system walkthrough",
      description: "Explain monitoring app and basic troubleshooting.",
      is_blocking: false,
      sort_order: 2,
    },
    {
      title: "Close all pending payments",
      description: "Ensure all milestones are received before closure.",
      is_blocking: true,
      sort_order: 3,
    },
    {
      title: "Collect customer satisfaction feedback",
      description: "For referral program and testimonials.",
      is_blocking: false,
      sort_order: 4,
    },
    {
      title: "Subsidy claim submission (if applicable)",
      description: "Only for eligible residential projects with has_subsidy = true.",
      is_blocking: false,
      sort_order: 5,
    },
  ],

  general: [],
};

export function getTaskTemplatesForStage(stage: TaskStage): TaskTemplate[] {
  return TASK_TEMPLATES[stage] ?? [];
}

export function getAllTaskTemplates(): Record<TaskStage, TaskTemplate[]> {
  return TASK_TEMPLATES;
}
