import { RULES_DEFAULTS } from '@/features/rules/lib/rules-content';

export type SettingRecord = {
  id: string;
  key: string;
  value: string;
  type: string;
  label: string;
  description: string | null;
  category: string | null;
};

export type Field = {
  key: string;
  label: string;
  type?:
    | 'text'
    | 'area'
    | 'toggle'
    | 'select'
    | 'json'
    | 'image'
    | 'file'
    | 'list'
    | 'number'
    | 'action';
  help?: string;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
  meta?: string;
  addLabel?: string;
  rowNote?: string;
  maxItems?: number;
  colorPreview?: boolean;
  counter?: number;
  columns?: Array<{ key: string; label: string; placeholder?: string; width?: string }>;
};

export type Group = { label: string; fields: Field[]; available?: boolean; description?: string };
export type Section = {
  id: string;
  label: string;
  eyebrow: string;
  description: string;
  href: string;
  groups: Group[];
};

const f = (key: string, label: string, help = '', options?: Partial<Field>): Field => ({
  key,
  label,
  help,
  ...options,
});

const siteWide = (id: string, label: string, description: string, groups: Group[], href = '/') => ({
  id,
  label,
  eyebrow: 'Site-wide',
  description,
  href,
  groups,
});

const pages = (
  id: string,
  label: string,
  description: string,
  groups: Group[],
  href = `/${id}`
) => ({
  id,
  label,
  eyebrow: 'Pages',
  description,
  href,
  groups,
});

const groupedPages = (
  eyebrow: string,
  id: string,
  label: string,
  description: string,
  groups: Group[],
  href = `/${id}`
) => ({ id, label, eyebrow, description, href, groups });

const competition = (
  id: string,
  label: string,
  description: string,
  groups: Group[],
  href = `/${id}`
) => groupedPages('Competition', id, label, description, groups, href);

const people = (id: string, label: string, description: string, groups: Group[], href = `/${id}`) =>
  groupedPages('People', id, label, description, groups, href);

const editorial = (
  id: string,
  label: string,
  description: string,
  groups: Group[],
  href = `/${id}`
) => groupedPages('Editorial', id, label, description, groups, href);

const notifications = (
  id: string,
  label: string,
  description: string,
  groups: Group[],
  href = '/admin/settings'
) => groupedPages('Notifications', id, label, description, groups, href);

