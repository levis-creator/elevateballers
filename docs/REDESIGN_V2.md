# Public Site Redesign (v2) — Tracker

Single source of truth for the public-site redesign. Update the table when you
migrate a page. If a row isn't ✅, that page still renders the v1 UI.

## How the toggle works

- Flag lives in one place: `src/lib/ui-version.ts` (`usePublicV2`), fed by the
  `PUBLIC_UI_VERSION` env var (declared in `astro.config.mjs`).
- `PUBLIC_UI_VERSION=v2` serves the redesign; anything else (incl. unset) = v1.
- `PUBLIC_*` vars are **build-time inlined** → flipping it needs a rebuild/redeploy
  (a zero-code, one-click revert), not a live env change.

> **Scope: PUBLIC site only.** The admin panel gets a *separate* complete
> redesign later, behind its own flag (`usePublicAdminV2` / `PUBLIC_ADMIN_UI_VERSION`)
> so the two roll out and roll back independently. Never gate admin on
> `usePublicV2`. See "Admin redesign (later)" below.

## Conventions — so v2 is always easy to find

All redesign code lives in `v2/` folders. Nothing v2 goes loose in a v1 folder.

**v2 is a PRESENTATION-layer concern.** The project is migrating to Clean
Architecture (`domain/` → `data/` → `presentation/` per feature). A redesign
only re-skins the view: `domain/` and `data/` are UI-agnostic and shared by v1
and v2 **untouched**. So v2 views live *under* a feature's `presentation/`, not
beside it.

| Kind            | Location                                        |
| --------------- | ----------------------------------------------- |
| Layout(s)       | `src/layouts/v2/`                               |
| Page body/view  | `src/features/<feature>/presentation/v2/`       |
| Shared v2 UI    | `src/components/v2/` (cross-feature primitives) |
| The toggle      | `src/lib/ui-version.ts`                          |

Rules that keep v2 aligned with the Clean Architecture restructure:

- v2 views import from the **real presentation components**
  (`presentation/components/…`), never the legacy re-export shims in
  `features/<feature>/components/` (those get deleted by the restructure).
- v2 **never** touches `domain/` or `data/`. If the redesign needs new data,
  that's a change to the data/domain layer shared with v1 — not a v2 file.

See the whole redesign footprint at any time:

```bash
find src -path '*/v2/*' | grep -v node_modules   # every v2 file
git log --oneline -- 'src/**/v2/**'              # every redesign commit
```

Each route stays a **thin switch** — data fetching is shared, only the UI branches:

```astro
{usePublicV2
  ? <LayoutV2 ...><FeatureV2 data={data} /></LayoutV2>
  : <Layout ...><!-- existing v1 body --></Layout>}
```

## Page migration status

| Page                   | Route                     | v2 body                                        | Status |
| ---------------------- | ------------------------- | ---------------------------------------------- | ------ |
| Standings              | `src/pages/standings.astro` | `src/features/standings/presentation/v2/StandingsPage.astro` | 🚧 scaffold (reference pattern) |
| Home                   | `src/pages/index.astro`     | —                                              | ⬜ pending |
| Players                | `src/pages/players/`        | —                                              | ⬜ pending |
| News                   | `src/pages/news/`           | —                                              | ⬜ pending |
| Stats / Leaders        | `src/pages/stats/`          | —                                              | ⬜ pending |
| Upcoming Fixtures      | `src/pages/upcoming-fixtures.astro` | —                                      | ⬜ pending |
| Rules                  | `src/pages/rules.astro`     | —                                              | ⬜ pending |
| League Registration    | `src/pages/league-registration.astro` | —                                    | ⬜ pending |

Legend: ✅ done · 🚧 in progress · ⬜ pending. (Admin pages are tracked separately — see below.)

## Admin redesign (later)

The admin panel (`src/pages/admin/**`) will be **completely redesigned** in a
separate effort. It reuses the same conventions but stays fully independent:

- **Own flag:** `PUBLIC_ADMIN_UI_VERSION` → `usePublicAdminV2` in
  `src/lib/ui-version.ts`. Add it when that work starts (not before — YAGNI).
- **Own folders:** admin v2 views go in `src/features/<adminfeature>/presentation/v2/`,
  an admin shell in `src/layouts/v2/AdminLayout.astro` (same presentation-layer rule).
- **Own tracker:** add an admin migration table here (or a `REDESIGN_ADMIN_V2.md`)
  when it kicks off.

Keeping the flags separate means shipping the public redesign never exposes a
half-finished admin, and either can be rolled back alone.

## Sequencing the three efforts

Three efforts overlap: **(A)** Clean Architecture restructure, **(B)** public v2
redesign, **(C)** admin v2 redesign. Do them in an order that never builds new
work on top of code that's about to move.

**Golden rule: per feature, restructure (A) *before* you build its v2 view (B/C).**
A v2 view built on the legacy `components/` shims has to be re-pointed the moment
the shims are deleted — wasted work. Restructure the feature to clean
`presentation/components/`, *then* add its `presentation/v2/` view against the
real components.

Recommended order:

1. **A — restructure, feature by feature.** Bring each feature to full
   `domain/ → data/ → presentation/` layering and delete its legacy
   `components/` re-export shim. Land these as small, independent PRs; they touch
   v1 only and ship safely with `usePublicV2` still off.
2. **B — public v2, one page at a time.** Only migrate a page's view *after* its
   feature is restructured (step 1). Each page is a thin switch; ship with the
   flag off, flip per-environment when the page is ready. Update the status table.
3. **B flip — go live.** Once enough pages are ✅, set `PUBLIC_UI_VERSION=v2` and
   rebuild. Instant rollback = flip back + rebuild.
4. **C — admin v2, last.** Start only after the public redesign is stable, behind
   its own `PUBLIC_ADMIN_UI_VERSION` flag. Same rule: restructure each admin
   feature first, then build its `presentation/v2/` view.

Guardrails:

- **Never** interleave A and B on the *same* feature in one PR — restructure and
  re-skin are separate reviews. Arch move first, view second.
- A page may sit in a **mixed state** safely: feature restructured (A done), v2
  view not built yet (B pending) → it just renders v1. That's the whole point of
  the flag + shim-free imports.
- If a feature *can't* be restructured yet but its page urgently needs v2, that's
  the one case to build v2 on the shim — **mark it 🚧 with a `TODO: repoint after
  A` note** so the debt is visible, not silent.

## Endgame

- **v2 wins:** promote each `v2/` file up one level, delete the v1 body + the
  toggle, drop `PUBLIC_UI_VERSION`.
- **v2 abandoned:** `rm -rf src/layouts/v2 src/**/v2 src/lib/ui-version.ts`,
  revert the `standings.astro` switch, drop the env field.
