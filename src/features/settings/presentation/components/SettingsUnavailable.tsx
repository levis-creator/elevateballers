type Props = {
  title: string;
  description: string;
  context?: string;
};

export default function SettingsUnavailable({ title, description, context }: Props) {
  return (
    <section className="eb-settings-unavailable" aria-labelledby={`settings-unavailable-${title}`}>
      <span className="eb-settings-unavailable-label">Not available yet</span>
      <h3 id={`settings-unavailable-${title}`}>{title}</h3>
      <p>{description}</p>
      {context && <p>{context}</p>}
    </section>
  );
}
