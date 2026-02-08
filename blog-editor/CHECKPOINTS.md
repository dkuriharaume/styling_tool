# Tiny Checkpoints

Use these checkpoints for every refactor or feature slice. Keep each checkpoint tiny and repeatable so you never skip audits.

## CP-0: Before You Change Anything (1–2 minutes)
- [ ] Run the safeguard lock check.
- [ ] State the intent in one sentence (what you expect to change and what must not change).
- [ ] Identify the single area of code you will touch.

## CP-1: After Each Small Refactor Chunk (3–5 minutes)
- [ ] Load `index.html` and confirm the editor opens.
- [ ] Add a single block, edit text, and undo/redo once.
- [ ] Export using **Copy M2O** and **Copy HTML** and paste into a scratch file.
- [ ] Reload the page and confirm last-opened draft and scroll position restore.

## CP-2: Before Sharing / Hand‑off (5–8 minutes)
- [ ] Re-run CP-1 with a second draft to confirm draft switching.
- [ ] Confirm no visual regression in the canvas (background, overflow, shadow).
- [ ] Update any notes in `README.md` if behaviors changed.

## Audit Notes (Optional)
Keep brief notes per checkpoint if something is flaky or deferred.

- Date / Change summary:
- Known issues:
- Next checkpoint owner:
