# Keyword atlas and research note · 2026-11-05

This release adds 20 keyword entries with 60 bilingual contextual paraphrases and a four-part research note. The underlying archive has 2,000 exact and stored-normalized-unique bodies: 1,000 51job, 500 BOSS and 500 Liepin, acquired earlier through secondary public datasets rather than live revalidation.

The fixed 33-expression search vocabulary and document frequencies are distributed as `public/work-language-study-aggregates.json`. Each expression uses case-sensitive substring matching, counted once per ad. Ranking is within this vocabulary, not unrestricted Chinese token frequency; tied counts follow vocabulary order. The vocabulary is not preregistered. Generic terms such as work, requirement and ability were excluded editorially. Hits can include meanings other than worker qualities; they must not be relabelled as semantic demand counts.

The 60 cases are distinct source records, one per source for each term, selected from 180–1,800-character records with preference for shorter inspectable bodies. They are purposefully selected contrasts, not a representative sample of a word’s senses. Each public description is an authored, deidentified paraphrase; source titles were generalized and company names, raw excerpts, identifiers and URLs withheld. A separate local provenance ledger retains record IDs and text hashes; it is not packaged or imported by the application. These model-written interpretations have not received independent human semantic validation.

The earlier independence pilot remains separately labelled: 120 full ads, 168 occurrences, 156 worker-directed occurrences, 122 competence/experience occurrences, and 71/114 relevant ads with identifiable collaboration. Same-model repetition is not human accuracy. The invalidated planning/review regex result is not reused.

New co-occurrence tables use documents as units. Pressure/coordination and data/communication contrasts are descriptive. The pressure/coordination direction also holds after splitting each source at its median body length, but this does not control templates, occupational composition, finer length differences or source selection. The broader historical pressure/rest screen uses its earlier rulebook, a separate definition from the exact 抗压 term; its 579 exposed records must not be substituted for the exact-term count of 501.

No market prevalence, causal platform effect, wage premium or employee experience is estimated. The site exposes only the tool, aggregate counts and these authorized deidentified examples. Private full texts, application essays, CVs, contact details and individual source indexes remain outside the release.

Run `node scripts/check-public-study.mjs` for bilingual coverage, margins, ranking, public data isolation and server-render checks. This is functional validation, not an independent sociological quality score.
