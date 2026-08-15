import { useEffect, useState } from 'react';
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
import { SECTIONS, type Section, type SettingRecord, type Field } from '../settingsSections';
import SettingsField from './SettingsField';
import SettingsHeaderPreview from './SettingsHeaderPreview';
import SettingsSeoPreview from './SettingsSeoPreview';
import SettingsEmailPreview from './SettingsEmailPreview';
import SettingsEmailDeliveryHistory from './SettingsEmailDeliveryHistory';
import SettingsUnavailable from './SettingsUnavailable';
import SessionHistoryPanel from './SessionHistoryPanel';
import SecurityAuditPanel from './SecurityAuditPanel';
import IntegrationStatusPanel from './IntegrationStatusPanel';

type Props = {
  section: Section;
  settings: Record<string, SettingRecord>;
  draft: Record<string, string>;
  canManage: boolean;
  loading: boolean;
  onChange: (key: string, value: string) => void;
  onReset: (field: Field) => void;
  onRestoreSection: (field?: Field) => void;
};

const SECTION_ICONS = {
  header: LayoutDashboard,
  footer: FileText,
  brand: Palette,
  seo: Search,
  contact: Mail,
  consent: ShieldCheck,
  security: ShieldCheck,
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
  email: Mail,
  emailTemplates: FileText,
  emailDelivery: ClipboardList,
} as const;

export default function SettingsSection({
  section,
  settings,
  draft,
  canManage,
  loading,
  onChange,
  onReset,
  onRestoreSection,
}: Props) {
  const [activeGroupLabel, setActiveGroupLabel] = useState(section.groups[0]?.label ?? '');
  const usesGroupTabs = section.groups.length >= 4;

  useEffect(() => {
    setActiveGroupLabel(section.groups[0]?.label ?? '');
  }, [section.id]);

  const valueFor = (field: Field) =>
    draft[field.key] ?? settings[field.key]?.value ?? field.defaultValue ?? '';
  const valueForKey = (key: string) => {
    const field = SECTIONS
      .flatMap((candidate) => candidate.groups)
      .flatMap((group) => group.fields)
      .find((candidate) => candidate.key === key);
    return draft[key] ?? settings[key]?.value ?? field?.defaultValue ?? '';
  };
  const Icon = SECTION_ICONS[section.id as keyof typeof SECTION_ICONS] ?? Settings2;
  const routeLabel = section.id === 'header' ? 'all pages' : section.href;
  const allValues = Object.fromEntries(SECTIONS.flatMap((candidate) => candidate.groups).flatMap((group) => group.fields).filter((field) => field.type !== 'action').map((field) => [field.key, valueForKey(field.key)]));
  const sectionDirty = section.groups.some((group) =>
    group.fields.some((field) => Object.prototype.hasOwnProperty.call(draft, field.key))
  );
  const activeGroup = section.groups.find((group) => group.label === activeGroupLabel) ?? section.groups[0];
  const visibleGroups = usesGroupTabs && activeGroup ? [activeGroup] : section.groups;

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
          {section.id === 'security' && (
            <div className="eb-settings-security-overview">
              <div className="eb-settings-security-overview-kicker">Protection overview</div>
              <p>Security controls are scoped to administrators and enforced on the server. Missing or invalid values fall back to conservative defaults.</p>
              <div className="eb-settings-security-overview-grid">
                <span><strong>Sign-in</strong> OTP & Login Protection</span>
                <span><strong>Rate limits</strong> OTP and settings mutations</span>
                <span><strong>Visibility</strong> Sessions and audit events are reviewable</span>
              </div>
            </div>
          )}
          {usesGroupTabs && (
            <div className="eb-settings-group-tabs" role="tablist" aria-label={`${section.label} groups`}>
              {section.groups.map((group) => {
                const groupDirty = group.fields.some((field) => Object.prototype.hasOwnProperty.call(draft, field.key));
                const selected = group.label === activeGroup?.label;
                return (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    className={selected ? 'is-active' : ''}
                    onClick={() => setActiveGroupLabel(group.label)}
                    key={group.label}
                  >
                    {group.label}
                    {groupDirty && <span className="eb-settings-tab-dirty" aria-label="Unsaved changes" />}
                  </button>
                );
              })}
            </div>
          )}
          {visibleGroups.map((group) => (
            <div className={`eb-settings-group ${usesGroupTabs ? 'is-tabbed' : ''}`} key={group.label}>
              {!usesGroupTabs && <div className="eb-settings-group-title">{group.label}</div>}
              {section.id === 'security' && group.label === 'Session history' ? (
                <SessionHistoryPanel canManage={canManage} />
              ) : section.id === 'security' && group.label === 'Alerts & Audit' ? (
                <SecurityAuditPanel canManage={canManage} />
              ) : group.available === false ? (
                <SettingsUnavailable
                  title={group.label}
                  description={group.description ?? 'This settings area is not configurable here yet.'}
                  context="It will appear here once its server-side behavior is ready."
                />
              ) : (
                <>
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
                        onAction={onRestoreSection}
                      />
                    ))}
                  </div>
                  {section.id === 'security' && group.label === 'Uploads & Integrations' && <IntegrationStatusPanel canManage={canManage} />}
                </>
              )}
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
          {section.id === 'emailTemplates' && activeGroup?.label !== 'Defaults' && (
            <SettingsEmailPreview values={allValues} templateLabel={activeGroup?.label} canManage={canManage} />
          )}
          {section.id === 'emailDelivery' && <SettingsEmailDeliveryHistory values={allValues} />}
        </>
      )}
    </section>
  );
}
