# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who type on a QWERTY keyboard and are learning a language whose native script has no QWERTY-native input method (currently Korean, Japanese), and who do not want to install or switch to an OS-level IME for that language. They know romanized spelling for the target language (not necessarily correct pronunciation-to-spelling mapping) but not the native keyboard layout (e.g. 두벌식 for Korean) or how to enable/switch a native IME on a shared, work, or unfamiliar device.

## Product Purpose

latype.com is a small family of independent, single-purpose typing tools, one per language, that convert romanized Latin-alphabet input into the target language's native script in the browser, in real time, as the user types. It is an input method, not a translator or a dictionary/romanization lookup tool: any legal input in the target romanization must convert, including names, places, and new words absent from any dictionary or wordlist.

## Positioning

- **Shared claim across all tools on the site:** zero install, zero login, works immediately in any browser — no OS-level keyboard/IME switch required. This matters most on a shared, work, or borrowed device where the user cannot or does not want to enable a native IME.
- **Korean tool:** uses *transliteration* (spelling-based) conversion, not *transcription* (pronunciation-based). This is a deliberate, tested decision (see claude.md §3.1) — pronunciation-based reverse-mapping is provably lossy and gets common verb conjugations wrong. The differentiator versus installing a native 두벌식 keyboard is not needing to memorize the keyboard's letter-position mapping; the user types the Romanization they already know.
- **Japanese tool:** romaji→kana conversion. Unlike Korean, romaji-to-kana is already the default built-in IME method on virtually every OS and phone for Japanese, so the differentiator is narrower and purely the "no install/no OS switch" claim above (e.g. a shared computer without a Japanese IME enabled), not a novel input mechanism.
- Core engine philosophy (see claude.md for the Korean engine's full rationale) is deterministic and rule-based: no ML, no training, no dictionary dependency for the core conversion. A wordlist/frequency table may assist candidate ranking or disambiguation later, but must never be required for basic conversion to work.

## Operating Context

- Domain: latype.com, deployed to Cloudflare (wrangler.jsonc present in `packages/web`).
- Multi-tool, multi-locale static site under one deployment: `/` and `/en/` serve the Korean tool; `/ja/` and `/en/ja/` serve the Japanese tool. Traditional Chinese (zh-TW) is the primary/default locale; English is secondary, mirrored per tool under `/en/`.
- Monorepo packages: `engine` (Korean core conversion, pure functions, no UI dependency), `engine-ja` (Japanese core conversion, same philosophy), `input-state` (composition/candidate state machine wrapping either engine), `web` (the only UI layer currently — Vite + TypeScript, no framework).
- `packages/web/PRODUCT.md` (this file) covers the `web` surface specifically; the deeper engine design rationale, algorithm details, and test methodology for the Korean tool live in the repo-root `claude.md` and should be treated as authoritative for that engine's decisions.

## Capabilities and Constraints

- No backend, no database, no login/account, no cloud sync, no ML/training pipeline — this is a binding constraint across every language tool on the site, not just Korean. All conversion runs client-side; user input never leaves the browser (this is stated as a commitment in site copy).
- Keyboard-driven correction is core UX, not an afterthought: candidates are cycled with ↓/number keys during composition, not primarily via mouse click (see claude.md §3.3–3.4, §4.5 for the full key map and rationale).
- Korean tool requires spelling-based input by default (e.g. `gamsahabnida`, not the pronounced `gamsahamnida`); it has narrow, explicitly scoped support for guessing common honorific-ending nasalization (`-습니다/-ㅂ니다`) so that a pronunciation-based guess still surfaces the correct candidate. Other sound changes (liaison, palatalization, etc.) are not handled — those inputs must be typed as spelled. Default correctness is roughly 77–82% against a hand-built golden test set (README.md, claude.md §4.4); the remainder is resolved by the user via candidate selection, not by the engine guessing right every time.
- Desktop-first for both tools: input experience is only guaranteed on a physical keyboard. Layout is responsive so mobile is at least viewable, but touch input is explicitly out of scope for v1 (claude.md §3.4).
- Japanese tool supports toggling output between hiragana and katakana.
- Any new language tool added to this site should default to the same architecture unless that language's phonology specifically requires otherwise: deterministic rule-based core engine, transliteration-first (not lossy pronunciation-based) where the distinction matters, and candidate-list correction for ambiguous cases.

## Brand Commitments

- Site brand: latype.com.
- Each language tool carries its own page-level branding rather than a single unified product name: "韓文羅馬拼音輸入法" (Korean) and "日文羅馬拼音輸入法" (Japanese), each with a matching English title under `/en/`.
- Traditional Chinese (zh-TW) is the primary voice/locale for site copy; English is a secondary, mirrored translation, not the primary voice.

## Evidence on Hand

- `claude.md` (repo root) is the authoritative design document for the Korean engine: architecture, the four key design decisions, letter-mapping tables, parsing/ranking rules, known failure cases, and test strategy. Treat it as product/engine truth for that tool, not just historical planning.
- `README.md` (repo root) records current build phase status and measured accuracy (~77% on the golden test set at time of writing).
- FAQ copy embedded as `FAQPage` JSON-LD in each tool's `index.html` is real, shipped user-facing copy explaining install-free use, the 두벌식 comparison, spelling-vs-pronunciation input, and support for out-of-dictionary names/new words — treat as confirmed voice/positioning evidence, not draft content.
- No testimonials, case studies, press, or usage-metric claims exist; do not fabricate any.

## Product Principles

1. It's an input method, not a lookup tool — any legal romanized input must convert, including names and new words with zero dictionary coverage.
2. The core conversion is deterministic and rule-based by design; dictionaries or statistics, if ever added, may only assist ranking/disambiguation and must never become a requirement for basic conversion.
3. Zero install, zero login, fully client-side, on every tool on this site — the shared reason someone reaches for latype.com instead of enabling a native OS IME.
4. Correction happens in the typing flow via the keyboard (↓/number-key candidates), not through a separate review or point-and-click UI.
5. Each language tool is documented and evaluated on its own terms (Korean's transliteration-vs-transcription distinction does not automatically apply to Japanese or future languages) even though they share one site and one architectural philosophy.
