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

// Pick a roughly-fitting font size for variable-length team names.
function fitTeamFontSize(name: string): number {
  const len = name.length;
  if (len <= 10) return 64;
  if (len <= 16) return 52;
  if (len <= 22) return 42;
  return 34;
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

// Build the satori element tree (React-element shape, no JSX needed).
function buildCard(opts: CardOpts): any {
  const { team1Name, team2Name, status, team1Score, team2Score, league, dateLine } = opts;
  const showScore =
    status === 'COMPLETED' && team1Score != null && team2Score != null;
  const t1FontSize = fitTeamFontSize(team1Name);
  const t2FontSize = fitTeamFontSize(team2Name);

  const statusBadge =
    status === 'LIVE'
      ? {
          bg: '#ef4444',
          color: '#ffffff',
          label: '● LIVE',
          border: 'transparent',
        }
      : status === 'COMPLETED'
        ? {
            bg: 'rgba(16, 185, 129, 0.18)',
            color: '#34d399',
            label: 'FINAL',
            border: 'rgba(16, 185, 129, 0.5)',
          }
        : {
            bg: 'rgba(255, 186, 0, 0.15)',
            color: '#ffba00',
            label: 'UPCOMING',
            border: 'rgba(255, 186, 0, 0.5)',
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
          'radial-gradient(circle at 50% 0%, rgba(255, 186, 0, 0.18) 0%, rgba(255, 186, 0, 0) 60%), linear-gradient(180deg, #0f0d18 0%, #14111f 100%)',
        fontFamily: 'Rubik',
        color: '#f8fafc',
        padding: '50px 80px',
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
              gap: 24,
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
                    fontSize: 22,
                    fontWeight: 500,
                    letterSpacing: 2,
                  },
                  children: dateLine,
                },
              },
            ],
          },
        },
        // Match row: team1 — center — team2
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              flex: 1,
              padding: '0 20px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flex: 1,
                    fontSize: t1FontSize,
                    fontWeight: 800,
                    color: '#f8fafc',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    justifyContent: 'center',
                    textAlign: 'center',
                  },
                  children: team1Name.toUpperCase(),
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    width: 360,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                  children: showScore
                    ? {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            fontSize: 130,
                            fontWeight: 900,
                            color: '#ffba00',
                            letterSpacing: -2,
                          },
                          children: `${team1Score} - ${team2Score}`,
                        },
                      }
                    : {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            fontSize: 96,
                            fontWeight: 900,
                            color: '#475569',
                            letterSpacing: 18,
                          },
                          children: 'VS',
                        },
                      },
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flex: 1,
                    fontSize: t2FontSize,
                    fontWeight: 800,
                    color: '#f8fafc',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    justifyContent: 'center',
                    textAlign: 'center',
                  },
                  children: team2Name.toUpperCase(),
                },
              },
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
                    padding: '10px 28px',
                    backgroundColor: statusBadge.bg,
                    border: `1px solid ${statusBadge.border}`,
                    borderRadius: 9999,
                    color: statusBadge.color,
                    fontSize: 20,
                    fontWeight: 800,
                    letterSpacing: 4,
                  },
                  children: statusBadge.label,
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
