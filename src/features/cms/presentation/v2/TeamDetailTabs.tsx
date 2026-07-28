export type DetailTab = 'registrations' | 'roster' | 'staff' | 'matches';
export default function TeamDetailTabs({
  active,
  onChange,
  counts,
}: {
  active: DetailTab;
  onChange: (tab: DetailTab) => void;
  counts: Record<DetailTab, number>;
}) {
  const labels: Record<DetailTab, string> = {
    roster: 'Roster',
    staff: 'Staff',
    registrations: 'Registrations',
    matches: 'Fixtures',
  };
  return (
    <div className="eb-detail-tabs">
      <div className="eb-detail-tabs-inner">
        {(['roster', 'staff', 'registrations', 'matches'] as DetailTab[]).map((tab) => (
          <button key={tab} className={active === tab ? 'active' : ''} onClick={() => onChange(tab)}>
            {labels[tab]} <span>{counts[tab]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
