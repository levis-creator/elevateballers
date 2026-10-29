import type { SiteSetting } from '../domain/siteSetting';

export const PRIVACY_POLICY_PATH = '/privacy-policy';

export type PublicPrivacyPolicySettings = {
  eyebrow: string;
  title: string;
  intro: string;
  /** Shown as "Last updated" and stored with every registration consent. */
  version: string;
  body: string;
  consentLabel: string;
  consentError: string;
};

export type PrivacyPolicyBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };
export type PrivacyPolicySection = { heading: string; blocks: PrivacyPolicyBlock[] };

// Template wording only. The league should have it reviewed by a qualified
// adviser before relying on it; it is not legal advice.
const DEFAULT_BODY = `## Who we are
Elevate Ballers runs a basketball league in Nairobi, Kenya. We are responsible for the personal data you give us when you register a team or a player, contact us, or use this website. We handle it in line with applicable data protection law, including Kenya's Data Protection Act, 2019.

## What we collect
- Registration details: names, email addresses, phone numbers, team names and the information you add to your application.
- Player details: position, jersey number, height, weight and, where entered by league officials, match statistics.
- Photos and video recorded at league games, events and training sessions.
- Technical data such as your IP address and browser details, used to keep the site secure and to stop spam registrations.

## Why we use it
- To process and review registrations and contact you about them.
- To run the league: fixtures, rosters, results, standings and player statistics.
- To publish team, player and match information on this website.
- To keep the website and the registration process secure.

## Photos, video and promotion
League games and events are photographed and filmed. By registering you agree that photos and video in which you appear, together with your name, team and match statistics, may be used to promote the league: on this website, on our social media channels, in match reports and highlights, and in printed or digital promotional material. We will not sell your image to third parties. If you would like a specific photo or video of you taken down, contact us and we will remove it from the channels we control where we reasonably can.

## How long we keep it
We keep registration details for as long as you take part in the league and for up to two years after your last season, so we can keep accurate records and handle any queries. Published results and statistics form part of the league's historical record and may be kept longer. Promotional material that has already been published may remain available.

## Who we share it with
We share data only with the service providers that help us run the league and this website (such as hosting, email delivery and security checks), and with authorities where the law requires it.

## Your rights
You can ask to see the personal data we hold about you, correct it, delete it, or object to how we use it, including for promotion. To make a request, contact us through the Contacts page or the email address shown in the site footer. We will respond within a reasonable time. If you are unhappy with how we handle your data, you can complain to the Office of the Data Protection Commissioner.

## Changes to this policy
We may update this policy. The date at the top shows when it last changed. Registrations record the version that was accepted.`;

export const DEFAULT_PUBLIC_PRIVACY_POLICY_SETTINGS: PublicPrivacyPolicySettings = {
  eyebrow: 'Privacy',
  title: 'Privacy Policy',
  intro:
    'How Elevate Ballers collects and uses personal data, including the photos and video used to promote the league.',
  version: '2026-10-29',
  body: DEFAULT_BODY,
  consentLabel:
    'I agree to the [Privacy Policy], including the use of photos and videos of me for league promotion.',
  consentError: 'Please agree to the Privacy Policy to register.',
};

function text(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

export function resolvePublicPrivacyPolicySettings(
  settings: SiteSetting[]
): PublicPrivacyPolicySettings {
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  const defaults = DEFAULT_PUBLIC_PRIVACY_POLICY_SETTINGS;
  return {
    eyebrow: text(values.privacy_eyebrow, defaults.eyebrow),
    title: text(values.privacy_title, defaults.title),
    intro: text(values.privacy_intro, defaults.intro),
    version: text(values.privacy_version, defaults.version),
    body: text(values.privacy_body, defaults.body),
    consentLabel: text(values.privacy_consentLabel, defaults.consentLabel),
    consentError: text(values.privacy_consentError, defaults.consentError),
  };
}

/** Splits the policy text into sections. `## ` starts a heading, `- ` lines form
 * a list and blank lines separate paragraphs. Text before the first heading
 * becomes an untitled section. */
export function privacyPolicySections(body: string): PrivacyPolicySection[] {
  const sections: PrivacyPolicySection[] = [];
  let current: PrivacyPolicySection = { heading: '', blocks: [] };
  let paragraph: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (paragraph.length) current.blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
    if (list.length) current.blocks.push({ type: 'list', items: list });
    paragraph = [];
    list = [];
  };
  for (const raw of body.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    if (line.startsWith('## ')) {
      flush();
      if (current.heading || current.blocks.length) sections.push(current);
      current = { heading: line.slice(3).trim(), blocks: [] };
    } else if (/^[-*] /.test(line)) {
      if (paragraph.length) flush();
      list.push(line.slice(2).trim());
    } else if (!line) {
      flush();
    } else {
      if (list.length) flush();
      paragraph.push(line);
    }
  }
  flush();
  if (current.heading || current.blocks.length) sections.push(current);
  return sections;
}

/** The text in [square brackets] becomes the policy link. Without brackets the
 * whole label is kept and a separate link is added after it. */
export function privacyConsentLabelParts(label: string): {
  before: string;
  link: string;
  after: string;
} {
  const match = label.match(/^(.*?)\[([^\]]+)\](.*)$/s);
  if (!match) return { before: `${label.trim()} (`, link: 'Privacy Policy', after: ')' };
  return { before: match[1], link: match[2], after: match[3] };
}

/** The plain-text label stored with a consent record. */
export function privacyConsentText(label: string): string {
  const { before, link, after } = privacyConsentLabelParts(label);
  return `${before}${link}${after}`.replace(/\s+/g, ' ').trim();
}
