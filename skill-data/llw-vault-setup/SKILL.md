---
name: llw-vault-setup
description: >
  Set up (or repair) the files the `llw` CLI needs inside the user's `llm-wiki` Obsidian vault:
  the bundles base, the bundle/concept templates, the Templates plugin config, and the `bundles/` folder.
  Use when the user mentions "setup llm-wiki", "setup vault", "llw setup", or when an `llw` command fails
  because the base file or templates are missing.
---

# LLW Vault Setup

This skill **only sets up files** inside an existing `llm-wiki` vault.
It does not create the vault, install Obsidian, or change app settings. The user does those, as listed below.

## Guardrails

- **DO NOT** create, register, rename, or move a vault. If anything is missing, stop and tell the user what to do.
- **NEVER** overwrite an existing file without showing the user a diff and getting confirmation.
- **DO NOT** edit the shipped base or template contents. Copy them exactly; `llw` depends on their filters and frontmatter keys.
- Only write inside the vault folder (including its `.obsidian/templates.json`).

---

## Step 1: Check the user's prerequisites

Run:

```bash
obsidian version
obsidian vaults verbose
```

Both commands must succeed, and the vault list must include a vault named **exactly** `llm-wiki`.
If either check fails, **stop** and send the user this, then wait for them to confirm before re-running the check:

```
Before I can set up the llm-wiki files, please:
1. Install and open the Obsidian desktop app (it must be running whenever you use llw).
2. Turn on the Obsidian CLI: Settings → General → Command line interface.
3. Create a vault named exactly "llm-wiki" (vault switcher → Create new vault, or "Open folder as vault"
   on a folder named llm-wiki).
4. Make sure the "Bases" and "Templates" core plugins are on (Settings → Core plugins).
Let me know when that's done.
```

Then get the vault path and the shipped setup files:

```bash
VAULT_DIR="$(obsidian vault=llm-wiki vault info=path)"
SETUP_DIR="$(llw skills view llw-vault-setup --path)/../../obsidian-setup"
ls -la "$SETUP_DIR/.settings" "$SETUP_DIR/bases" "$SETUP_DIR/config/templates"
```

---

## Step 2: Copy the vault files

| Source (`$SETUP_DIR/...`) | Target (`$VAULT_DIR/...`) |
|---|---|
| `bases/bundles-index.base` | `bases/bundles-index.base` |
| `config/templates/bundle.md` | `config/templates/bundle.md` |
| `config/templates/concept.md` | `config/templates/concept.md` |
| (folder) | `bundles/` |

```bash
mkdir -p "$VAULT_DIR/bases" "$VAULT_DIR/config/templates" "$VAULT_DIR/bundles"
for f in bases/bundles-index.base config/templates/bundle.md config/templates/concept.md; do
  if [ ! -e "$VAULT_DIR/$f" ]; then cp "$SETUP_DIR/$f" "$VAULT_DIR/$f" && echo "created $f"
  elif diff -q "$SETUP_DIR/$f" "$VAULT_DIR/$f" >/dev/null; then echo "ok      $f"
  else echo "DIFFERS $f"; fi
done
```

For any `DIFFERS` file, show `diff "$SETUP_DIR/<f>" "$VAULT_DIR/<f>"` to the user and only overwrite if they agree.

`cache/` is created automatically by `llw bundle sync`. Don't create it.

---

## Step 3: Configure the Templates plugin folder

The Templates plugin reads `$VAULT_DIR/.obsidian/templates.json`. The shipped version lives at
`$SETUP_DIR/.settings/templates.json` (the package folder is `.settings`, not `.obsidian`):

```json
{ "dateFormat": "", "timeFormat": "HH:mm", "folder": "config/templates" }
```

- If `$VAULT_DIR/.obsidian/templates.json` doesn't exist, copy the shipped file there.
- If it exists, **merge**: set `folder` to `config/templates` and `timeFormat` to `HH:mm`, and keep every other key.
  Leave `dateFormat` empty, because the default `YYYY-MM-DD` gives concept timestamps the format `YYYY-MM-DDTHH:mm`.

Obsidian may not notice the change while it's running, so reload:

```bash
obsidian vault=llm-wiki reload
```

---

## Step 4: Verify

These checks are read-only:

```bash
obsidian vault=llm-wiki templates       # must list bundle and concept
llw vault path                          # prints VAULT_DIR
llw bundle list --pretty                # fresh vault: { "bundles": [] }
```

- If `templates` doesn't list both, ask the user to check **Settings → Templates → Template folder location** = `config/templates`
  and that the Templates core plugin is on.
- If `llw bundle list` fails on `base:query`, ask the user to make sure the Bases core plugin is on.

---

## Final report

```
llm-wiki vault files ready (<VAULT_DIR>)
- bases/bundles-index.base: created | ok | kept user version
- config/templates/bundle.md: created | ok | kept user version
- config/templates/concept.md: created | ok | kept user version
- bundles/: ready
- .obsidian/templates.json: created | merged | ok
- verification: templates ✓, llw bundle list ✓
```

List anything the user still needs to fix by hand.
