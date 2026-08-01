import { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { PermissionProvider, usePermissions } from '@/features/rbac/usePermissions';
import {
  buildThemeColorPalette,
  DEFAULT_PUBLIC_BRAND_SETTINGS,
} from '@/features/settings/application/brandSettings';
import { SECTIONS, type Field, type SettingRecord } from '../settingsSections';
import SettingsRail from '../components/SettingsRail';
import SettingsSaveBar from '../components/SettingsSaveBar';
import SettingsSection from '../components/SettingsSection';
import '../styles/settings-v2.css';

function SettingsPageV2Content() {
  const { can } = usePermissions();
  const canManage = can('site_settings:manage');
  const [settings, setSettings] = useState<Record<string, SettingRecord>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState('header');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const active = SECTIONS.find((section) => section.id === activeId) ?? SECTIONS[0];
  const savedLabel = notice ? notice.replace(/^Saved\s*/i, '') : '2 days ago';
  const filteredSections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return SECTIONS;
    return SECTIONS.filter((section) =>
      `${section.label} ${section.description}`.toLowerCase().includes(normalized)
    );
  }, [query]);

  async function loadSettings() {
    setLoading(true);
    try {
      const response = await fetch('/api/settings?limit=500', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load settings');
      const records = (await response.json()) as SettingRecord[];
      setSettings(Object.fromEntries(records.map((record) => [record.key, record])));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to load settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  function updateValue(key: string, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function resetField(field: Field) {
    setDraft((current) => {
      const next = { ...current };
      delete next[field.key];
      return next;
    });
  }

  function applyAdminColors() {
    const root = document.getElementById('eb-admin-root');
    if (!root) return;

    const value = (key: string, fallback: string) => draft[key] ?? settings[key]?.value ?? fallback;
    const palette = buildThemeColorPalette({
      brand: value('brand_brand', value('brand_accent', DEFAULT_PUBLIC_BRAND_SETTINGS.brand)),
      paper: value('brand_paper', DEFAULT_PUBLIC_BRAND_SETTINGS.paper),
      night: value('brand_night', value('brand_surface', DEFAULT_PUBLIC_BRAND_SETTINGS.night)),
      ink: value('brand_ink', DEFAULT_PUBLIC_BRAND_SETTINGS.ink),
    });
    const variables: Record<string, string> = {
      '--site-brand-rgb': palette.brand,
      '--site-brand-light-rgb': palette.brandLight,
      '--site-brand-soft-rgb': palette.brandSoft,
      '--site-brand-foreground-rgb': palette.brandForeground,
      '--site-paper-rgb': palette.paper,
      '--site-paper-raised-rgb': palette.paperRaised,
      '--site-paper-soft-rgb': palette.paperSoft,
      '--site-paper-panel-rgb': palette.paperPanel,
      '--site-paper-border-rgb': palette.paperBorder,
      '--site-night-rgb': palette.night,
      '--site-night-raised-rgb': palette.nightRaised,
      '--site-night-soft-rgb': palette.nightSoft,
      '--site-night-border-rgb': palette.nightBorder,
      '--site-ink-rgb': palette.ink,
      '--site-ink-muted-rgb': palette.inkMuted,
      '--site-ink-soft-rgb': palette.inkSoft,
      '--site-cream-rgb': palette.cream,
      '--site-cream-dim-rgb': palette.creamDim,
      '--brand': `rgb(${palette.brand})`,
      '--brandlt': `rgb(${palette.brandLight})`,
      '--brandsoft': `rgb(${palette.brandSoft})`,
      '--brandfg': `rgb(${palette.brandForeground})`,
      '--paper': `rgb(${palette.paper})`,
      '--paper2': `rgb(${palette.paperSoft})`,
      '--panel': `rgb(${palette.paperPanel})`,
      '--night': `rgb(${palette.night})`,
      '--night2': `rgb(${palette.nightRaised})`,
      '--ink': `rgb(${palette.ink})`,
      '--muted': `rgb(${palette.inkMuted})`,
      '--muted2': `rgb(${palette.inkSoft})`,
      '--cream': `rgb(${palette.cream})`,
      '--creamdim': `rgb(${palette.creamDim})`,
    };
    Object.entries(variables).forEach(([name, value]) => root.style.setProperty(name, value));
  }

  async function saveChanges() {
    if (!canManage) return;
    setSaving(true);
    setNotice('');
    try {
      await Promise.all(
        Object.entries(draft).map(async ([key, value]) => {
          const existing = settings[key];
          const section = SECTIONS.find((item) =>
            item.groups.some((group) => group.fields.some((field) => field.key === key))
          );
          const field = section?.groups
            .flatMap((group) => group.fields)
            .find((item) => item.key === key);
          const response = await fetch(
            existing ? `/api/settings/${existing.id}` : '/api/settings',
            {
              method: existing ? 'PUT' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(
                existing
                  ? { value }
                  : {
                      key,
                      value,
                      label: field?.label ?? key,
                      type:
                        field?.type === 'toggle'
                          ? 'boolean'
                          : field?.type === 'list' || field?.type === 'json'
                            ? 'json'
                            : field?.type === 'image'
                              ? 'image'
                              : 'text',
                      category: section?.id,
                    }
              ),
            }
          );
          if (!response.ok) throw new Error(`Unable to save ${field?.label ?? key}`);
        })
      );
      if (['brand_brand', 'brand_accent', 'brand_paper', 'brand_night', 'brand_surface', 'brand_ink'].some((key) => key in draft)) {
        applyAdminColors();
      }
      setDraft({});
      setNotice('Saved just now');
      await loadSettings();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="eb-settings-v2">
      <div className="eb-settings-heading">
        <div className="eb-settings-heading-copy">
          <div className="eb-kicker">System</div>
          <h1>Site Settings</h1>
          <p>
            Every public page on Elevate Ballers is configured here — chrome, copy and per-page
            behaviour. Competition values that differ per edition live on the League Season.
          </p>
        </div>
        <div className="eb-settings-heading-actions">
          <span className="eb-settings-saved">Saved {savedLabel} · Levis N.</span>
          <a className="eb-quiet-button" href={active.href} target="_blank" rel="noreferrer">
            Preview Site <ExternalLink size={13} />
          </a>
        </div>
      </div>
      <div className="eb-settings-layout">
        <SettingsRail
          sections={filteredSections}
          activeId={active.id}
          draft={draft}
          query={query}
          onQuery={setQuery}
          onSelect={setActiveId}
        />
        <SettingsSection
          section={active}
          settings={settings}
          draft={draft}
          canManage={canManage}
          loading={loading}
          onChange={updateValue}
          onReset={resetField}
        />
      </div>
      <SettingsSaveBar
        dirtyCount={Object.keys(draft).length}
        saving={saving}
        canManage={canManage}
        onDiscard={() => setDraft({})}
        onSave={() => void saveChanges()}
      />
      {!canManage && (
        <div className="eb-settings-readonly">You have read-only access to site settings.</div>
      )}
    </div>
  );
}

export default function SettingsPageV2() {
  return (
    <PermissionProvider>
      <SettingsPageV2Content />
    </PermissionProvider>
  );
}
