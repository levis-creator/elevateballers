import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getMatchWithFullDetails } from '../../../../features/cms/lib/queries';
import { MATCH_TIMEZONE } from '../../../../features/matches/domain/usecases/utils';

export const prerender = false;

const W = 1200;
const H = 630;

// Lazy-load fonts once per process. Satori needs raw font bytes per weight —
// variable fonts crash satori's bundled opentype parser, so we use static TTFs.
type LoadedFonts = {
  regular: Buffer;
  semibold: Buffer;
  bold: Buffer;
  extrabold: Buffer;
  black: Buffer;
};
let fontsCache: LoadedFonts | null = null;
async function loadFonts(): Promise<LoadedFonts> {
  if (fontsCache) return fontsCache;
  const here = dirname(fileURLToPath(import.meta.url));
  const baseCandidates = [
    join(here, '../../../../assets/fonts'),
    join(process.cwd(), 'src/assets/fonts'),
  ];
  for (const base of baseCandidates) {
    try {
      const [regular, semibold, bold, extrabold, black] = await Promise.all([
        readFile(join(base, 'Rubik-Regular.ttf')),
        readFile(join(base, 'Rubik-SemiBold.ttf')),
        readFile(join(base, 'Rubik-Bold.ttf')),
        readFile(join(base, 'Rubik-ExtraBold.ttf')),
        readFile(join(base, 'Rubik-Black.ttf')),
      ]);
      fontsCache = { regular, semibold, bold, extrabold, black };
      return fontsCache;
    } catch {
      // try next
    }
  }
  throw new Error('Rubik static font files not found in src/assets/fonts');
}

function formatDate(d: Date): string {
  return d
    .toLocaleDateString('en-US', {
      timeZone: MATCH_TIMEZONE,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    timeZone: MATCH_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Pick a roughly-fitting font size for variable-length team names — long
// names need to step down so they wrap to at most 2-3 lines inside their column.
function fitTeamFontSize(name: string): number {
  const len = name.length;
  if (len <= 12) return 56;
  if (len <= 18) return 46;
  if (len <= 26) return 38;
  return 32;
}

interface CardOpts {
  team1Name: string;
  team2Name: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  team1Score: number | null;
  team2Score: number | null;
  league: string;
  dateLine: string;
}

// One half of the scoreboard — team name + score stacked vertically.
// `winState` controls colour treatment: 'win' shows gold score,
// 'loss' shows muted score, 'tie'/'none' shows neutral.
function buildTeamColumn(
  name: string,
  score: number | null,
  showScore: boolean,
  scoreState: 'win' | 'loss' | 'lead' | 'trail' | 'tie' | 'none',
): any {
  const fontSize = fitTeamFontSize(name);
  // win = brightest gold, lead = gold (less glow), tie/trail = neutral white,
  // loss = muted gray. Loser only when COMPLETED — never during LIVE.
  const scoreColor =
    scoreState === 'win' || scoreState === 'lead'
      ? '#ffba00'
      : scoreState === 'loss'
        ? '#64748b'
        : '#e2e8f0';
  const scoreGlow =
    scoreState === 'win'
      ? '0 0 24px rgba(255, 186, 0, 0.4)'
      : 'none';

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: showScore ? 28 : 0,
        padding: '0 16px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize,
              fontWeight: 800,
              color: '#f8fafc',
              textTransform: 'uppercase',
              letterSpacing: 1,
              lineHeight: 1.05,
              textAlign: 'center',
              maxWidth: '100%',
            },
            children: name.toUpperCase(),
          },
        },
        ...(showScore
          ? [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: 150,
                    fontWeight: 900,
                    color: scoreColor,
                    lineHeight: 1,
                    letterSpacing: -3,
                    textShadow: scoreGlow,
                  },
                  children: String(score ?? 0),
                },
              },
            ]
          : []),
      ],
    },
  };
}

