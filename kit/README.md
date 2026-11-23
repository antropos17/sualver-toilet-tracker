# Tracker «Sualver.az + Туалет»

Shared progress page for Руслан and Сеймур: https://claude.ai/code/artifact/3e6b0ef1-7a3a-43c9-8ed8-7edf927228c5

Every finished step of work in this repository is posted there as a stage: what changed (diff-style lines), before and after screenshots, the GitHub commits, models, tokens, API-equivalent cost and time. The people only look at the page; Claude does all the posting. The page draws a timeline with a slider, a graph of changes per person, and a breakdown per section and per person by change type.

## When to post

- After `git push` from Claude Code. The `PostToolUse` hook in `.claude/settings.json` runs `report.mjs hook`, saves a draft to `.claude/tracker-draft.local.json` and asks you to post.
- After a finished, verified stage without a push, or when the user asks ("отчитайся в трекер"): run `node tools/tracker/report.mjs draft` yourself.
- Not for small edits, failed attempts or work that was not checked.

## Screenshots: before and after

A change that is visible on screen must have a **before** and an **after** screenshot of the same screen, same size, same state. This is the main thing the other person looks at.

1. **Before you start** a change that will be visible, open the screen it affects and take the before shot: `node tools/tracker/report.mjs shot <url> .claude/shots/<slug>-before.png --width 390 --height 844` (add `--dark` or `--full` when that is what changes). `.claude/tracker.json` has a `preview` entry with the local address and how to start it. For a state deep inside the app, write a short Playwright script that gets there and reuse it for the after shot.
2. **After** the change is verified, take the after shot with the same command, size and state: `.claude/shots/<slug>-after.png`.
3. If the before shot was not taken at the start, make it from the base commit in the draft (`base`): extract that version with `git archive <base> <paths> | tar -x -C <temp dir>` (not a checkout of the working tree), start it the same way, shoot the same screen, then remove the temp dir. Never present a current screenshot as "before".
4. One to three pairs per stage, the screens where the difference is clearest. Phone size 390×844 by default, 375×667 for short-screen work, desktop 1280×800 when the change is desktop-only.
5. All pairs of one stage use the same screen size, so they sit in equal frames on the page.
6. Mark what changed. Look at both shots and add `marks` to the **after** entry of each pair: one to three ellipses over the zones that differ, `[{x, y, w, h}]` in percent of the image (`x`, `y` = centre, `w`, `h` = size). Example: a button at the right edge, two thirds down: `{ "x": 84, "y": 68, "w": 30, "h": 6 }`. Mark only real differences, a little larger than the element.
7. A stage with nothing visible (tests, server, git, docs) gets no screenshots and `visual: false`.

Upload each file with the Artifact tool, `action: "upload_asset"`, `url` = the tracker link (several at once with `file_paths`). Keep each returned `id`. `.claude/shots/` is not committed.

## Who is posting

`.claude/tracker.local.json` (not committed) holds `{"person": "ruslan"}` or `{"person": "seymur"}`. If it is missing, ask the user once which of the two they are and create it.

## How to post

1. Read the draft (`.claude/tracker-draft.local.json`): `project`, `person`, `repo`, `branch`, `base`, `commits` (full SHA, subject, GitHub `url`) and `usage` (`startedAt`, `finishedAt`, `wallMin`, `activeMin`, `tokens`, `cost`, `models[]`). Do not edit the numbers. You may rewrite each `models[].purpose` into plain Russian that says what that model did, for example «реализация и тесты» or «субагент: поиск по коду».
2. Pick the section (`group`): read `projects/<project>` with `read_db`, `db_op: "get"`, and use one of its `groups[].id`. One stage, one section; if the work spans two, post two stages.
3. Write everything in one call: Artifact tool, `action: "write_db"`, `db_op: "batch"`, `url` = the tracker link:
   - `set` in `updates`, `doc_id` = `u-<project>-<short-slug>`, data:
     - `project`, `person`, `via: "claude"`, `group`
     - `title`: what changed for a person using the product, up to 90 characters, Russian
     - `items`: 3 to 6 short Russian lines, each starting with `+ ` new, `~ ` changed, `! ` fixed or `- ` removed. These prefixes are counted into the graphs, so choose them carefully: a bug that is gone is `! `, a new control is `+ `, a layout that moved is `~ `.
     - `shots`: `[{id, type, role: "before"|"after", pair: 0, caption, marks}]` (`marks` only on the after entry), one `pair` number per before/after pair, the same `caption` on both (which screen, which size)
     - `visual`: `true` when something on screen changed, `false` otherwise
     - `goalIds` (goals this stage closed, `[]` if none), `commits`, `branch` and `usage` from the draft, `createdAt` (now, ms)
   - For each goal the stage closed: `update` in `goals`, `doc_id` = the goal id, `{done: true, doneAt: <ms>, doneBy: <person>}`, plus `set` in `events`, `doc_id` = `e-<ms>-<goal id>`, `{type: "goal_done", goalId, title, project, person, via: "claude", at: <ms>}`.
   - For a new task that came up: `set` in `goals` with `{project, group, title, done: false, removed: false, order: <ms>, createdAt: <ms>, createdBy: <person>, doneAt: 0, doneBy: ""}` and an event `goal_added`.
   To find goal ids, `read_db` with `db_op: "query"` on `goals`, `query.where: [["project","==","<project>"]]`.
