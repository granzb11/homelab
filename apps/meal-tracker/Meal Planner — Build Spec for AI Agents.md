# Meal Planner — Build Spec for AI Agents

Oct 31, 2026 · @Gustavo Ranz

## Overview

A personal meal planner that runs on OrbStack Kubernetes: save recipes (typed in or imported from a URL), drop them into lunch and dinner slots for the week, and get a grocery list built from the plan that works offline in the store.

- **Users:** one household (Goose) for now. The data model keeps `household_id` everywhere so a second household or a partner's phone can be added later without a migration.
- **Stack:** React PWA, Go API, Go import worker, Postgres, all on OrbStack's built-in Kubernetes.
- **How agents should use this doc:** treat it as the source of truth. Work one milestone from the Build plan at a time, meet its acceptance criteria, and follow the Rules for agents. If something here is ambiguous, add it to Open questions instead of guessing.
- **Design origin:** this is a scaled-down version of a system design worked through for interview practice. Where the big-scale design used Redis, sharding or WebSockets, this spec says what replaces them at one-household scale.

## Scope

v1 covers the full loop: recipes, weekly planner, generated grocery list, URL import and offline use on a phone. Everything else waits.

**In v1**

- Recipes: create, edit, delete, search; structured ingredients (`qty`, `unit`, `name`, `aisle`); steps and notes.
- URL import: paste a recipe URL, a background worker fetches and parses it into a draft recipe you review and save.
- Planner: a week view (Sunday start) with lunch and dinner slots; each slot is a recipe marked **cook** or **leftovers**, or a free-text note ("eating out"). Setting a dinner fills the next day's empty lunch with leftovers.
- "Also making" list per week for things like quick pickles that add groceries but aren't a meal.
- Grocery list: built from every **cook** slot and "also making" item, combined by item and unit, grouped by aisle, with check-off, manual extras and a pantry section.
- Offline: installable PWA; plan, list and recipes readable with no signal; check-offs and edits queue and sync on reconnect.
- Login: a single user account (see Open questions for the exact mechanism).

**Not in v1**

- Multiple households, invites, sharing recipes publicly.
- Live push between devices (pull-on-focus and a 30-second poll are enough for one person).
- Unit conversion (cups to tablespoons), nutrition and calorie tracking.
- Notifications and reminders.
- Native iOS or Android apps.

**Later phases**

- Phase 2: partner account in the same household, live sync over server-sent events, unit conversion for common kitchen units.
- Phase 3: copy last week, favorite rotations, simple nutrition estimates.

## Architecture

Four workloads share one Postgres: nginx serves the app, the Go API handles every request and sync, the Go worker imports recipes, and CronJobs back up and clean up.

&#91;embedded content: services on OrbStack Kubernetes · phone over Tailscale\]

On the Mac you open `meals.k8s.orb.local` directly; the phone goes through Tailscale. Only the worker talks to the internet.

## Tech stack and repo layout

One Go module with two binaries (API and import worker), one React app, one Postgres. No Redis and no message broker: at one-household scale, Postgres does both jobs.

| Layer | Choice | Why |
| --- | --- | --- |
| API | Go 1.23+, `chi` router, `pgx/v5`, `sqlc` for typed queries, `log/slog` | Small, fast, typed SQL without an ORM |
| Migrations | `goose` (SQL files) | Plain SQL, runs as a Kubernetes Job |
| Import worker | Go binary in the same module | Shares models and DB code with the API |
| Job queue | Postgres table polled with `SELECT … FOR UPDATE SKIP LOCKED` | Replaces Kafka/SQS from the big-scale design |
| Cache | None; Postgres plus HTTP `ETag` | Replaces Redis; one user never needs it |
| Database | Postgres 16 | Relational data, JSONB for raw import payloads |
| Frontend | React 18, Vite, TypeScript, TanStack Query, React Router | Standard, well known to agents |
| Offline store | Dexie (IndexedDB) | Local copy of data plus the outbox |
| PWA | `vite-plugin-pwa` (Workbox) | Installable app, cached app shell |
| Styling | Tailwind CSS | Fast for agents, consistent output |
| Tests | `go test` + `testcontainers-go` (Postgres); Vitest; Playwright for end-to-end | Real database in tests via OrbStack's Docker |

