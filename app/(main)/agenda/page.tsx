import { CrmCommandCenter } from "@/components/crm/crm-command-center";
import { DashboardFollowupWidgets } from "@/components/dashboard-followup-widgets";

export default function AgendaPage() {
  return (
    <main className="workspace-dashboard space-y-5 sm:space-y-6">
      <header className="rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-br from-white via-white to-teal-50/60 p-5 shadow-[0_20px_55px_-34px_rgba(15,23,42,0.28)] dark:border-white/10 dark:from-[#0c1017] dark:via-[#0c1017] dark:to-teal-950/20 sm:p-7">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Work planner</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Agenda &amp; reminders</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-slate-600 dark:text-slate-400">Customer callbacks, visits, hot leads and general office reminders—organized by date.</p>
      </header>
      <DashboardFollowupWidgets expanded />
      <CrmCommandCenter />
    </main>
  );
}
