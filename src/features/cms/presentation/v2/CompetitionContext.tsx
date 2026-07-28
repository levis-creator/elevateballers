import { useMemo, useState } from 'react';
import type { SeasonWithCounts } from '../../types';

export default function CompetitionContext({
  seasons,
  registrations,
  matches,
}: {
  seasons: SeasonWithCounts[];
  registrations: Array<{
    season: string;
    league: string;
    structure: string;
    conference: string;
    status: string;
  }>;
  matches: Array<Record<string, any>>;
}) {
  const [seasonId, setSeasonId] = useState(seasons[0]?.id ?? '');
  const season = seasons.find((item) => item.id === seasonId) ?? seasons[0];
  const leagueSeasons = season?.leagueSeasons ?? [];
  const [leagueId, setLeagueId] = useState(leagueSeasons[0]?.leagueId ?? '');
  const selectedLeague =
    leagueSeasons.find((item) => item.leagueId === leagueId) ?? leagueSeasons[0];
  const [conference, setConference] = useState('All conferences');
  const conferenceNames = season?.conferences?.map((item) => item.name) ?? [];
  const registration = useMemo(
    () =>
      registrations.find(
        (item) => item.season === season?.name && item.league === selectedLeague?.league.name
      ),
    [registrations, season?.name, selectedLeague?.league.name]
  );
  const played = matches.filter((match) => {
    const status = String(match.status ?? '').toLowerCase();
    return status.includes('completed') || status.includes('played');
  });
  const wins = played.filter((match) => Number(match.team1Score ?? 0) !== Number(match.team2Score ?? 0)).length;
  const pointsPerGame = played.length
    ? (played.reduce((sum, match) => sum + Number(match.team1Score ?? 0), 0) / played.length).toFixed(1)
    : '—';
  return (
    <>
      <div className="eb-detail-context eb-detail-card">
        <span className="eb-detail-context-label">Viewing</span>
        <select
          value={season?.id ?? ''}
          onChange={(event) => {
            setSeasonId(event.target.value);
            setLeagueId('');
          }}
          aria-label="Season"
        >
          {seasons.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <span className="eb-detail-arrow">›</span>
        <div className="eb-detail-pills">
          {leagueSeasons.map((item) => (
            <button
              key={item.leagueId}
              className={item.leagueId === selectedLeague?.leagueId ? 'active' : ''}
              onClick={() => setLeagueId(item.leagueId)}
            >
              {item.league.name}
            </button>
          ))}
        </div>
        {conferenceNames.length > 0 && <><span className="eb-detail-arrow">›</span><div className="eb-detail-pills eb-detail-conference-pills"><button className={conference === 'All conferences' ? 'active' : ''} onClick={() => setConference('All conferences')}>All conferences</button>{conferenceNames.map((name) => <button key={name} className={conference === name ? 'active' : ''} onClick={() => setConference(name)}>{name} conference</button>)}</div></>}
        <div className="eb-detail-context-meta">
          <span className="eb-detail-context-status">
            <i />
            {registration?.status ?? 'Not registered'}
          </span>
          <span className="eb-detail-context-structure">
            {registration?.structure ?? 'Competition'}
          </span>
          <span>
            {season
              ? new Date(season.startDate).toLocaleDateString(undefined, {
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </span>
        </div>
        {registration ? (
          <div className="eb-detail-stat-strip eb-detail-stat-strip-five">
            <div>
              <strong>{played.length ? `${wins}–${played.length - wins}` : '—'}</strong>
              <small>Record · {selectedLeague?.league.name ?? 'League'}</small>
            </div>
            <div>
              <strong>{registration.conference === 'Single table' ? 'Single table' : registration.conference}</strong>
              <small>{registration.conference === 'Single table' ? 'Structure' : 'Conference'}</small>
            </div>
            <div>
              <strong>{matches.length}</strong>
              <small>Fixtures in edition</small>
            </div>
            <div><strong className="green-stat">{pointsPerGame}</strong><small>Points / Game</small></div>
            <div><strong>—</strong><small>Allowed / Game</small></div>
          </div>
        ) : (
          <div className="eb-detail-warning">
            This team has no registration in this competition edition.
          </div>
        )}
      </div>
    </>
  );
}
