-- Hanzo Base schema for Quotewright (the `databaseSchema` DDL).
--
-- On publish, Hanzo Cloud translates each CREATE TABLE into a Hanzo Base
-- collection via `provisionBaseFromDDL` (additive + idempotent). Base manages
-- `id`/`created`/`updated`/`owner`/`org` itself, so they are never re-declared
-- here; every row is stamped with the verified IAM `owner`+`org`.
--
-- Both collections are ORG-SCOPED. The list/view/create/update/delete rules
-- Hanzo Cloud provisions are, for every collection below:
--
--     @request.auth.org_id = org
--
-- so a teammate in your org reads/writes the row and other orgs cannot see it.
-- A `lineitems.proposal` is the parent proposal's Base `id`.
--
-- Keep this file in lockstep with what the app reads/writes
-- (src/views/editor.tsx · list.tsx · preview.tsx; src/lib/proposal.ts).

CREATE TABLE IF NOT EXISTS proposals (
  client TEXT NOT NULL DEFAULT '',
  title  TEXT NOT NULL DEFAULT 'Untitled proposal',
  status TEXT NOT NULL DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS lineitems (
  proposal TEXT NOT NULL,
  desc     TEXT NOT NULL DEFAULT '',
  qty      REAL NOT NULL DEFAULT 1,
  price    REAL NOT NULL DEFAULT 0
);
