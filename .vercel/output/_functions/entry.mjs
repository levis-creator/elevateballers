import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_cZ1XN0_6.mjs';
import { manifest } from './manifest_DJii7OKC.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about-club.astro.mjs');
const _page2 = () => import('./pages/admin/leagues/new.astro.mjs');
const _page3 = () => import('./pages/admin/leagues/_id_.astro.mjs');
const _page4 = () => import('./pages/admin/leagues.astro.mjs');
const _page5 = () => import('./pages/admin/login.astro.mjs');
const _page6 = () => import('./pages/admin/matches/new.astro.mjs');
const _page7 = () => import('./pages/admin/matches/view/_id_.astro.mjs');
const _page8 = () => import('./pages/admin/matches/_id_.astro.mjs');
const _page9 = () => import('./pages/admin/matches.astro.mjs');
const _page10 = () => import('./pages/admin/media/new.astro.mjs');
const _page11 = () => import('./pages/admin/media/_id_.astro.mjs');
const _page12 = () => import('./pages/admin/media.astro.mjs');
const _page13 = () => import('./pages/admin/news/new.astro.mjs');
const _page14 = () => import('./pages/admin/news/view/_id_.astro.mjs');
const _page15 = () => import('./pages/admin/news/_id_.astro.mjs');
const _page16 = () => import('./pages/admin/news.astro.mjs');
const _page17 = () => import('./pages/admin/pages/new.astro.mjs');
const _page18 = () => import('./pages/admin/pages/_id_.astro.mjs');
const _page19 = () => import('./pages/admin/pages.astro.mjs');
const _page20 = () => import('./pages/admin/players/new.astro.mjs');
const _page21 = () => import('./pages/admin/players/_id_.astro.mjs');
const _page22 = () => import('./pages/admin/players.astro.mjs');
const _page23 = () => import('./pages/admin/seasons/new.astro.mjs');
const _page24 = () => import('./pages/admin/seasons/_id_.astro.mjs');
const _page25 = () => import('./pages/admin/seasons.astro.mjs');
const _page26 = () => import('./pages/admin/staff/new.astro.mjs');
const _page27 = () => import('./pages/admin/staff/_id_.astro.mjs');
const _page28 = () => import('./pages/admin/staff.astro.mjs');
const _page29 = () => import('./pages/admin/teams/new.astro.mjs');
const _page30 = () => import('./pages/admin/teams/view/_id_.astro.mjs');
const _page31 = () => import('./pages/admin/teams/_id_.astro.mjs');
const _page32 = () => import('./pages/admin/teams.astro.mjs');
const _page33 = () => import('./pages/admin/test-ui.astro.mjs');
const _page34 = () => import('./pages/admin.astro.mjs');
const _page35 = () => import('./pages/api/auth/login.astro.mjs');
const _page36 = () => import('./pages/api/auth/logout.astro.mjs');
const _page37 = () => import('./pages/api/auth/me.astro.mjs');
const _page38 = () => import('./pages/api/comments/_id_.astro.mjs');
const _page39 = () => import('./pages/api/comments.astro.mjs');
const _page40 = () => import('./pages/api/feature-flags.astro.mjs');
const _page41 = () => import('./pages/api/leagues/_id_.astro.mjs');
const _page42 = () => import('./pages/api/leagues.astro.mjs');
const _page43 = () => import('./pages/api/matches/_matchid_/events/_id_.astro.mjs');
const _page44 = () => import('./pages/api/matches/_matchid_/events.astro.mjs');
const _page45 = () => import('./pages/api/matches/_matchid_/players/_id_.astro.mjs');
const _page46 = () => import('./pages/api/matches/_matchid_/players.astro.mjs');
const _page47 = () => import('./pages/api/matches/_id_.astro.mjs');
const _page48 = () => import('./pages/api/matches.astro.mjs');
const _page49 = () => import('./pages/api/media/_id_.astro.mjs');
const _page50 = () => import('./pages/api/media.astro.mjs');
const _page51 = () => import('./pages/api/news/_id_.astro.mjs');
const _page52 = () => import('./pages/api/news.astro.mjs');
const _page53 = () => import('./pages/api/notifications.astro.mjs');
const _page54 = () => import('./pages/api/pages/_id_.astro.mjs');
const _page55 = () => import('./pages/api/pages.astro.mjs');
const _page56 = () => import('./pages/api/players/_id_/approve.astro.mjs');
const _page57 = () => import('./pages/api/players/_id_.astro.mjs');
const _page58 = () => import('./pages/api/players.astro.mjs');
const _page59 = () => import('./pages/api/registration/player.astro.mjs');
const _page60 = () => import('./pages/api/registration/team.astro.mjs');
const _page61 = () => import('./pages/api/seasons/_id_.astro.mjs');
const _page62 = () => import('./pages/api/seasons.astro.mjs');
const _page63 = () => import('./pages/api/settings/_id_.astro.mjs');
const _page64 = () => import('./pages/api/settings.astro.mjs');
const _page65 = () => import('./pages/api/staff/_id_.astro.mjs');
const _page66 = () => import('./pages/api/staff.astro.mjs');
const _page67 = () => import('./pages/api/teams/_id_/approve.astro.mjs');
const _page68 = () => import('./pages/api/teams/_id_/staff.astro.mjs');
const _page69 = () => import('./pages/api/teams/_id_.astro.mjs');
const _page70 = () => import('./pages/api/teams.astro.mjs');
const _page71 = () => import('./pages/contacts.astro.mjs');
const _page72 = () => import('./pages/league-registration.astro.mjs');
const _page73 = () => import('./pages/matches/results.astro.mjs');
const _page74 = () => import('./pages/matches/_id_.astro.mjs');
const _page75 = () => import('./pages/news/_slug_.astro.mjs');
const _page76 = () => import('./pages/news.astro.mjs');
const _page77 = () => import('./pages/players/_id_.astro.mjs');
const _page78 = () => import('./pages/players.astro.mjs');
const _page79 = () => import('./pages/standings.astro.mjs');
const _page80 = () => import('./pages/teams/_slug_.astro.mjs');
const _page81 = () => import('./pages/teams.astro.mjs');
const _page82 = () => import('./pages/tournaments.astro.mjs');
const _page83 = () => import('./pages/upcoming-fixtures.astro.mjs');
const _page84 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/about-club.astro", _page1],
    ["src/pages/admin/leagues/new.astro", _page2],
    ["src/pages/admin/leagues/[id].astro", _page3],
    ["src/pages/admin/leagues/index.astro", _page4],
    ["src/pages/admin/login.astro", _page5],
    ["src/pages/admin/matches/new.astro", _page6],
    ["src/pages/admin/matches/view/[id].astro", _page7],
    ["src/pages/admin/matches/[id].astro", _page8],
    ["src/pages/admin/matches/index.astro", _page9],
    ["src/pages/admin/media/new.astro", _page10],
    ["src/pages/admin/media/[id].astro", _page11],
    ["src/pages/admin/media/index.astro", _page12],
    ["src/pages/admin/news/new.astro", _page13],
    ["src/pages/admin/news/view/[id].astro", _page14],
    ["src/pages/admin/news/[id].astro", _page15],
    ["src/pages/admin/news/index.astro", _page16],
    ["src/pages/admin/pages/new.astro", _page17],
    ["src/pages/admin/pages/[id].astro", _page18],
    ["src/pages/admin/pages/index.astro", _page19],
    ["src/pages/admin/players/new.astro", _page20],
    ["src/pages/admin/players/[id].astro", _page21],
    ["src/pages/admin/players/index.astro", _page22],
    ["src/pages/admin/seasons/new.astro", _page23],
    ["src/pages/admin/seasons/[id].astro", _page24],
    ["src/pages/admin/seasons/index.astro", _page25],
    ["src/pages/admin/staff/new.astro", _page26],
    ["src/pages/admin/staff/[id].astro", _page27],
    ["src/pages/admin/staff/index.astro", _page28],
    ["src/pages/admin/teams/new.astro", _page29],
    ["src/pages/admin/teams/view/[id].astro", _page30],
    ["src/pages/admin/teams/[id].astro", _page31],
    ["src/pages/admin/teams/index.astro", _page32],
    ["src/pages/admin/test-ui.astro", _page33],
    ["src/pages/admin/index.astro", _page34],
    ["src/pages/api/auth/login.ts", _page35],
    ["src/pages/api/auth/logout.ts", _page36],
    ["src/pages/api/auth/me.ts", _page37],
    ["src/pages/api/comments/[id].ts", _page38],
    ["src/pages/api/comments/index.ts", _page39],
    ["src/pages/api/feature-flags.ts", _page40],
    ["src/pages/api/leagues/[id].ts", _page41],
    ["src/pages/api/leagues/index.ts", _page42],
    ["src/pages/api/matches/[matchId]/events/[id].ts", _page43],
    ["src/pages/api/matches/[matchId]/events/index.ts", _page44],
    ["src/pages/api/matches/[matchId]/players/[id].ts", _page45],
    ["src/pages/api/matches/[matchId]/players/index.ts", _page46],
    ["src/pages/api/matches/[id].ts", _page47],
    ["src/pages/api/matches/index.ts", _page48],
    ["src/pages/api/media/[id].ts", _page49],
    ["src/pages/api/media/index.ts", _page50],
    ["src/pages/api/news/[id].ts", _page51],
    ["src/pages/api/news/index.ts", _page52],
    ["src/pages/api/notifications/index.ts", _page53],
    ["src/pages/api/pages/[id].ts", _page54],
    ["src/pages/api/pages/index.ts", _page55],
    ["src/pages/api/players/[id]/approve.ts", _page56],
    ["src/pages/api/players/[id].ts", _page57],
    ["src/pages/api/players/index.ts", _page58],
    ["src/pages/api/registration/player.ts", _page59],
    ["src/pages/api/registration/team.ts", _page60],
    ["src/pages/api/seasons/[id].ts", _page61],
    ["src/pages/api/seasons/index.ts", _page62],
    ["src/pages/api/settings/[id].ts", _page63],
    ["src/pages/api/settings/index.ts", _page64],
    ["src/pages/api/staff/[id].ts", _page65],
    ["src/pages/api/staff/index.ts", _page66],
    ["src/pages/api/teams/[id]/approve.ts", _page67],
    ["src/pages/api/teams/[id]/staff.ts", _page68],
    ["src/pages/api/teams/[id].ts", _page69],
    ["src/pages/api/teams/index.ts", _page70],
    ["src/pages/contacts.astro", _page71],
    ["src/pages/league-registration.astro", _page72],
    ["src/pages/matches/results.astro", _page73],
    ["src/pages/matches/[id].astro", _page74],
    ["src/pages/news/[slug].astro", _page75],
    ["src/pages/news/index.astro", _page76],
    ["src/pages/players/[id].astro", _page77],
    ["src/pages/players.astro", _page78],
    ["src/pages/standings.astro", _page79],
    ["src/pages/teams/[slug].astro", _page80],
    ["src/pages/teams.astro", _page81],
    ["src/pages/tournaments.astro", _page82],
    ["src/pages/upcoming-fixtures.astro", _page83],
    ["src/pages/index.astro", _page84]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "c0ac522c-abf8-49ae-8cd7-b2d115cecfe3",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
