import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useTeamDetail } from '../hooks/useTeamDetail';
import CompetitionContext from './CompetitionContext';
import TeamDetailHero from './TeamDetailHero';
import TeamDetailTabs, { type DetailTab } from './TeamDetailTabs';
import {
  MatchesSection,
  RegistrationsSection,
  RosterSection,
  StaffSection,
} from './TeamDetailSections';

export default function TeamDetailPage({ teamId }: { teamId: string }) {
  const data = useTeamDetail(teamId);
  const [tab, setTab] = useState<DetailTab>('roster');
  if (data.loading)
    return (
      <div className="eb-detail-loading">
        <Loader2 size={22} className="eb-spin" /> Loading team detail…
      </div>
    );
  if (data.error || !data.team)
    return (
      <div className="eb-detail-error">
        <AlertCircle size={20} />
        <strong>{data.error || 'Team not found'}</strong>
        <button onClick={() => void data.refresh()}>Try again</button>
      </div>
    );
  const counts = {
    registrations: data.registrations.length,
    roster: data.team.players?.length ?? 0,
    staff: data.staff.length,
    matches: data.matches.length,
  };
  return (
    <div className="eb-detail-page">
      <div className="eb-detail-breadcrumb"><a href="/admin/teams">Teams</a><span>/</span><strong>{data.team.name}</strong></div>
      <TeamDetailHero team={data.team} staff={data.staff} />
      <CompetitionContext
        seasons={data.seasons}
        registrations={data.registrations}
        matches={data.matches}
      />
      <TeamDetailTabs active={tab} onChange={setTab} counts={counts} />
      {tab === 'registrations' && <RegistrationsSection rows={data.registrations} />}
      {tab === 'roster' && <RosterSection team={data.team} />}
      {tab === 'staff' && <StaffSection staff={data.staff} />}
      {tab === 'matches' && <MatchesSection matches={data.matches} />}
      <footer className="eb-detail-footer">Elevate Ballers CMS · Nairobi, Kenya</footer>
    </div>
  );
}