// Build the satori element tree (React-element shape, no JSX needed).
function buildCard(opts: CardOpts): any {
  const { team1Name, team2Name, status, team1Score, team2Score, league, dateLine } = opts;
  const showScore =
    (status === 'COMPLETED' || status === 'LIVE') &&
    team1Score != null &&
    team2Score != null;
  const isTie =
    showScore && team1Score === team2Score;
  // For COMPLETED: clear winner/loser. For LIVE: leader/trailer (still meaningful
  // but never marks anyone as a "loser"). For ties or no-score: neutral.
  const team1Lead =
    showScore && !isTie && (team1Score ?? 0) > (team2Score ?? 0);
  const team2Lead =
    showScore && !isTie && (team2Score ?? 0) > (team1Score ?? 0);
  type ScoreState = 'win' | 'loss' | 'lead' | 'trail' | 'tie' | 'none';
  const team1State: ScoreState = !showScore
    ? 'none'
    : isTie
      ? 'tie'
      : team1Lead
        ? status === 'COMPLETED'
          ? 'win'
          : 'lead'
        : status === 'COMPLETED'
          ? 'loss'
          : 'trail';
  const team2State: ScoreState = !showScore
    ? 'none'
    : isTie
      ? 'tie'
      : team2Lead
        ? status === 'COMPLETED'
          ? 'win'
          : 'lead'
        : status === 'COMPLETED'
          ? 'loss'
          : 'trail';

  const statusBadge =
    status === 'LIVE'
      ? {
          bg: '#ef4444',
          color: '#ffffff',
          label: 'LIVE',
          border: 'transparent',
          showDot: true,
        }
      : status === 'COMPLETED'
        ? {
            bg: 'rgba(16, 185, 129, 0.18)',
            color: '#34d399',
            label: 'FINAL',
            border: 'rgba(16, 185, 129, 0.5)',
            showDot: false,
          }
        : {
            bg: 'rgba(255, 186, 0, 0.15)',
            color: '#ffba00',
            label: 'UPCOMING',
            border: 'rgba(255, 186, 0, 0.5)',
            showDot: false,
          };

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#0f0d18',
        backgroundImage:
          'radial-gradient(circle at 50% 0%, rgba(255, 186, 0, 0.20) 0%, rgba(255, 186, 0, 0) 55%), linear-gradient(180deg, #0f0d18 0%, #14111f 100%)',
        fontFamily: 'Rubik',
        color: '#f8fafc',
        padding: '44px 72px',
        justifyContent: 'space-between',
      },
      children: [
        // League pill + date
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    padding: '10px 32px',
                    border: '1px solid rgba(255, 186, 0, 0.45)',
                    borderRadius: 9999,
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: '#ffba00',
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: 6,
                  },
                  children: league.toUpperCase(),
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    color: '#94a3b8',
                    fontSize: 20,
                    fontWeight: 600,
                    letterSpacing: 3,
                  },
                  children: dateLine,
                },
              },
            ],
          },
        },
        // Scoreboard row: team1 column | center divider | team2 column
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'stretch',
              justifyContent: 'space-between',
              flex: 1,
              width: '100%',
              padding: '8px 0',
            },
            children: [
              buildTeamColumn(team1Name, team1Score, showScore, team1State),
              // Center divider (vertical line + VS / dash glyph)
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    width: 4,
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          width: 1,
                          height: '60%',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        },
                        children: '',
                      },
                    },
                  ],
                },
              },
              buildTeamColumn(team2Name, team2Score, showScore, team2State),
            ],
          },
        },
        // Status badge + brand
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 24,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 28px',
                    backgroundColor: statusBadge.bg,
                    border: `1px solid ${statusBadge.border}`,
                    borderRadius: 9999,
                    color: statusBadge.color,
                    fontSize: 20,
                    fontWeight: 800,
                    letterSpacing: 4,
                  },
                  children: [
                    ...(statusBadge.showDot
                      ? [
                          {
                            type: 'div',
                            props: {
                              style: {
                                display: 'flex',
                                width: 10,
                                height: 10,
                                borderRadius: 9999,
                                backgroundColor: '#ffffff',
                              },
                              children: '',
                            },
                          },
                        ]
                      : []),
                    {
                      type: 'div',
                      props: {
                        style: { display: 'flex' },
                        children: statusBadge.label,
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    width: '100%',
                    height: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  },
                  children: '',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    color: '#ffba00',
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: 6,
                  },
                  children: 'ELEVATEBALLERS.COM',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) return new Response('Missing match id', { status: 400 });

  let match;
  try {
    match = await getMatchWithFullDetails(id);
  } catch (err) {
    console.error('OG image: failed to fetch match', err);
    return new Response('Failed to fetch match', { status: 500 });
  }

  if (!match) return new Response('Match not found', { status: 404 });

  const team1Name = match.team1Name || match.team1?.name || 'TBD';
  const team2Name = match.team2Name || match.team2?.name || 'TBD';
  const league = match.league?.name || match.leagueName || 'Elevate Basketball';
  const status = match.status as 'UPCOMING' | 'LIVE' | 'COMPLETED';
  const dateObj = match.date ? new Date(match.date) : null;
  const dateLine = dateObj ? `${formatDate(dateObj)} · ${formatTime(dateObj)}` : '';

  let png: Buffer;
  try {
    const fonts = await loadFonts();
    const svg = await satori(
      buildCard({
        team1Name,
        team2Name,
        status,
        team1Score: match.team1Score,
        team2Score: match.team2Score,
        league,
        dateLine,
      }),
      {
        width: W,
        height: H,
        fonts: [
          { name: 'Rubik', data: fonts.regular, weight: 400, style: 'normal' },
          { name: 'Rubik', data: fonts.semibold, weight: 600, style: 'normal' },
          { name: 'Rubik', data: fonts.bold, weight: 700, style: 'normal' },
          { name: 'Rubik', data: fonts.extrabold, weight: 800, style: 'normal' },
          { name: 'Rubik', data: fonts.black, weight: 900, style: 'normal' },
        ],
      },
    );

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: W },
    });
    png = resvg.render().asPng();
  } catch (err) {
    console.error('OG image: render failed', err);
    return new Response('Render failed', { status: 500 });
  }

  const cacheControl =
    status === 'COMPLETED'
      ? 'public, s-maxage=86400, max-age=3600, stale-while-revalidate=604800, immutable'
      : status === 'LIVE'
        ? 'public, s-maxage=30, stale-while-revalidate=120'
        : 'public, s-maxage=300, stale-while-revalidate=600';

  return new Response(new Uint8Array(png), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': cacheControl,
      'X-Robots-Tag': 'noindex',
    },
  });
};
