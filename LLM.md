# quotewright — agent notes

Quotewright Proposals: build line-item proposals and share a clean read-only
link. A real Hanzo-stack app forked from `hanzo-apps/hanzo-starter` — same
provider stack, `vite.config.ts`, auth, and deploy contract; different product.
Vite + React 19 + `@hanzo/gui` (UI) + `@hanzo/iam` (auth) + `@hanzo/base` (data).
Keep it REAL — every surface must build and run, no fabricated UI.

## One way, decomplected

- **Providers** (`src/providers.tsx`) mount in the canonical order every Hanzo
  surface ships: `GuiProvider` → `IamProvider` → `BaseProvider`. `BaseProvider`
  gets a `BaseClient` carrying the IAM access token; it is rebuilt when the token
  changes (`src/lib/base.ts` `baseAs`). That single seam is what makes every
  `useQuery`/`useMutation` org-scoped to the signed-in user.
- **Env is one place** (`src/env.ts`), read from `import.meta.env.VITE_*`
  (`VITE_HANZO_CLIENT_ID` falls back to `hanzo-app`).
- **Domain is one place** (`src/lib/proposal.ts`) — the `Proposal`/`LineItem`
  types, the status vocabulary, the money math (`subtotal`/`taxOf`/`totalOf`/
  `money`), and `shareLink`. Views compute nothing ad-hoc.
- **UI is one system** — `@hanzo/gui` primitives only (no second kit, no
  Tailwind). Shared pieces live in `src/ui.tsx` (`Mark`, `AccentButton`,
  `StatusBadge`). The three product views are list · editor · preview.
- **Routing is hand-rolled** (`src/views/home.tsx`) — no router dep, same ethos
  as the `/auth/callback` gate. `/p/<id>` opens the read-only preview and
  `history.pushState` keeps the URL in sync, so "Copy share link" always matches
  what's on screen.

## Gotchas (do not regress)

- **`@hanzo/gui` under Vite** needs three things in `vite.config.ts` (it is the
  Tamagui line): (1) alias `react-native` → `react-native-web`, (2) `define`
  `process.env.TAMAGUI_TARGET` / `NODE_ENV` / `__DEV__`, (3) `dedupe`
  react/react-dom/react-native-web. No Tamagui compiler, no `one`, no Expo.
- **`@hanzo/gui` props are Tamagui LONGHAND** with this v5 config:
  `alignItems`/`justifyContent`/`backgroundColor`/`padding`/`paddingHorizontal`/
  `borderRadius`/`textAlign` — NOT the `items`/`justify`/`bg`/`p`/`rounded`/
  `text` shorthands. Shorthands pass at runtime but FAIL `tsc`.
- **`Button` color goes on `Button.Text`, not the frame.** `<Button color=…>`
  does NOT typecheck (`color` isn't on the button frame). Put label color/weight
  on `<Button.Text color=… fontWeight=…>`, or use `AccentButton` in `src/ui.tsx`
  (the one violet brand button). `Button` uses `onPress`; `Input` uses
  `value`/`onChangeText` (+ `onBlur` to persist).
- **Light "paper" via `<Theme name="light">`.** The preview document and the
  hero mock wrap their subtree in `<Theme name="light">` so theme-relative tokens
  (`$background`/`$color`/`$borderColor`/`$colorN`) flip to dark ink on white
  inside the dark app chrome. Fixed palette tokens (`$purple9`/`$green10`/…) read
  on both.
- **PKCE storage is `localStorage`** (not sessionStorage) so the verifier/state
  survive the round-trip to hanzo.id.
- **`schema.sql` is the data contract.** `proposals` + `lineitems`, org-scoped
  (`@request.auth.org_id = org`). Keep it in lockstep with `src/lib/proposal.ts`
  and the editor/list/preview reads/writes. Tax (8%) is a display convention,
  not a stored column.

## Deploy contract (Hanzo Cloud)

- Static SPA: `npm run build` → `dist/`, served at `<slug>.hanzo.app` from
  object storage. No server process.
- On publish, `schema.sql` → `provisionBaseFromDDL` creates the collections
  (org-scoped, IAM-native). Runtime read/write is browser → `VITE_HANZO_BASE_URL`
  with the IAM token.
- **IAM redirect registration** is the one external requirement: the IAM client
  (`VITE_HANZO_CLIENT_ID`, default `hanzo-app`) must allow this origin's
  `/auth/callback` (a `https://*.hanzo.app/auth/callback` wildcard, or a per-app
  `hanzo-quotewright` client).

## Proven

`tsc --noEmit` clean · `vite build` → `dist/` · renders under Vite with ZERO
console errors (headless Chromium at 1280×800) · sample invoice totals compute
end-to-end (subtotal $23,300 → +8% tax → **$25,164.00**) · `login()` performs a
real PKCE S256 redirect to hanzo.id.

## Build

CI (`.github/workflows/ci.yml`) runs `npm ci && npm run typecheck && npm run
build` — build-verification only, NEVER a container image (Hanzo Cloud owns
deploys; do not build images locally).
