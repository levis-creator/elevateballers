type Props = {
  canonical: string;
  title: string;
  description: string;
};

export default function SettingsSeoPreview({ canonical, title, description }: Props) {
  const base = canonical.trim().replace(/\/$/, '') || 'https://elevateballers.com';

  return (
    <div className="eb-settings-seo-preview">
      <div className="eb-settings-seo-preview-title">Search result preview</div>
      <div className="eb-settings-seo-preview-result">
        <div className="eb-settings-seo-preview-url">{base} › fixtures</div>
        <div className="eb-settings-seo-preview-heading">{title || 'Elevate Ballers'}</div>
        <div className="eb-settings-seo-preview-description">{description}</div>
      </div>
    </div>
  );
}
