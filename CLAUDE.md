# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

author-cli is a novel-writing workspace where structured canon data (characters, locations, world, plot, etc.) lives in YAML files under `canon/`, and a TypeScript CLI ensures all writes are schema-validated and git-diffable.

## Edit Boundary

- **Can edit directly**: `manuscript/**/*.md` (chapter prose only)
- **Must use CLI**: Everything under `canon/`, chapter file creation/deletion

## Commands

```bash
npm run author -- <command> [args]

# Validation
npm run author -- validate

# Chapter lifecycle (creates/deletes both outline entry + manuscript file)
npm run author -- chapter add --id <id> --title <title> [--volume v01]
npm run author -- chapter delete <id> [--keep-file]
npm run author -- chapter list

# Character
npm run author -- character add --id <id> --name <name> [--role <role>]
npm run author -- character update <id> --field <field> --value <value>
npm run author -- character show <id>
npm run author -- character list
npm run author -- character note <id> --chapter <ch> --text <text>

# Location / World / Object (same pattern: add, update, show, list, note)
npm run author -- location add --id <id> --name <name>
npm run author -- world add --id <id> --name <name> [--category <cat>]
npm run author -- object add --id <id> --name <name> [--type <type>]

# Timeline
npm run author -- timeline add --id <id> --title <title> [--chapter <ch>]
npm run author -- timeline update <id> --field <field> --value <value>
npm run author -- timeline list

# Proposal workflow (extract suggestions from chapter, then apply or reject)
npm run author -- suggest --chapter <id>
npm run author -- proposal list [--status <status>]
npm run author -- proposal show <id>
npm run author -- proposal apply <id>
npm run author -- proposal reject <id>

# Continuity check (detect story inconsistencies)
npm run author -- check continuity --chapter <id> [--severity <level>]
npm run author -- check global [--severity <level>]

# RAG index (search across canon and chapters)
npm run author -- index rebuild
npm run author -- index status
npm run author -- index search --query <query> [--limit <n>]

# Outline (legacy, prefer `chapter` for add/delete)
npm run author -- outline add-chapter --id <id> --title <title>
npm run author -- outline update-chapter <id> --field <field> --value <value>
npm run author -- outline list

# Render read-only outputs
npm run author -- render context --chapter <id>
npm run author -- render canon
npm run author -- render character <id>

# Tests
npm test
npm run test:watch
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