4. Run `node tools/tracker/report.mjs mark` so the next report starts after this one.
5. Tell the user in one line what was posted and which screenshots went with it.

Only facts verified in this session go into the stage. No file paths in the text, no em dashes; commits carry the hashes and links.

## Cost

`cost` is what the same tokens would cost on the Claude API (input, output, cache writes and cache reads, at the prices in `report.mjs`). On a Claude subscription nothing is billed per token; the number is for comparing work, not an invoice.

## Adding another project

Projects are no longer fixed to two. A person adds one in the tracker itself: tab «Цели», button «+ Проект» (name, optional GitHub repository, colour, sections). The project shows up at once for everyone who has the page open: in the stories row, in «Цели», in the side panels and in the «Пост» form.

To let Claude post stages for it from a repository:

1. In the tracker open «Цели», press «Править» and copy the project key shown under the project (`Ключ проекта для Claude`, for example `p-glass-lab`). A key made from a non-Latin name is random, like `p-22dtz5`.
2. Copy `tools/tracker/` (`report.mjs`, this README) into the repository.
3. Create `.claude/tracker.json` with `"project": "<the key>"`, the same `"artifact"` address, and a `"preview"` entry (how to start the app locally and its address) if the project has a screen.
4. Add the push hook to `.claude/settings.json` (merge into existing `hooks` if the file has them):
   ```json
   { "hooks": { "PostToolUse": [ { "matcher": "Bash", "hooks": [
     { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/tools/tracker/report.mjs\" hook" } ] } ] } }
   ```
   and the lines `.claude/*.local.json` and `.claude/shots/` to `.gitignore`.
5. Each person creates `.claude/tracker.local.json` with `{"person":"ruslan"}` or `{"person":"seymur"}`.
6. Add this rule to the project's `CLAUDE.md`:
   ```markdown
   ## Progress tracker

   Руслан and Сеймур follow this project on a shared tracker, and Claude posts every finished stage there. The protocol is in `tools/tracker/README.md`.

   - Before starting a change that is visible on screen, take a "before" screenshot of the affected screen: `node tools/tracker/report.mjs shot <url> .claude/shots/<slug>-before.png`. After the change is verified, take the "after" shot of the same screen, size and state.
   - After a `git push` or a finished, verified stage, post the stage with both screenshots, its section and the change lines (`+` new, `~` changed, `!` fixed, `-` removed).
   ```
7. Check: `node tools/tracker/report.mjs draft` prints the project key, the person and token counts.

### Second person (Сеймур)

Posting writes to the tracker's database with the Artifact tool as the person who runs Claude Code, so that person needs edit access: Руслан opens the tracker, Share, and gives edit rights. Without it `write_db` and `upload_asset` are refused. Claude Code must be signed in to claude.ai for the Artifact tool to exist.

The fastest setup is the ready prompt in `kit/SEYMUR-PROMPT.md` of https://github.com/antropos17/sualver-toilet-tracker: paste it into Claude Code. It clones this repository, asks about each project separately (showcase, GitHub, tracker), installs steps 2 to 7 in the chosen repositories and changes nothing without a yes. On the page, the person presses «Это я» once so likes and comments carry their name.

In a stage, `group` must be one of the section ids of that project (`projects/<key>.groups`, ids look like `g1`, `g2`); an unknown id lands in «Другое». A project removed with «Убрать проект» is only hidden (`archived: true`): its posts stay in the feed and keep their colour.
