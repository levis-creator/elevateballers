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
  type?: 'text' | 'area' | 'toggle' | 'select' | 'json' | 'image' | 'file' | 'list';
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
  siteWide('system', 'System Pages', 'Error, redirect and loading states, plus the site-wide maintenance switch.', [
    {
      label: '404',
      fields: [
        f('system_notFoundEyebrow', 'Eyebrow', 'Rule-flanked mono label above the headline.', { defaultValue: 'Error 404' }),
        f('system_notFoundTitle', 'Headline', 'Set in Anton at up to 150px.', { defaultValue: 'Airball', counter: 14 }),
        f('system_notFoundAccent', 'Accent letters', 'The part of the headline set in the brand colour.', { defaultValue: 'ball' }),
        f('system_notFoundBody', 'Body', 'Offer a way back.', {
          type: 'area',
          defaultValue: 'That shot missed everything — the page you’re looking for isn’t on the court. It may have been moved, renamed, or never existed.',
        }),
        f('system_notFoundLinks', 'Suggested links', 'The first row is the primary button; the rest are secondary links.', {
          type: 'list', addLabel: 'Add link', maxItems: 8,
          columns: [
            { key: 'label', label: 'Label', placeholder: 'Back to Home', width: '1fr' },
            { key: 'path', label: 'Path', placeholder: '/', width: '1fr' },
          ],
          defaultValue: '[{"label":"Back to Home","path":"/"},{"label":"View Fixtures","path":"/fixtures"},{"label":"Standings","path":"/standings"}]',
        }),
      ],
    },
    {
      label: '302 redirect',
      fields: [
        f('system_redirectEyebrow', 'Eyebrow', 'Rule-flanked mono label.', { defaultValue: 'Page moved' }),
        f('system_redirectTitle', 'Headline', 'Set in Anton at up to 110px.', { defaultValue: 'Redirecting', counter: 16 }),
        f('system_redirectBody', 'Body', 'Use {countdown} for the live seconds remaining.', { type: 'area', defaultValue: 'This page has a new home. We’re taking you there now — you’ll arrive in {countdown}.' }),
        f('system_redirectSeconds', 'Countdown (seconds)', 'Also drives the ring animation. 0 redirects immediately.', { defaultValue: '5' }),
        f('system_redirectCta', 'Primary button', 'Jumps straight to the destination.', { defaultValue: 'Go There Now →' }),
        f('system_redirectFallback', 'Fallback note', 'Small print under the buttons.', { defaultValue: 'Not redirected automatically? Use the button above.' }),
        f('system_redirectLinks', 'Quick links', 'Links along the foot of the redirect page.', {
          type: 'list', addLabel: 'Add link', maxItems: 8,
          columns: [
            { key: 'label', label: 'Label', placeholder: 'Fixtures', width: '1fr' },
            { key: 'path', label: 'Path', placeholder: '/fixtures', width: '1fr' },
          ],
          defaultValue: '[{"label":"Home","path":"/"},{"label":"Teams","path":"/teams"},{"label":"Standings","path":"/standings"},{"label":"Fixtures","path":"/fixtures"},{"label":"News","path":"/news"}]',
        }),
      ],
    },
    {
      label: 'Loading',
      fields: [
        f('system_loadingLabel', 'Splash label', 'Beside the animated dots on the full-screen boot splash.', { defaultValue: 'Loading' }),
        f('system_loadingLines', 'Status lines', 'Cycled under the splash label while the app boots.', {
          type: 'list', addLabel: 'Add line', maxItems: 8,
          columns: [{ key: 'line', label: 'Line', placeholder: 'Loading standings', width: '1fr' }],
          defaultValue: '[{"line":"Tipping off…"},{"line":"Loading standings"},{"line":"Fetching fixtures"},{"line":"Warming up the court"}]',
        }),
        f('system_splashThreshold', 'Splash after (ms)', 'Below this, pages load without flashing the splash.', { defaultValue: '400' }),
        f('system_skeletons', 'Skeleton placeholders', 'Region-level shimmer for lists, tables and detail heroes.', { type: 'toggle', defaultValue: 'true' }),
      ],
    },
    {
      label: 'Maintenance',
      fields: [
        f('system_maintenance', 'Maintenance mode', 'Public site shows the notice below. Admin stays reachable.', { type: 'toggle', defaultValue: 'false' }),
        f('system_maintenanceMsg', 'Maintenance message', '', { type: 'area', defaultValue: 'We’re updating results from last night’s games. Back shortly.' }),
      ],
    },
  ]),
  pages(
    'home',
    'Homepage',
    'The blocks under the masthead and the order visitors meet them in.',
    [
      {
        label: 'Hero',
        fields: [
          f('home_pill', 'Live pill', 'Mono label with the pulsing red dot. Blank hides the pill.', { defaultValue: 'Season 2026 · Live now' }),
          f('home_heading', 'Headline', 'Set in Anton at up to 128px. A line break controls where the second line starts.', { type: 'area', defaultValue: 'Elevate\nyour game', counter: 34 }),
          f('home_accentWord', 'Accent word', 'This word in the headline is set in the brand colour.', { defaultValue: 'game' }),
          f('home_body', 'Intro paragraph', 'Two sentences maximum.', { type: 'area', defaultValue: 'Nairobi’s own basketball league — born on the city’s courts, built for its players. Live matches, standings, and rising stars from Kenya’s capital, all season long.' }),
          f('home_ctaLabel', 'Primary button', 'Blank hides the button.', { defaultValue: 'Register Team' }),
          f('home_ctaHref', 'Primary link', '', { defaultValue: '/register' }),
          f('home_ctaLabel2', 'Secondary button', '', { defaultValue: 'View Standings' }),
          f('home_ctaHref2', 'Secondary link', '', { defaultValue: '/standings' }),
        ],
      },
      {
        label: 'Hero background',
        fields: [
          f('home_heroMedia', 'Background', 'Video autoplays muted and looped; the court pattern is the no-media fallback.', { type: 'select', options: ['Drone video', 'Court pattern', 'Still image'], defaultValue: 'Drone video' }),
          f('home_heroVideo', 'Video URL', 'MP4 in the Media Library. Used as the image URL for Still image.', { defaultValue: '/media/general/nairobi-courts-loop.mp4' }),
          f('home_heroDim', 'Dim percent', 'Darkening over the media. Below 60 usually fails contrast.', { defaultValue: '78' }),
          f('home_ghostWord', 'Ghost word', 'Oversized outlined word behind the hero. Blank hides it.', { defaultValue: 'Nairobi' }),
        ],
      },
      {
        label: 'Stat rail',
        fields: [
          f('home_statRail', 'Show stat rail', 'Counters under the hero copy.', { type: 'toggle', defaultValue: 'true' }),
          f('home_statRailItems', 'Counters', 'Counts are read live from the current League Season.', { type: 'list', addLabel: 'Add counter', maxItems: 8, columns: [
            { key: 'label', label: 'Label', placeholder: 'Teams', width: '1fr' }, { key: 'source', label: 'Counts', placeholder: 'Registered teams', width: '1.2fr' },
          ], defaultValue: '[{"label":"Teams","source":"Registered teams"},{"label":"Players","source":"Registered players"},{"label":"Matches Played","source":"Matches marked final"}]' }),
          f('home_countUp', 'Count up on load', 'Numbers animate from zero the first time they scroll into view.', { type: 'toggle', defaultValue: 'true' }),
        ],
      },
      {
        label: 'News ticker',
        fields: [
          f('home_ticker', 'Show ticker', 'The scrolling strip under the hero.', { type: 'toggle', defaultValue: 'true' }),
          f('home_tickerLabel', 'Ticker label', 'Dark chip at the head of the strip.', { defaultValue: 'Elevate News' }),
          f('home_tickerSource', 'Items', 'What scrolls past.', { type: 'select', options: ['Latest headlines', 'Latest results', 'Headlines and results'], defaultValue: 'Headlines and results' }),
          f('home_tickerSpeed', 'Loop seconds', 'One full pass. Higher is slower.', { defaultValue: '40' }),
        ],
      },
      {
        label: 'Fixtures & results',
        fields: [
          f('home_fixturesBlock', 'Show block', 'Two columns: upcoming matches and recent results.', { type: 'toggle', defaultValue: 'true' }),
          f('home_fixturesHeading', 'Left heading', '', { defaultValue: 'Upcoming Matches' }),
          f('home_resultsHeading', 'Right heading', '', { defaultValue: 'Recent Results' }),
          f('home_fixturesCount', 'Rows per column', 'Same count for both sides.', { defaultValue: '4' }),
          f('home_emptyFixtures', 'No fixtures message', 'Shown between seasons.', { defaultValue: 'No matches scheduled — the next round drops soon.' }),
        ],
      },
      { label: 'Player of the Week', fields: [f('home_potw', 'Show spotlight', 'Its copy and stats are edited in Editorial › Player of the Week.', { type: 'toggle', defaultValue: 'true' })] },
      {
        label: 'Latest news', fields: [
          f('home_newsBlock', 'Show block', '', { type: 'toggle', defaultValue: 'true' }), f('home_newsEyebrow', 'Eyebrow', '', { defaultValue: 'From around the league' }),
          f('home_newsHeading', 'Heading', '', { defaultValue: 'Latest News' }), f('home_newsCount', 'Cards shown', 'Before the load-more step.', { defaultValue: '6' }),
          f('home_newsFilters', 'Category chips', 'Filter row beside the heading.', { type: 'toggle', defaultValue: 'true' }),
        ],
      },
      {
        label: 'Leaders & numbers', fields: [
          f('home_leadersBlock', 'Show block', 'League Leaders beside By The Numbers.', { type: 'toggle', defaultValue: 'true' }),
          f('home_leadersHeading', 'Leaders heading', '', { defaultValue: 'League Leaders' }), f('home_numbersHeading', 'Numbers heading', '', { defaultValue: 'By The Numbers' }),
          f('home_leadersRows', 'Players per board', '', { defaultValue: '5' }),
        ],
      },
      {
        label: 'Featured media', fields: [
          f('home_mediaBlock', 'Show block', 'Hidden automatically when the library has nothing tagged featured.', { type: 'toggle', defaultValue: 'true' }),
          f('home_mediaEyebrow', 'Eyebrow', '', { defaultValue: 'Visual highlights from across the league' }), f('home_mediaHeading', 'Heading', '', { defaultValue: 'Featured Media' }),
          f('home_mediaCount', 'Items shown', '', { defaultValue: '6' }),
        ],
      },
      {
        label: 'About block', fields: [
          f('home_aboutBlock', 'Show block', 'Centred white section above the register call-to-action.', { type: 'toggle', defaultValue: 'true' }),
          f('home_aboutEyebrow', 'Eyebrow', '', { defaultValue: 'Welcome to Elevate Ballers' }), f('home_aboutHeading', 'Heading', 'A line break splits it over two lines.', { type: 'area', defaultValue: 'Your home for the game\nwe live for' }),
          f('home_aboutBody', 'Paragraph', '', { type: 'area', defaultValue: 'The official home of Kenya’s premier basketball league. Follow every game, every team, and every player. Standings update after every match, and the Player of the Week highlights one standout performance.' }),
        ],
      },
      {
        label: 'Register call-to-action', fields: [
          f('home_ctaBlock', 'Show block', 'The full-width brand band at the foot of the page.', { type: 'toggle', defaultValue: 'true' }),
          f('home_ctaOpenEyebrow', 'Open · eyebrow', 'Shown while registration is open.', { defaultValue: 'Registration Open' }), f('home_ctaOpenHeading', 'Open · heading', '', { type: 'area', defaultValue: 'Register to\njoin the league' }),
          f('home_ctaOpenBody', 'Open · paragraph', '', { type: 'area', defaultValue: 'Be part of Elevate Ballers. Tryouts run throughout the year for late entries — sign up your team or yourself today.' }),
          f('home_ctaClosedEyebrow', 'Closed · eyebrow', 'Swaps in automatically once the registration window shuts.', { defaultValue: 'Registration Closed' }), f('home_ctaClosedHeading', 'Closed · heading', '', { type: 'area', defaultValue: '2026 entries\nare closed' }),
          f('home_ctaClosedBody', 'Closed · paragraph', '', { type: 'area', defaultValue: 'The season is underway. Tryouts still run year-round for late entries — join the waitlist and we’ll reach out the moment a spot or the 2027 window opens.' }),
          f('home_ctaClosedLabel', 'Closed · button', '', { defaultValue: 'Join the Waitlist →' }),
        ],
      },
    ],
    '/'
  ),
  pages('about', 'About', 'Every block on the About page, in the order it appears.', [
    { label: 'Hero', fields: [
      f('about_eyebrow', 'Eyebrow', 'Rule-flanked mono label.', { defaultValue: 'About the Club' }), f('about_title', 'Headline', 'A line break controls the second line.', { type: 'area', defaultValue: 'Built for the\nlove of the game' }),
      f('about_accentWord', 'Accent word', 'This word is set in the brand colour.', { defaultValue: 'game' }), f('about_intro', 'Intro paragraph', '', { type: 'area', defaultValue: 'Elevate Ballers is Kenya’s home for competitive basketball — a community league in Nairobi where clubs, players, and fans come together every week to compete, grow, and celebrate the game.' }),
    ] },
    { label: 'Stat strip', fields: [
      f('about_statStrip', 'Show strip', 'Four figures across the band under the hero.', { type: 'toggle', defaultValue: 'true' }),
      f('about_stats', 'Figures', 'Leave a value blank to read a matching live count.', { type: 'list', addLabel: 'Add figure', maxItems: 8, columns: [{ key: 'value', label: 'Value', placeholder: '24', width: '.5fr' }, { key: 'label', label: 'Label', placeholder: 'Teams', width: '1fr' }, { key: 'accent', label: 'Red?', placeholder: 'yes / no', width: '.4fr' }], defaultValue: '[{"value":"24","label":"Teams","accent":"yes"},{"value":"370+","label":"Players","accent":"no"},{"value":"2","label":"Leagues","accent":"no"},{"value":"2024","label":"Founded","accent":"yes"}]' }),
    ] },
    { label: 'Our story', fields: [
      f('about_storyBlock', 'Show block', '', { type: 'toggle', defaultValue: 'true' }), f('about_storyEyebrow', 'Eyebrow', '', { defaultValue: 'Our Story' }), f('about_storyHeading', 'Heading', '', { type: 'area', defaultValue: 'From a weekend\nrun to a league' }),
      f('about_storyImage', 'Story image', '4:3. A striped placeholder shows until one is uploaded.', { type: 'image' }), f('about_storyBody', 'Body', 'Blank lines separate paragraphs.', { type: 'area', defaultValue: "What started as a handful of friends looking for organised, competitive hoops has grown into one of Nairobi's most active basketball communities. Elevate Ballers was founded to give players a real stage — proper fixtures, standings that matter, and the structure to turn casual runs into a genuine season.\n\nToday the league runs two competitions side by side — the Elevate Basketball League (EBL) and the Elevate Women's Basketball League (EWBL) — bringing together school teams, academies, corporate sides, and community teams from across the city.\n\nEvery week, standings update after each game, a Player of the Week is crowned, and the next generation of Kenyan talent gets the reps, the competition, and the spotlight they deserve." }),
    ] },
    { label: 'The leagues', fields: [
      f('about_leaguesBlock', 'Show block', 'Two cards, one per permanent league.', { type: 'toggle', defaultValue: 'true' }), f('about_leaguesEyebrow', 'Eyebrow', '', { defaultValue: 'Two Leagues, One Community' }), f('about_leaguesHeading', 'Heading', '', { defaultValue: 'Where everyone plays' }),
      f('about_leagueCards', 'Cards', 'The first card renders dark, the second light.', { type: 'list', addLabel: 'Add card', maxItems: 8, columns: [{ key: 'abbr', label: 'Tag', placeholder: 'EBL', width: '.45fr' }, { key: 'title', label: 'Title', placeholder: "Men's League", width: '.8fr' }, { key: 'body', label: 'Blurb', placeholder: 'What the league is', width: '1.8fr' }, { key: 'teams', label: 'Teams', placeholder: '16', width: '.35fr' }, { key: 'players', label: 'Players', placeholder: '240+', width: '.4fr' }], defaultValue: '[{"abbr":"EBL","title":"Men\'s League","body":"The Elevate Basketball League brings together the city\'s top men\'s teams, academies, and community sides in weekly competitive play.","teams":"16","players":"240+"},{"abbr":"EWBL","title":"Women\'s League","body":"The Elevate Women\'s Basketball League gives women\'s teams a dedicated, competitive stage — from school programs to established teams.","teams":"8","players":"130+"}]' }),
    ] },
    { label: 'Values', fields: [
      f('about_valuesBlock', 'Show block', 'Four numbered cards.', { type: 'toggle', defaultValue: 'true' }), f('about_valuesEyebrow', 'Eyebrow', '', { defaultValue: 'What We Stand For' }), f('about_valuesHeading', 'Heading', '', { defaultValue: 'Our values' }),
      f('about_values', 'Values', 'Four fill the row.', { type: 'list', addLabel: 'Add value', maxItems: 8, columns: [{ key: 'num', label: 'No.', placeholder: '01', width: '.3fr' }, { key: 'title', label: 'Value', placeholder: 'Community', width: '.7fr' }, { key: 'body', label: 'Description', placeholder: 'What it means in practice', width: '1.8fr' }], defaultValue: '[{"num":"01","title":"Community","body":"It starts with belonging — a welcoming home in Nairobi for players, families, and fans of every level."},{"num":"02","title":"Development","body":"From that community we build players — competition, coaching, and reps that turn raw potential into real growth."},{"num":"03","title":"Excellence","body":"Real fixtures, real standings, real stakes — a relentless commitment to raising the standard of Kenyan basketball."},{"num":"04","title":"Integrity","body":"Clear rules, consistent officiating, and respect on and off the court — earned every single game."}]' }),
    ] },
    { label: 'Community impact', fields: [
      f('about_impactBlock', 'Show block', '', { type: 'toggle', defaultValue: 'true' }), f('about_impactEyebrow', 'Eyebrow', '', { defaultValue: 'More Than a League' }), f('about_impactHeading', 'Heading', '', { defaultValue: 'Community impact' }),
      f('about_impactBody', 'Paragraph', '', { type: 'area', defaultValue: 'Basketball is the reason we gather, but the impact runs deeper. Elevate Ballers exists to open doors — giving young players across Nairobi a safe, structured, and inspiring place to grow, on and off the court.' }),
      f('about_impactStats', 'Impact figures', 'Four numbers above the programme cards.', { type: 'list', addLabel: 'Add figure', maxItems: 8, columns: [{ key: 'value', label: 'Value', placeholder: '1,200+', width: '.5fr' }, { key: 'label', label: 'Label', placeholder: 'Youth reached', width: '1fr' }, { key: 'accent', label: 'Red?', placeholder: 'yes / no', width: '.4fr' }], defaultValue: '[{"value":"1,200+","label":"Youth reached","accent":"yes"},{"value":"18","label":"Partner schools","accent":"no"},{"value":"100%","label":"Free to attend","accent":"no"},{"value":"3","label":"Courts refurbished","accent":"yes"}]' }),
      f('about_impactItems', 'Programmes', 'Three cards fill the row.', { type: 'list', addLabel: 'Add programme', maxItems: 8, columns: [{ key: 'title', label: 'Programme', placeholder: 'Youth Clinics', width: '.8fr' }, { key: 'body', label: 'Description', placeholder: 'What it does', width: '1.8fr' }], defaultValue: '[{"title":"Youth Clinics","body":"Free weekend skills clinics run by our coaches and players, bringing structured training to neighbourhoods that rarely get it."},{"title":"Girls in the Game","body":"The EWBL and our schools program create a dedicated pathway for young women to compete, lead, and be seen on a real stage."},{"title":"Courts for the City","body":"We partner with local groups to refurbish public courts — leaving every community we play in with a better place to hoop."}]' }),
    ] },
    { label: 'Partnerships', fields: [
      f('about_partnerBlock', 'Show block', 'Dark card inviting sponsors.', { type: 'toggle', defaultValue: 'true' }), f('about_partnerEyebrow', 'Eyebrow', '', { defaultValue: 'Partner With Us' }), f('about_partnerHeading', 'Heading', '', { defaultValue: 'Grow the game together' }),
      f('about_partnerBody', 'Paragraph', '', { type: 'area', defaultValue: 'Brands, schools, and community organisations power what we do. If you want to reach Nairobi’s basketball community and invest in the game, let’s talk.' }), f('about_partnerCta', 'Button', 'Points at the Partnerships desk in Contact & Social.', { defaultValue: 'Become a Partner →' }),
    ] },
    { label: 'Timeline', fields: [
      f('about_timeline', 'Show timeline', 'Vertical list of milestones.', { type: 'toggle', defaultValue: 'true' }), f('about_timelineEyebrow', 'Eyebrow', '', { defaultValue: 'The Journey' }), f('about_timelineHeading', 'Heading', '', { defaultValue: 'How we got here' }),
      f('about_milestones', 'Milestones', 'Oldest first.', { type: 'list', addLabel: 'Add milestone', maxItems: 12, columns: [{ key: 'year', label: 'Year', placeholder: '2024', width: '.35fr' }, { key: 'title', label: 'Title', placeholder: 'The First Tip-Off', width: '.9fr' }, { key: 'body', label: 'Description', placeholder: 'What happened', width: '1.8fr' }], defaultValue: '[{"year":"2024","title":"The First Tip-Off","body":"Elevate Ballers launches with a handful of clubs and a shared love of the game."},{"year":"2025","title":"The Women\'s League Arrives","body":"The EWBL is founded, opening a dedicated stage for women’s basketball."},{"year":"2025","title":"Standings Go Live","body":"Weekly standings, Player of the Week, and league stats become part of every matchday."},{"year":"2026","title":"A Growing Community","body":"Two leagues, 24 clubs, and 370+ players competing across Nairobi."}]' }),
    ] },
    { label: 'Leadership', fields: [
      f('about_staffGrid', 'Show leadership', 'Reads from League Staff, ordered by role.', { type: 'toggle', defaultValue: 'true' }), f('about_staffEyebrow', 'Eyebrow', '', { defaultValue: 'The People' }), f('about_staffHeading', 'Heading', '', { defaultValue: 'Leadership' }),
      f('about_staffBody', 'Paragraph', '', { type: 'area', defaultValue: 'Meet the directors, operations leads, officials, and volunteers who run Elevate Ballers every match day — from tip-off to final buzzer.' }), f('about_staffCta', 'Button', 'Links to the Staff page.', { defaultValue: 'Meet the Team →' }),
    ] },
    { label: 'Venue', fields: [
      f('about_venueBlock', 'Show block', 'Address and hours print from Contact & Social.', { type: 'toggle', defaultValue: 'true' }), f('about_venueEyebrow', 'Eyebrow', '', { defaultValue: 'Home Court' }), f('about_venueHeading', 'Heading', '', { type: 'area', defaultValue: 'Come support\nlocal talent' }),
      f('about_venueBody', 'Paragraph', '', { type: 'area', defaultValue: 'Come support local talent and be part of the community. Our home base sits off Dagoretti Road in Nairobi, with fixtures across the city each weekend.' }), f('about_venueImage', 'Venue image', '4:3 or wider. A striped placeholder shows until one is uploaded.', { type: 'image' }),
    ] },
    { label: 'Closing call-to-action', fields: [
      f('about_ctaBlock', 'Show block', 'Brand band at the foot of the page.', { type: 'toggle', defaultValue: 'true' }), f('about_ctaHeading', 'Heading', '', { defaultValue: 'Be part of it' }), f('about_ctaBody', 'Paragraph', '', { type: 'area', defaultValue: 'Register a team, join as a player, or just come support. There’s a place for everyone at Elevate Ballers.' }),
      f('about_ctaButtons', 'Buttons', 'The first is solid dark; the rest are outlined.', { type: 'list', addLabel: 'Add button', maxItems: 8, columns: [{ key: 'label', label: 'Label', placeholder: 'Register →', width: '1fr' }, { key: 'path', label: 'Link', placeholder: '/register', width: '1fr' }], defaultValue: '[{"label":"Register →","path":"/#register"},{"label":"Browse Teams","path":"/teams"}]' }),
    ] },
  ]),
  pages('rules', 'Rules', 'Every block on the Rules page, in the order it appears — including the full rule text.', [
    { label: 'Hero', fields: [
      f('rules_eyebrow', 'Eyebrow', 'Rule-flanked mono label above the title.', { defaultValue: 'Official Rules & Regulations · 2026' }),
      f('rules_title', 'Page title', 'Set in Anton at up to 120px. One word works best.', { defaultValue: 'Rules', counter: 14 }),
      f('rules_intro', 'Intro', 'State the effective date and the rule set it derives from.', { type: 'area', defaultValue: 'The official rules and regulations governing Elevate Ballers play. Valid as of 1 January 2026, based on FIBA Official Basketball Rules 2024 with league-specific amendments.' }),
    ] },
    { label: 'Rulebook download', fields: [
      f('rules_pdf', 'Rulebook file', 'Upload the signed PDF. Replacing it updates every public rulebook link.', { type: 'file', placeholder: 'PDF up to 25 MB', defaultValue: '/documents/elevate-ballers-league-rules-2026.pdf' }),
      f('rules_pdfLabel', 'Button label', 'The solid brand button beside the title.', { defaultValue: '↓ Download Full Rulebook' }),
    ] },
    { label: 'Quick reference', fields: [
      f('rules_quickRef', 'Show cards', 'The strip of headline numbers above the first section.', { type: 'toggle', defaultValue: 'true' }),
      f('rules_quickRefCards', 'Cards', 'Four fill the row; two per row on mobile.', { type: 'list', addLabel: 'Add card', maxItems: 8, columns: [{ key: 'value', label: 'Value', placeholder: '4×10', width: '.7fr' }, { key: 'label', label: 'Label', placeholder: 'Minute quarters', width: '1fr' }], defaultValue: JSON.stringify(RULES_DEFAULTS.quickRef) }),
    ] },
    { label: 'Sections', fields: [
      f('rules_sections', 'Rule sections', 'Order controls page order and generated numbering. Changing an anchor breaks existing deep links.', { type: 'list', addLabel: 'Add section', maxItems: 16, columns: [{ key: 'title', label: 'Title', placeholder: 'Game Procedures', width: '1fr' }, { key: 'id', label: 'Anchor', placeholder: 'game', width: '.6fr' }], defaultValue: JSON.stringify(RULES_DEFAULTS.sections.map(({ title, id }) => ({ title, id }))) }),
      f('rules_clauseTags', 'Show clause numbers', 'The mono tag printed beside each clause title.', { type: 'toggle', defaultValue: 'true' }),
    ] },
    { label: 'Rule text', fields: [
      f('rules_clauses', 'Clauses', 'Full published rule text. Set Section to an anchor from Rule sections.', { type: 'list', addLabel: 'Add clause', maxItems: 80, columns: [{ key: 'section', label: 'Section', placeholder: 'game', width: '.55fr' }, { key: 'tag', label: 'Tag', placeholder: '5.1', width: '.35fr' }, { key: 'title', label: 'Title', placeholder: 'Playing Time', width: '.8fr' }, { key: 'body', label: 'Rule text', placeholder: 'Full published clause', width: '2fr' }], defaultValue: JSON.stringify(RULES_DEFAULTS.sections.flatMap((section) => section.rules.map((rule) => ({ section: section.id, ...rule })))) }),
    ] },
    { label: 'Contents sidebar', fields: [
      f('rules_contents', 'Show sidebar', 'Sticky section list on the left. Hidden below 960px.', { type: 'toggle', defaultValue: 'true' }),
      f('rules_contentsHeading', 'Heading', '', { defaultValue: 'On this page' }),
      f('rules_helpCard', 'Questions card', 'The card under the section list.', { type: 'toggle', defaultValue: 'true' }),
      f('rules_helpHeading', 'Card heading', '', { defaultValue: 'Questions?' }),
      f('rules_helpBody', 'Card body', 'One line.', { defaultValue: 'Reach the competitions desk for clarifications.' }),
      f('rules_helpLinkLabel', 'Card link', '', { defaultValue: 'Contact us →' }),
      f('rules_helpLinkPath', 'Card link target', '', { defaultValue: '/contacts' }),
    ] },
  ]),
  pages(
    'contactPage',
    'Contacts Page',
    'Copy and blocks on the public Contacts page.',
    [
      {
        label: 'Hero',
        fields: [
          f('contactPage_eyebrow', 'Eyebrow', 'Brand mono label above the title.', { defaultValue: 'Get in Touch' }),
          f('contactPage_title', 'Page title', 'Set in Anton at up to 120px.', { defaultValue: 'Contacts', counter: 18 }),
          f('contactPage_intro', 'Intro', 'Two sentences maximum.', { type: 'area', defaultValue: 'Questions about fixtures, registration, transfers, or officiating? Reach the right desk below, or send us a message and we’ll get back to you.' }),
        ],
      },
      { label: 'Quick contact cards', fields: [
        f('contactPage_quickCards', 'Show cards', 'The row of tap-to-act cards under the hero.', { type: 'toggle', defaultValue: 'true' }),
        f('contactPage_quickCardList', 'Cards', 'Value accepts {phone}, {email}, and {address}.', { type: 'list', addLabel: 'Add card', maxItems: 8, columns: [{ key: 'icon', label: 'Icon', placeholder: '✆', width: '.35fr' }, { key: 'label', label: 'Label', placeholder: 'Call us', width: '.8fr' }, { key: 'value', label: 'Value', placeholder: '{phone}', width: '1fr' }, { key: 'action', label: 'Action', placeholder: 'Call now', width: '.7fr' }, { key: 'href', label: 'Link', placeholder: 'tel:+254703913923', width: '1fr' }], defaultValue: '[{"icon":"✆","label":"Call us","value":"{phone}","action":"Call now","href":"tel:+254703913923"},{"icon":"✉","label":"Email","value":"{email}","action":"Send email","href":"mailto:ballers@elevateballers.com"},{"icon":"⌂","label":"Visit","value":"{address}","action":"Get directions","href":""}]' }),
      ] },
      { label: 'Message form', fields: [
        f('contactPage_form', 'Show form', 'Submissions land in Contact Messages.', { type: 'toggle', defaultValue: 'true' }),
        f('contactPage_formTitle', 'Form heading', '', { defaultValue: 'Send a message' }),
        f('contactPage_formBlurb', 'Form blurb', 'Use {response} for the promise set in Contact & Social.', { defaultValue: 'Fill in the form and the right team will get back to you, usually {response}.' }),
        f('contactPage_topics', 'Topic options', 'Each topic routes to a desk from Contact & Social.', { type: 'list', addLabel: 'Add topic', maxItems: 16, columns: [{ key: 'topic', label: 'Topic', placeholder: 'Registration', width: '1fr' }, { key: 'desk', label: 'Routes to desk', placeholder: 'Registration', width: '1fr' }], defaultValue: '[{"topic":"General enquiry","desk":"General"},{"topic":"Team registration","desk":"Registration"},{"topic":"Player transfer","desk":"Transfers"},{"topic":"Fixtures & scheduling","desk":"Fixtures & Results"},{"topic":"Officiating & protests","desk":"Officiating"},{"topic":"Media & partnerships","desk":"Media & Partnerships"}]' }),
        f('contactPage_teamField', 'Team field', 'Optional Team input beside the sender’s name.', { type: 'toggle', defaultValue: 'true' }),
        f('contactPage_requirePhone', 'Require phone', 'Off leaves the phone field optional.', { type: 'toggle', defaultValue: 'false' }),
        f('contactPage_submitLabel', 'Submit label', '', { defaultValue: 'Send Message' }),
        f('contactPage_successMsg', 'Success message', 'Replaces the form after a send. Use {response}.', { defaultValue: 'Message received. We’ll be in touch {response}.' }),
        f('contactPage_autoReply', 'Auto-reply', 'Emailed to the sender. Blank sends nothing. Use {response}.', { type: 'area', defaultValue: 'Thanks — we’ve got your message and will come back to you {response}.' }),
      ] },
      { label: 'Sidebar', fields: [
        f('contactPage_visitCard', 'Visit Us card', 'Address, hours, phone and email from Contact & Social.', { type: 'toggle', defaultValue: 'true' }),
        f('contactPage_visitHeading', 'Visit card heading', '', { defaultValue: 'Visit Us' }),
        f('contactPage_socialCard', 'Follow the League card', 'Dark card with social buttons.', { type: 'toggle', defaultValue: 'true' }),
        f('contactPage_map', 'Venue map', 'A striped placeholder shows until a map image is configured.', { type: 'toggle', defaultValue: 'true' }),
      ] },
      { label: 'Departments', fields: [
        f('contactPage_departments', 'Show departments', 'Three-column grid of desks at the foot of the page.', { type: 'toggle', defaultValue: 'true' }),
        f('contactPage_departmentsEyebrow', 'Eyebrow', '', { defaultValue: 'Reach the Right Desk' }),
        f('contactPage_departmentsHeading', 'Heading', 'The desks are edited once in Contact & Social.', { defaultValue: 'Departments' }),
      ] },
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
          f('leagues_names', 'Leagues', 'The code tags match cards; the full name is the competition filter pill on Standings and the league line in the match header.', { type: 'list', addLabel: 'Add league', maxItems: 8, columns: [{ key: 'code', label: 'Code', placeholder: 'EBL', width: '.4fr' }, { key: 'name', label: 'Full name', placeholder: 'Elevate Ballers League (EBL)', width: '1.6fr' }], defaultValue: '[{"code":"EBL","name":"Elevate Ballers League (EBL)"},{"code":"EWBL","name":"Elevate Women\'s Basketball League (EWBL)"}]' }),
          f('leagues_defaultLeague', 'Default league', 'What a first-time visitor sees selected.', { type: 'select', options: ['EBL', 'EWBL', 'Remember last choice'], defaultValue: 'Remember last choice' }),
          f('leagues_allLabel', '“All leagues” label', 'The pill that clears the league filter. Blank forces a league to always be chosen.', { defaultValue: 'All Leagues' }),
        ],
      },
      {
        label: 'Season picker',
        fields: [
          f('leagues_archive', 'Season archive', 'Lets visitors open completed League Seasons from the dropdown.', { type: 'toggle', defaultValue: 'true' }),
          f('leagues_seasonLabel', 'Dropdown suffix', 'Appended to each year in the picker.', { defaultValue: 'Season' }),
          f('leagues_archiveYears', 'Seasons listed', 'Most recent first, current season included.', { defaultValue: '3' }),
        ],
      },
    ],
    '/standings'
  ),
  competition('standings', 'Standings', 'The league table, its podium, the conference race and the playoff cut.', [
    {
      label: 'Hero',
      fields: [
        f('standings_eyebrow', 'Eyebrow', 'Use {season} for the selected season.', { defaultValue: 'League Table · Season {season}' }),
        f('standings_title', 'Page title', '', { defaultValue: 'Standings' }),
      ],
    },
    { label: 'Table', fields: [
      f('standings_columns', 'Columns', 'Left to right after rank, team and conference.', { type: 'list', addLabel: 'Add column', maxItems: 12, columns: [{ key: 'code', label: 'Header', placeholder: 'PF', width: '.4fr' }, { key: 'name', label: 'Means', placeholder: 'Points for', width: '1.6fr' }], defaultValue: '[{"code":"P","name":"Played"},{"code":"W","name":"Won"},{"code":"D","name":"Drawn"},{"code":"L","name":"Lost"},{"code":"PF","name":"Points For"},{"code":"PA","name":"Points Against"},{"code":"Diff","name":"Differential"},{"code":"Pts","name":"Table Points"}]' }),
      f('standings_legend', 'Show legend', 'The column key printed under the table.', { type: 'toggle', defaultValue: 'true' }),
      f('standings_search', 'Team search', 'Filter box above the table.', { type: 'toggle', defaultValue: 'true' }),
      f('standings_tiebreak', 'Tiebreak note', 'How ties are ordered. Blank hides the note.', { type: 'area', defaultValue: 'Ties are broken by point differential, then points scored.' }),
    ] },
    { label: 'Podium & conference race', fields: [
      f('standings_podium', 'Top-three podium', 'Three cards above the table; the leader renders dark.', { type: 'toggle', defaultValue: 'true' }),
      f('standings_conferenceRace', 'Conference Race', 'Mini top-three table per conference. Only shows when the League Season uses conferences and the view is Overall.', { type: 'toggle', defaultValue: 'true' }),
      f('standings_raceHeading', 'Race heading', '', { defaultValue: 'Conference Race' }),
      f('standings_conferenceTabs', 'Conference tabs', 'Overall plus one pill per conference.', { type: 'toggle', defaultValue: 'true' }),
    ] },
    { label: 'Playoffs', fields: [
      f('standings_playoffLine', 'Show cut line', 'Rule across the table at the qualification cut.', { type: 'toggle', defaultValue: 'true' }),
      f('standings_playoffSpots', 'Playoff spots', 'Teams above this line qualify. Counted within the current view.', { defaultValue: '8' }),
      f('standings_cutLabel', 'Cut line label', 'Use {n} for the number of spots.', { defaultValue: 'Playoff cutoff · Top {n}' }),
    ] },
  ]),
  competition('fixtures', 'Fixtures', 'Upcoming matches: how they are grouped, filtered and what each card shows.', [
    { label: 'Hero', fields: [
      f('fixtures_eyebrow', 'Eyebrow', 'Use {season} for the selected season.', { defaultValue: 'Match Calendar · Season {season}' }),
      f('fixtures_title', 'Page title', '', { defaultValue: 'Fixtures' }),
      f('fixtures_browseRow', 'Browse row', 'Teams / Standings / Fixtures / Results shortcuts under the hero.', { type: 'toggle', defaultValue: 'true' }),
    ] },
    { label: 'Controls', fields: [
      f('fixtures_viewTabs', 'Upcoming / Results toggle', 'Switches this page between the two views.', { type: 'toggle', defaultValue: 'true' }),
      f('fixtures_leagueFilter', 'League filter', 'All / EBL / EWBL pills.', { type: 'toggle', defaultValue: 'true' }),
      f('fixtures_dayNav', 'Day stepper', 'Previous / next match day above the list.', { type: 'toggle', defaultValue: 'true' }),
      f('fixtures_horizon', 'Days ahead', 'How far into the schedule the public list runs.', { defaultValue: '30' }),
    ] },
    { label: 'Match cards', fields: [
      f('fixtures_venue', 'Show venue', 'Printed beside the tip-off time.', { type: 'toggle', defaultValue: 'true' }),
      f('fixtures_leagueTag', 'League tag', 'Small pill in the card header.', { type: 'toggle', defaultValue: 'true' }),
      f('fixtures_crests', 'Team crests', 'Falls back to initials when a club has no crest.', { type: 'toggle', defaultValue: 'true' }),
      f('fixtures_ics', 'Calendar export', 'Adds an .ics subscribe link per team.', { type: 'toggle', defaultValue: 'true' }),
    ] },
    { label: 'Empty state', fields: [
      f('fixtures_emptyTitle', 'Heading', 'Shown when the filters return nothing.', { defaultValue: 'No upcoming fixtures' }),
      f('fixtures_emptyBody', 'Message', 'Shown when no league filter is applied.', { type: 'area', defaultValue: 'The schedule for this season hasn’t been published yet. Check back soon.' }),
      f('fixtures_emptyBodyFiltered', 'Message · league filtered', 'Use {league} for the selected league code.', { type: 'area', defaultValue: 'No {league} fixtures are scheduled right now.' }),
    ] },
  ], '/upcoming-fixtures'),
  competition('results', 'Results', 'Completed matches and what links out of each row.', [
    { label: 'Hero', fields: [
      f('results_eyebrow', 'Eyebrow', 'Use {season} for the selected season.', { defaultValue: 'Final Scores · Season {season}' }),
      f('results_title', 'Page title', '', { defaultValue: 'Results' }),
    ] },
    { label: 'Listing', fields: [
      f('results_perPage', 'Results per page', '', { defaultValue: '20' }),
      f('results_groupBy', 'Group by', '', { type: 'select', options: ['Date', 'Round', 'Team'], defaultValue: 'Date' }),
      f('results_boxLink', 'Box score link', 'Each row opens the match page.', { type: 'toggle', defaultValue: 'true' }),
      f('results_winnerHighlight', 'Highlight the winner', 'Bolds the winning side and its score.', { type: 'toggle', defaultValue: 'true' }),
      f('results_leadersStrip', 'Top performers strip', 'Best line from each match night.', { type: 'toggle', defaultValue: 'true' }),
    ] },
    { label: 'Empty state', fields: [
      f('results_emptyTitle', 'Heading', '', { defaultValue: 'No results yet' }),
      f('results_emptyBody', 'Message', '', { type: 'area', defaultValue: 'Completed matches will appear here once games have been played this season.' }),
      f('results_emptyBodyFiltered', 'Message · league filtered', 'Use {league} for the selected league code.', { type: 'area', defaultValue: 'No {league} results recorded yet for this season.' }),
    ] },
  ], '/matches'),
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
