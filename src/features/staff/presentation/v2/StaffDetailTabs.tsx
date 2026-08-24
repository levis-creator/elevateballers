export type StaffDetailTab = "overview" | "assignments";

export function StaffDetailTabs({ active, onChange, assignmentCount }: { active: StaffDetailTab; onChange: (tab: StaffDetailTab) => void; assignmentCount: number }) {
  const tabs = [{ id: "overview" as const, label: "Overview" }, { id: "assignments" as const, label: "Team assignments", count: assignmentCount }];
  return <div role="tablist" aria-label="Staff detail sections" className="flex gap-1 overflow-x-auto border-b border-[#ded8cf]">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={active === tab.id} onClick={() => onChange(tab.id)} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${active === tab.id ? "border-[#e4002b] text-[#171310]" : "border-transparent text-[#8c8175] hover:text-[#3f3831]"}`}>{tab.label}{tab.count !== undefined && <span className="ml-2 rounded-full bg-[#f0ece5] px-1.5 py-0.5 font-mono text-[10px]">{tab.count}</span>}</button>)}</div>;
}
