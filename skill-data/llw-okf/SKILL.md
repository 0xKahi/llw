---
name: llw-okf 
description: >
  Create, validate, and enrich knowledge bundles based on a custom   
  veriation of the Open Knowledge Format (OKF) bundles — the open
  spec for representing organizational knowledge as markdown files with YAML
  frontmatter. Use when the user mentions "knowledge bundle" 'OKF', 'Open Knowledge Format',
  'knowledge bundle', 'OKF bundle', 'create a knowledge base for agents',
  'validate OKF', 'convert to OKF', 'enrich knowledge docs', 'agent-readable
  knowledge', 'LLM wiki', 'knowledge catalog', 'kcmd'. — the skill has critical structural rules the agent
---

# LLW-OKF Skill 

a custom variation of the Open Knowledge Format (OKF) bundles - that is optimized for obsidian supported mono-repo knowlegebases

the difference between the original OKF spec and this skill is that, this skill
is optimized for obsidian supported mono-repo knowledgebases, and uses a custom cli `llw` to
create, validate, and enrich knowledge bundles and concepts.

for monorepo all kbs will be stored in a `bundles/` folder 

## References
- OKF_SPEC_REF: [Open Knowledge Format (OKF)](sk-references/spec-v01.md).
- OKF_BUNDLE_EXAMPLE_REF: [OKF Bundle Examples](sk-references/okf-examples.md).

---

## Open Knowledge Format (OKF)

