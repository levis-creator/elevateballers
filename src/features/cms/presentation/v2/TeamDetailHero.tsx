import {
  CalendarDays,
  Edit3,
  Eye,
  MoreHorizontal,
  Shield,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import type { TeamStaffWithStaff, TeamWithPlayers } from '../../types';

export default function TeamDetailHero({
  team,
  staff,
}: {
  team: TeamWithPlayers;
  staff: TeamStaffWithStaff[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const playerCount = team.players?.length ?? 0;
  const coach = staff.find((item) => String(item.role).toLowerCase().includes('coach'))?.staff as any;
  const coachName = (coach?.name ?? `${coach?.firstName ?? ''} ${coach?.lastName ?? ''}`.trim()) || 'Coach not assigned';
  const initials = team.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 4).toUpperCase();
  return (
    <div className="eb-detail-hero eb-detail-card">
      <div className="eb-detail-hero-main">
        <span className="eb-detail-crest">
          {team.logo ? <img src={team.logo} alt={team.name} /> : <strong>{initials}</strong>}
        </span>
        <div className="eb-detail-hero-copy">
          <div className="eb-detail-badges">
            <span className={`eb-detail-status ${team.approved ? 'approved' : 'pending'}`}>
              <i />
              {team.approved ? 'Approved' : 'Pending approval'}
            </span>
            <span className="eb-detail-chip">{playerCount} players on file</span>
            <span className="eb-detail-slug">{team.name.toLowerCase().replaceAll(' ', '_')}</span>
          </div>
          <h1>{team.name}</h1>
          <div className="eb-detail-meta">
            <span>
              <Users size={14} />
              Coach {coachName}
            </span>
            <span>
              <CalendarDays size={14} />
              Registered since 2023
            </span>
          </div>
        </div>
        <div className="eb-detail-hero-actions">
          <a
            className="eb-detail-quiet"
            href={`/teams/${team.name.toLowerCase().replaceAll(' ', '-')}`}
          >
            <Eye size={14} /> View public page
          </a>
          <a className="eb-detail-primary" href={`/admin/teams/${team.id}`}>
            <Edit3 size={14} /> Edit Team
          </a>
          <div className="eb-detail-menu-wrap"><button className="eb-detail-icon-button" aria-label="More actions" onClick={() => setMenuOpen((value) => !value)}>
            <MoreHorizontal size={17} />
          </button>{menuOpen && <div className="eb-detail-menu"><button>Register in a LeagueSeason…</button><button>Duplicate team</button><button className="danger">{team.approved ? 'Revoke approval' : 'Approve team'}</button></div>}</div>
        </div>
      </div>
    </div>
  );
}
