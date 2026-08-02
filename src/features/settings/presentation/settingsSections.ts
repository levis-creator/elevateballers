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
  type?: 'text' | 'area' | 'toggle' | 'select' | 'json' | 'image' | 'list';
  help?: string;
  placeholder?: string;
  options?: string[];
  defaultValue?: string;
  meta?: string;
  addLabel?: string;
  maxItems?: number;
  colorPreview?: boolean;
  counter?: number;
  columns?: Array<{ key: string; label: string; placeholder?: string; width?: string }>;
};

export type Group = { label: string; fields: Field[] };
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
            'Renders active sponsors from the Sponsors collection.',
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
          f('brand_siteName', 'Site name', 'Page titles, share cards and the alt text on the logo.', {
            defaultValue: 'Elevate Ballers',
          }),
          f('brand_tagline', 'Tagline', 'Right-hand line in the footer legal bar and the share card subtitle.', {
            defaultValue: 'Kenya’s Premier Basketball League',
          }),
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
          f('brand_paper', 'Paper', 'The light page background behind news, teams, standings and the nav.', {
            defaultValue: '#f5f3ef',
            colorPreview: true,
          }),
          f('brand_night', 'Night', 'The dark background used by the hero, footer and scoreboard blocks.', {
            defaultValue: '#0c0b0a',
            colorPreview: true,
          }),
          f('brand_ink', 'Ink', 'Body text on paper. Cream (#f3efe9) is used on night automatically.', {
            defaultValue: '#141009',
            colorPreview: true,
          }),
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
          f('brand_label', 'Label typeface', 'The small uppercase mono labels — eyebrows, column heads, timestamps.', {
            type: 'select',
            options: ['Space Mono', 'IBM Plex Mono'],
            defaultValue: 'Space Mono',
          }),
          f('brand_uppercaseHeadings', 'Uppercase headings', 'Off leaves headlines in sentence case.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
        ],
      },
      {
        label: 'Motion',
        fields: [
          f('brand_counters', 'Animated counters', 'The homepage stat rail counts up on first view.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('brand_heroArt', 'Hero court graphics', 'The spinning wireframe ball, arcs and halftone field in the hero.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('brand_reducedMotion', 'Respect reduced motion', 'Freezes the spin and counters for visitors who ask the OS for less motion.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
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
          f('seo_metaTitle', 'Home meta title', 'The homepage title and the fallback for pages with none.', {
            defaultValue: 'Elevate Ballers — Kenya Basketball League',
            counter: 60,
          }),
          f('seo_metaDescription', 'Meta description', 'Used when a page has none of its own.', {
            type: 'area',
            counter: 160,
            defaultValue:
              'Fixtures, live scores, standings and player stats for the Elevate Ballers men’s and women’s leagues.',
          }),
          f('seo_canonical', 'Canonical base URL', 'No trailing slash. Must match the public domain.', {
            defaultValue: 'https://elevateballers.com',
          }),
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
          f('seo_ogImage', 'Default share image', '1200 × 630. Used when a page has no image of its own.', {
            type: 'image',
            placeholder: 'Share image',
            meta: 'Recommended · 1200 × 630',
            defaultValue: '/media/general/og-default-2026.jpg',
          }),
          f('seo_autoCards', 'Auto match cards', 'Generates a share image with the scoreline and crests for match pages.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('seo_twitterHandle', 'X handle for cards', 'Attributed on shared links.', {
            defaultValue: '@elevateballers',
          }),
        ],
      },
      {
        label: 'Indexing & crawling',
        fields: [
          f('seo_indexing', 'Allow search indexing', 'Off writes a site-wide noindex — staging only.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('seo_sitemap', 'Generate sitemap.xml', 'Controls the dynamic public sitemap endpoint.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('seo_noindexPaths', 'Excluded paths', 'Kept out of the sitemap and marked noindex. * matches anything after it.', {
            type: 'list',
            addLabel: 'Add path',
            maxItems: 20,
            columns: [
              { key: 'path', label: 'Path', placeholder: '/admin/*', width: '1fr' },
              { key: 'why', label: 'Note', placeholder: 'Staff only', width: '1fr' },
            ],
            defaultValue:
              '[{"path":"/admin/*","why":"Staff only"},{"path":"/register/thanks","why":"Post-submit page"},{"path":"/search","why":"Duplicate of listings"}]',
          }),
          f('seo_schema', 'Sports structured data', 'SportsEvent, SportsTeam and Person markup for rich results.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
        ],
      },
      {
        label: 'Analytics',
        fields: [
          f('seo_analytics', 'Provider', 'Only loads after cookie consent is granted.', {
            type: 'select',
            options: ['None', 'Google Analytics 4', 'Plausible'],
            defaultValue: 'Plausible',
          }),
          f('seo_analyticsId', 'Site or measurement ID', '', {
            defaultValue: 'elevateballers.com',
          }),
          f('seo_verification', 'Verification codes', 'Rendered as ownership verification meta tags.', {
            type: 'list',
            addLabel: 'Add code',
            maxItems: 10,
            columns: [
              { key: 'provider', label: 'Provider', placeholder: 'Google', width: '0.6fr' },
              { key: 'token', label: 'Token', placeholder: 'Verification token', width: '1.4fr' },
            ],
            defaultValue: '[]',
          }),
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
          f('contact_email', 'Public email', 'Receives contact-form messages and prints in the footer.', { defaultValue: 'ballers@elevateballers.com' }),
          f('contact_phone', 'Phone numbers', 'Separate with “ · ”.', { defaultValue: '0703 913 923 · 0729 259 496' }),
          f('contact_address', 'Address', 'Line breaks are kept. Also the venue on the Contacts map card.', {
            type: 'area',
            defaultValue: 'Pepo Lane, off Dagoretti Road, Nairobi, Kenya',
          }),
          f('contact_hours', 'Opening hours', 'Printed in the footer and as the Hours row of the Visit Us card.', {
            defaultValue: 'Saturdays & Sundays · 8:00 AM – 6:00 PM',
          }),
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
          f('social_order', 'Button order', 'Comma-separated. Only accounts filled in above are rendered.', {
            defaultValue: 'FB, IG, YT, X',
          }),
        ],
      },
      {
        label: 'Desks & routing',
        fields: [
          f('contact_departmentList', 'Desks', 'Printed in the Contacts page Departments grid and used to route form topics. Multiples of three fill the grid evenly.', {
            type: 'list',
            addLabel: 'Add desk',
            maxItems: 12,
            columns: [
              { key: 'name', label: 'Desk', placeholder: 'Competition', width: '0.8fr' },
              { key: 'email', label: 'Email', placeholder: 'desk@elevateballers.com', width: '1.2fr' },
              { key: 'handles', label: 'Handles', placeholder: 'Fixtures, results, standings', width: '1.2fr' },
            ],
            defaultValue: '[{"name":"Competition","email":"competition@elevateballers.com","handles":"Fixtures, results, standings"},{"name":"Registration","email":"register@elevateballers.com","handles":"Team entries and transfers"},{"name":"Officiating","email":"referees@elevateballers.com","handles":"Referees and match reports"},{"name":"Media","email":"media@elevateballers.com","handles":"Press access and interviews"},{"name":"Partnerships","email":"partners@elevateballers.com","handles":"Sponsorship and events"},{"name":"Support","email":"ballers@elevateballers.com","handles":"Anything else"}]',
          }),
          f('contact_inbox', 'Default inbox', 'Where a message goes when its topic has no desk of its own.', {
            defaultValue: 'ballers@elevateballers.com',
          }),
          f('contact_notify', 'Notify the desk', 'Emails the desk as well as filing the message in Contact Messages.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('contact_responseTarget', 'Response promise', 'Printed on the Contacts page and in the auto-reply.', {
            defaultValue: 'within 48 hours',
          }),
        ],
      },
    ],
    '/contacts'
  ),
  siteWide(
    'consent',
    'Cookie Consent',
    'Cookie categories and the visitor controls shown on first visit.',
    [
      {
        label: 'Consent bar',
        fields: [
          f('consent_enabled', 'Show consent bar', 'Required while any analytics provider is set.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('consent_eyebrow', 'Eyebrow', 'Red mono label above the heading.', {
            defaultValue: 'We use cookies',
          }),
          f('consent_heading', 'Heading', 'Set in Anton at 30px.', {
            defaultValue: 'Game day, your way',
          }),
          f('consent_message', 'Message', 'Two sentences. The policy link is appended to the end.', {
            type: 'area',
            defaultValue: 'We use cookies to keep scores live, remember your favourite teams, and see which stories fans read most. Accept all to get the full experience.',
          }),
          f('consent_accept', 'Accept button', 'Red primary.', { defaultValue: 'Accept all' }),
          f('consent_reject', 'Reject button', 'Dark secondary. Keeps essential cookies only.', { defaultValue: 'Reject all' }),
          f('consent_manage', 'Manage button', 'Opens the preferences panel.', { defaultValue: 'Customise' }),
          f('consent_policyLabel', 'Policy link label', '', { defaultValue: 'Cookie Policy' }),
          f('consent_policy', 'Policy link', 'Path to the policy page.', { defaultValue: '/cookie-policy' }),
        ],
      },
      {
        label: 'Preferences panel',
        fields: [
          f('consent_prefsEyebrow', 'Panel eyebrow', '', { defaultValue: 'Cookie preferences' }),
          f('consent_prefsHeading', 'Panel heading', '', { defaultValue: 'Set your line-up' }),
          f('consent_essentialDesc', 'Essential row', 'Always listed first with its switch locked on.', {
            type: 'area',
            defaultValue: 'Keep the site running — page navigation, security, and remembering you got this far. These can’t be switched off.',
          }),
          f('consent_categories', 'Optional categories', 'Listed under Essential, each with its own switch.', {
            type: 'list',
            addLabel: 'Add category',
            columns: [
              { key: 'name', label: 'Category', placeholder: 'Match Stats', width: '0.7fr' },
              { key: 'desc', label: 'What it does', placeholder: 'Anonymous stats on what fans view', width: '1.3fr' },
            ],
            defaultValue: '[{"name":"Match Stats","desc":"Anonymous stats on which fixtures, players and stories fans view most, so we can improve the coverage."},{"name":"Your Line-up","desc":"Remember your favourite teams and preferences so standings and fixtures land the way you like them."},{"name":"Court-side Offers","desc":"Let us and select partners show you relevant tickets, merch and league promotions on and off the site."}]',
          }),
          f('consent_saveLabel', 'Save button', 'Red primary in the panel.', { defaultValue: 'Save my choices' }),
          f('consent_reopen', 'Cookie settings button', 'Lets a visitor reopen the panel after deciding.', {
            type: 'toggle',
            defaultValue: 'true',
          }),
          f('consent_remember', 'Remember for (days)', 'How long before a visitor is asked again.', {
            defaultValue: '180',
          }),
        ],
      },
    ]
  ),
  siteWide('system', 'System Pages', 'Operational defaults that affect the public experience.', [
    {
      label: 'Defaults',
      fields: [
        f('system_timezone', 'Timezone', '', {
          type: 'select',
          options: ['Africa/Nairobi', 'UTC', 'Europe/London'],
          defaultValue: 'Africa/Nairobi',
        }),
        f(
          'system_maintenance',
          'Maintenance mode',
          'Keep the public site read-only while maintenance is underway.',
          { type: 'toggle', defaultValue: 'false' }
        ),
      ],
    },
  ]),
  pages(
    'home',
    'Homepage',
    'Every block on the homepage, in the order it appears.',
    [
      {
        label: 'Intro block',
        fields: [
          f('home_eyebrow', 'Eyebrow', '', { defaultValue: 'Kenya basketball' }),
          f('home_heading', 'Heading', '', {
            type: 'area',
            defaultValue: 'Your home for the game we live for',
          }),
          f('home_body', 'Intro paragraph', '', { type: 'area' }),
        ],
      },
      {
        label: 'Homepage blocks',
        fields: [
          f('home_statRailItems', 'Counters', 'One JSON object per line.', { type: 'json' }),
          f('home_fixturesBlock', 'Fixtures block', '', { type: 'toggle', defaultValue: 'true' }),
        ],
      },
    ],
    '/'
  ),
  pages('about', 'About', 'Every block on the About page, in the order it appears.', [
    {
      label: 'Page copy',
      fields: [
        f('about_eyebrow', 'Eyebrow'),
        f('about_heading', 'Heading', '', { type: 'area' }),
        f('about_body', 'Paragraph', '', { type: 'area' }),
        f('about_values', 'Values', 'One JSON object per line.', { type: 'json' }),
      ],
    },
  ]),
  pages('rules', 'Rules', 'Competition rules shown publicly and linked from registration.', [
    {
      label: 'Rules page',
      fields: [
        f('rules_title', 'Page title'),
        f('rules_body', 'Summary', '', { type: 'area' }),
        f('rules_pdf', 'PDF download', '', {
          type: 'text',
          placeholder: '/media/documents/rules-2026.pdf',
        }),
      ],
    },
  ]),
  pages(
    'contactPage',
    'Contacts Page',
    'Copy and blocks on the public Contacts page.',
    [
      {
        label: 'Page copy',
        fields: [
          f('contactPage_title', 'Page title', '', { defaultValue: 'Contacts' }),
          f('contactPage_intro', 'Intro', '', { type: 'area' }),
          f('contactPage_featuredImage', 'Featured image', '', { type: 'text' }),
        ],
      },
    ],
    '/contacts'
  ),
  competition(
    'leagues',
    'Leagues',
    'Directory headings and supporting copy for the league directory.',
    [
      {
        label: 'Directory',
        fields: [
          f('leagues_title', 'Page title'),
          f('leagues_intro', 'Intro', '', { type: 'area' }),
        ],
      },
    ]
  ),
  competition('standings', 'Standings', 'Headings and empty-state copy for standings.', [
    {
      label: 'Standings',
      fields: [
        f('standings_title', 'Page title'),
        f('standings_empty', 'Empty message', '', { type: 'area' }),
      ],
    },
  ]),
  competition('fixtures', 'Fixtures', 'Upcoming fixture headings and empty states.', [
    {
      label: 'Fixtures',
      fields: [
        f('fixtures_title', 'Page title'),
        f('fixtures_empty', 'Empty message', '', { type: 'area' }),
      ],
    },
  ]),
  competition('results', 'Results', 'Results page headings and empty states.', [
    {
      label: 'Results',
      fields: [
        f('results_title', 'Page title'),
        f('results_empty', 'Empty message', '', { type: 'area' }),
      ],
    },
  ]),
  competition('match', 'Match Page', 'Match detail labels and sharing copy.', [
    {
      label: 'Match detail',
      fields: [
        f('match_title', 'Page title'),
        f('match_shareText', 'Share text', '', { type: 'area' }),
      ],
    },
  ]),
  competition('leaders', 'Leaders', 'Stat leader headings and explanatory copy.', [
    {
      label: 'Leaders',
      fields: [f('leaders_title', 'Page title'), f('leaders_intro', 'Intro', '', { type: 'area' })],
    },
  ]),
  competition(
    'registration',
    'Registration',
    'Registration window copy and closed-state behavior.',
    [
      {
        label: 'Registration',
        fields: [
          f('registration_openLabel', 'Open label'),
          f('registration_closedLabel', 'Closed label'),
          f('registration_closedBody', 'Closed message', '', { type: 'area' }),
          f('registration_showClosed', 'Show closed state', '', {
            type: 'toggle',
            defaultValue: 'false',
          }),
        ],
      },
    ],
    '/register'
  ),
  people(
    'team',
    'Team Page',
    'Team directory headings and empty states.',
    [
      {
        label: 'Directory',
        fields: [
          f('team_title', 'Page title'),
          f('team_empty', 'Empty message', '', { type: 'area' }),
        ],
      },
    ],
    '/teams'
  ),
  people('players', 'Players List', 'Player directory headings and filters.', [
    {
      label: 'Directory',
      fields: [f('players_title', 'Page title'), f('players_intro', 'Intro', '', { type: 'area' })],
    },
  ]),
  people('player', 'Player Page', 'Player profile labels and supporting copy.', [
    {
      label: 'Profile',
      fields: [f('player_statsLabel', 'Stats label'), f('player_matchesLabel', 'Matches label')],
    },
  ]),
  people('staff', 'Staff', 'Staff directory headings and supporting copy.', [
    {
      label: 'Directory',
      fields: [f('staff_title', 'Page title'), f('staff_intro', 'Intro', '', { type: 'area' })],
    },
  ]),
  people('staffMember', 'Staff Profile', 'Staff profile labels.', [
    {
      label: 'Profile',
      fields: [
        f('staffMember_title', 'Page title'),
        f('staffMember_contactLabel', 'Contact label'),
      ],
    },
  ]),
  editorial('news', 'News List', 'News listing headings and filters.', [
    {
      label: 'Listing',
      fields: [f('news_title', 'Page title'), f('news_intro', 'Intro', '', { type: 'area' })],
    },
  ]),
  editorial('article', 'Article Page', 'Article detail labels and sharing copy.', [
    {
      label: 'Article',
      fields: [
        f('article_shareText', 'Share text', '', { type: 'area' }),
        f('article_relatedLabel', 'Related label'),
      ],
    },
  ]),
  editorial('potw', 'Player of the Week', 'Player of the Week headings and supporting copy.', [
    {
      label: 'Highlight',
      fields: [f('potw_title', 'Page title'), f('potw_intro', 'Intro', '', { type: 'area' })],
    },
  ]),
];
