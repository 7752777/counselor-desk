# Public Repository Documentation Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public repository easy to browse for Windows, macOS, web users, developers, and AI-based reimplementers without breaking existing links or build paths.

**Architecture:** Keep source, test, sample, and Electron paths unchanged. Add a stable English documentation index and canonical English entry points; retain existing Chinese documents as compatibility content that links to the canonical pages. Add the ten requested prompt-engineering text files under one clearly named archive directory. Update README to be the short public map rather than duplicating every procedure.

**Tech Stack:** Markdown, UTF-8 text files, Git links, existing pnpm scripts, existing Node test/lint/public-surface checks.

---

### Task 1: Create the documentation map

**Files:**
- Create: `docs/README.md`
- Create: `docs/getting-started.md`
- Create: `docs/user-guide.md`
- Create: `docs/development.md`
- Create: `docs/data-contract.md`
- Create: `docs/prompt-archive.md`

- [ ] Write a directory map grouped into tutorials, how-to guides, reference, explanation, release records, screenshots, and prompt archive.
- [ ] Make `docs/getting-started.md` describe Web, Windows, and macOS startup with exact filenames and links to `v4-desktop-installation.md`.
- [ ] Make `docs/user-guide.md` point users to the maintained Chinese manual and explain which audience should use each guide.
- [ ] Make `docs/development.md` list install, dev, test, lint, public-surface, Windows build, macOS build, and release commands.
- [ ] Make `docs/data-contract.md` point to the existing data-format and migration documents and state the local-first storage boundary.
- [ ] Make `docs/prompt-archive.md` index exactly ten prompt text files in execution order.

### Task 2: Add the ten prompt-engineering text files

**Files:**
- Create: `docs/prompts/01-product-foundation.txt`
- Create: `docs/prompts/02-student-ledger-and-dynamic-data.txt`
- Create: `docs/prompts/03-daily-ledgers-and-workflow-links.txt`
- Create: `docs/prompts/04-risk-support-and-graduation.txt`
- Create: `docs/prompts/05-policy-files-and-form-library.txt`
- Create: `docs/prompts/06-import-export-backup-and-storage.txt`
- Create: `docs/prompts/07-mobile-and-phone-exchange.txt`
- Create: `docs/prompts/08-windows-and-macos-desktop.txt`
- Create: `docs/prompts/09-ui-visual-system-and-accessibility.txt`
- Create: `docs/prompts/10-testing-documentation-and-release.txt`

- [ ] Keep each file independently copyable as a prompt with role, scope, constraints, deliverables, and acceptance checks.
- [ ] Cover v4.0 data modules, policy/form files, normalized naming, desktop storage, universal macOS packaging, mobile exchange, visual system, testing, and release documentation.
- [ ] Use anonymized data and explicitly prohibit hidden cloud sync, secrets, and unverified claims.
- [ ] Keep filenames ASCII and numbered so a reader can execute them in order.

### Task 3: Add canonical README links while preserving legacy paths

**Files:**
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `使用说明.md`
- Modify: `docs/使用指南.md`
- Modify: `docs/辅导员工作台使用手册.md`

- [ ] Add a concise repository map near the startup section.
- [ ] Add a three-column Web/Windows/macOS usage matrix including DMG, ZIP, NSIS, portable, and unsigned/signing limitations.
- [ ] Link the documentation index, canonical getting-started/development/user-guide/data/prompt pages, screenshots, acceptance report, and release-signing guide.
- [ ] Turn legacy Chinese entry documents into maintained compatibility pages or add canonical links without removing their existing content.
- [ ] Remove duplicated or contradictory startup wording while preserving privacy and data-path warnings.

### Task 4: Verify links, naming, and release claims

**Files:**
- Test: repository-wide file/link checks and existing test suite.

- [ ] Run a script that validates every new local Markdown link target and every prompt archive link.
- [ ] Check new filenames are lowercase ASCII with numeric prompt ordering.
- [ ] Run `pnpm run lint`, `pnpm run check:public`, `git diff --check`, and the full `pnpm test` command.
- [ ] Review the final diff for source/test/build-path churn; only documentation and the plan should change.
- [ ] Commit with a documentation-focused message and push both `codex/v4-integration-cleanup` and `master` after verification.
