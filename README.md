# Sualver.az + Туалет tracker

A shared progress page for two people, Руслан (`antropos17`) and Сеймур (`seymurglv`), who build their projects with Claude Code. Live page: https://claude.ai/code/artifact/3e6b0ef1-7a3a-43c9-8ed8-7edf927228c5

## What it is

- `tracker.html` is the page: a feed of work stages with before and after screenshots, goals per project, a showcase of all projects and profiles. It runs as a claude.ai artifact and keeps its data in the artifact's database (`updates`, `goals`, `events`, `projects`, `showcase`, `comments`, `likes`, `people`).
- People only look and comment. Claude Code posts the stages.

## How posting works

1. Each project repository carries the kit in `tools/tracker/` (`report.mjs` and its README) and `.claude/tracker.json` with the project key.
2. After `git push`, a `PostToolUse` hook runs `report.mjs hook`. It reads the session logs, counts tokens, API-equivalent cost, models, time and commits, and saves a draft.
3. Claude takes before and after screenshots (`report.mjs shot`), uploads them with the Artifact tool and writes the stage to the database in one `write_db` batch, as described in `kit/README.md`.

Writing needs edit access to the artifact for the person whose Claude Code posts.

## Install the kit

- In an existing repository: follow «Adding another project» in [`kit/README.md`](kit/README.md).
- For Сеймур: paste [`kit/SEYMUR-PROMPT.md`](kit/SEYMUR-PROMPT.md) into Claude Code; it sets everything up and asks before each step.

Requirements: Node 18+, git, Claude Code signed in to claude.ai. Screenshots use the project's own Playwright.
