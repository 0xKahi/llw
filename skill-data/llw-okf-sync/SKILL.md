---
name: llw-okf-sync
description: >
  Sync all Knowledge Bundles across the `llm-wiki` vault, updating, out of date bundle.md files,
  with the latest content based on their concepts and child bundles. Use when the user mentions "bundle sync",
  "sync wiki", "enrich knowledge bundles".
---

# LLW OKF SYNC

The `llm-wiki` vault stores knowledge bundles in the `bundles/` directory, at the root of the vault. Each knowledge bundle is a folder that can contain 
concepts, and other child bundles, every bundles folder contains a `bundle.md` file that marks the root of that bundle and contains the knowledge bundles metadata.
This skill is used to sync all knowledge bundles across the vault, find outOfSync `bundle.md` files, and enrich them with its directory of contents. 

## Quick Reference

**Bundle Metadata/Frontmatter Fields:**

| Field | Required? | Description |
|-------|-----------|-------------|
| `title` | YES | title of knowledge bundle (default to bundle folder name) |
| `description` | Recommended | One-sentence summary of knowledge bundle |
| `triggers` | Optional | YAML list for when to utilize knowledge base |
| `parent` | YES(only if parent bundle exists) | for subdirectory groups in bundles to reference its parent bundle as a obsidian backlink  |


parent backlink format: `[[path/to/parent/bundle|parent-bundle-title]]`

**Concept Metadata/Frontmatter Fields:**

| Field | Required? | Description |
|-------|-----------|-------------|
| `type` | YES | A short string identifying the kind of concept. Consumers use this for routing, filtering, and presentation. |
| `title` | YES | title of the concept name (default to concept file name) |
| `description` | Recommended | A single sentence summarizing the concept. |
| `resource` | Optional | A URI that uniquely identifies the underlying asset the concept describes |
| `tags` | Optinal | A YAML list of short strings for cross-cutting categorization.  |
| `timestamp` | YES | ISO 8601 datetime of last meaningful change.  |


**Example Folder Structure:**

```
path/to/bundles/some-backend/
├── bundle.md                     # Bundle index that stores metadata of bundle title, description and triggers.
├── log.md                        # Optional. Chronological history of updates.
├── <concept>.md                  # A concept at the bundle root.
└── database/                     # Subdirectories organize concepts into groups.
    ├── bundle.md                 # subdirectory bundle index
    └── <concept>.md
```

---

## Bundle Syncing

### Step 1: Sync Bundles

```bash
llw bundle sync
```

this command will output the Bundle Sync mainifest which contains summary all the bundles states and 3 filepaths that tracks the bundle syncing process.

**Example Output:**
```
Bundle Sync Manifest

════════════════════════════════════════════════════════════
Summary:
 ● Knowledge Bundles: 10 total, 5 outOfSync 
 ● Pending Tasks: 3 in progress
 ● Completed Tasks: 2 
 ● Ignored Tasks: 0

FilePaths
────────────────────────────────────────────────────────────
currentHashMap: <full_file_path_to_current_hash_map.json> 
generatedHashMap: <full_file_path_to_generated_hash_map.json> 
taskList: <full_file_path_to_task_list.md> 

════════════════════════════════════════════════════════════
```

**FilePaths:**
- currenHashMap: contains the last updated sync state of all bundles in the vault, or an empty json file (if it is the first time running the sync command)
- generatedHashMap: contains the newly generated sync state of all bundles in the vault, with the timestamp of when it was generatted, and a Record of each bundleFolder and its bundleHash  
- taskList: its an auto generated markdown file that contains a list of tasks which are the outOfSync bundles that needs to be updated. 

Example hashMap json:
```json
{
  "generatedTimestamp": "2026-07-25T01:55:40.519Z",
  "bundles": {
    "bundles/ecommerce": "c03b8d8330e03ec0fb3becc53c808db7",
    "bundles/database": "103efa82af7bea22f8fe7449748d0bae",
    "bundles/database/tables": "5cb8fc88c9abad625da2f4dfe80463ad",
  }
}
```

**Workflows:**
1. if all tasks is completed/ignored, and there are 0 pending tasks, but there are still outOfSync bundles.
  - copy the generatedHashMap file to the currentHashMap file, and delete the generatedHashMap file
  - delete the taskList file, and rerun the sync command to check the output
