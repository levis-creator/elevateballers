import type { Section } from '../settingsSections';
import {
  BookOpen,
  ClipboardList,
  FileText,
  Globe2,
  LayoutDashboard,
  Mail,
  Palette,
  Search,
  Settings2,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';

type Props = {
  sections: Section[];
  activeId: string;
  draft: Record<string, string>;
  query: string;
  onQuery: (value: string) => void;
  onSelect: (id: string) => void;
};

const ICONS = {
  header: LayoutDashboard,
  footer: FileText,
  brand: Palette,
  seo: Globe2,
  contact: Mail,
  consent: ShieldCheck,
  system: Settings2,
  home: LayoutDashboard,
  about: FileText,
  rules: BookOpen,
  contactPage: Mail,
  leagues: Trophy,
  standings: Trophy,
  fixtures: ClipboardList,
  results: ClipboardList,
  match: Trophy,
  leaders: Trophy,
  registration: ClipboardList,
  team: Users,
  players: Users,
  player: Users,
  staff: Users,
  staffMember: Users,
  news: FileText,
  article: FileText,
  potw: Trophy,
  email: Mail,
  emailTemplates: FileText,
  emailDelivery: ClipboardList,
} as const;

const RAIL_GROUPS = [
  { id: 'site-wide', label: 'Site-wide', eyebrow: 'Site-wide' },
  { id: 'notifications', label: 'Notifications', eyebrow: 'Notifications' },
  { id: 'pages', label: 'Pages', eyebrow: 'Pages' },
  { id: 'competition', label: 'Competition', eyebrow: 'Competition' },
  { id: 'people', label: 'People', eyebrow: 'People' },
  { id: 'editorial', label: 'Editorial', eyebrow: 'Editorial' },
] as const;

export default function SettingsRail({
  sections,
  activeId,
  draft,
  query,
  onQuery,
  onSelect,
}: Props) {
  return (
    <aside className="eb-settings-rail">
      <div className="eb-settings-rail-filter">
        <Search size={14} />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Filter pages & settings…"
        />
      </div>
      {RAIL_GROUPS.map((group) => {
        const groupSections = sections.filter((section) => section.eyebrow === group.eyebrow);
        if (!groupSections.length) return null;
        return (
          <div className="eb-settings-rail-group" key={group.id} aria-label={group.label}>
            <div className="eb-settings-rail-title">{group.label}</div>
            {groupSections.map((section) => {
              const Icon = ICONS[section.id as keyof typeof ICONS] ?? Settings2;
              const dirtyCount = Object.keys(draft).filter((key) =>
                section.groups.some((item) => item.fields.some((field) => field.key === key))
              ).length;
              return (
                <button
                  key={section.id}
                  type="button"
                  className={activeId === section.id ? 'is-active' : ''}
                  onClick={() => onSelect(section.id)}
                >
                  <span className="eb-settings-rail-icon">
                    <Icon size={14} />
                  </span>
                  <span className="eb-settings-rail-label">{section.label}</span>
                  {dirtyCount > 0 && <span className="eb-settings-rail-badge">{dirtyCount}</span>}
                </button>
              );
            })}
          </div>
        );
      })}
      <div className="eb-settings-rail-footer">
        <span>
          {query
            ? `${sections.length} sections match`
            : `${sections.length} sections · ${sections.filter((section) => section.eyebrow !== 'Site-wide').length} pages`}
        </span>
        <a href="/admin/audit-logs">Audit log →</a>
      </div>
    </aside>
  );
}