**Repo layout**

```
meal-planner/
  CLAUDE.md                 rules for agents (copy of "Rules for agents")
  Makefile                  dev, test, build, deploy targets
  api/
    cmd/api/main.go
    cmd/worker/main.go
    internal/
      http/                 handlers, middleware, routing
      recipes/              recipe service
      plan/                 meal slots, weeks
      grocery/              list building, item keys, state
      sync/                 batch push, pull cursor
      importer/             fetch, parse, job loop
      auth/
      db/                   sqlc output + queries/*.sql
    migrations/             goose SQL files
    sqlc.yaml
    Dockerfile
  web/
    src/
      api/                  typed client
      offline/              Dexie schema, outbox, sync loop
      features/plan/
      features/grocery/
      features/recipes/
    vite.config.ts
    Dockerfile              build, then serve with nginx
  deploy/
    k8s/base/               namespace, deployments, services, ingress
    k8s/dev/                kustomize overlay for OrbStack
  scripts/                  backup and restore helpers
```

## Data model

Every shared table carries `household_id`, and every query filters on it. The grocery list itself is never stored: quantities are computed from the plan, and only what you do to the list (checks, extras) is saved.

```sql
CREATE TABLE households (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid NOT NULL REFERENCES households(id),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,          -- argon2id
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recipes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id  uuid NOT NULL REFERENCES households(id),
  title         text NOT NULL,
  cuisine       text NOT NULL DEFAULT 'other',  -- mexican, korean, chinese, italian, other
  servings      int  NOT NULL DEFAULT 2 CHECK (servings > 0),
  time_label    text,                    -- "30 min", "3 hr, mostly hands-off"
  steps         text[] NOT NULL DEFAULT '{}',
  notes         text[] NOT NULL DEFAULT '{}',
  source_url    text,
  version       bigint NOT NULL DEFAULT 1,
  deleted_at    timestamptz,             -- soft delete so offline clients can learn about it
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recipe_ingredients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id       uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position        int  NOT NULL,
  qty             numeric(10,3),         -- NULL for "to taste", herbs
  unit            text NOT NULL DEFAULT '',
  name_normalized text NOT NULL,         -- lowercase, singular: "yellow onion"
  display_name    text NOT NULL,         -- what the user typed
  aisle           text NOT NULL,         -- protein, produce, dairy_eggs, frozen_jarred, pantry
  note            text
);

CREATE TABLE meal_slots (
  household_id  uuid NOT NULL REFERENCES households(id),
  date          date NOT NULL,
  meal          text NOT NULL CHECK (meal IN ('lunch','dinner')),
  recipe_id     uuid REFERENCES recipes(id),
  mode          text NOT NULL CHECK (mode IN ('cook','leftovers','note')),
  note          text,                    -- used when mode = 'note'
  version       bigint NOT NULL DEFAULT 1,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, date, meal),
  CHECK ((mode = 'note') = (recipe_id IS NULL))
);

CREATE TABLE week_extras_cook (         -- "also making this week"
  household_id  uuid NOT NULL REFERENCES households(id),
  week_start    date NOT NULL,           -- always a Sunday
  recipe_id     uuid NOT NULL REFERENCES recipes(id),
  PRIMARY KEY (household_id, week_start, recipe_id)
);

CREATE TABLE grocery_item_state (
  household_id      uuid NOT NULL REFERENCES households(id),
  week_start        date NOT NULL,
  item_key          text NOT NULL,       -- "yellow onion|" or "chicken broth|cup"
  checked           boolean NOT NULL DEFAULT false,
  qty_when_checked  numeric(10,3),
  version           bigint NOT NULL DEFAULT 1,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (household_id, week_start, item_key)
);

CREATE TABLE grocery_extras (
  id            uuid PRIMARY KEY,        -- generated on the client so offline creates work
  household_id  uuid NOT NULL REFERENCES households(id),
  week_start    date NOT NULL,
  text          text NOT NULL,
  checked       boolean NOT NULL DEFAULT false,
  version       bigint NOT NULL DEFAULT 1,
  deleted_at    timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE change_log (               -- feeds the offline pull cursor
  seq           bigserial PRIMARY KEY,
  household_id  uuid NOT NULL,
  entity        text NOT NULL,           -- recipe, meal_slot, grocery_item_state, grocery_extra, week_extra
  entity_key    text NOT NULL,
  op            text NOT NULL CHECK (op IN ('upsert','delete')),
  at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON change_log (household_id, seq);

CREATE TABLE applied_ops (              -- makes offline replays safe
  op_id         uuid PRIMARY KEY,
  household_id  uuid NOT NULL,
  result        jsonb NOT NULL,
  applied_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE import_jobs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id   uuid NOT NULL REFERENCES households(id),
  url            text NOT NULL,
  url_normalized text NOT NULL,
  status         text NOT NULL CHECK (status IN ('queued','running','done','failed')),
  attempts       int  NOT NULL DEFAULT 0,
  run_after      timestamptz NOT NULL DEFAULT now(),
  draft          jsonb,                  -- parsed recipe for review
  error          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON import_jobs (status, run_after);
```