OKF is a vendor-neutral, open spec (v0.1, announced June 12, 2026 by Sam McVeety & Amir Hormati at Google Cloud) for representing knowledge as a directory of markdown files with YAML frontmatter. No SDK required — if you can `cat` a file, you can read OKF.
It formalizes the "LLM Wiki" pattern ([Karpathy's gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)) into an interoperable format: wikis written by different producers can be consumed by different agents without translation.
for the full spec read OKF_SPEC_REF 

### Design Principles
1. **Minimally opinionated** — Only `type` is required. The spec defines interoperability surface, not content model.
2. **Producer/consumer independence** — Who writes and who reads are decoupled. Human-authored bundles feed agents; LLM-generated bundles are browsed by humans.
3. **Format, not platform** — No cloud, SDK, or vendor dependency. Value comes from how many parties speak it.

### Key Terminology

- **Bundle** — A directory tree of `.md` files. The unit of distribution (git repo, tarball, or subdirectory).
- **Concept** — One markdown file = one unit of knowledge (table, metric, playbook, API, etc.)
- **Concept ID** — File path within the bundle, minus `.md` suffix. Example: `tables/users.md` → ID `tables/users`
- **Frontmatter** — YAML block between `---` delimiters at file top.
- **Body** — Everything after the frontmatter. Standard markdown.
- **Link** — Standard markdown link expressing a relationship between concepts.
- **Citation** — Link to an external source backing a claim in the body.

**Note:**
- OKF_SPEC_REF is only needed when creating/updating bundles or concepts
- `llw` cli tool already handles validation during creation of bundles/concepts  

---

## 1. Common Commands


### Bundle Commands

**List All Bundles And Their metadata**

```bash
# returns a compact TOON bundle overview (title, path, description, triggers, folder, parent, parentFolder)
llw bundle ls
```

The response includes the bundle's `parentFolder`, which can be used to identify and inspect its parent bundle.

**Display All Bundle Titles in tree format**

shows the hierarchical structure of bundles and their child bundles, with numbered titles (e.g.`1.2. bundle_title`).
for user to easily reference bundle by their number

```bash
llw bundle tree 
```

**View Bundle Meadata, Concepts And Child Bundles**
- returns bundle metadata 
- returns bundle child bundles metadata and its full path (if any)
- returns bundle concepts metadata and its full path (if any)

```bash
llw bundle view --bundle <bundle_folder>
```

### Concept Commands

**View Concept Metadata**
- usually not needed as bundle view command already shows all concepts and its metadata in its bundle
- **DO NOT** use this command to view concept content, read the concept file directly using its full path returned by the bundle view command 

```bash
llw concept view <concept_name> --bundle <bundle_folder> 
```

**Open Concept In Obsidian**

```bash
# opens the concept file in the obsidian app
llw concept open <concept_name> --bundle <bundle_folder>
```

### MISC Non llw Commands

**Get current repo url**
- for matching git repo triggers

```bash
gh repo view --json url -q .url
```

---


## 2. Bundle.md

a new reserved file name for storing a knowledge bundles metadata, it is a required file for all bundles, located in the root of that bundle
folder. act as a index for knowledgebase and funcstions as a replacement for the original OKF `index.md` file, as `llw` cli tool uses this to programatically
index kb and display concepts without having to upkeep a `index.md` for each bundle 

### bundle.md Frontmatter Fields

| Field | Required? | Description |
|-------|-----------|-------------|
| `title` | YES | title of knowledge bundle (default to bundle folder name) |
| `description` | Recommended | One-sentence summary of knowledge bundle |
| `triggers` | Optional | YAML list for when to utilize knowledge base |
| `parent` | YES(only if parent bundle exists) | for subdirectory groups in bundles to reference its parent bundle as a obsidian backlink  |


**parent backlink format**: `[[path/to/parent/bundle|parent-bundle-title]]`

### Example 

```
path/to/bundles/some-backend/
├── bundle.md                     # Bundle index that stores metadata of bundle title, description and triggers.
├── log.md                        # Optional. Chronological history of updates.
├── <concept>.md                  # A concept at the bundle root.
└── database/                     # Subdirectories organize concepts into groups.
    ├── bundle.md                 # subdirectory bundle index
    └── <concept>.md
```

**Parent Bundle.md**

```markdown
---
title: some-backend 
description: knowledge bundle for some backend repository  
triggers: 
  - https://github.com/username/some-backend
  - when referencing some backend 
---
```

**Subdirectory Bundle.md**

```markdown
---
title: database 
description: knowledge bundle for database concepts of some backend
triggers: 
  - when asking about some backend database 
  - when asking about some backend db migrations 
parent: [[bundles/some-backend/bundle|some-backend]]
---
```

---

## 3. Creating a Bundle

**pre-requisites**
- read OKF_SPEC_REF for the original spec  

### How To Create
```bash
# this commands creates both the folder and the bundle.md file with its required metadata
llw bundle create <bundle_folder> \
  --description "<description_value>" \
  --triggers "<list_of_trigger_values>" \
  --parent "<bundle_parent_folder>"
```

**example:**
```bash
llw bundle create bundles/some-backend/database \
  --description "knowledge bundle for database concepts of some backend" \
  --triggers "when asking about some backend database, when asking about some backend db migrations" \
  --parent "bundles/some-backend"
```

**Options:**
- `--description`: bundle description (required)
- `--triggers`:  comma separated bundle triggers (optional)
- `--parent`:  parent bundle folder (only required if the bundle is a subdirectory of another bundle)


### When User/Agent wants to create an OKF bundle:

**optional-references**
- for more example of bundles read OKF_BUNDLE_EXAMPLE_REF

#### 1. Determine scope and structure

what knowledge are we capturing? (tables, metrics, APIs, playbooks, etc.)
Organize concepts into a directory tree that makes sense for the domain.

#### 2. Recommend Bundle Properties

reccomend the following 
- path for new bundle
- title for new bundle 
- description for new bundle
- tags for new bundle
- triggers for new bundle

---

## 4. Updating Bundle Properties

```bash
# only pass the property options you want to change, the rest are left untouched
llw bundle update \
  --bundle "<bundle_folder>" \
  --description "<description_value>" \
  --triggers "<list_of_trigger_values>" \
  --parent "<bundle_parent_folder>"
```

**example:**
```bash
## updating only the description of an existing bundle
llw bundle update \
  --bundle "bundles/some-backend/database" \
  --description "knowledge bundle for database and migration concepts of some backend"
```

---

## 5. Creating Concepts

**pre-requisites**
- read OKF_SPEC_REF for the original spec  

### How To Create

```shell
Arguments:
  concept_name                 concept name (format: lowercase snake/kebab)(without .md extension)
Options:
  --bundle <bundle_folder>     bundle folder path
  --type <type>                concept type
  --description <description>  concept description
  --resource <resource>        concept resource (optional)
  --tags <tags>                comma separated concept tags (optional)
```

```bash
llw concept create <concept_name> \
  --bundle "<bundle_folder>" \
  --type "<type_name>" \
  --description "<description_value>" \
  --resource "<resource_value>" \
  --tags "<list_of_tag_values>"
```

**example:**
```bash
llw concept create bet-table \
  --bundle "bundles/some-backend/database" \
  --type "db-schema" \
  --description "bet table schema for some-backend database" \
  --tags "postgres, database, some-backend"
```

after creating the concept, fullpath to concept file will be returned, for you to write concept contents to

### When User/Agent wants store concepts in the wiki:

#### 1. Determine scope(s) of knowledge we are trying to store 

- what knowledge are we capturing?
- does the wiki already have a bundle that matches the data we are trying to store? (see `workflow` section below for bundle selection)
- do i need to create a new bundle for this knowledge (see `See §3.` for creating new bundles) 

#### 2. When Bundle Is Determined 

- does the bundle have a concept that matches the knowledge we are trying to store? (see `workflow` section below for concept selection)
- if yes see `See §6.` for updating concept and contents
- how are we going to organize concepts into a directory tree that makes sense for the domain.

#### 3. Return Fromat for Concept Creation 

```
creating new concept(s) for <purpose>
logical splits: <number_of_concept_to_split_data_into>

index: 1
bundle: <bundle_name>
concept: <concept_name>
reason: <logical_concept_data_split_reasoning_if_applicable>

index: 2 
bundle: <bundle_name>
concept: <concept_name>
reason: <logical_concept_data_split_reasoning_if_applicable>
(yes/no)?
```

---

## 6. Updating Concepts

**pre-requisites**
- read OKF_SPEC_REF for the original spec  

### Updating Existing Concept Contents

- determine what data are you trying to update
- does concept have out of date information that needs to be updated?
- which information needs to be added/updated/removed 
- does the concept have any related concepts that might need to be updated as well

#### Return Format

```
updating concept(s) for <purpose>

index: 1
bundle: <bundle_name>
concept: <concept_name>
summary: <short_summary_of_what_is_being_updated>

index: 2 
bundle: <bundle_name>
concept: <concept_name>
summary: <short_summary_of_what_is_being_updated>
(yes/no)?
```

### Updating Concept Properties

only done when needed to update concept metadata, not the concept content itself 

```bash
# only pass the property options you want to change, the rest are left untouched
llw concept update <concept_name> \
  --bundle "<bundle_folder>" \
  --type "<type_name>" \
  --description "<description_value>" \
  --resource "<resource_value>" \
  --tags "<list_of_tag_values>" \
  --timestamp "<timestamp_value>"
```

**example:**
```bash
## appending new tag `sql` to concept file (include existing tags)
llw concept update bet-table \
  --bundle "bundles/some-backend/database" \
  --tags "postgres, database, some-backend, sql"

## bumping the concept timestamp to now
llw concept update bet-table --bundle "bundles/some-backend/database" --timestamp

## setting an explicit timestamp
llw concept update bet-table --bundle "bundles/some-backend/database" --timestamp "2026-07-02T03:37"
```

**Notes:**
- use `--timestamp` to log concept updated time when editing a concept content

---

## Workflows

### Bundle/Concept Selection 

see `See §1.` for listing all bundles and their metadata, and viewing a bundles concepts

#### Which Bundle To Condider?

based on the user request determine their intent and context,and select bundle based on its metadata
- `description`: if concept/question matches the description of a bundle
- `triggers`: if concept/question matches any of the triggers of a bundle

**Descision Hierarchy:**
- `description` always takes precedence over `triggers` when determining which bundle to use
- `triggers` are the supporting role to help determine which bundle to use
- if triggers was a deciding factor also consider the bundles children as they are related to the parent bundle and might be a better fit

**Guards:**
- when Creating a new concept **MUST NOT** assume which bundle to use, always ask the user to confirm the bundle you are going to use 

#### Which Concept To Read?

follows the same descision hierarchy as above for selecting bundle

- view bundle concepts and determine concept to read based on its metadata
- if no concept matches criteria, move to the next most relevant bundle

even if no concepts can be found that matches criteria. **DO NOT** recursively check all bundles even, just tell the user no concept was found. 
bundles that do not logically match the users criteria should not be part of the consideration for finding concepts, this saves time and tokens for the user. 

**Return Format When No Concept Match**

```
no concept matches search criteria
bundles considered: <list_of_bundles_considered>
concepts: <list_of_concepts_considered>
```

#### Displaying Bundle For User Selection

see `See §1.` for Displaying bundles in a tree format, tool output has numbered titles so user can easily pick bundle etc.

> [!dev] use bundle 2.1

you **DO NOT** need to rewrite the output of the command to the user, they can already see it just return

```
available bundles are displayed above in tool output 
```

**Return Format With Suggestion**
used when creating new concepts or creating new sub bundles after following the same proccess above for displaying bundles return

```
I suggest using 
- <number>. <bundle_title>
- <number>. <bundle_title>
```

### Proccesing Raw folder

get the vaults full path with `llw` and view its `raw/`  folder
for each entry in the `raw/` folder you are meant to process each document and store it as concept/concepts,
`See §5.` for creating new concepts and `See §6.` for updating existing concepts

**Triggers:**
when user request include
- process llw raw  
- store llw raw 
- etc...

#### Smart detection

based on the document contents you should 
- you should first try and determine which bundle to store the new concept in
- you should determine if the concept should be newly created or it should update an existing concept
- if applicable you should add backlinks to other concepts if they are realated

#### After Proccessing Raw document

remove proccessed document from `raw/` folder

when no bundle can be determined, return the following to user
```
no bundle exists that matches <raw_document> content 
do you want to create a new bundle for this document?
or select a existing bundle?
```
