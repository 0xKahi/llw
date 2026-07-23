## 1. Skill Data and Registry Conventions

- [x] 1.1 Update the test skill so its folder, registry key, and frontmatter name consistently use `test-skill`, and rename its placeholders to valid `$REF_*` identifiers.
- [x] 1.2 Update registry reference declarations to use complete `$REF_*` keys and target paths relative to the `skills-data` root.
- [x] 1.3 Add reusable registry types and validation constants needed to enforce canonical names and strict placeholder syntax.

## 2. Skill Registry Utility

- [x] 2.1 Implement package-root and `skills-data` discovery from the executing module location without relying on `process.cwd()`.
- [x] 2.2 Implement absolute skill-folder and `SKILL.md` resolution for registered skill names, including clear failures for unknown or missing skills.
- [x] 2.3 Implement safe absolute reference resolution that requires existing files and prevents targets from escaping `skills-data`.
- [x] 2.4 Implement skill-content retrieval with literal global `$REF_*` replacement and rejection of undeclared or unused reference mappings.

## 3. Skills CLI Command

- [x] 3.1 Add the top-level `skills` command and `get <name>` subcommand using the existing command strategy pattern.
- [x] 3.2 Implement default transformed-Markdown output and exclusive `--path` skill-folder output.
- [x] 3.3 Register the skills command in the root CLI and ensure unknown skill errors use the existing non-zero CLI error path.

## 4. Automated Verification

- [x] 4.1 Add a known-output test for `test-skill` that verifies complete Markdown output, global absolute-path replacement, and preservation of non-reference dollar tokens.
- [x] 4.2 Add parameterized integrity tests over every registry entry for skill folder and `SKILL.md` existence, matching frontmatter identity, valid `$REF_*` keys, safe existing reference targets, and exact placeholder/declaration equality.
- [x] 4.3 Add command tests for content mode, folder-only `--path` mode, unknown names, and operation from a working directory outside the package.

## 5. Packaging and Quality Checks

- [x] 5.1 Update package publication configuration to include both `dist` and `skills-data`, and ensure ignored build output is generated before packing.
- [x] 5.2 Add a package-content test or verification step confirming the packed artifact contains `dist/index.js` plus every registered skill and reference asset.
- [x] 5.3 Run the test suite, type checker, linter, build, and packed-package verification; resolve all failures.
