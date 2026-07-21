# Quotewright Proposals

Build line-item proposals and share a clean, read-only link with your client — a
real, buildable Hanzo-stack app you fork on [hanzo.app](https://hanzo.app) and
deploy live on Hanzo Cloud.

- **UI** — [`@hanzo/gui`](https://www.npmjs.com/package/@hanzo/gui) (the Hanzo
  design system) under Vite + React 19. No Tailwind, no second kit.
- **Auth** — [`@hanzo/iam`](https://www.npmjs.com/package/@hanzo/iam), OAuth2
  **PKCE** against [hanzo.id](https://hanzo.id). No local passwords — IAM owns
  every credential interaction.
- **Data** — [`@hanzo/base`](https://www.npmjs.com/package/@hanzo/base), the
  IAM-native, org-scoped data plane. Proposals and their line items are real
  Base collections.

Sign in → build a proposal (client, title, status) → add priced line items and
watch the totals sidebar update live → preview the invoice-like document →
copy a read-only share link for your client.

## The three views

| View | What it does |
| --- | --- |
| **Proposals list** | Every proposal with its client, status, item count, and grand total (rolled up from `lineitems`). "New proposal" mints a draft and opens the editor. |
| **Proposal editor** | Edit client / title / status, add and price line items inline, and read a live **totals sidebar** (subtotal · tax · total). Header saves on blur; status on click; each line-item cell on blur. |
| **Proposal preview** | The clean, read-only document on a light "paper" surface — the invoice-like artifact you share. "Copy share link" writes this origin's `/p/<id>`. |

## Stack (pinned)

| Package | Version |
| --- | --- |
| `react` / `react-dom` | `^19.2.4` |
| `@hanzo/gui` + `@hanzogui/config` | `7.3.0` |
| `@hanzo/iam` | `^0.13.1` |
| `@hanzo/base` | `^0.2.1` |
| `vite` | `^6` (`@vitejs/plugin-react`) |
| `typescript` | `5.9.3` |
| `react-native-web` | `^0.21.0` |

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc --noEmit && vite build  ->  dist/
npm run preview    # serve the production build (SPA fallback on)
```

Out of the box it runs against **live** Hanzo (hanzo.id + api.hanzo.ai) — no
config needed to see the sign-in flow. Copy `.env.example` to `.env` to point at
a different environment.

## Environment contract

Only `VITE_`-prefixed vars reach the browser (this is a static SPA — there is no
server). Defaults in parentheses.

| Var | Purpose |
| --- | --- |
| `VITE_HANZO_IAM_URL` (`https://hanzo.id`) | OIDC issuer. |
| `VITE_HANZO_CLIENT_ID` (`hanzo-app`) | IAM application (`<org>-<app>`). Its redirect-URI list must allow this deploy's `/auth/callback` — see **Ambient IAM**. |
| `VITE_HANZO_REDIRECT_URI` (`${origin}/auth/callback`) | PKCE redirect. |
| `VITE_HANZO_BASE_URL` (`https://api.hanzo.ai`) | Browser-reachable Hanzo Base data plane. Deploy injects the provisioned URL. |

## How auth works — ambient IAM

`login()` starts an OAuth2 **PKCE S256** redirect to hanzo.id; hanzo.id returns
to `/auth/callback`, where `handleCallback()` exchanges the code for tokens
(stored in `localStorage`, refresh-aware via `offline_access`). Every deployed
app is a static site at `<slug>.hanzo.app`; there is **no server token** — the
SPA authenticates the user in the browser and carries the resulting IAM JWT to
Base.

The one deploy requirement: the IAM client (`VITE_HANZO_CLIENT_ID`) must list
this origin's `/auth/callback` as an allowed redirect URI. Register a
`https://*.hanzo.app/auth/callback` wildcard on the shared client, or a
dedicated `hanzo-quotewright` client for this app.

## How data works — Base from `schema.sql`

[`schema.sql`](./schema.sql) is the app's `databaseSchema`. On publish, Hanzo
Cloud translates each `CREATE TABLE` into a Hanzo Base collection
(`provisionBaseFromDDL`, additive + idempotent):

- `proposals` — `client`, `title`, `status`
- `lineitems` — `proposal` (the parent proposal's Base id), `desc`, `qty`, `price`

Base manages `id`/`created`/`updated`/`owner`/`org`, stamps `owner`+`org` from
the verified IAM principal, and scopes every row to the caller's org
(`@request.auth.org_id = org`) — a teammate in your org sees the row and its
share link; other orgs cannot. At runtime the views read/write these through
`@hanzo/base/react` (`useQuery`/`useMutation`) carrying the IAM token.

## Deploy — Hanzo Cloud

[`hanzo.yml`](./hanzo.yml) declares a static build (`npm run build` → `dist/`,
served at `<slug>.hanzo.app`) plus the Base schema to provision and the env to
inject. Do **not** build a container image locally — Hanzo Cloud owns builds and
deploys. CI here only proves the app compiles green.

## Layout

```
src/
  main.tsx          entry
  providers.tsx     GuiProvider -> IamProvider -> BaseProvider(client=IAM-token)
  app.tsx           route (/auth/callback) + auth gate
  gui.config.ts     createGui(defaultConfig from @hanzogui/config/v5)
  iam.config.ts     IAM PKCE config
  env.ts            the VITE_ env contract, one place
  lib/base.ts       BaseClient carrying the IAM bearer token
  lib/proposal.ts   domain: types · status · money math · share link
  ui.tsx            shared @hanzo/gui pieces (Mark · AccentButton · StatusBadge)
  auth/callback.tsx PKCE return leg
  views/            signed-out (hero) · home (router) · list · editor · preview
schema.sql          databaseSchema -> proposals + lineitems on publish
hanzo.yml           Hanzo Cloud build/deploy manifest
```
