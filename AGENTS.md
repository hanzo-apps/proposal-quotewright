# Agent guide

Canonical instructions for this repo live in [`LLM.md`](./LLM.md) (and its
`CLAUDE.md` symlink). Read it before changing anything.

TL;DR: Quotewright — line-item proposals with a clean read-only share link, on
Vite + React 19 + `@hanzo/gui` + `@hanzo/iam` + `@hanzo/base`. Keep it real.
`@hanzo/gui` needs the react-native-web alias + Tamagui defines in
`vite.config.ts` and uses Tamagui LONGHAND props (tsc enforces this) — put the
label color on `Button.Text`, never the `Button` frame. `schema.sql`
(`proposals` + `lineitems`) is the Base data contract. Prove changes with
`npm run build` (tsc + vite). Never build a container image locally — Hanzo
Cloud owns deploys.