**Rules**

- Every write that changes a synced entity bumps its `version` and appends one `change_log` row in the same transaction.
- Deletes of recipes and extras are soft (`deleted_at`) so an offline phone learns about them on its next pull. A recipe used by a meal slot can still be deleted; the slot then shows "Deleted recipe" and adds nothing to groceries.
- `applied_ops` rows older than 30 days are purged by a nightly CronJob.

## API

JSON over HTTPS under `/api/v1`. The household comes from the signed-in session, never from the URL or body, so a client can't ask for another household's data. Writes set state (never toggle) and are safe to retry.

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/auth/login` | `{email, password}` | 204, sets session cookie |
| POST | `/auth/logout` | — | 204 |
| GET | `/me` | — | `{user, household}` |
| GET | `/recipes?q=&cuisine=` | — | `[recipe summary]` |
| POST | `/recipes` | recipe | 201 `recipe` |
| GET | `/recipes/{id}` | — | `recipe` with ingredients |
| PUT | `/recipes/{id}` | recipe + `version` | `recipe`, or 409 if `version` is stale |
| DELETE | `/recipes/{id}` | — | 204 (soft delete) |
| POST | `/recipe-imports` | `{url}` | 202 `{id, status: "queued"}` |
| GET | `/recipe-imports/{id}` | — | `{id, status, draft?, error?}` |
| GET | `/weeks/{weekStart}` | — | `{weekStart, slots[], alsoMaking[]}` with `ETag` |
| PUT | `/weeks/{weekStart}/slots/{date}/{meal}` | `{mode, recipeId?, note?, opId}` | `slot` |
| DELETE | `/weeks/{weekStart}/slots/{date}/{meal}` | `?opId=` | 204 |
| PUT | `/weeks/{weekStart}/also/{recipeId}` | `{opId}` | 204 |
| DELETE | `/weeks/{weekStart}/also/{recipeId}` | `?opId=` | 204 |
| GET | `/weeks/{weekStart}/grocery` | — | computed list (example below) with `ETag` |
| PUT | `/weeks/{weekStart}/grocery/items/{itemKey}` | `{checked, opId}` | `item` |
| PUT | `/weeks/{weekStart}/grocery/extras/{id}` | `{text, checked, opId}` | `extra` (creates if new) |
| DELETE | `/weeks/{weekStart}/grocery/extras/{id}` | `?opId=` | 204 |
| POST | `/sync/push` | `{ops: [op]}` | `{results: [{opId, status, error?}]}` |
| GET | `/sync/pull?since={seq}` | — | `{changes: [...], cursor, reset}` |
| GET | `/healthz`, `/readyz` | — | 200 when live / when the DB answers |

**Conventions**

- `weekStart` is an ISO date that must be a Sunday; anything else is a 400.
- `itemKey` is URL-encoded (`yellow%20onion%7C`).
- `opId` is a UUID made on the client. A repeated `opId` returns the stored result from `applied_ops` without applying it again.
- Errors are `{"error": {"code": "version_conflict", "message": "…"}}`. Codes: `validation` (400), `unauthenticated` (401), `not_found` (404, also used for another household's IDs), `version_conflict` (409), `rate_limited` (429).
- `GET` endpoints honor `If-None-Match` and return 304 when nothing changed.

**Grocery list response**

```json
{
  "weekStart": "2026-11-01",
  "sections": [
    {
      "aisle": "produce",
      "items": [
        {
          "itemKey": "yellow onion|",
          "name": "yellow onion",
          "qty": 4,
          "unit": "",
          "usedBy": ["Carnitas bowls", "Tuscan soup"],
          "checked": true,
          "needMore": 1
        }
      ]
    }
  ],
  "pantry": [{"itemKey": "soy sauce|", "name": "soy sauce", "checked": false}],
  "extras": [{"id": "…", "text": "Coffee", "checked": false}]
}
```

## Grocery list rules

The list is a pure function of the week's plan plus saved check state. Put it in `internal/grocery` with table-driven tests; the frontend runs the same rules offline, so mirror it in `web/src/offline/grocery.ts` and share one set of test fixtures (JSON) between both.

1. **Inputs:** every `meal_slots` row in the week with `mode = 'cook'` and a live recipe, plus every `week_extras_cook` recipe. Leftover and note slots add nothing.
2. **Each planned cook counts once.** Cooking the same recipe twice in a week counts its ingredients twice.
3. **Item key:** `name_normalized + "|" + unit` (lowercased, trimmed). Pantry items use `name_normalized + "|"` and show no quantity.
4. **Combine:** sum `qty` for rows with the same key. Rows with a NULL `qty` contribute no number; an item whose rows are all NULL shows the name with no quantity.
5. **No unit conversion in v1:** `1 cup broth` and `4 tbsp broth` stay as two lines.
6. **Group** by aisle in this order: protein, produce, dairy\_eggs, frozen\_jarred, pantry. Sort by name inside each aisle.
7. **`usedBy`** lists the titles of the recipes that contributed.
8. **Quantity display** (frontend): 0.25 → ¼, 0.333 → ⅓, 0.5 → ½, 0.667 → ⅔, 0.75 → ¾; otherwise up to two decimals.

**Checkmarks when the plan changes**

- Checking an item saves `checked = true` and `qty_when_checked` = the quantity shown at that moment.
- If the computed quantity later rises above `qty_when_checked`, the item shows as checked with **"need N more"** (`needMore = qty − qty_when_checked`).
- If the computed quantity falls or the item disappears, the saved state is kept but hidden. It comes back if the item returns that week.
- Unchecking clears `qty_when_checked`.

**Name normalization** (used when saving ingredients and when parsing imports): lowercase, trim, collapse spaces, drop a trailing plural `s`/`es` when the singular is in a small known list (`onions` → `onion`, `tomatoes` → `tomato`), and apply an alias table kept in code (`scallion` and `green onion` → `scallions`). Keep the alias table short and add to it as real duplicates show up.

## Offline sync

The app reads and writes a local copy first, records every change in an outbox, and syncs in the background: push the outbox, then pull everything that changed since the last cursor.

**On the phone (Dexie tables)**

- `recipes`, `slots`, `alsoMaking`, `itemState`, `extras`: the local copy, with each row's `version`.
- `outbox`: `{opId, type, payload, createdAt, status, attempts}`, `status` = pending, sending or failed.
- `meta`: `cursor` (last `change_log.seq` seen), `lastSyncAt`.

**Op types** (each is a set-state write)

`slot.set`, `slot.clear`, `also.add`, `also.remove`, `item.setChecked`, `extra.upsert`, `extra.delete`, `recipe.upsert`, `recipe.delete`.

**Writing**

1. Update the local table and add the outbox row in one Dexie transaction.
2. The UI reads only from Dexie, so it updates immediately.
3. If online, the sync loop runs right away.

**Sync loop** (on app start, on `online`, on window focus, after each local write, and every 30 seconds while visible)

1. **Squash:** for ops on the same target, keep only the last one (check then uncheck the same item = one `item.setChecked` with the final value).
2. **Push:** `POST /sync/push` with up to 100 ops in creation order.
3. **Server:** for each op, skip it if `opId` is already in `applied_ops` (return the saved result). Otherwise apply it in a transaction, bump `version`, write `change_log`, record `applied_ops`. One failing op returns an error result and does not stop the others.
4. **Client:** delete acknowledged ops. Mark rejected ops `failed` and show them in a "Couldn't sync" sheet with the server's reason.
5. **Pull:** `GET /sync/pull?since={cursor}` returns current snapshots of every entity changed since that seq (deduplicated, newest only) and the new cursor. Apply them to Dexie, skipping any entity that still has a pending op in the outbox, then save the cursor.
6. If the cursor is too old (`change_log` pruned), the server returns `reset: true`; the client clears its tables and reloads the current and next week plus all recipes.

**Conflicts**

- Last writer wins per entity, ordered by when the **server** applies the op, not by the phone's clock.
- Ops on something that no longer exists (a deleted recipe) are rejected with `not_found`; the client drops them and shows a short notice.
- `PUT /recipes/{id}` from the online editor uses `version` and returns 409 on a stale edit; the editor then shows both versions and lets you pick. Offline `recipe.upsert` ops use last writer wins.

**Retries:** exponential backoff with jitter, starting at 2 seconds, capped at 5 minutes. After 8 failed attempts an op is marked `failed`.

**What is cached for offline:** the app shell (Workbox precache), all recipes, and the current and next week's slots, item state and extras. The grocery list is computed on the phone from that data using the same rules as the server.

## URL recipe import

Importing a URL is a background job: the API queues it and answers right away, the worker fetches and parses the page, and you review the draft before it becomes a recipe.

**Flow**

1. `POST /recipe-imports {url}` validates the URL, normalizes it (lowercase host, strip `utm_*` and fragments), inserts an `import_jobs` row with `status = 'queued'`, and returns 202.
2. The worker loop claims one job: `SELECT … FROM import_jobs WHERE status = 'queued' AND run_after <= now() ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1`, sets `running`, commits.
3. It fetches the page, parses it, stores the result in `draft`, and sets `done`. On failure it increments `attempts` and sets `run_after` with backoff (1, 5, 30 minutes); after 3 attempts it sets `failed` with a readable `error`.
4. The app polls `GET /recipe-imports/{id}` every 2 seconds for up to 60 seconds, then shows the draft in the recipe editor. Nothing is saved as a recipe until you press Save.
5. On worker start, jobs stuck in `running` for over 5 minutes go back to `queued`.

**Parsing, in order**

1. Schema.org `Recipe` in JSON-LD (`<script type="application/ld+json">`, including inside `@graph`). Most recipe sites have it.
2. Microdata (`itemtype="http://schema.org/Recipe"`).
3. Fallback: title and the page URL only, with a note that ingredients need to be added by hand.

Map `name` → title, `recipeYield` → servings, `totalTime` (ISO 8601 duration) → `time_label`, `recipeInstructions` → steps (flatten `HowToSection`), `recipeCuisine` → cuisine when it matches a known value.

**Ingredient line parser** (`"1 1/2 cups chicken broth, divided"` → `qty 1.5, unit cup, name "chicken broth", note "divided"`)

- Quantity: integers, decimals, fractions, mixed numbers, Unicode fractions (½), ranges (take the higher number).
- Unit: match a fixed list with plural and abbreviation forms (cup/cups/c, tablespoon/tbsp/T, teaspoon/tsp/t, lb/pound, oz/ounce, clove, can, bunch, head, bag, block, jar, pinch).
- Name: the rest, normalized with the Grocery list rules; text after a comma or in parentheses becomes `note`.
- Aisle: guess from a small keyword map (chicken, pork, beef, shrimp, tofu → protein; milk, cream, cheese, egg → dairy\_eggs; salt, pepper, oil, sauce, vinegar, spices → pantry; default produce). You can change it in the editor.
- Unparseable lines keep the whole text as `display_name` with no quantity.

**Safety limits** (the worker fetches pages from the internet, so treat them as hostile)

- Only `http` and `https`. Resolve the host and refuse private, loopback, link-local and cluster IP ranges, including after redirects (blocks SSRF into the cluster or your home network).
- At most 3 redirects, 10-second timeout, 3 MB response cap, HTML content types only.
- A realistic `User-Agent`, and at most 1 request per host every 5 seconds.
- Never execute page scripts; parse HTML only.
- The worker's Kubernetes NetworkPolicy allows egress to the internet on 80/443 and to Postgres, and nothing else.

## Frontend

A phone-first PWA with three tabs (Plan, Groceries, Recipes) and a sync status line in the header. It must be fully usable one-handed at 390 px wide, and work the same with the network off.

| Screen | What it shows | Key behaviors |
| --- | --- | --- |
| Plan | Week picker (‹ Nov 1 – Nov 7 ›), 7 day cards with lunch and dinner slots, "Also making" chips, summary (meals planned, cooks, items to buy) | Slot picker groups options as Cook / Leftovers / Other; setting a dinner fills the next empty lunch with leftovers; "View" opens the recipe; Friday and Saturday open on next week by default |
| Groceries | Items grouped by aisle with quantity, name and the recipes that use them; pantry section; extras with an add box; "N of M in the cart" | Tap to check (state-setting op); "need N more" badge; Copy what's left; Uncheck all with a confirm step |
| Recipes | Search box, cuisine filter chips, collapsible recipe cards | New recipe, Import from URL, Edit, Delete with a confirm step |
| Recipe editor | Name, cuisine, time, servings, ingredient rows (qty, unit, item, aisle), steps and notes (one per line) | Unit suggestions; item name autocomplete from existing normalized names, so the list combines correctly; draft from an import opens here |
| Import | URL box and progress (queued, reading the page, done or failed) | Polls the job; on success opens the editor with the draft; on failure explains why and offers manual entry |
| Sync sheet | Pending and failed changes, last sync time | Retry all; discard a failed change |
| Login | Email and password | Remembers the session for 30 days |

**Look and feel:** neutral surfaces with one green accent, a colored chip per cuisine, light and dark themes, large tap targets (44 px minimum), no layout shift while syncing.

**Accessibility:** every control has a label, checkboxes are real inputs, focus is visible, and status changes are announced through an `aria-live` region.

## Deployment on OrbStack Kubernetes

Everything runs in one namespace, `meal-planner`, on OrbStack's single-node cluster, managed with Kustomize. The app answers at `http://meals.k8s.orb.local` on the Mac; the phone reaches it over Tailscale (below).

**OrbStack facts the manifests rely on** ([OrbStack Kubernetes docs](https://docs.orbstack.dev/kubernetes/))

- Images built with `docker build` are usable by pods right away, with no registry. Tag them `:dev` (never `:latest`) and set `imagePullPolicy: IfNotPresent`.
- LoadBalancer services, including an ingress controller, work out of the box at the wildcard `*.k8s.orb.local`.
- Those ports are reachable only from the Mac unless "Expose services to local network devices" is turned on in OrbStack settings.

**Workloads**

| Resource | Kind | Notes |
| --- | --- | --- |
| `postgres` | StatefulSet, 1 replica, 5 Gi PVC | Postgres 16; credentials from a Secret; `pg_isready` probes |
| `api` | Deployment, 1 replica | Go API on :8080; an init container runs `goose up` before the API starts; probes on `/healthz` and `/readyz` |
| `worker` | Deployment, 1 replica | Import worker; no Service |
| `web` | Deployment, 1 replica | nginx serving the built PWA on :80; `index.html` and `sw.js` sent with `Cache-Control: no-cache` |
| `ingress` | Ingress (ingress-nginx) | Host `meals.k8s.orb.local`: `/api` → `api:8080`, `/` → `web:80` |
| `db-backup` | CronJob, nightly at 3:00 | `pg_dump` to a hostPath folder on the Mac; keep 14 days |
| `ops-purge` | CronJob, nightly | Deletes `applied_ops` and `change_log` rows older than 30 days |
| `app-secrets` | Secret from `secretGenerator` | DB password, session key, first-user email and password; source `.env` is gitignored |
| NetworkPolicies | default deny, then allow web/api from ingress, api/worker to postgres, worker egress 80/443 | Check that OrbStack's network plugin enforces them (Open questions) |

Give every container small requests and limits (for example 50m CPU and 64 Mi requested, 256 Mi limit), run it as non-root with a read-only root filesystem, and drop all capabilities.

**Kustomize layout**

```
deploy/k8s/base/        namespace, postgres, api, worker, web, ingress, cronjobs, netpols
deploy/k8s/dev/         kustomization.yaml: images (:dev), secretGenerator, replica counts
```

**Makefile targets**

- `make cluster` — start OrbStack Kubernetes (`orb start k8s`) and install ingress-nginx once.
- `make images` — `docker build` the api, worker and web images, tagged `:dev`.
- `make deploy` — `kubectl apply -k deploy/k8s/dev`, then restart the api, worker and web deployments so new `:dev` images roll out.
- `make up` — images + deploy.
- `make logs` — tail api and worker logs.
- `make psql` — open psql in the postgres pod.
- `make test` — Go tests (with a Postgres testcontainer), Vitest, then Playwright against `meals.k8s.orb.local`.
- `make backup` / `make restore FILE=…` — run or restore a dump by hand.

**Fast inner loop:** run `vite dev` on the Mac with `/api` proxied to `http://meals.k8s.orb.local`, so frontend changes don't need an image rebuild. Rebuild and redeploy only the API while working on Go code.

**Reaching it from the phone**

Service workers (needed for offline use and installing the PWA) only run over HTTPS, and the phone can't resolve `*.k8s.orb.local`. The recommended setup is Tailscale on the Mac and phone, with `tailscale serve` proxying `https://<mac-name>.<tailnet>.ts.net` to `http://meals.k8s.orb.local`. That gives a valid certificate, keeps the app off the public internet, and works away from home. Add the Tailscale host to the app's allowed origins and set the session cookie to `Secure`.

## Build plan

Seven milestones, each small enough for one agent session and each ending in something you can open and use. Do them in order; don't start a milestone until the previous one's "Done when" passes.

### M0 — Skeleton running on the cluster

- [ ] Repo layout, `CLAUDE.md`, Makefile, `.env.example`, `.gitignore`
- [ ] Go module with `cmd/api` serving `/healthz` and `/readyz`; Dockerfile (multi-stage, distroless, non-root)
- [ ] Vite + React + TypeScript app with the three empty tabs; Dockerfile (build, then nginx)
- [ ] Kustomize base and dev overlay: namespace, postgres StatefulSet, api, web, ingress
- [ ] `make cluster`, `make images`, `make deploy`, `make up`

**Done when:** `make up` from a clean clone serves the app at `http://meals.k8s.orb.local`, and `/api/v1/healthz` returns 200.

### M1 — Database, login and recipes API

- [ ] goose migrations for the Data model; init container runs them
- [ ] sqlc queries; household scoping enforced in every query
- [ ] First user and household created at startup from `app-secrets` if none exist
- [ ] Login, logout, `/me`; argon2id hashes; HttpOnly, SameSite=Lax session cookie; login rate limit
- [ ] Recipe endpoints with ingredient normalization and version checks

**Done when:** Go tests against a real Postgres cover CRUD, 404 for another household's recipe, 409 on a stale version, and login failures.

### M2 — Planner and grocery API

- [ ] Weeks, slots, "also making" endpoints; Sunday validation; `opId` dedupe through `applied_ops`
- [ ] Grocery list builder following the Grocery list rules, with `needMore`
- [ ] Item state and extras endpoints
- [ ] `change_log` written in the same transaction as every change
- [ ] Shared JSON fixtures in `testdata/grocery/` used by Go and TypeScript tests

**Done when:** fixture tests pass, including two cooks of one recipe, NULL quantities, mixed units, pantry items, and a quantity rising after an item was checked.

### M3 — Frontend, online only

- [ ] Typed API client; login screen
- [ ] Plan, Groceries and Recipes tabs and the recipe editor as described in Frontend
- [ ] Leftovers auto-fill, week navigation, copy list, ingredient name autocomplete

**Done when:** you can sign in on the Mac, add a recipe, plan a week, and see the right grocery list, and Playwright covers that path.

### M4 — Offline and phone install

- [ ] Dexie schema, outbox, squash, sync loop, backoff, sync sheet
- [ ] `/sync/push` and `/sync/pull` with cursor and `reset`
- [ ] Client-side grocery builder using the shared fixtures
- [ ] `vite-plugin-pwa`: manifest, icons, precached shell
- [ ] Tailscale serve setup documented in the README

**Done when:** a Playwright test goes offline, checks 3 items and changes a slot, comes back online, and the server shows the same state; and the app installs on your phone over the Tailscale URL and opens with the network off.

### M5 — URL import

- [ ] `cmd/worker` job loop with `SKIP LOCKED`, retries, stuck-job recovery
- [ ] Fetcher with the Safety limits, including private-IP checks after redirects
- [ ] JSON-LD and microdata parsers; ingredient line parser; aisle guesser
- [ ] Import screen and draft-to-editor flow

**Done when:** parser tests pass on at least 5 saved HTML pages from real recipe sites (stored in `testdata/`, not fetched live), the fetcher refuses `http://10.0.0.1` and a redirect to `127.0.0.1`, and importing a real URL from the phone produces an editable draft.

### M6 — Hardening

- [ ] NetworkPolicies, security contexts, resource limits
- [ ] `db-backup` and `ops-purge` CronJobs; `make restore` tested once for real
- [ ] Accessibility pass (labels, focus, contrast in both themes)
- [ ] README: setup from zero, daily use, backup and restore

**Done when:** a restore from last night's backup brings back your recipes and plan, and the README gets a fresh clone running without help.

## Rules for agents

Copy this section into `CLAUDE.md` at the repo root so every session starts with it.

**Working style**

- Work on one milestone at a time. Before coding, write a short plan listing the files you'll touch and how you'll prove it works.
- Keep changes small and on a branch per milestone (`m2-grocery`); commit after each passing step with a clear message.
- Don't add dependencies, services or infrastructure that this spec doesn't name. If you think one is needed, stop and add it to Open questions.
- Don't change the API, data model or sync protocol on your own. Propose the change in Open questions first.
- When this spec and the code disagree, the spec wins; fix the code or flag the spec.

**Code conventions**

- Go: standard layout above, `gofmt` and `go vet` clean, errors wrapped with context, no global state, `context.Context` on every call that touches I/O, SQL only through sqlc.
- Every query includes `household_id` from the session. Write a test for each new endpoint proving another household gets 404.
- TypeScript: strict mode, no `any`, ESLint and Prettier clean, server calls only through `src/api`, local data only through `src/offline`.
- Never log passwords, session tokens or full request bodies.

**Testing**

- Go handlers and services: tests against a real Postgres (testcontainers), not mocks of the database.
- Grocery rules and the ingredient parser: table-driven tests from shared fixtures.
- Frontend: Vitest for logic (outbox squash, grocery builder, quantity display), Playwright for the user paths in each milestone.
- Import parsers use saved HTML in `testdata/`; tests never hit the live internet.

**Definition of done for any task**

1. `make test` passes.
2. `make up` deploys cleanly to OrbStack and the feature works at `meals.k8s.orb.local`.
3. The milestone's "Done when" check passes, and its checkboxes in this doc are ticked.
4. README and this spec are updated if behavior or setup changed.
5. A short summary is written for Goose: what changed, how it was tested, anything left open.

## Open questions

Decide these before or during the milestone named; until then, agents use the default in brackets.

- [ ] **Login method (M1):** email and password for one user, or skip app login and rely on Tailscale for access? \[email and password\]
- [ ] **Phone access (M4):** Tailscale serve, or OrbStack's LAN exposure plus a local certificate authority (mkcert) installed on the phone? \[Tailscale\]
- [ ] **NetworkPolicy enforcement (M6):** confirm OrbStack's cluster enforces NetworkPolicies; if not, note it and keep the manifests for a future cluster. \[keep manifests either way\]
- [ ] **Backups off the Mac (M6):** copy nightly dumps to iCloud Drive or another disk? \[local folder only\]
- [ ] **Starter data (M3):** load the recipes and week from the existing Low-Carb Weekly Meal Plan doc, or start empty? \[start empty\]
- [ ] **Week start (M2):** Sunday, matching the current plan. \[Sunday\]
