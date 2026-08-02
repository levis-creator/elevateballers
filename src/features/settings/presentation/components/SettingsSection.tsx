import {
  BookOpen,
  Calendar,
  ClipboardList,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Mail,
  Palette,
  Search,
  Settings2,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import type { Section, SettingRecord, Field } from '../settingsSections';
import SettingsField from './SettingsField';
import SettingsHeaderPreview from './SettingsHeaderPreview';
import SettingsSeoPreview from './SettingsSeoPreview';

type Props = {
  section: Section;
  settings: Record<string, SettingRecord>;
  draft: Record<string, string>;
  canManage: boolean;
  loading: boolean;
  onChange: (key: string, value: string) => void;
  onReset: (field: Field) => void;
};

const SECTION_ICONS = {
  header: LayoutDashboard,
  footer: FileText,
  brand: Palette,
  seo: Search,
  contact: Mail,
  consent: ShieldCheck,
  system: Settings2,
  home: LayoutDashboard,
  about: FileText,
  rules: BookOpen,
  contactPage: Mail,
  leagues: Trophy,
  standings: Trophy,
  fixtures: Calendar,
  results: ClipboardList,
  match: Trophy,
  leaders: Trophy,
  registration: ClipboardList,
  team: ShieldCheck,
  players: Users,
  player: Users,
  staff: Users,
  staffMember: Users,
  news: FileText,
  article: FileText,
  potw: Trophy,
} as const;

export default function SettingsSection({
  section,
  settings,
  draft,
  canManage,
  loading,
  onChange,
  onReset,
}: Props) {
  const valueFor = (field: Field) =>
    draft[field.key] ?? settings[field.key]?.value ?? field.defaultValue ?? '';
  const valueForKey = (key: string) => {
    const field = section.groups
      .flatMap((group) => group.fields)
      .find((candidate) => candidate.key === key);
    return draft[key] ?? settings[key]?.value ?? field?.defaultValue ?? '';
  };
  const Icon = SECTION_ICONS[section.id as keyof typeof SECTION_ICONS] ?? Settings2;
  const routeLabel = section.id === 'header' ? 'all pages' : section.href;
  const sectionDirty = section.groups.some((group) =>
    group.fields.some((field) => Object.prototype.hasOwnProperty.call(draft, field.key))
  );

  return (
    <section className="eb-settings-main">
      <div className="eb-settings-section-head">
        <div className="eb-settings-section-copy">
          <div className="eb-settings-section-title-row">
            <span className="eb-settings-section-icon">
              <Icon size={16} />
            </span>
            <h2>{section.label}</h2>
            {sectionDirty && <span className="eb-settings-unsaved">Unsaved</span>}
            <span className="eb-settings-route">{routeLabel}</span>
          </div>
          <p>{section.description}</p>
        </div>
        <a className="eb-settings-open-page" href={section.href} target="_blank" rel="noreferrer">
          Open page <ExternalLink size={13} />
        </a>
      </div>
      {loading ? (
        <div className="eb-settings-loading">
          <div />
          <div />
          <div />
        </div>
      ) : (
        <>
          {section.groups.map((group) => (
            <div className="eb-settings-group" key={group.label}>
              <div className="eb-settings-group-title">{group.label}</div>
              <div className="eb-settings-fields">
                {group.fields.map((field) => (
                  <SettingsField
                    key={field.key}
                    field={field}
                    value={valueFor(field)}
                    dirty={Object.prototype.hasOwnProperty.call(draft, field.key)}
                    canManage={canManage}
                    onChange={onChange}
                    onReset={onReset}
                  />
                ))}
              </div>
            </div>
          ))}
          {section.id === 'header' && (
            <SettingsHeaderPreview
              utilityBar={valueForKey('header_utilityBar') !== 'false'}
              utilityText={valueForKey('header_utilityText')}
              statusText={valueForKey('header_statusText')}
              loginLink={valueForKey('header_loginLink') !== 'false'}
              logo={valueForKey('header_logo')}
              navItems={valueForKey('header_navItems')}
              sticky={valueForKey('header_sticky') !== 'false'}
              ctaLabel={valueForKey('header_ctaLabel')}
            />
          )}
          {section.id === 'seo' && (
            <SettingsSeoPreview
              canonical={valueForKey('seo_canonical')}
              title={valueForKey('seo_metaTitle')}
              description={valueForKey('seo_metaDescription')}
            />
          )}
        </>
      )}
    </section>
  );
}
