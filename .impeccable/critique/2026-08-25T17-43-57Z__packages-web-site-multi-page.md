---
target: packages/web (site, multi-page)
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-08-25T17-43-57Z
slug: packages-web-site-multi-page
---
Method: dual-agent (A: a9ce02980b8c7e189 · B: a28fd1293932bf02f)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Live composing underline/caret/candidate popup and timed "Copied" feedback are solid, but ambiguity-resolved state is visual-only — nothing surfaces to non-visual users. |
| 2 | Match System / Real World | 4 | FAQ defines 두벌식 for people who've never heard the term; uses real linguistic terms (促音, ん) framed as "the spelling you already know." |
| 3 | User Control and Freedom | 2 | Korean tool has Escape-to-freeze and click-to-reopen; the Japanese tool has neither — once kana commits, only serial backspace exists. |
| 4 | Consistency and Standards | 3 | Header/nav/footer are byte-identical across all 4 pages, but the interaction contract (Escape, click-reopen) silently differs between the two tools sharing that chrome. |
| 5 | Error Prevention | 2 | Capital-letter/hyphen escape hatch genuinely prevents errors, but Clear wipes all state on one click with zero confirmation or undo, and paste has no handler at all. |
| 6 | Recognition Rather Than Recall | 4 | Every candidate row shows both native script and its romanized syllable-break spelling, matching the spec's "don't require reading the script to pick" requirement. |
| 7 | Flexibility and Efficiency | 3 | Digit-key direct-select (composing-only) serves power users; no paste support and no batch workflow hold it back from a 4. |
| 8 | Aesthetic and Minimalist Design | 4 | CSS comments document its own restraint ("the only colored block, deliberately flat"); above-the-fold is exactly input+output+examples, tables/FAQ behind `<details>`. |
| 9 | Error Recovery | 2 | OS-IME-active warning is well handled with `aria-live`, but a wrong candidate silently commits with no after-the-fact diagnostic. |
| 10 | Help and Documentation | 4 | "How it works," FAQ (doubling as real on-page content, not throwaway SEO filler), and collapsed romanization tables are contextual and one click away. |
| **Total** | | **31/40** | **Good** |

## Design Specificity Verdict

**LLM assessment**: Authored specifically for this exact problem, most visibly at the copy layer. The `.spelling-note` block states the product's single load-bearing rule (spelling ≠ pronunciation) with a real minimal pair directly above the input. The capital-letter escape hatch is explained via the actual linguistic collision it resolves (`gaEul` → 가+을 vs. default `gaeul` → 개울), and framed as faster than the hyphen alternative — the repo's own design rationale surviving intact into user-facing copy. The Japanese FAQ names real edge cases (`kinen` vs `kin'en`) and admits outright that `matcha` won't auto-insert っ. The `.seal` ink-stamp badge and blinking terminal-cursor wordmark visually reinforce "typed letters become stamped native script." Where it reads generic: the candidate popup itself is a conventional numbered dropdown, and the engine's own computed distinction between "literal" and "pronunciation-guessed" candidates is discarded before it reaches the UI — specificity earned in the engine, then lost in the last mile.

