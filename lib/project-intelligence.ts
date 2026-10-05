import type { ProjectListItem } from "@/lib/project-api-client";

export type ProjectPriority = "normal" | "watch" | "urgent" | "blocked";
export type ProjectIntelligence = {
  score: number;
  priority: ProjectPriority;
  headline: string;
  reasons: string[];
  nextBestAction: string;
};

export function getProjectIntelligence(project: ProjectListItem): ProjectIntelligence {
  if (project.current_stage === "completed" || project.actual_completion) {
    return { score: 100, priority: "normal", headline: "Project completed", reasons: ["Delivery lifecycle is complete"], nextBestAction: project.pending_inr && project.pending_inr > 0 ? "Collect outstanding payment" : "Maintain service relationship" };
  }
  let score = 100;
  const reasons: string[] = [];
  if (project.stage_status === "blocked") { score -= 45; reasons.push("Current stage is blocked"); }
  if (project.health === "delayed") { score -= 30; reasons.push("Target completion date has passed"); }
  else if (project.health === "attention_needed") { score -= 15; reasons.push("Target completion is due within 7 days"); }
  if (!project.assigned_manager_id) { score -= 12; reasons.push("Project manager is not assigned"); }
  if (!project.target_completion) { score -= 10; reasons.push("Target completion date is missing"); }
  if (!project.next_action?.trim()) { score -= 10; reasons.push("Next action is not defined"); }
  if ((project.pending_inr ?? 0) > 0 && project.current_stage === "net_metering") { score -= 8; reasons.push("Payment is outstanding near commissioning"); }
  score = Math.max(0, score);
  const priority: ProjectPriority = project.stage_status === "blocked" ? "blocked" : score < 50 ? "urgent" : score < 75 ? "watch" : "normal";
  const nextBestAction = project.stage_status === "blocked"
    ? "Resolve the blocking task and assign an owner"
    : !project.assigned_manager_id
      ? "Assign a project manager"
      : !project.target_completion
        ? "Set a target completion date"
        : !project.next_action?.trim()
          ? "Define the next action"
          : project.next_action;
  return { score, priority, headline: priority === "normal" ? "On track" : priority === "watch" ? "Needs attention" : priority === "blocked" ? "Blocked" : "Urgent intervention", reasons: reasons.length ? reasons : ["No material delivery risks detected"], nextBestAction };
}
