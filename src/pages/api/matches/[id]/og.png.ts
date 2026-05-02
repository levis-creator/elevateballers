import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { getMatchWithFullDetails } from '../../../../features/cms/lib/queries';
import { MATCH_TIMEZONE } from '../../../../features/matches/domain/usecases/utils';

export const prerender = false;

const W = 1200;
const H = 630;

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      default:
        return '&quot;';
    }
  });
}

// Pick a roughly readable size for variable-length team names.
function fitTeamFontSize(name: string): number {
  const len = name.length;
  if (len <= 10) return 64;
  if (len <= 16) return 52;
  if (len <= 22) return 42;
  return 34;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    timeZone: MATCH_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    timeZone: MATCH_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildSvg(opts: {
  team1Name: string;
  team2Name: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  team1Score: number | null;
  team2Score: number | null;
  league: string;
  dateLine: string;
}): string {
  const {
    team1Name,
    team2Name,
    status,
    team1Score,
    team2Score,
    league,
    dateLine,
  } = opts;

  const showScore =
    status === 'COMPLETED' && team1Score != null && team2Score != null;
  const t1FontSize = fitTeamFontSize(team1Name);
  const t2FontSize = fitTeamFontSize(team2Name);

  const statusBadge =
    status === 'LIVE'
      ? `
    <g transform="translate(${W / 2 - 60}, 470)">
      <rect width="120" height="44" rx="22" fill="#ef4444" />
      <circle cx="22" cy="22" r="6" fill="#ffffff" opacity="0.95" />
      <text x="40" y="29" font-family="Rubik, Arial, sans-serif" font-size="20" font-weight="800" fill="#ffffff" letter-spacing="3">LIVE</text>
    </g>`
      : status === 'COMPLETED'
        ? `
    <g transform="translate(${W / 2 - 70}, 470)">
      <rect width="140" height="44" rx="22" fill="rgba(16, 185, 129, 0.18)" stroke="rgba(16, 185, 129, 0.5)" />
      <text x="70" y="29" text-anchor="middle" font-family="Rubik, Arial, sans-serif" font-size="18" font-weight="800" fill="#34d399" letter-spacing="3">FINAL</text>
    </g>`
        : `
    <g transform="translate(${W / 2 - 90}, 470)">
      <rect width="180" height="44" rx="22" fill="rgba(255, 186, 0, 0.15)" stroke="rgba(255, 186, 0, 0.5)" />
      <text x="90" y="29" text-anchor="middle" font-family="Rubik, Arial, sans-serif" font-size="18" font-weight="800" fill="#ffba00" letter-spacing="3">UPCOMING</text>
    </g>`;

  const centerContent = showScore
    ? `
    <text x="${W / 2}" y="320" text-anchor="middle" font-family="JetBrains Mono, Courier New, monospace" font-size="160" font-weight="900" fill="#ffba00">${team1Score}<tspan dx="40" dy="0" fill="#475569" font-size="100">-</tspan><tspan dx="40" dy="0" fill="#ffba00">${team2Score}</tspan></text>`
    : `
    <text x="${W / 2}" y="310" text-anchor="middle" font-family="Rubik, Arial, sans-serif" font-size="96" font-weight="900" fill="#475569" letter-spacing="20">VS</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f0d18" />
      <stop offset="100%" stop-color="#14111f" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="0%" r="60%">
      <stop offset="0%" stop-color="#ffba00" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#ffba00" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)" />
  <rect width="${W}" height="${H}" fill="url(#glow)" />

  <!-- Top: League pill -->
  <g transform="translate(${W / 2 - 200}, 60)">
    <rect width="400" height="40" rx="20" fill="rgba(255, 255, 255, 0.04)" stroke="rgba(255, 186, 0, 0.3)" />
    <text x="200" y="27" text-anchor="middle" font-family="Rubik, Arial, sans-serif" font-size="16" font-weight="700" fill="#ffba00" letter-spacing="6">${escapeXml(league.toUpperCase())}</text>
  </g>

  <!-- Date / time line -->
  <text x="${W / 2}" y="140" text-anchor="middle" font-family="Rubik, Arial, sans-serif" font-size="22" font-weight="500" fill="#94a3b8" letter-spacing="2">${escapeXml(dateLine.toUpperCase())}</text>

  <!-- Team names -->
  <text x="240" y="240" text-anchor="middle" font-family="Rubik, Arial, sans-serif" font-size="${t1FontSize}" font-weight="800" fill="#f8fafc" letter-spacing="2">${escapeXml(team1Name.toUpperCase())}</text>
  <text x="${W - 240}" y="240" text-anchor="middle" font-family="Rubik, Arial, sans-serif" font-size="${t2FontSize}" font-weight="800" fill="#f8fafc" letter-spacing="2">${escapeXml(team2Name.toUpperCase())}</text>

  <!-- Center: VS or score -->
  ${centerContent}

  <!-- Status badge -->
  ${statusBadge}

  <!-- Bottom branding -->
  <line x1="80" y1="560" x2="${W - 80}" y2="560" stroke="rgba(255, 255, 255, 0.06)" stroke-width="1" />
  <text x="${W / 2}" y="595" text-anchor="middle" font-family="Rubik, Arial, sans-serif" font-size="20" font-weight="800" fill="#ffba00" letter-spacing="6">ELEVATEBALLERS.COM</text>
</svg>`;
}

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;
  if (!id) {
    return new Response('Missing match id', { status: 400 });
  }

  let match;
  try {
    match = await getMatchWithFullDetails(id);
  } catch (err) {
    console.error('OG image: failed to fetch match', err);
    return new Response('Failed to fetch match', { status: 500 });
  }

  if (!match) {
    return new Response('Match not found', { status: 404 });
  }

  const team1Name = match.team1Name || match.team1?.name || 'TBD';
  const team2Name = match.team2Name || match.team2?.name || 'TBD';
  const league =
    match.league?.name || match.leagueName || 'Elevate Basketball';
  const status = match.status as 'UPCOMING' | 'LIVE' | 'COMPLETED';
  const dateObj = match.date ? new Date(match.date) : null;
  const dateLine = dateObj
    ? `${formatDate(dateObj)} · ${formatTime(dateObj)}`
    : '';

  const svg = buildSvg({
    team1Name,
    team2Name,
    status,
    team1Score: match.team1Score,
    team2Score: match.team2Score,
    league,
    dateLine,
  });

  let png: Buffer;
  try {
    png = await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9, quality: 90 })
      .toBuffer();
  } catch (err) {
    console.error('OG image: sharp render failed', err);
    return new Response('Render failed', { status: 500 });
  }

  // Match the page's Cache-Control profile.
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