**Deterministic scan**: Detector ran in **DEGRADED mode** (missing `htmlparser2`, `css-select`, `css-tree`, `domutils` — the tool's own banner states custom properties, selector matching, and computed contrast were NOT evaluated, so this is an undercount, not a clean bill). Found exactly 1 advisory finding across all 4 pages + stylesheet: `em-dash-overuse` on `packages/web/en/ja/index.html` (14 em-dashes in body text, non-blocking, exit code 0 throughout). No false positives beyond noting the finding is un-localized (line 0) and its legitimacy can't be confirmed without reading the actual prose.

**Visual overlays**: Not available — no browser automation tool was connected in this session, so no live-page overlay exists. All findings above are source-grounded, not visually confirmed.

## Overall Impression

This is a rare case where the *product's own design decisions* are the strongest asset — the spelling-vs-pronunciation distinction, the capital-letter escape hatch, and the honest "still under active development" footer all read as considered, not templated. But the last mile between "the engine already knows something useful" and "the UI tells the user" keeps failing: guessed candidates look identical to literal ones, the Japanese tool silently drops correction affordances the Korean tool has, and the core text surface has no accessible semantics at all despite being, structurally, an input method. The single biggest opportunity is closing that gap — the hard linguistic and product thinking is already done; it just isn't reaching the person typing.

## What's Working

1. **The capital-letter/hyphen escape hatch** is explained with its real linguistic justification and framed as faster than the alternative it supersedes — the design rationale in `claude.md` §4.6 survives intact into shipped copy, which is unusually rare.
2. **The homepage is genuinely the tool.** Input, output, and try-it examples are the entire first screen; long reference material (romanization tables, FAQ) sits one click away behind `<details>` rather than gating the tool behind an article — exactly matching the product's own UI spec.
3. **Brand touches are load-bearing.** The rotated 한/あ ink-stamp badge and blinking terminal-cursor wordmark both reinforce the actual value proposition rather than sitting on top as decoration.

## Priority Issues

**[P0] The core text input is invisible to screen readers**
- **Why it matters**: `#editor` carries `role="textbox"`/`aria-multiline="true"` but isn't `contenteditable` — content is replaced via `innerHTML = ""` on every keystroke with no live region, and the candidate popup has no `listbox`/`option`/`aria-selected` semantics. A product whose entire premise is "an input method" is structurally unusable with a screen reader, not degraded — absent.
- **Fix**: Add a live region announcing committed/candidate changes; wire `role="listbox"`, `aria-selected`, and `aria-activedescendant` on the candidate popup linking back to the textbox.
- **Suggested command**: `/impeccable harden`

**[P1] Paste silently does nothing**
- **Why it matters**: No `paste` listener exists anywhere, and `#editor` isn't `contenteditable`, so there's no native insertion target either. The product's own differentiator is "names and new words no dictionary has" — the single most natural real workflow (paste a romanized name from elsewhere) fails with zero error message.
- **Fix**: Add a `paste` handler that reads `clipboardData` and feeds it through the existing `reduce`/`feedLetter` pipeline.
- **Suggested command**: `/impeccable harden`

**[P1] The engine's literal-vs-guessed candidate distinction is computed, then thrown away**
- **Why it matters**: `candidates.ts` explicitly separates "literal" from "pronunciation-guessed" candidates (with a comment explaining the reserved-slot logic), but the UI renders every candidate identically. The product's stated pedagogical goal is reinforcing correct spelling — a learner who leans on the one handled pronunciation exception never learns they did, which undercuts the tool's own teaching premise.
- **Fix**: Tag guessed candidates with a small inline label (e.g. "音變猜測") in the candidate row.
- **Suggested command**: `/impeccable clarify`

**[P2] Escape and click-to-reopen exist only in the Korean tool**
- **Why it matters**: Both tools share identical header/nav/footer chrome implying one consistent family, but the Japanese tool has no `Escape` case and no click listener on `#editor` at all — once kana commits, the only correction path is serial backspace from the end. A user moving between tools will expect parity and find a dead key.
- **Fix**: At minimum give Escape a defined behavior and feedback in the Japanese tool; consider click-to-reposition even without a candidate popup.
- **Suggested command**: `/impeccable adapt`

**[P2] No confirmation or undo on Clear**
- **Why it matters**: `clearBtn` wipes all state to `initialState()` on a single click, instantly, with no confirmation and no undo — the one destructive action in an otherwise low-risk tool has the least protection.
- **Fix**: An "Cleared — undo" toast with a few seconds' grace, or a confirm gate once content exceeds a trivial length.
- **Suggested command**: `/impeccable harden`

## Persona Red Flags

**Sam (accessibility-dependent, keyboard/screen-reader)**: Everything under the P0 above — no `contenteditable`, no live region, no listbox semantics, no `aria-activedescendant`. This persona matters more than usual here since the product is inherently keyboard-first already, yet has zero non-visual feedback wired up. `.candidate-spelling` at `#888` on white (~3:1 at 0.85rem) is likely below WCAG AA's 4.5:1 for small text (inferred from code, not visually confirmed).

**Jordan (first-timer / language learner)**: The only proactive spelling-vs-pronunciation reminder is one example pair (`johayo`/`joayo`); `claude.md` documents nine known-fail words (가을→개울, 있어요→이써요, etc.) with none surfaced as inline warnings — Jordan will hit several of these blind. Because guessed candidates look identical to literal ones, Jordan also gets no signal about when they relied on the tool's one forgiven exception versus spelling correctly — undermining the "this teaches you to spell it right" premise.

**Riley (edge-case stress tester)**: Confirmed — pasting does nothing (no handler, no editable surface). Confirmed — backspacing even one character into a previously-committed Korean word permanently downgrades it from a re-openable "word" to a frozen "literal" (per the code's own comment), even if retyped back to the exact original text. Emoji/very-long-input handling only branches on single-UTF-16-unit `e.key` values; most emoji delivery paths likely fall through as a silent no-op (inferred from code, not run live).

## Minor Observations

- English and zh-TW "try it" example lists aren't at parity: the zh-TW Korean page has 5 examples including the capital-letter forced-split demo (`gochI`); the English page has 3 and omits it, so English readers never see the example the "how it works" prose specifically describes.
- Detector (Assessment B) flagged one advisory, non-blocking finding: 14 em-dashes in `packages/web/en/ja/index.html` body text (`em-dash-overuse`, exit code stayed 0). Its legitimacy couldn't be confirmed since the tool didn't localize a line number — worth a quick manual look, not a hard fix.
- The detector ran in **degraded/regex-fallback mode** this session (missing `htmlparser2`, `css-select`, `css-tree`, `domutils` in its own dependency tree) — computed contrast and CSS selector matching were not evaluated at all, so treat the "1 finding" count as a floor, not a ceiling. Worth re-running once that install is repaired.
- `.candidates` popup is `position: absolute; left: 0` with no viewport-edge collision handling — a word composing near a line's right edge could render its popup clipped (inferred from code).
- The footer's "still under active development" disclaimer is consistent across all 4 pages and honestly matches the documented ~80% accuracy limitation rather than overselling.

## Questions to Consider

1. The engine already knows the difference between "you spelled it correctly" and "we rescued a pronunciation guess for you" — given the product's entire thesis is spelling ≠ pronunciation, why does the UI blend those two cases into identical-looking rows instead of using that moment to teach the distinction?
2. If the core pitch is "type a script you can't natively type," why does the one input method every OS already gives users for free — paste — silently fail?
3. Should the Japanese tool's undo/correction model be brought in line with the Korean tool's, or should the shared chrome itself signal up front that the two tools behave differently, so the gap reads as intentional rather than broken?
