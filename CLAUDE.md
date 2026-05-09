# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

author-cli is a novel-writing workspace where structured canon data (characters, locations, world, plot, etc.) lives in YAML files under `canon/`, and a TypeScript CLI ensures all writes are schema-validated and git-diffable.

## Edit Boundary

- **Can edit directly**: `manuscript/**/*.md` (chapter prose only)
- **Must use CLI**: Everything under `canon/`, chapter file creation/deletion

## Commands

**重要**：所有命令必须在小说项目根目录（包含 `project.yaml` 的目录）运行，不能在 author-cli 工具目录运行。

```bash
# 全局安装后（在小说项目根目录）
author <command> [args]

# 开发模式（在小说项目根目录）
npx tsx <author-cli-path>/tools/src/cli.ts <command> [args]

# Validation
author validate

# Chapter lifecycle (creates/deletes both outline entry + manuscript file)
author chapter add --id <id> --title <title> [--volume v01]
author chapter import --id <id> --title <title> --from <file> [--summary <text>]
author chapter delete <id> [--keep-file]
author chapter list

# Character
author character add --id <id> --name <name> [--role <role>]
author character update <id> --field <field> --value <value>
author character show <id>
author character list
author character note <id> --chapter <ch> --text <text>

# Location / World / Object (same pattern: add, update, show, list, note)
author location add --id <id> --name <name>
author world add --id <id> --name <name> [--category <cat>]
author object add --id <id> --name <name> [--type <type>]

# Timeline
author timeline add --id <id> --title <title> [--chapter <ch>]
author timeline update <id> --field <field> --value <value>
author timeline list

# Proposal workflow (extract suggestions from chapter, then apply or reject)
author suggest --chapter <id>
author proposal list [--status <status>]
author proposal show <id>
author proposal apply <id>
author proposal reject <id>

# Continuity check (detect story inconsistencies)
author check continuity --chapter <id> [--severity <level>]
author check global [--severity <level>]

# RAG index (search across canon and chapters)
author index rebuild
author index status
author index search --query <query> [--limit <n>]

# Outline (for updating outline fields; prefer `chapter` for add/delete)
author outline add-chapter --id <id> --title <title>
author outline update-chapter <id> --field <field> --value <value>
author outline foreshadowing-add --id <id> --setup <ch> [--payoff <ch>] [--note <text>]
author outline foreshadowing-update <id> --field <field> --value <value>
author outline foreshadowing-list [--status <status>]
author outline list

# Render read-only outputs
author render context --chapter <id>
author render canon
author render character <id>

# Tests (在 author-cli 目录运行)
npm test
npm run test:watch
```

**错误示例**（不要这样做）：
```bash
# ❌ 在 author-cli 目录运行会把工具目录当项目目录
cd author-cli && npm run author -- validate
```

## Architecture

### Source of Truth

- **`canon/**/*.yaml`** — structured canon data (characters, locations, world, objects, plot, rules, timeline, book info). This is the source of truth. Never edit these directly; use CLI commands.
- **`manuscript/**/*.md`** — prose chapters. These can be edited directly.
- **`generated/`** — read-only outputs (context packs, canon overview). Can be deleted and regenerated.
- **`proposals/`** — AI-generated suggestions pending user approval.
- **`project.yaml`** — workspace configuration (writing mode, context settings, directory paths).

### Code Layout (`tools/src/`)

- **`cli.ts`** — Commander entry point. Registers all command groups.
- **`schemas/`** — Zod schemas for every canon entity type. Each exports a schema, a type, and a `createDefault*` factory function. `index.ts` re-exports everything.
- **`commands/`** — One file per command group (`validate.ts`, `character.ts`, `location.ts`, `world.ts`, `object.ts`, `timeline.ts`, `chapter.ts`, `render.ts`, `outline.ts`). Each exports a `register*Command(program)` function.
- **`render/`** — `context.ts` generates the context pack for a chapter; `canon.ts` generates the full canon overview. Both output Markdown strings.
- **`utils/`** — `yaml.ts` (YAML read/write with stable formatting), `paths.ts` (project root discovery, directory resolution), `validate.ts` (cross-reference validation).

### Key Design Decisions

- **CLI as write boundary**: All canon mutations go through CLI commands that enforce zod schema validation, ID consistency, and cross-reference checks. This prevents AI from corrupting structured data.
- **Context pack priority**: `render context` assembles writing context in priority order: writingRules > currentChapter > characters > plot > bookInfo > world > locations > objects.
- **Project root discovery**: CLI walks up from cwd to find `project.yaml`. All paths are resolved relative to project root.
- **ESM only**: `"type": "module"` in package.json. All imports use `.js` extensions. No `require()` calls.
- **Field ordering**: YAML output uses `yaml` library's stringify with stable options. Avoid reordering fields in canon files.

### Adding a New Canon Entity Type

1. Create `tools/src/schemas/<type>.ts` with zod schema + `createDefault*` factory.
2. Export from `tools/src/schemas/index.ts`.
3. Add validation in `tools/src/utils/validate.ts`.
4. Add rendering in `tools/src/render/canon.ts` and `context.ts`.
5. Create command file in `tools/src/commands/<type>.ts`.
6. Register in `cli.ts`.

## Workflow for Writing

Skills in `skills/` directory define specialized workflows:

- **`skills/write-scenes/SKILL.md`** — Full writing workflow (validate → context → write → update)
- **`skills/suggest-canon/SKILL.md`** — Extract canon suggestions from chapter prose
- **`skills/continuity-check/SKILL.md`** — Detect story inconsistencies
