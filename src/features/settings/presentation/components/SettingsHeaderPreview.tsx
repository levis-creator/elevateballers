type NavItem = { label: string; path: string };

type Props = {
  utilityBar: boolean;
  utilityText: string;
  statusText: string;
  loginLink: boolean;
  logo: string;
  navItems: string;
  ctaLabel: string;
  sticky: boolean;
};

function parseNavItems(value: string): NavItem[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        label: String(item?.label ?? '').trim(),
        path: String(item?.path ?? '').trim(),
      }))
      .filter((item) => item.label)
      .slice(0, 8);
  } catch {
    return [];
  }
}

function normalizeLogo(value: string): string {
  const path = value.trim();
  if (!path || path === 'assets/elevate-logo.png') return '/logo/Elevate_Logo.png';
  if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) return path;
  return `/${path}`;
}

export default function SettingsHeaderPreview({
  utilityBar,
  utilityText,
  statusText,
  loginLink,
  logo,
  navItems,
  ctaLabel,
  sticky,
}: Props) {
  const items = parseNavItems(navItems);

  return (
    <div className="eb-settings-header-preview">
      <div className="eb-settings-header-preview-title">
        <span>Public header preview</span>
        <span>{items.length} nav items</span>
      </div>

      <div className="eb-settings-header-preview-frame">
        {utilityBar && (
          <div className="eb-settings-header-preview-utility">
            <span>{utilityText}</span>
            <span className="eb-settings-header-preview-utility-actions">
              {statusText && (
                <span className="eb-settings-header-preview-status">
                  <i /> {statusText}
                </span>
              )}
              {loginLink && <span className="eb-settings-header-preview-login">Log In</span>}
            </span>
          </div>
        )}

        <div className="eb-settings-header-preview-nav">
          <img src={normalizeLogo(logo)} alt="Elevate Ballers" />
          <div className="eb-settings-header-preview-links">
            {items.map((item, index) => (
              <span
                className={index === 0 ? 'is-active' : ''}
                key={`${index}-${item.label}-${item.path}`}
              >
                {item.label}
              </span>
            ))}
          </div>
          {ctaLabel && <span className="eb-settings-header-preview-cta">{ctaLabel}</span>}
        </div>
      </div>

      <div className="eb-settings-header-preview-note">
        {sticky ? 'Nav sticks to the top on scroll' : 'Nav scrolls away with the page'}
      </div>
    </div>
  );
}
