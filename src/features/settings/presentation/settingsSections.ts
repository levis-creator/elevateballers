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
  siteWide('footer', 'Footer', 'The footer logo, links, contact visibility and legal strip.', [
    {
      label: 'Footer content',
      fields: [
        f('footer_logo', 'Footer logo', '', {
          type: 'text',
          placeholder: '/media/general/elevate-logo.png',
        }),
        f('footer_tagline', 'Tagline', '', { defaultValue: "Kenya's Premier Basketball League" }),
        f('footer_links', 'Footer links', 'One JSON object per line: label and path.', {
          type: 'json',
        }),
      ],
    },
    {
      label: 'Visibility',
      fields: [
        f('footer_showContact', 'Show contact details', '', {
          type: 'toggle',
          defaultValue: 'true',
        }),
        f('footer_socialRow', 'Social buttons', '', { type: 'toggle', defaultValue: 'true' }),
      ],
    },
  ]),
  siteWide('brand', 'Brand & Theme', 'Colors and visual language used across the public site.', [
    {
      label: 'Palette',
      fields: [
        f('brand_accent', 'Accent', '', { type: 'text', defaultValue: '#e4002b' }),
        f('brand_night', 'Night', '', { type: 'text', defaultValue: '#0c0b0a' }),
        f('brand_surface', 'Surface', '', { type: 'text', defaultValue: '#111010' }),
      ],
    },
  ]),
  siteWide(
    'seo',
    'SEO & Sharing',
    'Search titles, descriptions, social previews and index rules.',
    [
      {
        label: 'Search appearance',
        fields: [
          f('seo_metaTitle', 'Home meta title', '', {
            defaultValue: 'Elevate Ballers — Kenya Basketball League',
          }),
          f('seo_metaDescription', 'Meta description', '', { type: 'area' }),
          f('seo_ogImage', 'Social sharing image', '', {
            type: 'text',
            placeholder: '/media/general/og.jpg',
          }),
        ],
      },
      {
        label: 'Indexing',
        fields: [
          f('seo_noindexPaths', 'Excluded paths', 'One path per line. Wildcards are supported.', {
            type: 'json',
            defaultValue: '[{"path":"/admin/*","why":"Staff only"}]',
          }),
        ],
      },
    ]
  ),
  siteWide(
    'contact',
    'Contact & Social',
    'The single source for public contact details and social accounts.',
    [
      {
        label: 'Contact',
        fields: [
          f('contact_email', 'Public email', '', { defaultValue: 'ballers@elevateballers.com' }),
          f('contact_phone', 'Phone', '', { defaultValue: '0703913923' }),
          f('contact_address', 'Address', '', {
            type: 'area',
            defaultValue: 'Pepo Lane, off Dagoretti Road, Nairobi, Kenya',
          }),
          f('contact_hours', 'Opening hours', '', {
            defaultValue: 'Saturdays & Sundays · 8:00 AM – 6:00 PM',
          }),
        ],
      },
      {
        label: 'Social accounts',
        fields: [
          f('social_facebook', 'Facebook URL', '', {
            defaultValue: 'https://www.facebook.com/Elevateballers',
          }),
          f('social_instagram', 'Instagram URL', '', {
            defaultValue: 'https://www.instagram.com/elevateballers/',
          }),
          f('social_twitter', 'X / Twitter URL'),
          f('social_youtube', 'YouTube URL'),
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
        label: 'Cookie panel',
        fields: [
          f('consent_essentialDesc', 'Essential row', '', {
            type: 'area',
            defaultValue:
              'Keep the site running — navigation, security and remembering your choices.',
          }),
          f('consent_reopen', 'Cookie settings button', '', {
            type: 'toggle',
            defaultValue: 'true',
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
