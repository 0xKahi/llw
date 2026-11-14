# @0xkahi/llw

## 0.1.1

### Patch Changes

- b84a9ce: Add `llw upgrade [version] [--check]` to update the CLI and its bundled skills in place. It resolves versions from the npm registry (overridable with `LLW_NPM_REGISTRY`), never downgrades unless a version is given explicitly, and installs with the package manager that originally installed `llw` (bun, npm, pnpm, or yarn), printing manual install commands when that can't be detected.

## 0.1.0

### Minor Changes

- bf40b36: Initial release of `llw`, the llm-wiki CLI.
  
  - `llw bundle`: list, tree, view, create, update, rename, and sync knowledge bundles, indexed by Obsidian Bases
  - `llw concept`: view, create, update, and open concepts, created from Obsidian Templates
  - `llw jev`: semantic bundle and concept search powered by TypeSafe Jev
  - `llw vault`: vault path, info, and raw bundle index
  - `llw skills`: bundled agent skills (`llw-okf`, `llw-okf-sync`, `llw-vault-setup`) served by the CLI
  - `obsidian-setup/`: the Obsidian base, templates, and Web Clipper template for the `llm-wiki` vault