2. if there are 0 pending tasks and 0 outOfSync bundles, means there is nothing to sync, inform the user that the bundles sync is already up to date. 
3. if there are pending tasks move on to step 2.

---

### Step 2: Updating Bundle.md files

read through the taskList file for pending tasks
```md
1. [ ] bundles/some_bundle // pending
2. [x] bundles/some_bundle/child_bundle // completed 
3. [-] bundles/some_other_bundle // ignored 
```

**Guardrails:**
- **DO NOT** update the `bundle.md` metadata/frontmatter fields, only update its contents

example of the `bundle.md` frontmatter fields:
```markdown
---
title: <title name> 
description: <bundle_description>
parent: <obsidian parent link> 
triggers: [<trigger>, <trigger>, …]
---
```
this **SHOULD NOT** be touched, updated, removed or changed in any capacity, only edit the contents below the frontmatter fields.

- **MUST** proccess one task at a time, do not do multiple simultaneously
- only need to read the `bundle.md` file thats being updated, do not need to read any other files, all required data i already provided with the command output mentioned below. 

**Command to View Bundle**
for each pending task in the tasklist, run teh following command to view the bundles data 

```bash
llw bundle view --bundle <bundle_folder_path>
# example
llw bundle view --bundle bundles/some_bundle
```

this command will output the bundles metadata, and the metadata of all its concepts and child bundles. This command output is what we use to derive the  
bundles hash in the generatedHashMap file.

**Important Fields:**
- title: the title of the bundle (will be used for the `bundle.md` main header)
- path: will be used with the vault path to read the `bundle.md` file `<vault_path>/<bundle_path>`
- concepts: list of all concepts and its metadata in the bundle
- childBundles: list of all child bundles and its metadata in the bundle

using the current bundle `path` field along with the full path to the vault, read the bundle.md file and sees what needs to be updated.

> [!NOTE] outOfSync bundles !== outdated bundles
> just because a bundle is outOfSync, does not mean that the `bundle.md`file needs to be updated.
> It could be that there was a minor change to its metadata field or one of its concepts or child bundles, that cause the bundle to have a different hash.
> if thats the case, just mark the task as ignored and move on to the next task.


#### Bundle.md Content Structure

**Overview Structure**
```md
# <bundle-title> (capitalize first letter)

...directory list of all concepts in the bundle.

## Child Bundles
...directory list of all child bundles in the bundle.
```

**Note:** for directory links description, do not reuse the `description` field, instead format it to make it more human readable
as the `description` field is meant for agents to read but for, bundle sync, we want to make it more human readable for the user. 

##### Updating/Adding Concepts Section

based on the returned `concepts` and its metadata from the `llw bundle view` command, structure the concepts section in the `bundle.md` file as follows: 

```markdown
### Section / Group Heading

- [Title 1](relative-url-1) - short description of concept 1
- [Title 2](relative-url-2) - short description of concept 2

### Another Section

- [Title 3](relative-url-3) - short description of concept3 
```

group the concepts by their `type`, `description` and `tags` fields into logical sections. and remove any concepts links  that are no longer in the bundle.


##### Updating/Adding Child Bundles Section

based on the returned `childBundles` and its metadata from the `llw bundle view` command, structure the child bundles section in the `bundle.md` file as follows: 

```markdown
## Child Bundles 

### Section / Group Heading

- [Title 1](relative-url-1) - short description of bundle 1
- [Title 2](relative-url-2) - short description of bundle 2

### Another Section

- [Title 3](relative-url-3) - short description of bundle3 
```

group the childBundles by `description` fields into logical sections. and remove any child bundle links that are no longer in the bundle.

#### Marking Task as Completed
- once the `bundle.md` file has been updated, edit the taskList file and mark the task  as completed, pending `[ ]` to completed `[x]`. 
- move on to the next pending task in the taskList file and repeat the process until all tasks are completed or ignored.
- once all tasks are no longer pending, move on to the next Step.

---

### Step 3: Finalizing Bundle Sync

before finalizing the bundle sync, wait for user confirmation to continue. unless the user has `AUTO MODE` in their prompt, then automatically continue to finalize the bundle sync.

**Response Format**
```
All Bundles have been Updated.
Summary:
- completed Tasks: <count> 
- ignored Tasks: <count> 
continue to finalize the bundle sync? (yes/no)
```

1. next replace the currentHashMap file with the generatedHashMap file, and delete the generatedHashMap file. (both schemas have to be the same)
2. delete the taskList file.
