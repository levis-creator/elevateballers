/**
 * Load test for public team and player registration.
 *
 *   npx tsx scripts/load-test-registration.ts --base http://localhost:4321 --kind player --counts 50,100,300
 *
 * Fires N near-simultaneous registrations per round and reports status codes
 * and response times (p50/p95/max). Run it against a disposable test copy,
 * never production: every successful request creates real records (players or
 * teams, coach records, notifications and email jobs).
 *
 * Before running, on the target:
 *   - Turn off Turnstile in Site settings → Security (or use Cloudflare's
 *     always-pass test keys). `astro dev` already skips the Cloudflare check.
 *   - Turn off automatic emails (Site settings → Email), or registrations will
 *     try to email the fake @example.com addresses.
 *   - Open registration for a league and active season (team mode needs a
 *     league id: pass --league <id>).
 *
 * All generated names start with "LOADTEST" so they are easy to find and delete.
 *
 * Rate limits: by default every request comes from this machine, so after 40
 * player (or 5 team) sign-ups per hour the rest return 429; that is the limit
 * working, and the report counts them. --spread-ips sends a different
 * X-Forwarded-For per request to simulate many users. It only has an effect
 * while the server trusts that header, and is allowed only for local hosts.
 */

type Kind = 'player' | 'team';
type Result = { status: number; ms: number; error?: string };

const PRODUCTION_HOSTS = ['elevateballers.com', 'www.elevateballers.com', '102.218.215.35'];

function parseArgs(argv: string[]) {
  const get = (name: string) => {
    const index = argv.indexOf(`--${name}`);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  const base = get('base') ?? 'http://localhost:4321';
  const kind = (get('kind') ?? 'player') as Kind;
  const counts = (get('counts') ?? '50,100,300').split(',').map((value) => Number(value.trim()));
  const pauseMs = Number(get('pause') ?? 5_000);
  return { base, kind, counts, pauseMs, league: get('league'), spreadIps: argv.includes('--spread-ips') };
}

function assertSafeTarget(base: string, spreadIps: boolean) {
  const host = new URL(base).hostname;
  if (PRODUCTION_HOSTS.includes(host)) {
    throw new Error(`Refusing to load test production (${host}). Point --base at a test copy.`);
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(host) || host.endsWith('.localhost') || host.endsWith('.test');
  if (spreadIps && !local) throw new Error('--spread-ips is only allowed against a local or .test host.');
}

const runId = Date.now().toString(36);

function payload(kind: Kind, index: number, league?: string) {
  const tag = `${runId}-${index}`;
  const phone = `+2547${String(10_000_000 + ((Date.now() + index) % 89_999_999)).slice(0, 8)}`;
  const common = {
    website: '',
    'cf-turnstile-token': 'XXXX.DUMMY.TOKEN.XXXX',
    privacyConsent: true,
  };
  if (kind === 'team')
    return {
      ...common,
      name: `LOADTEST Team ${tag}`,
      coachName: `LOADTEST Coach ${tag}`,
      contactEmail: `loadtest+team-${tag}@example.com`,
      contactPhone: phone,
      leagueId: league,
    };
  return {
    ...common,
    firstName: 'LOADTEST',
    lastName: `Player ${tag}`,
    email: `loadtest+player-${tag}@example.com`,
    phone,
    position: 'Point Guard',
  };
}

async function fire(base: string, kind: Kind, index: number, league: string | undefined, spreadIps: boolean): Promise<Result> {
  const started = performance.now();
  try {
    const response = await fetch(`${base}/api/registration/${kind}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
        ...(spreadIps ? { 'X-Forwarded-For': `10.${(index >> 16) & 255}.${(index >> 8) & 255}.${index & 255}` } : {}),
      },
      body: JSON.stringify(payload(kind, index, league)),
    });
    const ms = performance.now() - started;
    const error = response.ok ? undefined : ((await response.json().catch(() => ({}))) as { error?: string }).error;
    return { status: response.status, ms, error };
  } catch (cause) {
    return { status: 0, ms: performance.now() - started, error: cause instanceof Error ? cause.message : String(cause) };
  }
}

const percentile = (sorted: number[], p: number) =>
  sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] : 0;

function report(count: number, results: Result[], wallMs: number) {
  const times = results.map((result) => result.ms).sort((a, b) => a - b);
  const byStatus = new Map<number, number>();
  for (const result of results) byStatus.set(result.status, (byStatus.get(result.status) ?? 0) + 1);
  const errors = new Map<string, number>();
  for (const result of results)
    if (result.error && result.status !== 429) errors.set(result.error, (errors.get(result.error) ?? 0) + 1);
  console.log(`\n${count} concurrent requests, finished in ${(wallMs / 1000).toFixed(1)} s`);
  console.log(
    `  status: ${[...byStatus].sort(([a], [b]) => a - b).map(([status, n]) => `${status === 0 ? 'network error' : status}×${n}`).join(', ')}`
  );
  console.log(
    `  time:   p50 ${percentile(times, 50).toFixed(0)} ms · p95 ${percentile(times, 95).toFixed(0)} ms · max ${(times.at(-1) ?? 0).toFixed(0)} ms`
  );
  for (const [message, n] of errors) console.log(`  error ×${n}: ${message}`);
}

async function main() {
  const { base, kind, counts, pauseMs, league, spreadIps } = parseArgs(process.argv.slice(2));
  assertSafeTarget(base, spreadIps);
  if (kind === 'team' && !league) throw new Error('Team mode needs --league <leagueId>.');
  console.log(`Load testing ${kind} registration at ${base} (run ${runId}${spreadIps ? ', spread IPs' : ''})`);
  let offset = 0;
  for (const [round, count] of counts.entries()) {
    if (round > 0) await new Promise((resolve) => setTimeout(resolve, pauseMs));
    const started = performance.now();
    const results = await Promise.all(
      Array.from({ length: count }, (_, i) => fire(base, kind, offset + i, league, spreadIps))
    );
    report(count, results, performance.now() - started);
    offset += count;
  }
  console.log(`\nClean up afterwards: delete ${kind === 'team' ? 'teams named "LOADTEST Team %"' : 'players with first name LOADTEST'} (run ${runId}).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
