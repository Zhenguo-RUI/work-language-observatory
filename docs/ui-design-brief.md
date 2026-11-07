# UI design brief — 6 November 2026

Design Work Language Observatory as a calm bilingual reading tool. A reader brings a job description, reads an interpretation next to its source, and returns to saved work. The interface should help that sequence, with no separate pitch for each feature.

## References

- [Apple Human Interface Guidelines: Layout](https://developer.apple.com/design/human-interface-guidelines/layout) and [Typography](https://developer.apple.com/design/human-interface-guidelines/typography): clear hierarchy, familiar controls, legible text and space around meaningful actions.
- [识典古籍](https://www.shidianguji.com/): a text-centred research setting, access to source material, dictionary and reading tools. Borrow the reading emphasis, not its identity, assets or exact layout.

## Implementation prompt

1. Use warm white, dark readable text and one restrained green accent. Use system sans-serif for controls; reserve a modest serif for reading titles and the sociological essay. Avoid faint text, tiny captions, decorative badges, numbered marketing panels and repeated slogans.
2. Keep four public destinations in a horizontal navigation: analyse, history, keywords, research. Show the current destination. Keep operations access in the footer; its authentication remains unchanged.
3. Make the JD text area the first and largest input. Role and company remain optional. Explain where the text goes in one sentence near the submission button. Only show company lookup controls after a company is supplied.
4. Keep one clear primary action per state. Retain a fictional example as a small action, clearly labelled fictional. Place optional source and model settings in a disclosure.
5. Present results like a reading: headline, meaning, anchored quotation, alternative reading. Use separators instead of stacking tinted cards. Keep the original JD alongside the interpretation on wide screens and reachable on narrow screens.
6. Preserve research depth without duplicating it in navigation and introductory cards. Keep keyword examples, quantitative denominators, source limits and qualitative evidence; fold technical methods and references rather than deleting them.
7. Feedback, download and next-JD controls must remain easy to find. Keep real progress states, errors and retry visible. Do not replace an error with reassuring decoration.
8. Chinese and English receive equal layout care. Support keyboard focus, visible labels, readable contrast, reduced motion, narrow screens and long titles. No invented metrics, new model calls or changes to analysis prompts for a visual redesign.

## Acceptance

Inspect desktop and narrow layouts; switch languages and all four destinations; submit a synthetic JD through the existing local draft path; check source highlighting, feedback, export and next-JD reset; refresh history. Build and typecheck. Release to the existing project and custom domain after checking the exact commit.
