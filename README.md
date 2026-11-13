# llm-wiki (`llw`)

> A persistent, agent-friendly knowledge base built on Obsidian, plus the CLI and agent skills to manage it.

`llw` is a CLI that turns an [Obsidian](https://obsidian.md) vault into a structured knowledge base that AI agents can read, write, and search reliably. Knowledge is stored as plain markdown with YAML frontmatter, following a variation of Google's **Open Knowledge Format (OKF)**. It is organized into:

- **Bundles**: folders that group related knowledge on one area. Each bundle has a `bundle.md` holding its metadata (title, description, triggers, parent).
- **Concepts**: individual notes inside a bundle (a schema, an API, a decision, a how-to…).

`llw` does not reimplement a markdown database. It builds on Obsidian:

- **Obsidian Bases** index every bundle in the vault, so lookups are fast and consistent.
- **Obsidian Templates** create bundles and concepts with the correct frontmatter.
- **The Obsidian CLI** is the only path `llw` uses to query and edit the vault.

On top of that, `llw` ships a suite of **agent skills** (installable with `npx skills`). They teach agents how to add, enrich, search, and sync knowledge without breaking the vault's structure.

### Features

- 📚 **Bundle and concept management**: create, view, update, rename, and browse knowledge as a tree.
- 🔎 **Semantic search** with [TypeSafe Jev](https://typesafe.ai) (optional): ask a question and get the bundles and concepts most likely to answer it, with probabilities.
- 🔄 **Bundle sync**: detect bundles whose contents changed so agents can refresh their `bundle.md` summaries.
- 🤖 **Agent skills served by the CLI**: skill instructions always match the installed CLI version.
- 🪶 **Token-efficient output**: data commands default to compact [TOON](https://github.com/toon-format/toon), with JSON available.

---

## Installation

### Prerequisites

| Requirement | Why |
| --- | --- |
| [Bun](https://bun.sh) | `llw` runs on the Bun runtime. |
| [Obsidian](https://obsidian.md) desktop app, **running** | All vault operations go through the Obsidian CLI. |
| Obsidian CLI enabled | *Settings → General → Command line interface*. Check with `obsidian version`. |
| A vault named exactly **`llm-wiki`** | `llw` targets this vault by name. |
| Core plugins **Bases** and **Templates** enabled | *Settings → Core plugins*. Used for indexing and note creation. |
| `TYPESAFE_API_KEY` *(optional)* | Only needed for the `llw jev` search commands. |

### 1. Install the CLI

```bash
bun add -g @0xkahi/llm-wiki
# or
npm install -g @0xkahi/llm-wiki   # Bun must still be on your PATH
```

Verify the install:

```bash
llw --version
llw skills list
```

### 2. Install the agent skills

```bash
npx skills add 0xKahi/llw
```

This installs the `llm-wiki` discovery skill into your agent (Claude Code, Codex, Cursor, pi, …). The discovery skill is intentionally thin: it routes the agent to the full workflows, which are served by the installed CLI (`llw skills view <name>`). Install the CLI from step 1 as well.

### 3. Set up the vault

Create a vault named `llm-wiki` in Obsidian and enable the **Bases** and **Templates** core plugins. Then let your agent do the rest:

> *"Set up my llm-wiki vault"*

The agent follows the `llw-vault-setup` skill. It copies the shipped base and templates into the vault, configures the Templates plugin, creates the `bundles/` folder, and verifies the result.

<details>
<summary>Manual setup</summary>

The files live in the package's `obsidian-setup/` folder:

```bash
VAULT="$(obsidian vault=llm-wiki vault info=path)"
SETUP="$(llw skills view llw-vault-setup --path)/../../obsidian-setup"

mkdir -p "$VAULT/bases" "$VAULT/config/templates" "$VAULT/bundles"
cp "$SETUP/bases/bundles-index.base"          "$VAULT/bases/"
cp "$SETUP/config/templates/bundle.md"        "$VAULT/config/templates/"
cp "$SETUP/config/templates/concept.md"       "$VAULT/config/templates/"
# Only if you have no existing Templates config. Otherwise set
# "folder": "config/templates" and "timeFormat": "HH:mm" by hand.
cp "$SETUP/.settings/templates.json"          "$VAULT/.obsidian/templates.json"

obsidian vault=llm-wiki reload
llw bundle list --pretty   # → bundles: [] on a fresh vault
```

</details>

### 4. (Optional) Enable semantic search

```bash
export TYPESAFE_API_KEY="<your key>"
llw jev status   # → available
```

### 5. (Optional) Web Clipper inbox

Import `obsidian-setup/config/web-clipper/llm-wiki-template.json` into the [Obsidian Web Clipper](https://obsidian.md/clipper) extension. Clipped pages then land in the vault's `raw/` folder. Ask your agent to *"parse raw"* to turn them into bundles and concepts.

---

## Usage

### With an agent (recommended)

`llw` is designed to be driven by agents through its skills. Once the skills are installed, just talk to your agent:

| You say… | Skill used |
| --- | --- |
| *"Add what we learned about the payments DB schema to the wiki"* | `llw-okf` (core) |
| *"What does the wiki know about our deploy pipeline?"* | `llw-okf` (core) |
| *"Parse raw"* | `llw-okf` (core) |
| *"Sync the wiki"* / *"bundle sync"* | `llw-okf-sync` |
| *"Set up the llm-wiki vault"* | `llw-vault-setup` |

| Skill | Alias | Purpose |
| --- | --- | --- |
| `llw-okf` | `core` | Create, validate, enrich, and search bundles and concepts (default workflow). |
| `llw-okf-sync` | `bundle-sync` | Find out-of-sync bundles and refresh their `bundle.md` summaries. |
| `llw-vault-setup` | `setup` | Set up or repair the files `llw` needs inside the vault. |

Read any skill directly with `llw skills view <name|alias>`.

### From the command line

```bash
# Create a top-level bundle, a child bundle, and a concept
llw bundle create bundles/backend --description "Backend services" --triggers "api, services"
llw bundle create bundles/backend/database \
  --description "Database schemas and migrations" \
  --triggers "db, migrations, postgres" \
  --parent bundles/backend
llw concept create users-table \
  --bundle bundles/backend/database \
  --type db-schema \
  --description "Schema of the users table" \
  --tags "postgres, sql"
# → prints the full path of the new note, ready for its body to be written

# Browse
llw bundle tree --verbose
llw bundle view --bundle bundles/backend/database --pretty
llw vault info

# Search (requires TYPESAFE_API_KEY)
llw jev search -q "how are user ids generated?"
```

### Command reference

Commands marked with † accept `--format, -f <toon|json>` (default `toon`) and `--pretty` (indented output instead of compact).

#### `llw bundle`

| Command | Description |
| --- | --- |
| `bundle list` (`ls`) † | List every bundle in the vault. |
| `bundle tree [--verbose]` | Print the bundle hierarchy. `--verbose` adds paths, descriptions, and triggers. |
| `bundle view --bundle <folder>` † | Show a bundle with its concepts and direct child bundles. |
| `bundle create <folder> --description <d> [--triggers <csv>] [--parent <folder>]` | Create a bundle (folder + `bundle.md`) under `bundles/`. |
| `bundle update --bundle <folder> [--description] [--triggers] [--parent]` | Update bundle metadata. |
| `bundle rename --bundle <folder> --title <title>` | Rename a bundle and its folder. |
| `bundle sync [--reset]` | Generate a manifest of out-of-sync bundles in `cache/bundles/`. `--reset` discards a pending sync. |

#### `llw concept`

| Command | Description |
| --- | --- |
| `concept view <name> --bundle <folder>` † | Show a concept's properties and full path. |
| `concept create <name> --bundle <folder> --type <t> --description <d> [--resource <uri>] [--tags <csv>]` | Create a concept from the template. |
| `concept update <name> --bundle <folder> [--type] [--description] [--resource] [--tags] [--timestamp [YYYY-MM-DDTHH:mm]]` | Update concept properties. A bare `--timestamp` sets it to now. |
| `concept open <name> --bundle <folder>` | Open the concept in Obsidian. |

#### `llw jev` (requires `TYPESAFE_API_KEY`)

| Command | Description |
| --- | --- |
| `jev status` | Print `available` / `unavailable` (exits `1` when unavailable). |
| `jev bundle_search -q <question>` † | Rank bundles likely to cover a question. |
| `jev search -q <question>` † | Rank bundles **and** the concepts inside them that likely answer a question. |

> `jev search` sends the contents of your concept notes to the TypeSafe API for scoring.

#### `llw vault`

| Command | Description |
| --- | --- |
| `vault path` | Print the vault's absolute path. |
| `vault info` | Print a vault summary: bundle and concept counts plus the bundle tree. |
| `vault base` | Print the raw bundle index (Obsidian Bases query result) as JSON. |

#### `llw skills`

| Command | Description |
| --- | --- |
| `skills list` (`ls`) `[--json]` | List the bundled agent skills. |
| `skills view <name\|alias> [--path]` | Print a skill's instructions (or its folder path with `--path`). |

Run `llw <command> --help` for full details on any command. Errors are written to stderr and exit with code `1`, so stdout stays safe to parse.

---

## Documentation

- [**How bundles and the Obsidian Bases indexer work**](docs/bundles-and-indexing.md): the vault layout, bundle and concept schemas, how the index, templates, and sync work, and how this OKF variant differs from upstream OKF.
- [**Skill registry**](docs/skill-registry.md): how skills are authored, registered, and served by `llw skills` (for contributors).
- [**OKF v0.1 specification (vendored)**](skill-data/llw-okf/sk-references/spec-v01.md): the upstream format this project builds on.
- [**OKF examples**](skill-data/llw-okf/sk-references/okf-examples.md): example bundles and concepts.

### Development

```bash
bun install
bun run dev -- --help    # run from source
bun test                 # run tests
bun run check            # lint (biome) + type-check
bun run build            # build to dist/
```

## License

[MIT](LICENSE) © 0xKahi
