# Multi-Agent Developer Team — Quick Start

## Overview

This ERP Platform uses a structured multi-agent AI workflow. Each AI agent has a defined role and a `.mdc` rule file in `.cursor/rules/agents/`.

## The Team

| Agent | File | What to say |
|-------|------|-------------|
| **System Architect** | `agents/system-architect.mdc` | "Plan next phases", "Analyse the gap vs Odoo 19" |
| **Feature Developer** | `agents/feature-dev.mdc` | "Implement Phase 246", "Add the X module" |
| **Security Reviewer** | `agents/security-reviewer.mdc` | "Review the new auth module", "Check access rules" |
| **Context Specialist** | `agents/context-specialist.mdc` | "Where is model X defined?", "How does field Y work?" |
| **Docs Writer** | `agents/docs-writer.mdc` | "Update changelog", "Document Phase 246" |
| **UI/UX Designer** | `agents/ui-designer.mdc` | "Design system for ERP dashboard", "Create component spec" |
| **Frontend Builder** | `agents/frontend-builder.mdc` | "Implement UI component", "Build responsive layout" |

## UI UX Pro Max Skill Integration

The UI/UX Designer and Frontend Builder personas use the external skill:
- `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill`

### Install

```bash
npm install -g uipro-cli
uipro init --ai cursor
```

### Usage in Team Flow

1. UI/UX Designer runs the design system generator and updates `design-system/MASTER.md`.
2. UI/UX Designer aligns specs with `docs/brand-system.md`, `docs/frontend-design-rules.md`, and the app-shell/foundations specs.
3. Frontend Builder implements UI from that spec using CSS custom properties, shell-first patterns, and class-based styling.
4. Both agents follow accessibility, responsive, and light/dark-mode checks from the project design rules.

## Standard Development Loop

```
1. Plan
   Ask: "As System Architect, plan Phase 246 for [topic]"
   Output: numbered plan with file paths

2. Implement
   Ask: "As Feature Developer, implement Phase 246"
   Output: code changes + tests

3. Review (for security-sensitive changes)
   Ask: "As Security Reviewer, review the Phase 246 changes"
   Output: security report

4. Document
   Ask: "As Docs Writer, update docs for Phase 246"
   Output: changelog + checklist updates

5. Commit
   git add . && git commit -m "Phase 246: <title>"
```

## Trigger Phrases

The agents respond to these trigger phrases automatically:

- **Planning**: "plan", "next phases", "analyse", "roadmap", "gap analysis"
- **Implementation**: "implement", "create addon", "add model", "build feature"
- **Review**: "review", "check security", "access rules"
- **Exploration**: "where is", "find all", "how does", "trace", "what models"
- **Docs**: "update changelog", "document", "write checklist"

## Long-Term Memory

These files are always read by agents before acting:

| File | Contains |
|------|---------|
| `docs/architecture.md` | System design |
| `docs/ai-rules.md` | Coding rules |
| `docs/brand-system.md` | Product brand and naming |
| `docs/frontend-design-rules.md` | Frontend design constraints |
| `docs/parity_matrix.md` | Odoo 19 parity status |
| `changelog.md` | All changes (Phase 1–389) |
| `DeploymentChecklist.md` | Deployment notes |
| `core/release.py` | Current version |

## Quality Gates

Every feature must pass before merge:

1. `python3 -m pytest tests/test_<feature>*.py -v` — all green
2. `./erp-bin db init -d _test_<feature>` — DB init succeeds
3. Lints clean
4. `changelog.md` updated
5. `DeploymentChecklist.md` updated

## Current Status

- **Version**: see `core/release.py`
- **Completed Phases**: see `docs/parity_matrix.md`
- **Next Focus**: parity-safe implementation and shell/design-system modernization
- **Modules**: see `addons/` and parity docs for current counts

## File Structure Reference

```
erp-platform/
├── .cursor/
│   └── rules/
│       ├── core-protocol.mdc          ← always active
│       └── agents/
│           ├── system-architect.mdc
│           ├── feature-dev.mdc
│           ├── security-reviewer.mdc
│           ├── context-specialist.mdc
│           └── docs-writer.mdc
├── addons/          ← 391 business modules
├── core/            ← ORM, DB, tools
├── docs/            ← Architecture, rules, parity
├── tests/           ← 100+ test files
├── changelog.md
└── DeploymentChecklist.md
```
