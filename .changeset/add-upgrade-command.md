---
"@0xkahi/llw": patch
---

Add `llw upgrade [version] [--check]` to update the CLI and its bundled skills in place. It resolves versions from the npm registry (overridable with `LLW_NPM_REGISTRY`), never downgrades unless a version is given explicitly, and installs with the package manager that originally installed `llw` (bun, npm, pnpm, or yarn), printing manual install commands when that can't be detected.
