# TASK-046 release browser QA

Date: 2026-08-29

Release content: `quiet-cascade-expansion-v3`

Runner: Playwright 1.62.1, Chromium projects from `playwright.config.mjs`

## Result

The canonical staged release passed the focused browser matrix. A completed
`quiet-cascade-characterization-v2` save migrated through the live client into
Shift 7 on desktop and mobile, and a twelve-Match save exposed the deliberate
current-content ending and isolated Shift 12 review under reduced motion and
200% text. No page error, console error, horizontal overflow, fabricated Match
result, or release-copy overstatement was observed.

| Project | Passed | Skipped | Failed | Exercised path |
| --- | ---: | ---: | ---: | --- |
| `chromium-desktop` | 1 | 1 | 0 | v2 ending migration, six preserved history entries, keyboard entry into Shift 7, focus, alt text, reflow |
| `chromium-tablet` | 0 | 2 | 0 | Explicitly skipped; TASK-046 adds no tablet-only contract beyond the already-tested responsive Story surface |
| `chromium-mobile` | 1 | 1 | 0 | v2 ending migration, touch entry into Shift 7, focus, alt text, mobile reflow |
| `chromium-reduced-motion` | 1 | 1 | 0 | twelve-Match current-content ending, disabled canonical Continue, twelve review entries, Shift 12 review, reduced motion, 200% text, focus, reflow |
| **Total** | **3** | **5** | **0** | Eight project/test combinations |

## Assertions exercised

- The stored campaign-one record begins as
  `quiet-cascade-characterization-v2`, with six accepted Match results and the
  reviewed `ending.qc01.defensible_release` marker.
- Reloading the live release migrates that record to
  `quiet-cascade-expansion-v3`, clears only the predecessor terminal marker,
  preserves all six results, labels the next state `Expansion available`, and
  enters `story.qc02.s07.entry.01` without replaying a Match.
- Desktop activation works from focused keyboard Enter; mobile activation works
  through the touch path. The first expansion scene restores focus to Continue,
  exposes a text alternative for its decorative background, and has no
  document-level horizontal overflow.
- A fully completed twelve-Match record ends at
  `ending.qc02.current_content`. Story Home says that all twelve *currently
  released* episodes are complete, disables canonical Continue, preserves all
  twelve review entries, and makes no all-future-content claim.
- Explicit `prefers-reduced-motion: reduce` emulation remains active after
  reload. At 200% root text size, Story Home and the Shift 12 review reflow
  without horizontal overflow; the review opens at
  `story.qc02.s12.entry.01` and restores keyboard focus without changing the
  canonical ending.

## Commands and totals

```powershell
node --check tests/browser/task-046-story-expansion-release.spec.mjs
node --check tests/task-046-story-expansion-release.test.mjs
```

Exit code `0`; both files parsed successfully.

```powershell
node --test tests/task-046-story-expansion-release.test.mjs
```

Exit code `0`; 9 passed, 0 failed, 0 skipped, 0 cancelled.

```powershell
& .\node_modules\.bin\playwright.CMD test tests/browser/task-046-story-expansion-release.spec.mjs --reporter=line
```

Exit code `0`; 3 passed, 5 intentional project skips, 0 failed in 40.0 seconds.

The first exploratory browser run exited `1` with 2 passed, 5 skipped, and 1
failed because the focused test relied on the project label to set the media
query. The test was corrected to call Playwright's explicit
`page.emulateMedia({ reducedMotion: 'reduce' })`, matching the repository's
established reduced-motion QA pattern. The complete matrix then passed; no
production source or content changed in response.

## Unresolved items

None.
