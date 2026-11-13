# Bundles & the Obsidian Bases Indexer

This document explains how `llw` stores knowledge in the `llm-wiki` Obsidian vault and how it finds, creates, and updates that knowledge. The building blocks are **bundles**, **concepts**, the **Obsidian Bases index**, and **Obsidian Templates**.

- [Mental model](#mental-model)
- [Vault layout](#vault-layout)
- [Bundles](#bundles)
- [Concepts](#concepts)
- [The bundle index (Obsidian Bases)](#the-bundle-index-obsidian-bases)
- [Creating and updating notes (Obsidian Templates)](#creating-and-updating-notes-obsidian-templates)
- [How a lookup flows](#how-a-lookup-flows)
- [Bundle sync](#bundle-sync)
- [Semantic search with Jev](#semantic-search-with-jev)
- [How this differs from upstream OKF](#how-this-differs-from-upstream-okf)
- [Constraints and gotchas](#constraints-and-gotchas)

---

## Mental model

```
┌──────────────┐   shell    ┌───────────────────┐   reads/writes   ┌──────────────────────┐
│  agent/user  │ ─────────▶ │     llw (CLI)     │ ───────────────▶ │  Obsidian app + CLI  │
│  (skills)    │            │  validation, I/O  │  obsidian vault= │  Bases · Templates · │
└──────────────┘            │  formatting       │     llm-wiki …   │  Properties          │
                            └───────────────────┘                  └──────────┬───────────┘
                                                                              │
                                                                   ┌──────────▼───────────┐
                                                                   │  llm-wiki vault      │
                                                                   │  (plain markdown)    │
                                                                   └──────────────────────┘
```

`llw` does not keep its own database. The **vault is the source of truth**, and the **Obsidian app is the engine**:

| Concern | Handled by |
| --- | --- |
| Finding every bundle | Obsidian **Bases** (`bases/bundles-index.base`) |
| Creating notes with the right frontmatter | Obsidian **Templates** (`config/templates/*.md`) |
| Reading and writing frontmatter | Obsidian CLI `properties` / `property:set` |
| Validation, hierarchy, output formatting, sync, search | `llw` |

Every vault call is a shell-out of the form `obsidian vault=llm-wiki <command> …`. That is why the Obsidian desktop app must be running, with its CLI enabled, whenever you use `llw`.

---

## Vault layout

```
llm-wiki/                                 ← vault (name must be exactly "llm-wiki")
├── .obsidian/templates.json              ← Templates plugin config (folder: config/templates)
├── bases/
│   └── bundles-index.base                ← the bundle index
├── config/
│   └── templates/
│       ├── bundle.md                     ← template for bundle.md
│       └── concept.md                    ← template for concepts
├── bundles/                              ← all knowledge lives here
│   └── backend/
│       ├── bundle.md                     ← bundle metadata  (bundle "bundles/backend")
│       ├── api-gateway.md                ← concept
│       └── database/
│           ├── bundle.md                 ← child bundle     (bundle "bundles/backend/database")
│           ├── users-table.md            ← concept
│           └── migrations.md             ← concept
├── raw/                                  ← optional Web Clipper inbox, processed by the llw-okf skill
└── cache/
    └── bundles/                          ← created by `llw bundle sync`
        ├── hash_map.json
        ├── generated_hash_map.json
        └── task.md
```

The `llw-vault-setup` skill installs `bases/`, `config/templates/`, `.obsidian/templates.json`, and `bundles/` from the package's `obsidian-setup/` folder. `cache/` is created on the first `llw bundle sync`.

---

## Bundles

A **bundle** is a folder under `bundles/` that contains a `bundle.md` file. It groups the knowledge for one area, such as a service, library, domain, or project.

### Identity

A bundle is identified by its **vault-relative folder path**, e.g. `bundles/backend/database`. Every `--bundle` flag takes this path.

- The path must start with `bundles/` and have at least one segment after it.
- Each segment must match `^[a-z0-9][a-z0-9_-]*$`: lowercase kebab-case or snake_case, no spaces.

### `bundle.md` frontmatter

```yaml
---
title: database
description: Database schemas and migrations for the backend
parent: "[[bundles/backend/bundle|backend]]"
triggers:
  - db
  - migrations
  - postgres
---

<!-- body: an agent-maintained overview / table of contents of the bundle -->
```

| Field | Set by | Meaning |
| --- | --- | --- |
| `title` | `bundle create` (last path segment), `bundle rename` | Bundle name. |
| `description` | `--description` (required on create) | What knowledge the bundle holds. Used by humans, agents, and Jev. |
| `parent` | `--parent <folder>` | Obsidian wikilink to the parent bundle's `bundle.md`: `[[<parent folder>/bundle\|<parent title>]]`. |
| `triggers` | `--triggers "a, b, c"` | Topics or phrases that should lead an agent to this bundle. |

The **body** of `bundle.md` is free-form. The `llw-okf-sync` skill uses it for an agent-written overview of the bundle's concepts and child bundles. The CLI never writes the body.

### Hierarchy

Bundles form a tree through the **`parent` property**, not through folder nesting alone. `llw bundle tree`, `llw vault info`, and the `childBundles` list in `llw bundle view` are all computed from `parent`. By convention a child bundle's folder sits inside its parent's folder, and you pass `--parent` explicitly:

```bash
llw bundle create bundles/backend --description "Backend services"
llw bundle create bundles/backend/database --description "DB schemas" --parent bundles/backend
```

A nested bundle without a `parent` appears as a root in the tree.

---

## Concepts

A **concept** is any other `.md` file placed **directly** inside a bundle folder. Subfolders are always child bundles, never concept containers. Each concept is one self-contained unit of knowledge, such as a table schema, an API, an architectural decision, or a runbook.

### Identity

A concept is addressed by `<name> --bundle <bundle folder>`, e.g. `users-table --bundle bundles/backend/database`, which maps to `bundles/backend/database/users-table.md`.

- The name must match `^[a-z0-9][a-z0-9_-]*$` and must not include `.md`.
- `bundle`, `log`, and `index` are **reserved** and never treated as concepts.

### Concept frontmatter

```yaml
---
type: db-schema
title: users-table
tags:
  - postgres
  - sql
description: Schema of the users table, including id generation and soft-delete rules
resource: https://github.com/acme/backend/blob/main/db/schema.sql
timestamp: 2026-07-26T10:42
---

# Schema
…

# Examples
…

# Citations
…
```

| Field | Set by | Meaning |
| --- | --- | --- |
| `type` | `--type` (required) | Free-form kind of concept, e.g. `db-schema`, `api`, `decision`, `how-to`. |
| `title` | `concept create` (= concept name) | Concept name. |
| `description` | `--description` (required) | One-line summary used for discovery. |
| `tags` | `--tags "a, b"` | Free-form tags. |
| `resource` | `--resource <uri>` | Optional link to the canonical source. |
| `timestamp` | Template at creation; `concept update --timestamp [value]` | Last-updated time, local `YYYY-MM-DDTHH:mm`. A bare `--timestamp` means now. |

Agents write the **body** directly to the path that `llw concept create` prints. The **frontmatter** is changed only through `llw concept update`.

---

## The bundle index (Obsidian Bases)

[Obsidian Bases](https://help.obsidian.md/bases) is a core plugin that defines database-like views over notes, filtered and projected by their properties. `llw` ships one base, `bases/bundles-index.base`:

```yaml
views:
  - type: cards
    name: main
    filters:
      and:
        - file.inFolder("bundles")   # anywhere under bundles/ (recursive)
        - file.name == "bundle"      # only bundle.md files, never concepts
    order:                            # the columns returned by a query
      - title
      - description
      - triggers
      - file.folder
      - parent
```

The filters select **every `bundle.md` under `bundles/` at any depth, and nothing else**. Each row is one bundle, and its columns are the bundle's frontmatter plus its folder. Obsidian keeps the index up to date as files change, so `llw` never has to walk the folder tree to find bundles.

You can also open the base in Obsidian to browse your bundles as cards.

### How `llw` queries it

`llw` asks Obsidian to run the base through the CLI's `base:query` command:

| Purpose | Obsidian CLI call | Used by |
| --- | --- | --- |
| All bundle folders | `base:query path=bases/bundles-index.base format=paths` | `bundle sync`, bundle validation |
| All bundle metadata | `base:query path=bases/bundles-index.base format=json` | `bundle list`, `bundle tree`, `bundle view`, `vault info`, `jev *` |
| Raw dump | same as above, printed unchanged | `vault base` |

Each JSON row is normalized into:

```ts
{
  title: string;
  folder: string;              // e.g. "bundles/backend/database"
  path: string;                // e.g. "bundles/backend/database/bundle.md"
  description: string;
  triggers: string[];          // Bases returns lists as a comma-joined string; llw splits on ","
  parent: string | null;       // raw wikilink
  parentFolder: string | null; // parsed from the wikilink, e.g. "bundles/backend"
}
```

### The index decides what counts as a bundle

The index is also how `llw` **validates** bundles. A folder counts as a bundle only if its `bundle.md` appears in the base query. A bundle that the index does not return is rejected by every command that takes `--bundle`. Two consequences:

- A hand-made `bundle.md` outside `bundles/` is never a bundle.
- If the Bases plugin is disabled, every bundle command fails.

Concepts are **not** in the index. Once `llw` has a valid bundle folder, it lists that folder's `.md` files directly, skipping reserved names. It then reads each concept's frontmatter with `obsidian properties path=<bundle>/<concept>.md format=json`.

---

## Creating and updating notes (Obsidian Templates)

New notes are always created through the Obsidian [Templates](https://help.obsidian.md/plugins/templates) core plugin, so every note starts with the correct frontmatter skeleton:

```bash
obsidian vault=llm-wiki create name=bundle    path=<bundle folder> template=bundle    # → <bundle>/bundle.md
obsidian vault=llm-wiki create name=<concept> path=<bundle folder> template=concept   # → <bundle>/<concept>.md
```

The templates live in `config/templates/`:

```yaml
# config/templates/bundle.md          # config/templates/concept.md
---                                    ---
title: ""                              type: ""
description: ""                        title: ""
parent: ""                             tags: []
triggers: [ ]                          description: ""
---                                    resource: ""
                                       timestamp: "{{date}}T{{time}}"
                                       ---
```

`.obsidian/templates.json` sets `"folder": "config/templates"`, `"timeFormat": "HH:mm"`, and an empty `dateFormat` (Obsidian's default `YYYY-MM-DD`). Together these make `{{date}}T{{time}}` expand to the `YYYY-MM-DDTHH:mm` timestamp that `llw` validates.

After creation, `llw` fills in each field with typed property writes:

```bash
obsidian vault=llm-wiki property:set path=<file> name=<field> value=<value> type=<text|list|tags|datetime>
```

Updates (`bundle update`, `concept update`, `bundle rename`) follow the same path. Only the properties you pass are written, and the note body is never touched. Because every write goes through Obsidian, the app's metadata cache, the Bases index, and links stay consistent.

---

## How a lookup flows

`llw bundle view --bundle bundles/backend/database`:

1. **Index**: `base:query … format=json` returns all bundle rows.
2. **Validate**: confirm `bundles/backend/database` is one of the rows, and collect rows whose `parentFolder` equals it (the `childBundles`).
3. **List concepts**: read the bundle folder and keep `*.md` files that are not reserved.
4. **Read properties**: run `obsidian properties` for each concept and attach its absolute `fullpath`.
5. **Format**: emit `{ …bundle, concepts[], childBundles[] }` as TOON (default) or JSON.

An agent typically narrows down **index → bundle → concept**: `bundle list` / `bundle tree`, then `bundle view`, then read the concept file at `fullpath`. Each step reveals only as much as the agent needs.

---

## Bundle sync

`bundle.md` bodies are written by agents, so they can drift from the bundle's actual contents. `llw bundle sync` detects this:

1. For every bundle from the index, take the output of `llw bundle view --bundle <folder>` and hash it (MD5). That output covers the bundle's metadata, every concept's frontmatter, and the list of child bundles.
2. Compare each hash with `cache/bundles/hash_map.json` (the last accepted state).
3. If any hashes differ, write:
   - `cache/bundles/generated_hash_map.json`: the new hashes, with a timestamp.
   - `cache/bundles/task.md`: a checklist (`1. [ ] bundles/…`) of out-of-sync bundles.
4. Print a manifest with total and out-of-sync counts, plus pending, completed, and ignored task counts taken from `task.md` by the Obsidian CLI `tasks` command.

The `llw-okf-sync` skill then works through `task.md`. It refreshes each listed bundle's `bundle.md` body and ticks the task. When every task is done, `generated_hash_map.json` becomes the new `hash_map.json`. `llw bundle sync --reset` discards a pending run (it deletes the generated map and the task list).

> *Out of sync* means "contents changed since the last sync", not necessarily "the summary is wrong". The agent decides whether a rewrite is needed.

---

## Semantic search with Jev

The `llw jev` commands layer [TypeSafe Jev](https://typesafe.ai) over the same index:

1. **Bundle filter** (`jev bundle_search`, and stage 1 of `jev search`): send each bundle's folder, title, description, and triggers from the index. Jev returns, for each bundle, the probability that it covers the question. Bundles below `0.3` are dropped.
2. **Concept filter** (`jev search` only): for each remaining bundle, read every concept file in full (truncated at 60k characters), batch the files to fit Jev's request limits, and score each concept the same way.

Results come back sorted by probability, in the same shape as `bundle view` plus a `probability` field. Good `description` and `triggers` values on bundles therefore improve search quality.

> `jev search` sends concept note contents to the TypeSafe API. Requires `TYPESAFE_API_KEY`.

---

## How this differs from upstream OKF

`llw` follows a variation of the [Open Knowledge Format v0.1](../skill-data/llw-okf/sk-references/spec-v01.md):

| Aspect | OKF v0.1 | llw variant |
| --- | --- | --- |
| Bundle metadata | Optional `index.md` listing, no frontmatter | Required `bundle.md` with frontmatter (`title`, `description`, `parent`, `triggers`) |
| Discovery | Walk directories / `index.md` | Obsidian Bases index over `bundle.md` files |
| Hierarchy | Directory nesting, markdown links | `parent` wikilink (`[[bundles/x/bundle\|x]]`) |
| Concept location | Any relative path | Flat: concepts sit directly in a bundle folder |
| Concept naming | Any | `^[a-z0-9][a-z0-9_-]*$`; `bundle`, `log`, `index` reserved |
| Required concept fields | `type` | `type` and `description` (plus auto-filled `title`, `timestamp`) |
| Timestamp | ISO 8601 | Local `YYYY-MM-DDTHH:mm` |
| Routing hints | None | Bundle-level `triggers` |
| Root | Anywhere | The `bundles/` folder of the `llm-wiki` vault |
| Tooling | None required | Obsidian app + CLI, Bases, Templates (and optionally Jev) |

Unchanged from OKF: the concept fields `type`, `title`, `description`, `resource`, `tags`, and `timestamp`, and the body conventions (`# Schema`, `# Examples`, `# Citations`).

---

## Constraints and gotchas

- **Obsidian must be running**, and the vault must be named exactly `llm-wiki`. There is currently no flag to target a different vault.
- **Bases and Templates core plugins must be enabled.** Without Bases, no bundle resolves. Without Templates, `create` commands fail.
- **Triggers must not contain commas.** Bases returns list properties as a comma-joined string.
- **Indexing lag**: a bundle created a moment ago may take a short time to appear in the base query.
- **Set `--parent` explicitly** for nested bundles. Hierarchy comes from the `parent` property, not from folder nesting.
- **`bundle rename`** renames the folder on disk. It does not rewrite other bundles' `parent` links, so update child bundles with `llw bundle update --parent` afterwards.
- **`bundle sync` calls `llw` from your `PATH`**, so the installed `llw` binary is the one that gets hashed.
