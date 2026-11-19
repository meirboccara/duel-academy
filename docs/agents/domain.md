# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root: it points at one `CONTEXT.md` per context. Read each one relevant to the topic.
- **`<context>/CONTEXT.md`**: the glossary for a single app or package (e.g. `apps/coiffure-nextjs/CONTEXT.md`).
- **`docs/adr/`** at the repo root: system-wide decisions. Also check `<context>/docs/adr/` for decisions scoped to the app or package you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

This is a multi-context repo. Each pnpm workspace under `apps/` or `packages/` is a candidate context; a context only gets a `CONTEXT.md` once it has vocabulary worth writing down.

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← system-wide decisions
├── apps/
│   ├── coiffure-nextjs/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/                  ← context-specific decisions
│   ├── coiffure-nestjs/
│   │   └── CONTEXT.md
│   └── youlli_client/
│       └── CONTEXT.md
└── packages/
    ├── models/
    │   └── CONTEXT.md
    └── ui/
        └── CONTEXT.md
```

A decision that changes how two or more workspaces talk to each other (a shared schema, an API contract, a build convention) belongs in the root `docs/adr/`. A decision that lives and dies inside one workspace belongs in that workspace's `docs/adr/`.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

Where two contexts use the same word for different things, `CONTEXT-MAP.md` is the place that records the translation. Prefer the local context's meaning when working inside it.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