export const SECTIONS: Section[] = [
  siteWide(
    'header',
    'Header & Nav',
    'The utility bar, logo, primary navigation and header button that sit above every public page.',
    [
      {
        label: 'Utility bar',
        fields: [
          f('header_utilityBar', 'Show utility bar', 'The thin dark strip above the nav.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('header_utilityText', 'Left text', 'Place and season.', {
            defaultValue: 'Nairobi, Kenya · Season 2026',
          }),
          f(
            'header_statusText',
            'Status text',
            'Sits next to the red live dot. Blank hides the dot.',
            {
              defaultValue: 'Live standings updating',
            }
          ),
          f(
            'header_loginLink',
            'Log In link',
            'Right of the utility bar. Points at the admin login.',
            {
              type: 'toggle',
              defaultValue: 'true',
            }
          ),
        ],
      },
      {
        label: 'Logo & navigation',
        fields: [
          f(
            'header_logo',
            'Logo',
            'Transparent PNG or SVG. Rendered at 46px tall, 38px on mobile.',
            {
              type: 'image',
              placeholder: 'Logo',
              defaultValue: 'assets/elevate-logo.png',
              meta: 'elevate-logo.png · 640 × 200 · 24 KB',
            }
          ),
          f(
            'header_navItems',
            'Nav items',
            'Shown left to right in this order. Eight is the most that fits before the nav collapses.',
            {
              type: 'list',
              defaultValue:
                '[{"label":"Home","path":"/"},{"label":"Teams","path":"/teams"},{"label":"Standings","path":"/standings"},{"label":"Fixtures","path":"/fixtures"},{"label":"Results","path":"/results"},{"label":"About","path":"/about"},{"label":"Rules","path":"/rules"},{"label":"Contacts","path":"/contacts"}]',
              addLabel: 'Add nav item',
              maxItems: 8,
            }
          ),
          f('header_sticky', 'Stick to top', 'Nav stays pinned with a blurred paper background.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
        ],
      },
      {
        label: 'Header button',
        fields: [
          f(
            'header_ctaLabel',
            'Button label',
            'Blank hides the button in both the desktop nav and the mobile menu.',
            {
              defaultValue: 'Register Team',
            }
          ),
          f('header_ctaHref', 'Button link', 'Relative path.', { defaultValue: '/register' }),
        ],
      },
    ]
  ),
  siteWide(
    'footer',
    'Footer',
    'The dark closing block on every public page: venue details, link column, email signup, partners and the legal bar.',
    [
      {
        label: 'Venue column',
        fields: [
          f(
            'footer_logo',
            'Footer logo',
            'Sits on a white chip, 34px tall. Leave blank to reuse the header logo.',
            {
              type: 'image',
              placeholder: 'Footer logo',
              meta: 'elevate-logo.png · 640 × 200 · 24 KB',
              defaultValue: 'assets/elevate-logo.png',
            }
          ),
          f(
            'footer_showContact',
            'Show contact details',
            'Address, hours, phones and email all print from Contact & Social.',
            { type: 'toggle', defaultValue: 'true' }
          ),
        ],
      },
      {
        label: 'Link column',
        fields: [
          f('footer_linksHeading', 'Column heading', '', { defaultValue: 'Explore' }),
          f('footer_links', 'Links', 'Five fit the column without wrapping.', {
            type: 'list',
            addLabel: 'Add link',
            maxItems: 5,
            defaultValue:
              '[{"label":"Teams","path":"/teams"},{"label":"Standings","path":"/standings"},{"label":"Fixtures & Results","path":"/fixtures"},{"label":"About","path":"/about"},{"label":"Rules","path":"/rules"}]',
          }),
        ],
      },
      {
        label: 'Email signup',
        fields: [
          f('footer_newsletter', 'Show signup', 'Submissions land in Subscribers.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('footer_newsletterHeading', 'Heading', '', {
            defaultValue: 'Sign up for email alerts',
          }),
          f('footer_newsletterBlurb', 'Blurb', 'One line above the field.', {
            defaultValue: 'Select topics and stay current with our latest news.',
          }),
          f('footer_newsletterPlaceholder', 'Field placeholder', '', {
            defaultValue: 'your@email.com',
          }),
          f('footer_newsletterButton', 'Button label', '', { defaultValue: 'Join' }),
          f(
            'footer_socialRow',
            'Social buttons',
            'Square icon buttons using the accounts in Contact & Social.',
            { type: 'toggle', defaultValue: 'true' }
          ),
        ],
      },
      {
        label: 'Partners',
        fields: [
          f(
            'footer_partners',
            'Partner strip',
            'Renders your active partner logos in the footer.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('footer_partnersHeading', 'Strip heading', '', { defaultValue: 'Our Partners' }),
          f('footer_partnersGrayscale', 'Grayscale logos', 'Colour returns on hover.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
        ],
      },
      {
        label: 'Legal bar',
        fields: [
          f('footer_copyright', 'Left line', 'The year range updates automatically.', {
            defaultValue: '© 2024–2026 Elevate Ballers · All Rights Reserved',
          }),
          f('footer_legalRight', 'Right line', 'Blank leaves the right side empty.', {
            defaultValue: 'Kenya’s Premier Basketball League',
          }),
        ],
      },
    ]
  ),
  siteWide(
    'brand',
    'Brand & Theme',
    'Name, accent colour and typography applied across the public site.',
    [
      {
        label: 'Identity',
        fields: [
          f(
            'brand_siteName',
            'Site name',
            'Page titles, share cards and the alt text on the logo.',
            {
              defaultValue: 'Elevate Ballers',
            }
          ),
          f(
            'brand_tagline',
            'Tagline',
            'Right-hand line in the footer legal bar and the share card subtitle.',
            {
              defaultValue: 'Kenya’s Premier Basketball League',
            }
          ),
          f('brand_favicon', 'Favicon', '512 × 512 PNG.', {
            type: 'image',
            placeholder: 'Favicon',
            meta: 'favicon-512.png · 512 × 512 · 9 KB',
            defaultValue: '/media/general/favicon-512.png',
          }),
        ],
      },
      {
        label: 'Colour',
        fields: [
          f(
            'brand_brand',
            'Brand red',
            'Hex. Primary buttons, live dots, active nav and scores only — never as a background wash.',
            { defaultValue: '#e4002b', colorPreview: true }
          ),
          f(
            'brand_paper',
            'Paper',
            'The light page background behind news, teams, standings and the nav.',
            {
              defaultValue: '#f5f3ef',
              colorPreview: true,
            }
          ),
          f(
            'brand_night',
            'Night',
            'The dark background used by the hero, footer and scoreboard blocks.',
            {
              defaultValue: '#0c0b0a',
              colorPreview: true,
            }
          ),
          f(
            'brand_ink',
            'Ink',
            'Body text on paper. Cream (#f3efe9) is used on night automatically.',
            {
              defaultValue: '#141009',
              colorPreview: true,
            }
          ),
        ],
      },
      {
        label: 'Typography',
        fields: [
          f('brand_display', 'Display typeface', 'Headlines, scores and stat numbers.', {
            type: 'select',
            options: ['Anton', 'Archivo Black'],
            defaultValue: 'Anton',
          }),
          f('brand_body', 'Body typeface', 'Paragraphs, tables and buttons.', {
            type: 'select',
            options: ['Archivo', 'Inter'],
            defaultValue: 'Archivo',
          }),
          f(
            'brand_label',
            'Label typeface',
            'The small uppercase mono labels — eyebrows, column heads, timestamps.',
            {
              type: 'select',
              options: ['Space Mono', 'IBM Plex Mono'],
              defaultValue: 'Space Mono',
            }
          ),
          f(
            'brand_uppercaseHeadings',
            'Uppercase headings',
            'Off leaves headlines in sentence case.',
            {
              type: 'toggle',
              defaultValue: 'true',
            }
          ),
        ],
      },
      {
        label: 'Motion',
        fields: [
          f(
            'brand_counters',
            'Animated counters',
            'The homepage stat rail counts up on first view.',
            {
              type: 'toggle',
              defaultValue: 'true',
            }
          ),
          f(
            'brand_heroArt',
            'Hero court graphics',
            'The spinning wireframe ball, arcs and halftone field in the hero.',
            {
              type: 'toggle',
              defaultValue: 'true',
            }
          ),
          f(
            'brand_reducedMotion',
            'Respect reduced motion',
            'Freezes the spin and counters for visitors who ask the OS for less motion.',
            {
              type: 'toggle',
              defaultValue: 'true',
            }
          ),
        ],
      },
    ]
  ),
  siteWide(
    'seo',
    'SEO & Sharing',
    'Defaults for pages that do not set their own title, description or share image.',
    [
      {
        label: 'Metadata',
        fields: [
          f(
            'seo_metaTitle',
            'Home meta title',
            'The homepage title and the fallback for pages with none.',
            {
              defaultValue: 'Elevate Ballers — Kenya Basketball League',
              counter: 60,
            }
          ),
          f('seo_metaDescription', 'Meta description', 'Used when a page has none of its own.', {
            type: 'area',
            counter: 160,
            defaultValue:
              'Fixtures, live scores, standings and player stats for the Elevate Ballers men’s and women’s leagues.',
          }),
          f(
            'seo_canonical',
            'Canonical base URL',
            'No trailing slash. Must match the public domain.',
            {
              defaultValue: 'https://elevateballers.com',
            }
          ),
          f('seo_suffix', 'Title suffix', 'Appended to page-specific titles.', {
            defaultValue: ' | Elevate Ballers',
          }),
        ],
      },
      {
        label: 'Title patterns',
        fields: [
          f('seo_patternTeam', 'Team page', 'Tokens: {team} {league} {season}.', {
            defaultValue: '{team} — Roster, Schedule & Stats',
          }),
          f('seo_patternPlayer', 'Player page', 'Tokens: {player} {team} {position} {season}.', {
            defaultValue: '{player} — {team} | Stats & Game Log',
          }),
          f('seo_patternMatch', 'Match page', 'Tokens: {home} {away} {score} {date}.', {
            defaultValue: '{home} vs {away} — {date} Box Score',
          }),
          f('seo_patternArticle', 'Article page', 'Tokens: {title} {category} {date}.', {
            defaultValue: '{title}',
          }),
        ],
      },
      {
        label: 'Sharing',
        fields: [
          f(
            'seo_ogImage',
            'Default share image',
            '1200 × 630. Used when a page has no image of its own.',
            {
              type: 'image',
              placeholder: 'Share image',
              meta: 'Recommended · 1200 × 630',
              defaultValue: '/media/general/og-default-2026.jpg',
            }
          ),
          f('seo_twitterHandle', 'X handle for cards', 'Attributed on shared links.', {
            defaultValue: '@elevateballers',
          }),
        ],
      },
      {
        label: 'Indexing & crawling',
        fields: [
          f(
            'seo_indexing',
            'Allow search indexing',
            'Off writes a site-wide noindex — staging only.',
            {
              type: 'toggle',
              defaultValue: 'true',
            }
          ),
          f(
            'seo_sitemap',
            'Generate sitemap.xml',
            'Controls the dynamic public sitemap endpoint.',
            {
              type: 'toggle',
              defaultValue: 'true',
            }
          ),
          f(
            'seo_noindexPaths',
            'Excluded paths',
            'Kept out of the sitemap and marked noindex. * matches anything after it.',
            {
              type: 'list',
              addLabel: 'Add path',
              maxItems: 20,
              columns: [
                { key: 'path', label: 'Path', placeholder: '/admin/*', width: '1fr' },
                { key: 'why', label: 'Note', placeholder: 'Staff only', width: '1fr' },
              ],
              defaultValue:
                '[{"path":"/admin/*","why":"Staff only"},{"path":"/register/thanks","why":"Post-submit page"},{"path":"/search","why":"Duplicate of listings"}]',
            }
          ),
          f(
            'seo_schema',
            'Sports structured data',
            'SportsEvent, SportsTeam and Person markup for rich results.',
            {
              type: 'toggle',
              defaultValue: 'true',
            }
          ),
        ],
      },
      {
        label: 'Analytics',
        fields: [
          f('seo_analytics', 'Provider', 'Only loads after cookie consent is granted.', {
            type: 'select',
            options: ['None', 'Google Analytics 4', 'Plausible'],
            defaultValue: 'Google Analytics 4',
          }),
          f(
            'seo_analyticsId',
            'Measurement or site ID',
            'A GA4 Measurement ID (G-XXXXXXXXXX) or, for Plausible, your site domain.',
            {
              placeholder: 'G-XXXXXXXXXX',
              defaultValue: 'G-VVZ9P3XBLP',
            }
          ),
          f(
            'seo_verification',
            'Verification codes',
            'Rendered as ownership verification meta tags.',
            {
              type: 'list',
              addLabel: 'Add code',
              maxItems: 10,
              columns: [
                { key: 'provider', label: 'Provider', placeholder: 'Google', width: '0.6fr' },
                { key: 'token', label: 'Token', placeholder: 'Verification token', width: '1.4fr' },
              ],
              defaultValue: '[]',
            }
          ),
        ],
      },
    ]
  ),
  siteWide(
    'contact',
    'Contact & Social',
    'The single source for address, phones, email and social accounts — printed in the footer and on the Contacts page.',
    [
      {
        label: 'Contact',
        fields: [
          f(
            'contact_email',
            'Public email',
            'Receives contact-form messages and prints in the footer.',
            { defaultValue: 'ballers@elevateballers.com' }
          ),
          f('contact_phone', 'Phone numbers', 'Separate with “ · ”.', {
            defaultValue: '0703 913 923 · 0729 259 496',
          }),
          f(
            'contact_address',
            'Address',
            'Line breaks are kept. Also the venue on the Contacts map card.',
            {
              type: 'area',
              defaultValue: 'Pepo Lane, off Dagoretti Road, Nairobi, Kenya',
            }
          ),
          f(
            'contact_hours',
            'Opening hours',
            'Printed in the footer and as the Hours row of the Visit Us card.',
            {
              defaultValue: 'Saturdays & Sundays · 8:00 AM – 6:00 PM',
            }
          ),
        ],
      },
      {
        label: 'Social',
        fields: [
          f('social_facebook', 'Facebook', 'Page URL. Shown as the FB button.', {
            defaultValue: 'facebook.com/elevateballers',
          }),
          f('social_instagram', 'Instagram', 'Handle or full URL. Shown as IG.', {
            defaultValue: '@elevateballers',
          }),
          f('social_youtube', 'YouTube', 'Channel URL — also the source for embedded highlights.', {
            defaultValue: 'youtube.com/@elevateballers',
          }),
          f('social_twitter', 'X', 'Handle or full URL.', { defaultValue: '@elevateballers' }),
          f(
            'social_order',
            'Button order',
            'Comma-separated. Only accounts filled in above are rendered.',
            {
              defaultValue: 'FB, IG, YT, X',
            }
          ),
        ],
      },
      {
        label: 'Desks & routing',
        fields: [
          f(
            'contact_departmentList',
            'Desks',
            'Printed in the Contacts page Departments grid and used to route form topics. Multiples of three fill the grid evenly.',
            {
              type: 'list',
              addLabel: 'Add desk',
              maxItems: 12,
              columns: [
                { key: 'name', label: 'Desk', placeholder: 'Competition', width: '0.8fr' },
                {
                  key: 'email',
                  label: 'Email',
                  placeholder: 'desk@elevateballers.com',
                  width: '1.2fr',
                },
                {
                  key: 'handles',
                  label: 'Handles',
                  placeholder: 'Fixtures, results, standings',
                  width: '1.2fr',
                },
              ],
              defaultValue:
                '[{"name":"Competition","email":"competition@elevateballers.com","handles":"Fixtures, results, standings"},{"name":"Registration","email":"register@elevateballers.com","handles":"Team entries and transfers"},{"name":"Officiating","email":"referees@elevateballers.com","handles":"Referees and match reports"},{"name":"Media","email":"media@elevateballers.com","handles":"Press access and interviews"},{"name":"Partnerships","email":"partners@elevateballers.com","handles":"Sponsorship and events"},{"name":"Support","email":"ballers@elevateballers.com","handles":"Anything else"}]',
            }
          ),
          f(
            'contact_inbox',
            'Default inbox',
            'Where a message goes when its topic has no desk of its own.',
            {
              defaultValue: 'ballers@elevateballers.com',
            }
          ),
          f(
            'contact_notify',
            'Notify the desk',
            'Emails the desk as well as filing the message in Contact Messages.',
            {
              type: 'toggle',
              defaultValue: 'true',
            }
          ),
          f(
            'contact_responseTarget',
            'Response promise',
            'Printed on the Contacts page and in the auto-reply.',
            {
              defaultValue: 'within 48 hours',
            }
          ),
        ],
      },
    ],
    '/contacts'
  ),
  notifications(
    'email',
    'Email Sending',
    'Who transactional mail comes from, how it is sent, and the signature every message carries. Templates live in the next section.',
    [
      {
        label: 'Automatic replies',
        fields: [
          f(
            'email_autoReplies',
            'Send automatic replies',
            'Master switch. Off queues nothing — no registration, approval, payment or reset mail leaves the system.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f(
            'email_adminCopy',
            'Copy the league office',
            'Blind-copies the default inbox on every automatic reply.',
            { type: 'toggle', defaultValue: 'false' }
          ),
        ],
      },
      {
        label: 'Sender',
        fields: [
          f('email_senderName', 'Sender name', 'Shown as the From name in the inbox.', {
            defaultValue: 'Elevate Ballers',
          }),
          f(
            'email_senderEmail',
            'Sender address',
            'Must be a verified sender on the provider below.',
            { defaultValue: 'no-reply@elevateballers.com' }
          ),
          f(
            'email_replyTo',
            'Reply-to address',
            'Where replies land. Usually a monitored inbox, not the sender.',
            { defaultValue: 'ballers@elevateballers.com' }
          ),
        ],
      },
      {
        label: 'Providers',
        fields: [
          f(
            'email_providers',
            'Configured providers',
            'Order sets priority. Resend and Brevo accept an API key; Mailgun accepts key|domain or JSON; SMTP accepts host:port or JSON with host, port, user and pass. Credentials are encrypted and masked after saving.',
            {
              type: 'list',
              addLabel: 'Add provider',
              rowNote: 'top row sends first',
              maxItems: 8,
              columns: [
                { key: 'provider', label: 'Provider', placeholder: 'Resend', width: '0.7fr' },
                {
                  key: 'credential',
                  label: 'Credential / connection',
                  placeholder: 're_live_…',
                  width: '1.3fr',
                },
                { key: 'useFor', label: 'Use for', placeholder: 'All mail', width: '0.8fr' },
                { key: 'status', label: 'Status', placeholder: 'Verified', width: '0.6fr' },
              ],
              defaultValue:
                '[{"provider":"Resend","credential":"re_live_••••••••••••••4c1a","useFor":"Transactional","status":"Verified"},{"provider":"Brevo","credential":"xkeysib-••••••••••••••8d3f","useFor":"Bulk & newsletter","status":"Verified"},{"provider":"Mailgun","credential":"key-••••••••••••••7b02","useFor":"Bulk & newsletter","status":"Verified"},{"provider":"SMTP","credential":"smtp.elevateballers.com:587","useFor":"Fallback only","status":"Unverified"}]',
            }
          ),
          f('email_routing', 'Routing', 'How a message picks its provider.', {
            type: 'select',
            options: [
              'By “Use for” column',
              'Always the top provider',
              'Round-robin across verified',
            ],
            defaultValue: 'By “Use for” column',
          }),
        ],
      },
      {
        label: 'Failover',
        fields: [
          f(
            'email_failover',
            'Fail over automatically',
            'On a send error, retry down the provider list before giving up.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f(
            'email_failoverAfter',
            'Switch after failures',
            'Consecutive failures on one provider before moving to the next.',
            { type: 'number', defaultValue: '2' }
          ),
          f(
            'email_failoverCooldown',
            'Cooldown (minutes)',
            'How long a failing provider is skipped before it is tried again.',
            { type: 'number', defaultValue: '15' }
          ),
          f(
            'email_failoverAlert',
            'Alert on failover',
            'Emails the alert address when sending moves to another provider.',
            { type: 'toggle', defaultValue: 'true' }
          ),
        ],
      },
      {
        label: 'Format & signature',
        fields: [
          f(
            'email_format',
            'Email format',
            'Multipart sends both and lets the client choose — the safest default.',
            {
              type: 'select',
              options: ['HTML and plain text', 'HTML only', 'Plain text only'],
              defaultValue: 'HTML and plain text',
            }
          ),
          f('email_brandHeader', 'Branded header', 'Logo on a dark band at the top of HTML mail.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('email_signature', 'Signature', 'Appended to every message body.', {
            type: 'area',
            defaultValue:
              'Elevate Ballers League\nPepo Lane, off Dagoretti Road, Nairobi\n0703 913 923 · ballers@elevateballers.com',
          }),
          f(
            'email_footerNote',
            'Email footer',
            'Small print under the signature. Unsubscribe is added automatically to non-transactional mail.',
            {
              type: 'area',
              defaultValue: 'You are receiving this because you registered with Elevate Ballers.',
            }
          ),
        ],
      },
    ]
  ),
  notifications(
    'emailTemplates',
    'Email Templates',
    'Subject and body for every automatic message. Variables: {name} {firstName} {email} {team} {fromTeam} {effectiveDate} {league} {season} {status} {applicationId} {amount} {matchDate} {opponent} {venue} {link} {expiry}.',
    [
      {
        label: 'Registration received',
        fields: [
          f(
            'emailTemplates_registrationEnabled',
            'Registration received',
            'Sent the moment a team or player form is submitted.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f(
            'emailTemplates_registrationSubject',
            'Registration received · subject',
            'Variables are resolved when the mail is queued.',
            { defaultValue: 'We’ve received your {season} registration', counter: 70 }
          ),
          f(
            'emailTemplates_registrationBody',
            'Registration received · body',
            'Blank lines separate paragraphs. The signature is appended automatically.',
            {
              type: 'area',
              defaultValue:
                'Hi {firstName},\n\nThanks for registering {team} for the {season} {league} season. Your application ID is {applicationId}.\n\nOur team reviews entries within 3 working days and will email you the outcome.',
            }
          ),
        ],
      },
      {
        label: 'Team registration approved',
        fields: [
          f(
            'emailTemplates_approvedEnabled',
            'Team registration approved',
            'Sent to the team coach after an admin approves the team’s season registration.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f(
            'emailTemplates_approvedSubject',
            'Approval email · subject',
            'Variables are resolved when the mail is queued.',
            { defaultValue: '{team} is in — {season} registration approved', counter: 70 }
          ),
          f(
            'emailTemplates_approvedBody',
            'Approval email · body',
            'Sent to the coach with the team, league, season, application ID, and approval status.',
            {
              type: 'area',
              defaultValue:
                'Hi {firstName},\n\nGood news: {team} has been accepted into the {season} {league} season. Application {applicationId} is now marked {status}.\n\nYour entry fee of {amount} is due before the roster deadline. Fixtures are published once all entries are confirmed.',
            }
          ),
        ],
      },
      {
        label: 'Rejected',
        fields: [
          f(
            'emailTemplates_rejectedEnabled',
            'Application rejected',
            'Sent when an entry is declined. Keep it specific and offer a route back.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f(
            'emailTemplates_rejectedSubject',
            'Application rejected · subject',
            'Variables are resolved when the mail is queued.',
            { defaultValue: 'About your {season} registration', counter: 70 }
          ),
          f(
            'emailTemplates_rejectedBody',
            'Application rejected · body',
            'Blank lines separate paragraphs. The signature is appended automatically.',
            {
              type: 'area',
              defaultValue:
                'Hi {firstName},\n\nThanks for applying to the {season} {league} season. We’re unable to confirm {team} this time — application {applicationId} is marked {status}.\n\nReply to this email and we’ll explain the reason and what would make a future entry successful.',
            }
          ),
        ],
      },
      {
        label: 'Payment received',
        fields: [
          f(
            'emailTemplates_paymentEnabled',
            'Payment received',
            'Sent on a confirmed entry-fee payment. Doubles as the receipt.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f(
            'emailTemplates_paymentSubject',
            'Payment received · subject',
            'Variables are resolved when the mail is queued.',
            { defaultValue: 'Payment received — {amount} for {team}', counter: 70 }
          ),
          f(
            'emailTemplates_paymentBody',
            'Payment received · body',
            'Blank lines separate paragraphs. The signature is appended automatically.',
            {
              type: 'area',
              defaultValue:
                'Hi {firstName},\n\nWe’ve received {amount} for {team}’s {season} entry. Application {applicationId} is fully paid.\n\nKeep this email as your receipt.',
            }
          ),
        ],
      },
      {
        label: 'Match notification',
        fields: [
          f(
            'emailTemplates_matchEnabled',
            'Match notification',
            'Sent to a club when a fixture is published, moved or cancelled.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f(
            'emailTemplates_matchSubject',
            'Match notification · subject',
            'Variables are resolved when the mail is queued.',
            { defaultValue: '{team} vs {opponent} — {matchDate}', counter: 70 }
          ),
          f(
            'emailTemplates_matchBody',
            'Match notification · body',
            'Blank lines separate paragraphs. The signature is appended automatically.',
            {
              type: 'area',
              defaultValue:
                'Hi {firstName},\n\n{team} play {opponent} on {matchDate} at {venue}.\n\nArrive 45 minutes before tip-off with your squad list. Full fixture details: {link}',
            }
          ),
          f(
            'emailTemplates_matchLead',
            'Send days ahead',
            'How far before tip-off the reminder goes out. 0 sends only on publication.',
            { type: 'number', defaultValue: '2' }
          ),
        ],
      },
      {
        label: 'Account & security',
        fields: [
          f(
            'emailTemplates_verifyEnabled',
            'Verification & password reset',
            'One template covers both; {link} carries the right action.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f(
            'emailTemplates_verifySubject',
            'Verification & password reset · subject',
            'Variables are resolved when the mail is queued.',
            { defaultValue: 'Confirm your Elevate Ballers account', counter: 70 }
          ),
          f(
            'emailTemplates_verifyBody',
            'Verification & password reset · body',
            'Blank lines separate paragraphs. The signature is appended automatically.',
            {
              type: 'area',
              defaultValue:
                'Hi {firstName},\n\nUse the link below to continue. It expires in {expiry}.\n\n{link}\n\nIf you didn’t request this, ignore this email and nothing will change.',
            }
          ),
          f(
            'emailTemplates_linkExpiry',
            'Link valid for (minutes)',
            'Fills {expiry} and enforces the real expiry.',
            { type: 'number', defaultValue: '60' }
          ),
        ],
      },
      {
        label: 'Staff transfer',
        fields: [
          f(
            'emailTemplates_staffTransferEnabled',
            'Staff transfer notification',
            'Sent to the staff member when an administrator transfers them between teams.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f(
            'emailTemplates_staffTransferSubject',
            'Staff transfer · subject',
            'Variables include {firstName}, {fromTeam}, {team}, and {effectiveDate}.',
            { defaultValue: 'Your team assignment is moving to {team}', counter: 70 }
          ),
          f(
            'emailTemplates_staffTransferBody',
            'Staff transfer · body',
            'Sent after an admin records an immediate or scheduled transfer.',
            {
              type: 'area',
              defaultValue:
                'Hi {firstName},\n\nYour Elevate Ballers staff assignment is moving from {fromTeam} to {team}.\n\nEffective date: {effectiveDate}.',
            }
          ),
        ],
      },
      {
        label: 'Defaults',
        fields: [
          f(
            '$restoreSection',
            'Restore default templates',
            'Puts every subject and body in this section back to its original wording. Nothing is written until you save.',
            { type: 'action' }
          ),
        ],
      },
    ]
  ),
  notifications(
    'emailDelivery',
    'Delivery & Logs',
    'Sending limits, duplicate protection, and where failures are recorded.',
    [
      {
        label: 'Rate limiting',
        fields: [
          f(
            'emailDelivery_perMinute',
            'Messages per minute',
            'Queue drains at this rate. Keep at or under your provider’s limit.',
            { type: 'number', defaultValue: '60' }
          ),
          f(
            'emailDelivery_perRecipientDay',
            'Per recipient, per day',
            'Hard cap so a loop cannot flood one inbox.',
            { type: 'number', defaultValue: '5' }
          ),
          f(
            'emailDelivery_dedupe',
            'Suppress duplicates',
            'Drops an identical event and recipient sent inside the window below.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('emailDelivery_dedupeWindow', 'Duplicate window (minutes)', '', {
            type: 'number',
            defaultValue: '30',
          }),
        ],
      },
      {
        label: 'Errors',
        fields: [
          f(
            'emailDelivery_logErrors',
            'Log SMTP and API errors',
            'Failures are written to audit logs with the provider response.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f(
            'emailDelivery_retries',
            'Retry attempts',
            'Exponential backoff between tries. Hard bounces are never retried.',
            { type: 'number', defaultValue: '3' }
          ),
          f(
            'emailDelivery_alertEmail',
            'Alert address',
            'Notified when the queue stalls or the bounce rate spikes. Blank disables alerts.',
            { defaultValue: 'ballers@elevateballers.com' }
          ),
          f(
            'emailDelivery_bounceThreshold',
            'Bounce alert threshold (%)',
            'Alert once bounces exceed this share of a day’s sends.',
            { type: 'number', defaultValue: '5' }
          ),
        ],
      },
      {
        label: 'History',
        fields: [
          f(
            'emailDelivery_history',
            'Keep notification history',
            'Every message with its status — queued, sent, opened, bounced, failed.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('emailDelivery_retention', 'Retain for (days)', 'Older records are purged nightly.', {
            type: 'number',
            defaultValue: '90',
          }),
          f(
            'emailDelivery_trackOpens',
            'Track opens',
            'Adds a tracking pixel. Requires cookie consent for marketing mail.',
            { type: 'toggle', defaultValue: 'false' }
          ),
        ],
      },
    ]
  ),
  siteWide(
    'consent',
    'Cookie Consent',
    'Cookie categories and the visitor controls shown on first visit.',
    [
      {
        label: 'Consent bar',
        fields: [
          f(
            'consent_enabled',
            'Show consent bar',
            'Required while any analytics provider is set.',
            {
              type: 'toggle',
              defaultValue: 'true',
            }
          ),
          f('consent_eyebrow', 'Eyebrow', 'Red mono label above the heading.', {
            defaultValue: 'We use cookies',
          }),
          f('consent_heading', 'Heading', 'Set in Anton at 30px.', {
            defaultValue: 'Game day, your way',
          }),
          f(
            'consent_message',
            'Message',
            'Two sentences. The policy link is appended to the end.',
            {
              type: 'area',
              defaultValue:
                'We use cookies to keep scores live, remember your favourite teams, and see which stories fans read most. Accept all to get the full experience.',
            }
          ),
          f('consent_accept', 'Accept button', 'Red primary.', { defaultValue: 'Accept all' }),
          f('consent_reject', 'Reject button', 'Dark secondary. Keeps essential cookies only.', {
            defaultValue: 'Reject all',
          }),
          f('consent_manage', 'Manage button', 'Opens the preferences panel.', {
            defaultValue: 'Customise',
          }),
          f('consent_policyLabel', 'Policy link label', '', { defaultValue: 'Cookie Policy' }),
          f('consent_policy', 'Policy link', 'Path to the policy page.', {
            defaultValue: '/cookie-policy',
          }),
        ],
      },
      {
        label: 'Preferences panel',
        fields: [
          f('consent_prefsEyebrow', 'Panel eyebrow', '', { defaultValue: 'Cookie preferences' }),
          f('consent_prefsHeading', 'Panel heading', '', { defaultValue: 'Set your line-up' }),
          f(
            'consent_essentialDesc',
            'Essential row',
            'Always listed first with its switch locked on.',
            {
              type: 'area',
              defaultValue:
                'Keep the site running — page navigation, security, and remembering you got this far. These can’t be switched off.',
            }
          ),
          f(
            'consent_categories',
            'Optional categories',
            'Listed under Essential, each with its own switch.',
            {
              type: 'list',
              addLabel: 'Add category',
              columns: [
                { key: 'name', label: 'Category', placeholder: 'Match Stats', width: '0.7fr' },
                {
                  key: 'desc',
                  label: 'What it does',
                  placeholder: 'Anonymous stats on what fans view',
                  width: '1.3fr',
                },
              ],
              defaultValue:
                '[{"name":"Match Stats","desc":"Anonymous stats on which fixtures, players and stories fans view most, so we can improve the coverage."},{"name":"Your Line-up","desc":"Remember your favourite teams and preferences so standings and fixtures land the way you like them."},{"name":"Court-side Offers","desc":"Let us and select partners show you relevant tickets, merch and league promotions on and off the site."}]',
            }
          ),
          f('consent_saveLabel', 'Save button', 'Red primary in the panel.', {
            defaultValue: 'Save my choices',
          }),
          f(
            'consent_reopen',
            'Cookie settings button',
            'Lets a visitor reopen the panel after deciding.',
            {
              type: 'toggle',
              defaultValue: 'true',
            }
          ),
          f(
            'consent_remember',
            'Remember for (days)',
            'How long before a visitor is asked again.',
            {
              defaultValue: '180',
            }
          ),
        ],
      },
    ]
  ),
  siteWide(
    'security',
    'Security',
    'Admin-only controls for sign-in verification and sensitive Site Settings changes. Values are bounded server-side and secure defaults apply when they are missing or invalid.',
    [
      {
        label: 'OTP & Login Protection',
        fields: [
          f(
            'security_loginMaxAttempts',
            'Maximum login attempts',
            'Invalid passwords allowed before the account is locked. Allowed range: 3–10.',
            { type: 'number', defaultValue: '5' }
          ),
          f(
            'security_loginLockoutMinutes',
            'Login lockout duration',
            'Minutes an account stays locked after too many invalid passwords. Allowed range: 5–60.',
            { type: 'number', defaultValue: '15' }
          ),
          f(
            'security_otpExpiryMinutes',
            'OTP expiry duration',
            'Minutes before a sign-in verification code expires. Allowed range: 5–30.',
            { type: 'number', defaultValue: '10' }
          ),
          f(
            'security_otpMaxAttempts',
            'Maximum OTP attempts',
            'Invalid codes allowed before the current code is locked. Allowed range: 3–10.',
            { type: 'number', defaultValue: '5' }
          ),
          f(
            'security_otpLockoutMinutes',
            'OTP lockout duration',
            'Minutes a code stays locked after too many invalid codes. Allowed range: 5–60.',
            { type: 'number', defaultValue: '15' }
          ),
        ],
      },
      {
        label: 'Sessions',
        fields: [
          f(
            'security_sessionDurationDays',
            'Admin session duration',
            'Days before an authenticated admin session expires. Allowed range: 1–14.',
            { type: 'number', defaultValue: '7' }
          ),
          f(
            'security_maxConcurrentSessions',
            'Maximum concurrent sessions',
            'Active admin sessions retained per user; oldest sessions are revoked first. Allowed range: 1–10.',
            { type: 'number', defaultValue: '3' }
          ),
          f(
            'security_signOutAll',
            'Sign out all users',
            'Immediately invalidates every existing authenticated session. You will need to sign in again.',
            { type: 'action' }
          ),
        ],
      },
      {
        label: 'Session history',
        fields: [],
        available: true,
        description:
          'Review durable administrator sessions and revoke an active session when needed.',
      },
      {
        label: 'Rate limits',
        fields: [
          f(
            'security_loginRateLimitMax',
            'Login requests per window',
            'Login attempts allowed for one source IP before a temporary limit. Allowed range: 3–30.',
            { type: 'number', defaultValue: '10' }
          ),
          f(
            'security_loginRateLimitWindowMinutes',
            'Login rate-limit window',
            'Minutes in the login rate-limit window. Allowed range: 5–60.',
            { type: 'number', defaultValue: '15' }
          ),
          f(
            'security_otpRateLimitMax',
            'OTP requests per window',
            'Verification requests allowed for one administrator before a temporary limit. Allowed range: 3–20.',
            { type: 'number', defaultValue: '5' }
          ),
          f(
            'security_otpRateLimitWindowMinutes',
            'OTP rate-limit window',
            'Minutes in the OTP verification rate-limit window. Allowed range: 5–60.',
            { type: 'number', defaultValue: '15' }
          ),
          f(
            'security_settingsMutationMax',
            'Settings changes per window',
            'Creates and updates allowed for one administrator before a temporary limit. Allowed range: 10–100.',
            { type: 'number', defaultValue: '30' }
          ),
          f(
            'security_settingsMutationWindowMinutes',
            'Settings rate-limit window',
            'Minutes in the Site Settings mutation rate-limit window. Allowed range: 5–60.',
            { type: 'number', defaultValue: '10' }
          ),
        ],
      },
      {
        label: 'Passwords',
        fields: [
          f(
            'security_passwordMinLength',
            'Minimum password length',
            'Applies to new and changed passwords; existing passwords are not changed automatically. Allowed range: 8–64.',
            { type: 'number', defaultValue: '8' }
          ),
          f(
            'security_passwordHistoryCount',
            'Password history count',
            'Recent password hashes retained and rejected for reuse. Allowed range: 0–10.',
            { type: 'number', defaultValue: '5' }
          ),
          f(
            'security_passwordBreachCheck',
            'Breached-password checks',
            'Reject passwords found by the privacy-preserving breach range check.',
            { type: 'toggle', defaultValue: 'true' }
          ),
        ],
      },
      {
        label: 'Alerts & Audit',
        fields: [],
        available: true,
        description:
          'Review security audit events. Email change alerts use the existing transactional email delivery.',
      },
      {
        label: 'Uploads & Integrations',
        fields: [
          f(
            'security_mediaUploadMaxSizeMB',
            'Media upload max size (MB)',
            'Largest image or media file accepted by the media library, per file. Allowed range: 1–50.',
            { type: 'number', defaultValue: '12' }
          ),
          f(
            'security_documentUploadMaxSizeMB',
            'Document upload max size (MB)',
            'Largest PDF accepted for the rulebook document upload. Allowed range: 1–50.',
            { type: 'number', defaultValue: '25' }
          ),
          f(
            'security_mediaUploadRateLimitMax',
            'Media uploads per window',
            'Uploads allowed for one administrator before a temporary limit. Allowed range: 3–60.',
            { type: 'number', defaultValue: '20' }
          ),
          f(
            'security_mediaUploadRateLimitWindowMinutes',
            'Media upload rate-limit window',
            'Minutes in the media upload rate-limit window. Allowed range: 5–60.',
            { type: 'number', defaultValue: '15' }
          ),
          f(
            'security_batchUploadMaxFiles',
            'Maximum files per batch upload',
            'Files accepted in a single batch media upload request. Allowed range: 1–50.',
            { type: 'number', defaultValue: '20' }
          ),
          f(
            'security_turnstileEnabled',
            'Bot protection (Turnstile)',
            'Require a passed Cloudflare Turnstile check on login, registration, and public forms.',
            { type: 'toggle', defaultValue: 'true' }
          ),
        ],
      },
    ],
    '/admin/settings'
  ),
  siteWide(
    'system',
    'System Pages',
    'Error, redirect and loading states, plus the site-wide maintenance switch.',
    [
      {
        label: '404',
        fields: [
          f('system_notFoundEyebrow', 'Eyebrow', 'Rule-flanked mono label above the headline.', {
            defaultValue: 'Error 404',
          }),
          f('system_notFoundTitle', 'Headline', 'Set in Anton at up to 150px.', {
            defaultValue: 'Airball',
            counter: 14,
          }),
          f(
            'system_notFoundAccent',
            'Accent letters',
            'The part of the headline set in the brand colour.',
            { defaultValue: 'ball' }
          ),
          f('system_notFoundBody', 'Body', 'Offer a way back.', {
            type: 'area',
            defaultValue:
              'That shot missed everything — the page you’re looking for isn’t on the court. It may have been moved, renamed, or never existed.',
          }),
          f(
            'system_notFoundLinks',
            'Suggested links',
            'The first row is the primary button; the rest are secondary links.',
            {
              type: 'list',
              addLabel: 'Add link',
              maxItems: 8,
              columns: [
                { key: 'label', label: 'Label', placeholder: 'Back to Home', width: '1fr' },
                { key: 'path', label: 'Path', placeholder: '/', width: '1fr' },
              ],
              defaultValue:
                '[{"label":"Back to Home","path":"/"},{"label":"View Fixtures","path":"/fixtures"},{"label":"Standings","path":"/standings"}]',
            }
          ),
        ],
      },
      {
        label: '302 redirect',
        fields: [
          f('system_redirectEyebrow', 'Eyebrow', 'Rule-flanked mono label.', {
            defaultValue: 'Page moved',
          }),
          f('system_redirectTitle', 'Headline', 'Set in Anton at up to 110px.', {
            defaultValue: 'Redirecting',
            counter: 16,
          }),
          f('system_redirectBody', 'Body', 'Use {countdown} for the live seconds remaining.', {
            type: 'area',
            defaultValue:
              'This page has a new home. We’re taking you there now — you’ll arrive in {countdown}.',
          }),
          f(
            'system_redirectSeconds',
            'Countdown (seconds)',
            'Also drives the ring animation. 0 redirects immediately.',
            { defaultValue: '5' }
          ),
          f('system_redirectCta', 'Primary button', 'Jumps straight to the destination.', {
            defaultValue: 'Go There Now →',
          }),
          f('system_redirectFallback', 'Fallback note', 'Small print under the buttons.', {
            defaultValue: 'Not redirected automatically? Use the button above.',
          }),
          f('system_redirectLinks', 'Quick links', 'Links along the foot of the redirect page.', {
            type: 'list',
            addLabel: 'Add link',
            maxItems: 8,
            columns: [
              { key: 'label', label: 'Label', placeholder: 'Fixtures', width: '1fr' },
              { key: 'path', label: 'Path', placeholder: '/fixtures', width: '1fr' },
            ],
            defaultValue:
              '[{"label":"Home","path":"/"},{"label":"Teams","path":"/teams"},{"label":"Standings","path":"/standings"},{"label":"Fixtures","path":"/fixtures"},{"label":"News","path":"/news"}]',
          }),
        ],
      },
      {
        label: 'Loading',
        fields: [
          f(
            'system_loadingLabel',
            'Splash label',
            'Beside the animated dots on the full-screen boot splash.',
            { defaultValue: 'Loading' }
          ),
          f(
            'system_loadingLines',
            'Status lines',
            'Cycled under the splash label while the app boots.',
            {
              type: 'list',
              addLabel: 'Add line',
              maxItems: 8,
              columns: [
                { key: 'line', label: 'Line', placeholder: 'Loading standings', width: '1fr' },
              ],
              defaultValue:
                '[{"line":"Tipping off…"},{"line":"Loading standings"},{"line":"Fetching fixtures"},{"line":"Warming up the court"}]',
            }
          ),
          f(
            'system_splashThreshold',
            'Splash after (ms)',
            'Below this, pages load without flashing the splash.',
            { defaultValue: '400' }
          ),
          f(
            'system_skeletons',
            'Skeleton placeholders',
            'Region-level shimmer for lists, tables and detail heroes.',
            { type: 'toggle', defaultValue: 'true' }
          ),
        ],
      },
      {
        label: 'Maintenance',
        fields: [
          f(
            'system_maintenance',
            'Maintenance mode',
            'Public site shows the notice below. Admin stays reachable.',
            { type: 'toggle', defaultValue: 'false' }
          ),
          f('system_maintenanceMsg', 'Maintenance message', '', {
            type: 'area',
            defaultValue: 'We’re updating results from last night’s games. Back shortly.',
          }),
        ],
      },
    ]
  ),
  pages(
    'home',
    'Homepage',
    'The blocks under the masthead and the order visitors meet them in.',
    [
      {
        label: 'Hero',
        fields: [
          f(
            'home_pill',
            'Live pill',
            'Mono label with the pulsing red dot. Blank hides the pill.',
            { defaultValue: 'Season 2026 · Live now' }
          ),
          f(
            'home_heading',
            'Headline',
            'Set in Anton at up to 128px. A line break controls where the second line starts.',
            { type: 'area', defaultValue: 'Elevate\nyour game', counter: 34 }
          ),
          f(
            'home_accentWord',
            'Accent word',
            'This word in the headline is set in the brand colour.',
            { defaultValue: 'game' }
          ),
          f('home_body', 'Intro paragraph', 'Two sentences maximum.', {
            type: 'area',
            defaultValue:
              'Nairobi’s own basketball league — born on the city’s courts, built for its players. Live matches, standings, and rising stars from Kenya’s capital, all season long.',
          }),
          f('home_ctaLabel', 'Primary button', 'Blank hides the button.', {
            defaultValue: 'Register Team',
          }),
          f('home_ctaHref', 'Primary link', '', { defaultValue: '/register' }),
          f('home_ctaLabel2', 'Secondary button', '', { defaultValue: 'View Standings' }),
          f('home_ctaHref2', 'Secondary link', '', { defaultValue: '/standings' }),
        ],
      },
      {
        label: 'Hero background',
        fields: [
          f(
            'home_heroMedia',
            'Background',
            'Video autoplays muted and looped; the court pattern is the no-media fallback.',
            {
              type: 'select',
              options: ['Drone video', 'Court pattern', 'Still image'],
              defaultValue: 'Drone video',
            }
          ),
          f(
            'home_heroVideo',
            'Video URL',
            'MP4 in the Media Library. Used as the image URL for Still image.',
            { defaultValue: '/media/general/nairobi-courts-loop.mp4' }
          ),
          f(
            'home_heroDim',
            'Dim percent',
            'Darkening over the media. Below 60 usually fails contrast.',
            { defaultValue: '78' }
          ),
          f(
            'home_ghostWord',
            'Ghost word',
            'Oversized outlined word behind the hero. Blank hides it.',
            { defaultValue: 'Nairobi' }
          ),
        ],
      },
      {
        label: 'Stat rail',
        fields: [
          f('home_statRail', 'Show stat rail', 'Counters under the hero copy.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f(
            'home_statRailItems',
            'Counters',
            'Counts are read live from the current League Season.',
            {
              type: 'list',
              addLabel: 'Add counter',
              maxItems: 8,
              columns: [
                { key: 'label', label: 'Label', placeholder: 'Teams', width: '1fr' },
                { key: 'source', label: 'Counts', placeholder: 'Registered teams', width: '1.2fr' },
              ],
              defaultValue:
                '[{"label":"Teams","source":"Registered teams"},{"label":"Players","source":"Registered players"},{"label":"Matches Played","source":"Matches marked final"}]',
            }
          ),
          f(
            'home_countUp',
            'Count up on load',
            'Numbers animate from zero the first time they scroll into view.',
            { type: 'toggle', defaultValue: 'true' }
          ),
        ],
      },
      {
        label: 'News ticker',
        fields: [
          f('home_ticker', 'Show ticker', 'The scrolling strip under the hero.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('home_tickerLabel', 'Ticker label', 'Dark chip at the head of the strip.', {
            defaultValue: 'Elevate News',
          }),
          f('home_tickerSource', 'Items', 'What scrolls past.', {
            type: 'select',
            options: ['Latest headlines', 'Latest results', 'Headlines and results'],
            defaultValue: 'Headlines and results',
          }),
          f('home_tickerSpeed', 'Loop seconds', 'One full pass. Higher is slower.', {
            defaultValue: '40',
          }),
        ],
      },
      {
        label: 'Fixtures & results',
        fields: [
          f(
            'home_fixturesBlock',
            'Show block',
            'Two columns: upcoming matches and recent results.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('home_fixturesHeading', 'Left heading', '', { defaultValue: 'Upcoming Matches' }),
          f('home_resultsHeading', 'Right heading', '', { defaultValue: 'Recent Results' }),
          f('home_fixturesCount', 'Rows per column', 'Same count for both sides.', {
            defaultValue: '4',
          }),
          f('home_emptyFixtures', 'No fixtures message', 'Shown between seasons.', {
            defaultValue: 'No matches scheduled — the next round drops soon.',
          }),
        ],
      },
      {
        label: 'Player of the Week',
        fields: [
          f(
            'home_potw',
            'Show spotlight',
            'Its copy and stats are edited in Editorial › Player of the Week.',
            { type: 'toggle', defaultValue: 'true' }
          ),
        ],
      },
      {
        label: 'Latest news',
        fields: [
          f('home_newsBlock', 'Show block', '', { type: 'toggle', defaultValue: 'true' }),
          f('home_newsEyebrow', 'Eyebrow', '', { defaultValue: 'From around the league' }),
          f('home_newsHeading', 'Heading', '', { defaultValue: 'Latest News' }),
          f('home_newsCount', 'Cards shown', 'Before the load-more step.', { defaultValue: '6' }),
          f('home_newsFilters', 'Category chips', 'Filter row beside the heading.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
        ],
      },
      {
        label: 'Leaders & numbers',
        fields: [
          f('home_leadersBlock', 'Show block', 'League Leaders beside By The Numbers.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('home_leadersHeading', 'Leaders heading', '', { defaultValue: 'League Leaders' }),
          f('home_numbersHeading', 'Numbers heading', '', { defaultValue: 'By The Numbers' }),
          f('home_leadersRows', 'Players per board', '', { defaultValue: '5' }),
        ],
      },
      {
        label: 'Featured media',
        fields: [
          f(
            'home_mediaBlock',
            'Show block',
            'Hidden automatically when the library has nothing tagged featured.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('home_mediaEyebrow', 'Eyebrow', '', {
            defaultValue: 'Visual highlights from across the league',
          }),
          f('home_mediaHeading', 'Heading', '', { defaultValue: 'Featured Media' }),
          f('home_mediaCount', 'Items shown', '', { defaultValue: '6' }),
        ],
      },
      {
        label: 'About block',
        fields: [
          f(
            'home_aboutBlock',
            'Show block',
            'Centred white section above the register call-to-action.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('home_aboutEyebrow', 'Eyebrow', '', { defaultValue: 'Welcome to Elevate Ballers' }),
          f('home_aboutHeading', 'Heading', 'A line break splits it over two lines.', {
            type: 'area',
            defaultValue: 'Your home for the game\nwe live for',
          }),
          f('home_aboutBody', 'Paragraph', '', {
            type: 'area',
            defaultValue:
              'The official home of Kenya’s premier basketball league. Follow every game, every team, and every player. Standings update after every match, and the Player of the Week highlights one standout performance.',
          }),
        ],
      },
      {
        label: 'Register call-to-action',
        fields: [
          f('home_ctaBlock', 'Show block', 'The full-width brand band at the foot of the page.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('home_ctaOpenEyebrow', 'Open · eyebrow', 'Shown while registration is open.', {
            defaultValue: 'Registration Open',
          }),
          f('home_ctaOpenHeading', 'Open · heading', '', {
            type: 'area',
            defaultValue: 'Register to\njoin the league',
          }),
          f('home_ctaOpenBody', 'Open · paragraph', '', {
            type: 'area',
            defaultValue:
              'Be part of Elevate Ballers. Tryouts run throughout the year for late entries — sign up your team or yourself today.',
          }),
          f(
            'home_ctaClosedEyebrow',
            'Closed · eyebrow',
            'Swaps in automatically once the registration window shuts.',
            { defaultValue: 'Registration Closed' }
          ),
          f('home_ctaClosedHeading', 'Closed · heading', '', {
            type: 'area',
            defaultValue: '2026 entries\nare closed',
          }),
          f('home_ctaClosedBody', 'Closed · paragraph', '', {
            type: 'area',
            defaultValue:
              'The season is underway. Tryouts still run year-round for late entries — join the waitlist and we’ll reach out the moment a spot or the 2027 window opens.',
          }),
          f('home_ctaClosedLabel', 'Closed · button', '', { defaultValue: 'Join the Waitlist →' }),
        ],
      },
    ],
    '/'
  ),
  pages('about', 'About', 'Every block on the About page, in the order it appears.', [
    {
      label: 'Hero',
      fields: [
        f('about_eyebrow', 'Eyebrow', 'Rule-flanked mono label.', {
          defaultValue: 'About the Club',
        }),
        f('about_title', 'Headline', 'A line break controls the second line.', {
          type: 'area',
          defaultValue: 'Built for the\nlove of the game',
        }),
        f('about_accentWord', 'Accent word', 'This word is set in the brand colour.', {
          defaultValue: 'game',
        }),
        f('about_intro', 'Intro paragraph', '', {
          type: 'area',
          defaultValue:
            'Elevate Ballers is Kenya’s home for competitive basketball — a community league in Nairobi where clubs, players, and fans come together every week to compete, grow, and celebrate the game.',
        }),
      ],
    },
    {
      label: 'Stat strip',
      fields: [
        f('about_statStrip', 'Show strip', 'Four figures across the band under the hero.', {
          type: 'toggle',
          defaultValue: 'true',
        }),
        f('about_stats', 'Figures', 'Leave a value blank to read a matching live count.', {
          type: 'list',
          addLabel: 'Add figure',
          maxItems: 8,
          columns: [
            { key: 'value', label: 'Value', placeholder: '24', width: '.5fr' },
            { key: 'label', label: 'Label', placeholder: 'Teams', width: '1fr' },
            { key: 'accent', label: 'Red?', placeholder: 'yes / no', width: '.4fr' },
          ],
          defaultValue:
            '[{"value":"24","label":"Teams","accent":"yes"},{"value":"370+","label":"Players","accent":"no"},{"value":"2","label":"Leagues","accent":"no"},{"value":"2024","label":"Founded","accent":"yes"}]',
        }),
      ],
    },
    {
      label: 'Our story',
      fields: [
        f('about_storyBlock', 'Show block', '', { type: 'toggle', defaultValue: 'true' }),
        f('about_storyEyebrow', 'Eyebrow', '', { defaultValue: 'Our Story' }),
        f('about_storyHeading', 'Heading', '', {
          type: 'area',
          defaultValue: 'From a weekend\nrun to a league',
        }),
        f(
          'about_storyImage',
          'Story image',
          '4:3. A striped placeholder shows until one is uploaded.',
          { type: 'image' }
        ),
        f('about_storyBody', 'Body', 'Blank lines separate paragraphs.', {
          type: 'area',
          defaultValue:
            "What started as a handful of friends looking for organised, competitive hoops has grown into one of Nairobi's most active basketball communities. Elevate Ballers was founded to give players a real stage — proper fixtures, standings that matter, and the structure to turn casual runs into a genuine season.\n\nToday the league runs two competitions side by side — the Elevate Basketball League (EBL) and the Elevate Women's Basketball League (EWBL) — bringing together school teams, academies, corporate sides, and community teams from across the city.\n\nEvery week, standings update after each game, a Player of the Week is crowned, and the next generation of Kenyan talent gets the reps, the competition, and the spotlight they deserve.",
        }),
      ],
    },
    {
      label: 'The leagues',
      fields: [
        f('about_leaguesBlock', 'Show block', 'Two cards, one per permanent league.', {
          type: 'toggle',
          defaultValue: 'true',
        }),
        f('about_leaguesEyebrow', 'Eyebrow', '', { defaultValue: 'Two Leagues, One Community' }),
        f('about_leaguesHeading', 'Heading', '', { defaultValue: 'Where everyone plays' }),
        f('about_leagueCards', 'Cards', 'The first card renders dark, the second light.', {
          type: 'list',
          addLabel: 'Add card',
          maxItems: 8,
          columns: [
            { key: 'abbr', label: 'Tag', placeholder: 'EBL', width: '.45fr' },
            { key: 'title', label: 'Title', placeholder: "Men's League", width: '.8fr' },
            { key: 'body', label: 'Blurb', placeholder: 'What the league is', width: '1.8fr' },
            { key: 'teams', label: 'Teams', placeholder: '16', width: '.35fr' },
            { key: 'players', label: 'Players', placeholder: '240+', width: '.4fr' },
          ],
          defaultValue:
            '[{"abbr":"EBL","title":"Men\'s League","body":"The Elevate Basketball League brings together the city\'s top men\'s teams, academies, and community sides in weekly competitive play.","teams":"16","players":"240+"},{"abbr":"EWBL","title":"Women\'s League","body":"The Elevate Women\'s Basketball League gives women\'s teams a dedicated, competitive stage — from school programs to established teams.","teams":"8","players":"130+"}]',
        }),
      ],
    },
    {
      label: 'Values',
      fields: [
        f('about_valuesBlock', 'Show block', 'Four numbered cards.', {
          type: 'toggle',
          defaultValue: 'true',
        }),
        f('about_valuesEyebrow', 'Eyebrow', '', { defaultValue: 'What We Stand For' }),
        f('about_valuesHeading', 'Heading', '', { defaultValue: 'Our values' }),
        f('about_values', 'Values', 'Four fill the row.', {
          type: 'list',
          addLabel: 'Add value',
          maxItems: 8,
          columns: [
            { key: 'num', label: 'No.', placeholder: '01', width: '.3fr' },
            { key: 'title', label: 'Value', placeholder: 'Community', width: '.7fr' },
            {
              key: 'body',
              label: 'Description',
              placeholder: 'What it means in practice',
              width: '1.8fr',
            },
          ],
          defaultValue:
            '[{"num":"01","title":"Community","body":"It starts with belonging — a welcoming home in Nairobi for players, families, and fans of every level."},{"num":"02","title":"Development","body":"From that community we build players — competition, coaching, and reps that turn raw potential into real growth."},{"num":"03","title":"Excellence","body":"Real fixtures, real standings, real stakes — a relentless commitment to raising the standard of Kenyan basketball."},{"num":"04","title":"Integrity","body":"Clear rules, consistent officiating, and respect on and off the court — earned every single game."}]',
        }),
      ],
    },
    {
      label: 'Community impact',
      fields: [
        f('about_impactBlock', 'Show block', '', { type: 'toggle', defaultValue: 'true' }),
        f('about_impactEyebrow', 'Eyebrow', '', { defaultValue: 'More Than a League' }),
        f('about_impactHeading', 'Heading', '', { defaultValue: 'Community impact' }),
        f('about_impactBody', 'Paragraph', '', {
          type: 'area',
          defaultValue:
            'Basketball is the reason we gather, but the impact runs deeper. Elevate Ballers exists to open doors — giving young players across Nairobi a safe, structured, and inspiring place to grow, on and off the court.',
        }),
        f('about_impactStats', 'Impact figures', 'Four numbers above the programme cards.', {
          type: 'list',
          addLabel: 'Add figure',
          maxItems: 8,
          columns: [
            { key: 'value', label: 'Value', placeholder: '1,200+', width: '.5fr' },
            { key: 'label', label: 'Label', placeholder: 'Youth reached', width: '1fr' },
            { key: 'accent', label: 'Red?', placeholder: 'yes / no', width: '.4fr' },
          ],
          defaultValue:
            '[{"value":"1,200+","label":"Youth reached","accent":"yes"},{"value":"18","label":"Partner schools","accent":"no"},{"value":"100%","label":"Free to attend","accent":"no"},{"value":"3","label":"Courts refurbished","accent":"yes"}]',
        }),
        f('about_impactItems', 'Programmes', 'Three cards fill the row.', {
          type: 'list',
          addLabel: 'Add programme',
          maxItems: 8,
          columns: [
            { key: 'title', label: 'Programme', placeholder: 'Youth Clinics', width: '.8fr' },
            { key: 'body', label: 'Description', placeholder: 'What it does', width: '1.8fr' },
          ],
          defaultValue:
            '[{"title":"Youth Clinics","body":"Free weekend skills clinics run by our coaches and players, bringing structured training to neighbourhoods that rarely get it."},{"title":"Girls in the Game","body":"The EWBL and our schools program create a dedicated pathway for young women to compete, lead, and be seen on a real stage."},{"title":"Courts for the City","body":"We partner with local groups to refurbish public courts — leaving every community we play in with a better place to hoop."}]',
        }),
      ],
    },
    {
      label: 'Partnerships',
      fields: [
        f('about_partnerBlock', 'Show block', 'Dark card inviting sponsors.', {
          type: 'toggle',
          defaultValue: 'true',
        }),
        f('about_partnerEyebrow', 'Eyebrow', '', { defaultValue: 'Partner With Us' }),
        f('about_partnerHeading', 'Heading', '', { defaultValue: 'Grow the game together' }),
        f('about_partnerBody', 'Paragraph', '', {
          type: 'area',
          defaultValue:
            'Brands, schools, and community organisations power what we do. If you want to reach Nairobi’s basketball community and invest in the game, let’s talk.',
        }),
        f('about_partnerCta', 'Button', 'Points at the Partnerships desk in Contact & Social.', {
          defaultValue: 'Become a Partner →',
        }),
      ],
    },
    {
      label: 'Timeline',
      fields: [
        f('about_timeline', 'Show timeline', 'Vertical list of milestones.', {
          type: 'toggle',
          defaultValue: 'true',
        }),
        f('about_timelineEyebrow', 'Eyebrow', '', { defaultValue: 'The Journey' }),
        f('about_timelineHeading', 'Heading', '', { defaultValue: 'How we got here' }),
        f('about_milestones', 'Milestones', 'Oldest first.', {
          type: 'list',
          addLabel: 'Add milestone',
          maxItems: 12,
          columns: [
            { key: 'year', label: 'Year', placeholder: '2024', width: '.35fr' },
            { key: 'title', label: 'Title', placeholder: 'The First Tip-Off', width: '.9fr' },
            { key: 'body', label: 'Description', placeholder: 'What happened', width: '1.8fr' },
          ],
          defaultValue:
            '[{"year":"2024","title":"The First Tip-Off","body":"Elevate Ballers launches with a handful of clubs and a shared love of the game."},{"year":"2025","title":"The Women\'s League Arrives","body":"The EWBL is founded, opening a dedicated stage for women’s basketball."},{"year":"2025","title":"Standings Go Live","body":"Weekly standings, Player of the Week, and league stats become part of every matchday."},{"year":"2026","title":"A Growing Community","body":"Two leagues, 24 clubs, and 370+ players competing across Nairobi."}]',
        }),
      ],
    },
    {
      label: 'Leadership',
      fields: [
        f('about_staffGrid', 'Show leadership', 'Reads from League Staff, ordered by role.', {
          type: 'toggle',
          defaultValue: 'true',
        }),
        f('about_staffEyebrow', 'Eyebrow', '', { defaultValue: 'The People' }),
        f('about_staffHeading', 'Heading', '', { defaultValue: 'Leadership' }),
        f('about_staffBody', 'Paragraph', '', {
          type: 'area',
          defaultValue:
            'Meet the directors, operations leads, officials, and volunteers who run Elevate Ballers every match day — from tip-off to final buzzer.',
        }),
        f('about_staffCta', 'Button', 'Links to the Staff page.', {
          defaultValue: 'Meet the Team →',
        }),
      ],
    },
    {
      label: 'Venue',
      fields: [
        f('about_venueBlock', 'Show block', 'Address and hours print from Contact & Social.', {
          type: 'toggle',
          defaultValue: 'true',
        }),
        f('about_venueEyebrow', 'Eyebrow', '', { defaultValue: 'Home Court' }),
        f('about_venueHeading', 'Heading', '', {
          type: 'area',
          defaultValue: 'Come support\nlocal talent',
        }),
        f('about_venueBody', 'Paragraph', '', {
          type: 'area',
          defaultValue:
            'Come support local talent and be part of the community. Our home base sits off Dagoretti Road in Nairobi, with fixtures across the city each weekend.',
        }),
        f(
          'about_venueImage',
          'Venue image',
          '4:3 or wider. A striped placeholder shows until one is uploaded.',
          { type: 'image' }
        ),
      ],
    },
    {
      label: 'Closing call-to-action',
      fields: [
        f('about_ctaBlock', 'Show block', 'Brand band at the foot of the page.', {
          type: 'toggle',
          defaultValue: 'true',
        }),
        f('about_ctaHeading', 'Heading', '', { defaultValue: 'Be part of it' }),
        f('about_ctaBody', 'Paragraph', '', {
          type: 'area',
          defaultValue:
            'Register a team, join as a player, or just come support. There’s a place for everyone at Elevate Ballers.',
        }),
        f('about_ctaButtons', 'Buttons', 'The first is solid dark; the rest are outlined.', {
          type: 'list',
          addLabel: 'Add button',
          maxItems: 8,
          columns: [
            { key: 'label', label: 'Label', placeholder: 'Register →', width: '1fr' },
            { key: 'path', label: 'Link', placeholder: '/register', width: '1fr' },
          ],
          defaultValue:
            '[{"label":"Register →","path":"/#register"},{"label":"Browse Teams","path":"/teams"}]',
        }),
      ],
    },
  ]),
  pages(
    'rules',
    'Rules',
    'Every block on the Rules page, in the order it appears — including the full rule text.',
    [
      {
        label: 'Hero',
        fields: [
          f('rules_eyebrow', 'Eyebrow', 'Rule-flanked mono label above the title.', {
            defaultValue: 'Official Rules & Regulations · 2026',
          }),
          f('rules_title', 'Page title', 'Set in Anton at up to 120px. One word works best.', {
            defaultValue: 'Rules',
            counter: 14,
          }),
          f('rules_intro', 'Intro', 'State the effective date and the rule set it derives from.', {
            type: 'area',
            defaultValue:
              'The official rules and regulations governing Elevate Ballers play. Valid as of 1 January 2026, based on FIBA Official Basketball Rules 2024 with league-specific amendments.',
          }),
        ],
      },
      {
        label: 'Rulebook download',
        fields: [
          f(
            'rules_pdf',
            'Rulebook file',
            'Upload the signed PDF. Replacing it updates every public rulebook link.',
            {
              type: 'file',
              placeholder: 'PDF up to 25 MB',
              defaultValue: '/documents/elevate-ballers-league-rules-2026.pdf',
            }
          ),
          f('rules_pdfLabel', 'Button label', 'The solid brand button beside the title.', {
            defaultValue: '↓ Download Full Rulebook',
          }),
        ],
      },
      {
        label: 'Quick reference',
        fields: [
          f(
            'rules_quickRef',
            'Show cards',
            'The strip of headline numbers above the first section.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('rules_quickRefCards', 'Cards', 'Four fill the row; two per row on mobile.', {
            type: 'list',
            addLabel: 'Add card',
            maxItems: 8,
            columns: [
              { key: 'value', label: 'Value', placeholder: '4×10', width: '.7fr' },
              { key: 'label', label: 'Label', placeholder: 'Minute quarters', width: '1fr' },
            ],
            defaultValue: JSON.stringify(RULES_DEFAULTS.quickRef),
          }),
        ],
      },
      {
        label: 'Sections',
        fields: [
          f(
            'rules_sections',
            'Rule sections',
            'Order controls page order and generated numbering. Changing an anchor breaks existing deep links.',
            {
              type: 'list',
              addLabel: 'Add section',
              maxItems: 16,
              columns: [
                { key: 'title', label: 'Title', placeholder: 'Game Procedures', width: '1fr' },
                { key: 'id', label: 'Anchor', placeholder: 'game', width: '.6fr' },
              ],
              defaultValue: JSON.stringify(
                RULES_DEFAULTS.sections.map(({ title, id }) => ({ title, id }))
              ),
            }
          ),
          f(
            'rules_clauseTags',
            'Show clause numbers',
            'The mono tag printed beside each clause title.',
            { type: 'toggle', defaultValue: 'true' }
          ),
        ],
      },
      {
        label: 'Rule text',
        fields: [
          f(
            'rules_clauses',
            'Clauses',
            'Full published rule text. Set Section to an anchor from Rule sections.',
            {
              type: 'list',
              addLabel: 'Add clause',
              maxItems: 80,
              columns: [
                { key: 'section', label: 'Section', placeholder: 'game', width: '.55fr' },
                { key: 'tag', label: 'Tag', placeholder: '5.1', width: '.35fr' },
                { key: 'title', label: 'Title', placeholder: 'Playing Time', width: '.8fr' },
                {
                  key: 'body',
                  label: 'Rule text',
                  placeholder: 'Full published clause',
                  width: '2fr',
                },
              ],
              defaultValue: JSON.stringify(
                RULES_DEFAULTS.sections.flatMap((section) =>
                  section.rules.map((rule) => ({ section: section.id, ...rule }))
                )
              ),
            }
          ),
        ],
      },
      {
        label: 'Contents sidebar',
        fields: [
          f(
            'rules_contents',
            'Show sidebar',
            'Sticky section list on the left. Hidden below 960px.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('rules_contentsHeading', 'Heading', '', { defaultValue: 'On this page' }),
          f('rules_helpCard', 'Questions card', 'The card under the section list.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('rules_helpHeading', 'Card heading', '', { defaultValue: 'Questions?' }),
          f('rules_helpBody', 'Card body', 'One line.', {
            defaultValue: 'Reach the competitions desk for clarifications.',
          }),
          f('rules_helpLinkLabel', 'Card link', '', { defaultValue: 'Contact us →' }),
          f('rules_helpLinkPath', 'Card link target', '', { defaultValue: '/contacts' }),
        ],
      },
    ]
  ),
  pages(
    'contactPage',
    'Contacts Page',
    'Copy and blocks on the public Contacts page.',
    [
      {
        label: 'Hero',
        fields: [
          f('contactPage_eyebrow', 'Eyebrow', 'Brand mono label above the title.', {
            defaultValue: 'Get in Touch',
          }),
          f('contactPage_title', 'Page title', 'Set in Anton at up to 120px.', {
            defaultValue: 'Contacts',
            counter: 18,
          }),
          f('contactPage_intro', 'Intro', 'Two sentences maximum.', {
            type: 'area',
            defaultValue:
              'Questions about fixtures, registration, transfers, or officiating? Reach the right desk below, or send us a message and we’ll get back to you.',
          }),
        ],
      },
      {
        label: 'Quick contact cards',
        fields: [
          f('contactPage_quickCards', 'Show cards', 'The row of tap-to-act cards under the hero.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f(
            'contactPage_quickCardList',
            'Cards',
            'Value accepts {phone}, {email}, and {address}.',
            {
              type: 'list',
              addLabel: 'Add card',
              maxItems: 8,
              columns: [
                { key: 'icon', label: 'Icon', placeholder: '✆', width: '.35fr' },
                { key: 'label', label: 'Label', placeholder: 'Call us', width: '.8fr' },
                { key: 'value', label: 'Value', placeholder: '{phone}', width: '1fr' },
                { key: 'action', label: 'Action', placeholder: 'Call now', width: '.7fr' },
                { key: 'href', label: 'Link', placeholder: 'tel:+254703913923', width: '1fr' },
              ],
              defaultValue:
                '[{"icon":"✆","label":"Call us","value":"{phone}","action":"Call now","href":"tel:+254703913923"},{"icon":"✉","label":"Email","value":"{email}","action":"Send email","href":"mailto:ballers@elevateballers.com"},{"icon":"⌂","label":"Visit","value":"{address}","action":"Get directions","href":""}]',
            }
          ),
        ],
      },
      {
        label: 'Message form',
        fields: [
          f('contactPage_form', 'Show form', 'Submissions land in Contact Messages.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('contactPage_formTitle', 'Form heading', '', { defaultValue: 'Send a message' }),
          f(
            'contactPage_formBlurb',
            'Form blurb',
            'Use {response} for the promise set in Contact & Social.',
            {
              defaultValue:
                'Fill in the form and the right team will get back to you, usually {response}.',
            }
          ),
          f(
            'contactPage_topics',
            'Topic options',
            'Each topic routes to a desk from Contact & Social.',
            {
              type: 'list',
              addLabel: 'Add topic',
              maxItems: 16,
              columns: [
                { key: 'topic', label: 'Topic', placeholder: 'Registration', width: '1fr' },
                { key: 'desk', label: 'Routes to desk', placeholder: 'Registration', width: '1fr' },
              ],
              defaultValue:
                '[{"topic":"General enquiry","desk":"General"},{"topic":"Team registration","desk":"Registration"},{"topic":"Player transfer","desk":"Transfers"},{"topic":"Fixtures & scheduling","desk":"Fixtures & Results"},{"topic":"Officiating & protests","desk":"Officiating"},{"topic":"Media & partnerships","desk":"Media & Partnerships"}]',
            }
          ),
          f(
            'contactPage_teamField',
            'Team field',
            'Optional Team input beside the sender’s name.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('contactPage_requirePhone', 'Require phone', 'Off leaves the phone field optional.', {
            type: 'toggle',
            defaultValue: 'false',
          }),
          f('contactPage_submitLabel', 'Submit label', '', { defaultValue: 'Send Message' }),
          f(
            'contactPage_successMsg',
            'Success message',
            'Replaces the form after a send. Use {response}.',
            { defaultValue: 'Message received. We’ll be in touch {response}.' }
          ),
          f(
            'contactPage_autoReply',
            'Auto-reply',
            'Emailed to the sender. Blank sends nothing. Use {response}.',
            {
              type: 'area',
              defaultValue: 'Thanks — we’ve got your message and will come back to you {response}.',
            }
          ),
        ],
      },
      {
        label: 'Sidebar',
        fields: [
          f(
            'contactPage_visitCard',
            'Visit Us card',
            'Address, hours, phone and email from Contact & Social.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('contactPage_visitHeading', 'Visit card heading', '', { defaultValue: 'Visit Us' }),
          f('contactPage_socialCard', 'Follow the League card', 'Dark card with social buttons.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f(
            'contactPage_map',
            'Venue map',
            'A striped placeholder shows until a map image is configured.',
            { type: 'toggle', defaultValue: 'true' }
          ),
        ],
      },
      {
        label: 'Departments',
        fields: [
          f(
            'contactPage_departments',
            'Show departments',
            'Three-column grid of desks at the foot of the page.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('contactPage_departmentsEyebrow', 'Eyebrow', '', {
            defaultValue: 'Reach the Right Desk',
          }),
          f(
            'contactPage_departmentsHeading',
            'Heading',
            'The desks are edited once in Contact & Social.',
            { defaultValue: 'Departments' }
          ),
        ],
      },
    ],
    '/contacts'
  ),
  competition(
    'leagues',
    'Leagues',
    'The two permanent competitions as visitors meet them — the codes on every filter pill, and how the season picker behaves. There is no public leagues page; these values drive the pickers on Standings, Fixtures, Results and Leaders.',
    [
      {
        label: 'Competitions',
        fields: [
          f(
            'leagues_names',
            'Leagues',
            'The code tags match cards; the full name is the competition filter pill on Standings and the league line in the match header.',
            {
              type: 'list',
              addLabel: 'Add league',
              maxItems: 8,
              columns: [
                { key: 'code', label: 'Code', placeholder: 'EBL', width: '.4fr' },
                {
                  key: 'name',
                  label: 'Full name',
                  placeholder: 'Elevate Ballers League (EBL)',
                  width: '1.6fr',
                },
              ],
              defaultValue:
                '[{"code":"EBL","name":"Elevate Ballers League (EBL)"},{"code":"EWBL","name":"Elevate Women\'s Basketball League (EWBL)"}]',
            }
          ),
          f('leagues_defaultLeague', 'Default league', 'What a first-time visitor sees selected.', {
            type: 'select',
            options: ['EBL', 'EWBL', 'Remember last choice'],
            defaultValue: 'Remember last choice',
          }),
          f(
            'leagues_allLabel',
            '“All leagues” label',
            'The pill that clears the league filter. Blank forces a league to always be chosen.',
            { defaultValue: 'All Leagues' }
          ),
        ],
      },
      {
        label: 'Season picker',
        fields: [
          f(
            'leagues_archive',
            'Season archive',
            'Lets visitors open completed League Seasons from the dropdown.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('leagues_seasonLabel', 'Dropdown suffix', 'Appended to each year in the picker.', {
            defaultValue: 'Season',
          }),
          f(
            'leagues_archiveYears',
            'Seasons listed',
            'Most recent first, current season included.',
            { defaultValue: '3' }
          ),
        ],
      },
    ],
    '/standings'
  ),
  competition(
    'standings',
    'Standings',
    'The league table, its podium, the conference race and the playoff cut.',
    [
      {
        label: 'Hero',
        fields: [
          f('standings_eyebrow', 'Eyebrow', 'Use {season} for the selected season.', {
            defaultValue: 'League Table · Season {season}',
          }),
          f('standings_title', 'Page title', '', { defaultValue: 'Standings' }),
        ],
      },
      {
        label: 'Table',
        fields: [
          f('standings_columns', 'Columns', 'Left to right after rank, team and conference.', {
            type: 'list',
            addLabel: 'Add column',
            maxItems: 12,
            columns: [
              { key: 'code', label: 'Header', placeholder: 'PF', width: '.4fr' },
              { key: 'name', label: 'Means', placeholder: 'Points for', width: '1.6fr' },
            ],
            defaultValue:
              '[{"code":"P","name":"Played"},{"code":"W","name":"Won"},{"code":"D","name":"Drawn"},{"code":"L","name":"Lost"},{"code":"PF","name":"Points For"},{"code":"PA","name":"Points Against"},{"code":"Diff","name":"Differential"},{"code":"Pts","name":"Table Points"}]',
          }),
          f('standings_legend', 'Show legend', 'The column key printed under the table.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('standings_search', 'Team search', 'Filter box above the table.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('standings_tiebreak', 'Tiebreak note', 'How ties are ordered. Blank hides the note.', {
            type: 'area',
            defaultValue: 'Ties are broken by point differential, then points scored.',
          }),
        ],
      },
      {
        label: 'Podium & conference race',
        fields: [
          f(
            'standings_podium',
            'Top-three podium',
            'Three cards above the table; the leader renders dark.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f(
            'standings_conferenceRace',
            'Conference Race',
            'Mini top-three table per conference. Only shows when the League Season uses conferences and the view is Overall.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('standings_raceHeading', 'Race heading', '', { defaultValue: 'Conference Race' }),
          f(
            'standings_conferenceTabs',
            'Conference tabs',
            'Overall plus one pill per conference.',
            { type: 'toggle', defaultValue: 'true' }
          ),
        ],
      },
      {
        label: 'Playoffs',
        fields: [
          f(
            'standings_playoffLine',
            'Show cut line',
            'Rule across the table at the qualification cut.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f(
            'standings_playoffSpots',
            'Playoff spots',
            'Teams above this line qualify. Counted within the current view.',
            { defaultValue: '8' }
          ),
          f('standings_cutLabel', 'Cut line label', 'Use {n} for the number of spots.', {
            defaultValue: 'Playoff cutoff · Top {n}',
          }),
        ],
      },
    ]
  ),
  competition(
    'fixtures',
    'Fixtures',
    'Upcoming matches: how they are grouped, filtered and what each card shows.',
    [
      {
        label: 'Hero',
        fields: [
          f('fixtures_eyebrow', 'Eyebrow', 'Use {season} for the selected season.', {
            defaultValue: 'Match Calendar · Season {season}',
          }),
          f('fixtures_title', 'Page title', '', { defaultValue: 'Fixtures' }),
          f(
            'fixtures_browseRow',
            'Browse row',
            'Teams / Standings / Fixtures / Results shortcuts under the hero.',
            { type: 'toggle', defaultValue: 'true' }
          ),
        ],
      },
      {
        label: 'Controls',
        fields: [
          f(
            'fixtures_viewTabs',
            'Upcoming / Results toggle',
            'Switches this page between the two views.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('fixtures_leagueFilter', 'League filter', 'All / EBL / EWBL pills.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('fixtures_dayNav', 'Day stepper', 'Previous / next match day above the list.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('fixtures_horizon', 'Days ahead', 'How far into the schedule the public list runs.', {
            defaultValue: '30',
          }),
        ],
      },
      {
        label: 'Match cards',
        fields: [
          f('fixtures_venue', 'Show venue', 'Printed beside the tip-off time.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('fixtures_leagueTag', 'League tag', 'Small pill in the card header.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('fixtures_crests', 'Team crests', 'Falls back to initials when a club has no crest.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('fixtures_ics', 'Calendar export', 'Adds an .ics subscribe link per team.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
        ],
      },
      {
        label: 'Empty state',
        fields: [
          f('fixtures_emptyTitle', 'Heading', 'Shown when the filters return nothing.', {
            defaultValue: 'No upcoming fixtures',
          }),
          f('fixtures_emptyBody', 'Message', 'Shown when no league filter is applied.', {
            type: 'area',
            defaultValue:
              'The schedule for this season hasn’t been published yet. Check back soon.',
          }),
          f(
            'fixtures_emptyBodyFiltered',
            'Message · league filtered',
            'Use {league} for the selected league code.',
            { type: 'area', defaultValue: 'No {league} fixtures are scheduled right now.' }
          ),
        ],
      },
    ],
    '/upcoming-fixtures'
  ),
  competition(
    'results',
    'Results',
    'Completed matches and what links out of each row.',
    [
      {
        label: 'Hero',
        fields: [
          f('results_eyebrow', 'Eyebrow', 'Use {season} for the selected season.', {
            defaultValue: 'Final Scores · Season {season}',
          }),
          f('results_title', 'Page title', '', { defaultValue: 'Results' }),
        ],
      },
      {
        label: 'Listing',
        fields: [
          f('results_perPage', 'Results per page', '', { defaultValue: '20' }),
          f('results_groupBy', 'Group by', '', {
            type: 'select',
            options: ['Date', 'Round', 'Team'],
            defaultValue: 'Date',
          }),
          f('results_boxLink', 'Box score link', 'Each row opens the match page.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f(
            'results_winnerHighlight',
            'Highlight the winner',
            'Bolds the winning side and its score.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('results_leadersStrip', 'Top performers strip', 'Best line from each match night.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
        ],
      },
      {
        label: 'Empty state',
        fields: [
          f('results_emptyTitle', 'Heading', '', { defaultValue: 'No results yet' }),
          f('results_emptyBody', 'Message', '', {
            type: 'area',
            defaultValue:
              'Completed matches will appear here once games have been played this season.',
          }),
          f(
            'results_emptyBodyFiltered',
            'Message · league filtered',
            'Use {league} for the selected league code.',
            { type: 'area', defaultValue: 'No {league} results recorded yet for this season.' }
          ),
        ],
      },
    ],
    '/matches'
  ),
  competition(
    'match',
    'Match Page',
    'The single-match page: scoreboard, tabs and how live scoring reaches the public.',
    [
      {
        label: 'Tabs',
        fields: [
          f('match_tabs', 'Tabs', 'Shown in this order. The first is the default tab.', {
            type: 'list',
            addLabel: 'Add tab',
            maxItems: 3,
            columns: [{ key: 'label', label: 'Tab', placeholder: 'Box Score', width: '1fr' }],
            defaultValue: '[{"label":"Box Score"},{"label":"Play-by-Play"},{"label":"Timeline"}]',
          }),
          f('match_boxScore', 'Box score visibility', 'Who can open a full box score.', {
            type: 'select',
            options: ['Public', 'Signed-in users', 'Staff only'],
            defaultValue: 'Public',
          }),
          f('match_playRows', 'Plays per page', 'Before the “show more” step on Play-by-Play.', {
            defaultValue: '25',
          }),
        ],
      },
      {
        label: 'Scoreboard',
        fields: [
          f('match_quarters', 'Quarter breakdown', 'Per-quarter scores under the final line.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('match_lineups', 'Lineups', 'Starters and bench.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('match_video', 'Highlight embed', 'YouTube embed when a link is attached.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
        ],
      },
      {
        label: 'Live',
        fields: [
          f(
            'match_delay',
            'Live score delay (seconds)',
            'Buffer between the Live Console and the public page.',
            { defaultValue: '30' }
          ),
          f(
            'match_autoPublish',
            'Auto-publish finals',
            'Publishes when a scorer marks a match FINAL.',
            { type: 'toggle', defaultValue: 'false' }
          ),
          f(
            'match_liveBadge',
            'Live badge',
            'Shown on in-progress matches everywhere on the site.',
            { defaultValue: 'LIVE' }
          ),
        ],
      },
      {
        label: 'Sharing',
        fields: [
          f(
            'match_autoShareCards',
            'Auto share cards',
            'Generates a scoreboard-style share image per match, used when a match link is shared.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('match_shareWatermark', 'Card watermark', 'Printed at the bottom of the share image.', {
            defaultValue: 'ELEVATEBALLERS.COM',
          }),
          f(
            'match_shareLeagueFallback',
            'League fallback name',
            'Used on the share image when a match has no league name set.',
            { defaultValue: 'Elevate Basketball' }
          ),
        ],
      },
    ],
    '/matches'
  ),
  competition(
    'leaders',
    'Leaders',
    'Statistical leaderboards, their categories and the qualification rule.',
    [
      {
        label: 'Hero',
        fields: [
          f('leaders_eyebrow', 'Eyebrow', 'Use {season} for the selected season.', {
            defaultValue: 'Statistical Leaders · Season {season}',
          }),
          f('leaders_title', 'Page title', '', { defaultValue: 'League Leaders' }),
        ],
      },
      {
        label: 'Boards',
        fields: [
          f(
            'leaders_categories',
            'Categories',
            'Category pills, in this order. The first is selected on arrival.',
            {
              type: 'list',
              addLabel: 'Add category',
              maxItems: 6,
              columns: [
                { key: 'name', label: 'Category', placeholder: 'Points', width: '1fr' },
                { key: 'unit', label: 'Unit', placeholder: 'PPG', width: '.5fr' },
              ],
              defaultValue:
                '[{"name":"Points","unit":"PPG"},{"name":"Rebounds","unit":"RPG"},{"name":"Assists","unit":"APG"},{"name":"Steals","unit":"SPG"},{"name":"Blocks","unit":"BPG"},{"name":"3-Pointers","unit":"3PG"}]',
            }
          ),
          f('leaders_podium', 'Top-three podium', 'Cards above the full leaderboard.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('leaders_boardRows', 'Rows in the leaderboard', '', { defaultValue: '15' }),
          f('leaders_perGame', 'Per-game averages', 'Off shows season totals.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
        ],
      },
      {
        label: 'Qualification',
        fields: [
          f('leaders_minGames', 'Minimum games', 'Below this a player is not ranked.', {
            defaultValue: '3',
          }),
          f(
            'leaders_qualNote',
            'Qualification note',
            'Printed under the table. Use {n} for the minimum.',
            { defaultValue: 'Minimum {n} games to qualify' }
          ),
        ],
      },
    ],
    '/stats/leaders'
  ),
  competition(
    'registration',
    'Registration',
    'The public team and player registration page.',
    [
      {
        label: 'Hero',
        fields: [
          f('registration_eyebrow', 'Eyebrow', '', { defaultValue: 'Season 2026 · Sign-up open' }),
          f('registration_title', 'Headline', 'A line break controls the second line.', {
            type: 'area',
            defaultValue: '2026 League\nRegistration',
          }),
          f('registration_intro', 'Intro', '', {
            type: 'area',
            defaultValue:
              'Register your team or sign up as a player for the 2026 Elevate Ballers League season. Lock your spot on the Nairobi courts.',
          }),
          f(
            'registration_heroFacts',
            'Hero facts',
            'Three figures under the intro. “Team slots” is the capacity for the season.',
            {
              type: 'list',
              addLabel: 'Add fact',
              maxItems: 6,
              columns: [
                { key: 'big', label: 'Value', placeholder: 'Feb 28', width: '.5fr' },
                {
                  key: 'small',
                  label: 'Label',
                  placeholder: 'Registration closes',
                  width: '1.5fr',
                },
              ],
              defaultValue:
                '[{"big":"Feb 28","small":"Registration closes"},{"big":"Mar 14","small":"Season tip-off"},{"big":"24","small":"Team slots"}]',
            }
          ),
          f('registration_deadlines', 'Deadline chips', 'Dates shown under the intro.', {
            type: 'list',
            addLabel: 'Add date',
            maxItems: 8,
            columns: [
              { key: 'date', label: 'Date', placeholder: 'Mar 14', width: '.5fr' },
              { key: 'label', label: 'Milestone', placeholder: 'Season tip-off', width: '1.5fr' },
            ],
            defaultValue:
              '[{"date":"Jan 20","label":"Registration opens"},{"date":"Feb 28","label":"Entry deadline"},{"date":"Mar 07","label":"Fixtures released"},{"date":"Mar 14","label":"Season tip-off"}]',
          }),
        ],
      },
      {
        label: 'Window',
        fields: [
          f('registration_open', 'Registration open', 'Master switch for the public form.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f(
            'registration_opens',
            'Opens on',
            'ISO date. Drives the “Registration opens” chip and the open/closed switch.',
            { defaultValue: '2026-01-20' }
          ),
          f(
            'registration_closes',
            'Closes on',
            'ISO date. Must match the entry deadline shown in the hero facts and chips.',
            { defaultValue: '2026-02-28' }
          ),
          f(
            'registration_slots',
            'Team slots',
            'Season capacity, printed as the third hero fact.',
            { defaultValue: '24' }
          ),
          f(
            'registration_fee',
            'Entry fee (KES)',
            'Charged at the Confirm step. The form does not print an amount today.',
            { defaultValue: '25000' }
          ),
          f(
            'registration_approval',
            'Require admin approval',
            'New registrations start as pending.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f(
            'registration_playerMode',
            'Allow individual players',
            'Adds the player sign-up alongside team entry.',
            { type: 'toggle', defaultValue: 'true' }
          ),
        ],
      },
      {
        label: 'How it works',
        fields: [
          f('registration_stepsHeading', 'Panel heading', '', { defaultValue: 'How it works' }),
          f('registration_steps', 'Steps', 'Numbered automatically in the dark panel.', {
            type: 'list',
            addLabel: 'Add step',
            maxItems: 8,
            columns: [
              { key: 'title', label: 'Step', placeholder: 'Submit', width: '.6fr' },
              { key: 'desc', label: 'Description', placeholder: 'What happens', width: '1.8fr' },
            ],
            defaultValue:
              '[{"title":"Submit","desc":"Complete the team or player form with accurate contact details."},{"title":"Review","desc":"We verify eligibility and roster within 3 working days."},{"title":"Confirm","desc":"Pay the season fee and receive your fixtures and slot."}]',
          }),
        ],
      },
      {
        label: 'After submitting',
        fields: [
          f('registration_successTitle', 'Success heading', '', {
            defaultValue: "You're in the queue",
          }),
          f('registration_successBody', 'Success message', 'Use {mode} for “team” or “player”.', {
            type: 'area',
            defaultValue:
              'Thanks — your {mode} registration has been received. Our team reviews entries within 3 working days and will email you the outcome.',
          }),
          f('registration_closedTitle', 'Closed heading', '', {
            defaultValue: 'Registration is closed',
          }),
          f('registration_closedBody', 'Closed message', '', {
            type: 'area',
            defaultValue:
              'The 2026 window has closed. Join the waitlist and we’ll reach out the moment a spot or the 2027 window opens.',
          }),
        ],
      },
    ],
    '/league-registration'
  ),
  people(
    'team',
    'Team Page',
    'A club page: dark hero, about block, matches, squad and coaching staff.',
    [
      {
        label: 'Hero',
        fields: [
          f('team_leagueLine', 'League line', 'Competition name above the club name.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('team_coachLine', 'Head coach line', 'Printed under the club name.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('team_crest', 'Club crest', 'Falls back to initials when a club has none.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('team_heroStats', 'Record strip', 'Wins, losses and table position in the hero.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
        ],
      },
      {
        label: 'About the team',
        fields: [
          f('team_aboutBlock', 'Show block', 'Club blurb with an image beside it.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('team_aboutEyebrow', 'Eyebrow', '', { defaultValue: 'About the Team' }),
          f(
            'team_aboutFallback',
            'Fallback blurb',
            'Used when a club has written nothing. Use {team} for the club name.',
            {
              type: 'area',
              defaultValue:
                '{team} compete in the Elevate Ballers League. Squad, results and stats for the current season are below.',
            }
          ),
        ],
      },
      {
        label: 'Matches',
        fields: [
          f('team_recentHeading', 'Recent heading', '', { defaultValue: 'Recent Matches' }),
          f('team_upcomingHeading', 'Upcoming heading', '', { defaultValue: 'Upcoming Matches' }),
          f('team_matchRows', 'Matches per column', '', { defaultValue: '5' }),
          f(
            'team_seasonPicker',
            'Season picker',
            'Lets visitors read past League Seasons for this club.',
            { type: 'toggle', defaultValue: 'true' }
          ),
        ],
      },
      {
        label: 'Squad',
        fields: [
          f('team_squadHeading', 'Heading', '', { defaultValue: 'Squad' }),
          f('team_squadLayout', 'Layout', '', {
            type: 'select',
            options: ['Card grid', 'Table'],
            defaultValue: 'Card grid',
          }),
          f('team_positionFilter', 'Position filter', 'Pills above the squad.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('team_squadStat', 'Card stat', 'Figure shown on each player card.', {
            type: 'select',
            options: ['Points per game', 'Jersey number', 'Position', 'None'],
            defaultValue: 'Points per game',
          }),
          f('team_staffHeading', 'Coaching staff heading', 'Section under the squad.', {
            defaultValue: 'Coaching Staff',
          }),
        ],
      },
    ],
    '/teams'
  ),
  people('players', 'Players List', 'The public player directory.', [
    {
      label: 'Hero',
      fields: [
        f('players_eyebrow', 'Eyebrow', 'Use {season} for the selected season.', {
          defaultValue: 'The Players · Season {season}',
        }),
        f('players_title', 'Page title', '', { defaultValue: 'Players' }),
        f('players_totalLine', 'Total count', 'Player tally beside the title.', {
          type: 'toggle',
          defaultValue: 'true',
        }),
      ],
    },
    {
      label: 'Listing',
      fields: [
        f('players_searchPlaceholder', 'Search placeholder', '', {
          defaultValue: 'Search players…',
        }),
        f('players_perPage', 'Players per page', '', { defaultValue: '24' }),
        f('players_sort', 'Default sort', '', {
          type: 'select',
          options: ['Name', 'Points per game', 'Team', 'Jersey number'],
          defaultValue: 'Points per game',
        }),
        f('players_positionFilter', 'Position filter', '', {
          type: 'toggle',
          defaultValue: 'true',
        }),
        f('players_teamFilter', 'Team filter', '', { type: 'toggle', defaultValue: 'true' }),
        f('players_headshots', 'Show headshots', 'Falls back to initials.', {
          type: 'toggle',
          defaultValue: 'true',
        }),
      ],
    },
    {
      label: 'Empty state',
      fields: [
        f('players_emptyTitle', 'Heading', '', { defaultValue: 'No players found' }),
        f('players_emptyBody', 'Message · search', 'Use {q} for what the visitor typed.', {
          type: 'area',
          defaultValue: 'Nothing matches “{q}”. Try another name or team.',
        }),
        f(
          'players_emptyBodyFiltered',
          'Message · filtered',
          'Shown when filters, not a search, return nothing.',
          { type: 'area', defaultValue: 'No players match these filters. Try clearing them.' }
        ),
      ],
    },
  ]),
  people(
    'player',
    'Player Page',
    'An individual profile: dark hero, per-game splits, shooting breakdown and recent games.',
    [
      {
        label: 'Hero',
        fields: [
          f('player_teamChip', 'Team & league chip', 'Above the name.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f(
            'player_bioFacts',
            'Bio facts',
            'Row of facts under the name. A fact with no value for a player is hidden.',
            {
              type: 'list',
              addLabel: 'Add fact',
              maxItems: 8,
              columns: [{ key: 'label', label: 'Label', placeholder: 'Position', width: '1fr' }],
              defaultValue:
                '[{"label":"Position"},{"label":"Height"},{"label":"Age"},{"label":"Games"}]',
            }
          ),
          f('player_heroAverages', 'Hero averages', 'Season averages printed across the hero.', {
            type: 'list',
            addLabel: 'Add average',
            maxItems: 8,
            columns: [{ key: 'label', label: 'Stat', placeholder: 'Points', width: '1fr' }],
            defaultValue:
              '[{"label":"Points"},{"label":"Rebounds"},{"label":"Assists"},{"label":"Steals"},{"label":"FG"},{"label":"3PT"}]',
          }),
          f('player_headshot', 'Headshot', 'Falls back to initials.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
        ],
      },
      {
        label: 'Statistics',
        fields: [
          f('player_splits', 'Per-game splits', 'Season-by-season averages table.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('player_splitsHeading', 'Splits heading', '', { defaultValue: 'Per-Game Splits' }),
          f(
            'player_shooting',
            'Shooting breakdown',
            'Field-goal, three-point and free-throw split.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('player_gameLog', 'Recent games', 'Game-by-game log.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('player_logRows', 'Games listed', 'Before “show more”.', {
            type: 'number',
            defaultValue: '10',
          }),
        ],
      },
      {
        label: 'Profile',
        fields: [
          f('player_bio', 'Biography', 'Shown when the player has one.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('player_social', 'Social links', 'Only if the player supplied them.', {
            type: 'toggle',
            defaultValue: 'false',
          }),
          f('player_careerHigh', 'Career highs', 'Best single-game figures.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
        ],
      },
    ],
    '/players'
  ),
  people(
    'staff',
    'Staff',
    'League officials and volunteers, grouped by department.',
    [
      {
        label: 'Hero',
        fields: [
          f('staff_eyebrow', 'Eyebrow', '', { defaultValue: 'The People Behind the League' }),
          f('staff_title', 'Page title', '', { defaultValue: 'Our Staff' }),
          f('staff_intro', 'Intro', '', {
            type: 'area',
            defaultValue:
              'The organisers, officials, and volunteers who keep Elevate Ballers running — from tip-off to final buzzer, every match day of the season.',
          }),
        ],
      },
      {
        label: 'Leadership',
        fields: [
          f(
            'staff_leaders',
            'Show leadership',
            'Founder and operations lead, above the departments. These cards always show a bio.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('staff_leaderBadge', 'Card badge', 'Printed on each leadership card.', {
            defaultValue: 'Leadership',
          }),
        ],
      },
      {
        label: 'Directory',
        fields: [
          f('staff_groupByRole', 'Group by department', 'Otherwise one alphabetical grid.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f(
            'staff_departments',
            'Department order',
            'Sections appear in this order; anyone unassigned falls to the end.',
            {
              type: 'list',
              addLabel: 'Add department',
              maxItems: 12,
              columns: [
                {
                  key: 'name',
                  label: 'Department',
                  placeholder: 'League Management',
                  width: '1fr',
                },
              ],
              defaultValue:
                '[{"name":"League Management"},{"name":"Officiating"},{"name":"Operations & Media"}]',
            }
          ),
          f('staff_counts', 'Show counts', 'Number of people beside each department heading.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f(
            'staff_bios',
            'Show bios in departments',
            'Leadership cards always carry a bio; this controls the department cards.',
            { type: 'toggle', defaultValue: 'false' }
          ),
        ],
      },
      {
        label: 'Get involved',
        fields: [
          f('staff_recruitBlock', 'Show block', 'Dark recruitment card at the foot of the page.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('staff_recruitEyebrow', 'Eyebrow', '', { defaultValue: 'Get Involved' }),
          f('staff_recruitHeading', 'Heading', '', {
            defaultValue: 'Referee, score, or volunteer with us',
          }),
          f('staff_recruitBody', 'Paragraph', '', {
            type: 'area',
            defaultValue:
              "We're always looking for certified officials, table crew, and match-day volunteers. Join the team that runs Kenya's premier basketball league.",
          }),
          f('staff_recruitCta', 'Button', 'Points at the Officiating desk in Contact & Social.', {
            defaultValue: 'Get in touch',
          }),
        ],
      },
    ],
    '/staff'
  ),
  people(
    'staffMember',
    'Staff Profile',
    'An individual staff profile, opened from the Staff directory.',
    [
      {
        label: 'Hero',
        fields: [
          f('staffMember_roleEyebrow', 'Role eyebrow', 'Rule-flanked role above the name.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('staffMember_tagline', 'Tagline', 'One line under the name.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f(
            'staffMember_contactButtons',
            'Contact buttons',
            'Email and phone, shown only where the person has published them.',
            { type: 'toggle', defaultValue: 'true' }
          ),
        ],
      },
      {
        label: 'Sections',
        fields: [
          f('staffMember_aboutHeading', 'About heading', '', { defaultValue: 'About' }),
          f(
            'staffMember_dutiesHeading',
            'Responsibilities heading',
            'Two-column list. Hidden when the person has none.',
            { defaultValue: 'Responsibilities' }
          ),
          f(
            'staffMember_factsHeading',
            'Facts heading',
            'Three cards — years served, matches worked, department.',
            { defaultValue: 'At the League' }
          ),
          f('staffMember_backLink', 'Back link', 'Returns to the Staff directory.', {
            defaultValue: 'All staff',
          }),
        ],
      },
    ],
    '/staff'
  ),
  editorial(
    'news',
    'News List',
    'The article index: featured story, category filter, card grid and the sidebar.',
    [
      {
        label: 'Hero',
        fields: [
          f('news_eyebrow', 'Eyebrow', '', { defaultValue: 'From Around the League' }),
          f('news_title', 'Page title', '', { defaultValue: 'News' }),
          f('news_searchPlaceholder', 'Search placeholder', '', { defaultValue: 'Search news…' }),
        ],
      },
      {
        label: 'Featured story',
        fields: [
          f(
            'news_featured',
            'Show featured card',
            'Wide card above the grid. Only on page one with no search or category applied.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('news_featuredBadge', 'Badge', '', { defaultValue: 'Featured' }),
        ],
      },
      {
        label: 'Listing',
        fields: [
          f(
            'news_categories',
            'Categories',
            'Filter pills, in this order. “All” is added automatically.',
            {
              type: 'list',
              addLabel: 'Add category',
              maxItems: 16,
              columns: [
                { key: 'name', label: 'Category', placeholder: 'Match Report', width: '1fr' },
              ],
              defaultValue:
                '[{"name":"Match Report"},{"name":"Championships"},{"name":"Interviews"}]',
            }
          ),
          f('news_perPage', 'Articles per page', '', { type: 'number', defaultValue: '6' }),
          f('news_readTime', 'Read time on cards', 'Estimated from word count.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
        ],
      },
      {
        label: 'Sidebar',
        fields: [
          f('news_sidebarCategories', 'Category list', 'Counts per category.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('news_archives', 'Archive by month', '', { type: 'toggle', defaultValue: 'true' }),
          f(
            'news_newsletterCard',
            'Newsletter card',
            'Dark card in the sidebar. Emails land in Subscribers.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('news_newsletterHeading', 'Newsletter heading', '', { defaultValue: 'Newsletter' }),
          f('news_newsletterBlurb', 'Newsletter blurb', '', {
            defaultValue: 'Get the latest stories in your inbox.',
          }),
          f('news_newsletterButton', 'Newsletter button', '', { defaultValue: 'Subscribe' }),
        ],
      },
      {
        label: 'Empty state',
        fields: [
          f('news_emptyBody', 'Message · search', 'Use {q} for what the visitor typed.', {
            type: 'area',
            defaultValue: 'Nothing matches “{q}”. Try another search.',
          }),
          f(
            'news_emptyBodyCategory',
            'Message · category',
            'Shown when a category has no articles.',
            { type: 'area', defaultValue: 'No articles in this category yet — check back soon.' }
          ),
        ],
      },
    ],
    '/news'
  ),
  editorial(
    'article',
    'Article Page',
    'The reading experience: hero, body, tags, share buttons and comments.',
    [
      {
        label: 'Hero',
        fields: [
          f('article_categoryChip', 'Category chip', 'Red pill above the headline.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('article_standfirst', 'Standfirst', 'Large intro paragraph under the headline.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('article_author', 'Show author', '', { type: 'toggle', defaultValue: 'true' }),
          f('article_readTime', 'Show read time', 'Estimated from word count.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('article_heroImage', 'Featured image', 'Hidden when an article has none.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
        ],
      },
      {
        label: 'Body',
        fields: [
          f('article_tags', 'Tag list', 'Under the article body.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('article_share', 'Share buttons', 'Shown above and below the article.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('article_shareTargets', 'Share targets', 'In this order.', {
            type: 'list',
            addLabel: 'Add target',
            maxItems: 8,
            columns: [{ key: 'name', label: 'Target', placeholder: 'FB', width: '1fr' }],
            defaultValue: '[{"name":"FB"},{"name":"X"},{"name":"IG"},{"name":"in"}]',
          }),
        ],
      },
      {
        label: 'Comments',
        fields: [
          f('article_comments', 'Allow comments', 'Off hides the whole section.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('article_commentsHeading', 'Heading', 'The count is shown beside it.', {
            defaultValue: 'Comments',
          }),
          f('article_commentPlaceholder', 'Field placeholder', '', {
            defaultValue: 'Add a comment…',
          }),
          f('article_commentNote', 'Guideline note', 'Small print beside the button.', {
            defaultValue: 'Be respectful — comments are moderated.',
          }),
          f('article_commentButton', 'Button label', '', { defaultValue: 'Post Comment' }),
          f('article_moderation', 'Moderation', 'Where a new comment lands.', {
            type: 'select',
            options: ['Hold every comment', 'Publish, flag reports', 'Publish immediately'],
            defaultValue: 'Hold every comment',
          }),
          f('article_replies', 'Allow replies', 'One level deep.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
        ],
      },
    ],
    '/news'
  ),
  editorial(
    'potw',
    'Player of the Week',
    'The weekly spotlight shown on the homepage; it has no standalone page.',
    [
      {
        label: 'Feature',
        fields: [
          f('potw_eyebrow', 'Eyebrow', 'Red mono label above the name.', {
            defaultValue: 'Player of the Week',
          }),
          f('potw_photo', 'Photo', 'Falls back to a striped placeholder when the pick has none.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f(
            'potw_teamChip',
            'Team & jersey chip',
            'Red chip over the photo, e.g. “CBA Jets · #7”.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('potw_tagline', 'Tagline', 'The short shout under the name, e.g. “DYNAMITE.”', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('potw_quote', 'Write-up', 'Two paragraphs explaining the pick.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
        ],
      },
      {
        label: 'Stat line',
        fields: [
          f(
            'potw_showStats',
            'Show stats',
            'Figures from the winning week, across the foot of the block.',
            { type: 'toggle', defaultValue: 'true' }
          ),
          f('potw_stats', 'Stats shown', 'Three fit the row.', {
            type: 'list',
            addLabel: 'Add stat',
            maxItems: 8,
            columns: [{ key: 'label', label: 'Stat', placeholder: 'Points', width: '1fr' }],
            defaultValue: '[{"label":"Points"},{"label":"Threes"},{"label":"Assists"}]',
          }),
        ],
      },
      {
        label: 'Schedule',
        fields: [
          f('potw_day', 'Published on', 'When a new pick replaces the current one.', {
            type: 'select',
            options: ['Monday', 'Tuesday', 'Wednesday'],
            defaultValue: 'Monday',
          }),
          f(
            'potw_archive',
            'Past winners',
            'Not built on the public site yet — the CMS keeps the history.',
            { type: 'toggle', defaultValue: 'false' }
          ),
          f(
            'potw_profileLink',
            'Link to the player',
            'Not built yet — the block currently has no button or link out.',
            { type: 'toggle', defaultValue: 'false' }
          ),
        ],
      },
    ],
    '/'
  ),
];
