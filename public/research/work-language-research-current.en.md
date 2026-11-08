# What work surrounds a competence word?

Read named collaborators, expected results and decision rights alongside the words used to select people.

2,000 historical ads · Exploratory research · Lexical comparisons and coding diagnostics

What work relations do competence words describe in job advertisements? Skills language can signal demand while recasting collective work as individual qualities. This study examines 2,000 historical advertisements using lexical comparisons, source stratification and repeated-fragment detection. Rules code 4,029 occurrences of focal terms, followed by AI review of a held-out sample. Pressure tolerance remains associated with coordination after detected repeats are removed. Yet broadening named collaborators to include generic team references changes the direction of threshold comparisons. An authority detector also achieves high overall agreement while missing every positive case identified in review. These results show why the units and definitions used to count skills matter for interpreting advertisements. Automated analysis and error diagnosis are complete for this round; the absence of human reference labels limits semantic inference.

## Question
When an ad asks for independence, pressure tolerance or communication, which collaborators, expected results and decision rights does it name for that work?

## Findings · Lexical comparisons
### Ads mentioning pressure tolerance more often mention coordination
284 / 501 ads, versus 467 / 1,499. Unadjusted odds ratio: 2.89 (95% CI 2.35–3.56).
Share also mentioning coordination

| Ad group | Hits / ads | Share |
| --- | --- | --- |
| Pressure term present | 284 / 501 | 56.7% |
| Pressure term absent | 467 / 1,499 | 31.2% |

The co-occurrence identifies texts in which pressure tolerance accompanies cooperation language. Identifiable collaborators under H1 have not yet been coded, and occupational composition has not been adjusted.

### Ads mentioning data also mention communication more often
619 / 905 ads, versus 614 / 1,095. Unadjusted odds ratio: 1.70 (95% CI 1.41–2.04).
Share also mentioning communication

| Ad group | Hits / ads | Share |
| --- | --- | --- |
| Data term present | 619 / 905 | 68.4% |
| Data term absent | 614 / 1,095 | 56.1% |

These ads invite a closer reading: who receives the numbers, and what must be explained? Co-occurrence does not establish that communication and data concern the same task.

### Generic teamwork and named collaborators produce different results
Rules distinguish named roles from a broader definition that includes generic team references. Pressure tolerance rises from 16.8% to 54.7% (495 occurrences); communication from 28.4% to 62.4% (1,640); responsibility from 11.5% to 53.1% (537). These fixed-archive rule flags demonstrate sensitivity to definitions, not validated semantic prevalence.

### High overall agreement can conceal every missed authority case
The authority rule agrees with AI review in 110 / 114 occurrences (96.5%), yet finds 0 of the 4 grants identified by the reviewer. It fails this diagnostic and cannot support a claim of responsibility without authority. The review is AI judgment, not a human gold standard.

### Source comparisons · Pressure tolerance and coordination
| Source | Focal term present | Focal term absent | OR (95% CI) |
| --- | --- | --- | --- |
| 51job | 60.4% (n=270) | 27% (n=730) | 4.12 (3.07–5.53) |
| BOSS | 47.7% (n=109) | 30.7% (n=391) | 2.06 (1.34–3.18) |
| Liepin | 56.6% (n=122) | 39.7% (n=378) | 1.98 (1.31–2.99) |
Source-stratified pooled OR 2.89 (95% CI 2.35–3.56)

### Source comparisons · Data and communication
| Source | Focal term present | Focal term absent | OR (95% CI) |
| --- | --- | --- | --- |
| 51job | 69.1% (n=414) | 51.2% (n=586) | 2.13 (1.64–2.77) |
| BOSS | 66.3% (n=249) | 57.4% (n=251) | 1.46 (1.02–2.10) |
| Liepin | 69.4% (n=242) | 65.9% (n=258) | 1.18 (0.81–1.71) |
Source-stratified pooled OR 1.67 (95% CI 1.39–2.01)

## Discussion
The clearest current association links pressure tolerance with coordination. It directs attention from an individual’s ability to cope to the cooperation requirements written alongside it. Urciuoli’s (2008) work motivates examining this wording, but co-occurrence does not identify the collaborators or their tasks. The data–communication comparison also prompts questions about who needs the numbers explained and which decisions they inform. Automated coding and AI review show that generic team references and named roles produce different results. The authority detector also missed explicit grants found in review; missing flags cannot establish that workers lack authority. Applicants can already use those distinctions to ask specific questions about how the work is arranged.
- When another department is delayed, who adjusts the original target?
- Who reads this analysis, and what decision will they make from it?
- Which standards may I change, and which changes require approval?

## Methods and reproducibility
Deming and Kahn (2018) measure skill words in job postings as demand signals. Urciuoli (2008) examines how skill language describes work relations as personal qualities. This study reads the words alongside the duties to examine what work they describe.

### Data
The archive contains 1,000 51job ads, 500 BOSS ads and 500 Liepin ads. These are secondary historical records with deduplicated text. The 51job subset lacks employer and city fields; BOSS and Liepin lack posting dates.
Lexical counts use advertisements, counted once per word. Semantic coding uses a word’s occurrence within a clause. Occupational dispersion compares terms and awaits validated occupation mapping.

### Exploratory hypotheses · Untested
These hypotheses were proposed after examining existing data and fixed before this round of sampling and new human coding. They remain untested and were not preregistered before seeing the data.
[2026-11-08 · 7db06ee](https://github.com/Zhenguo-RUI/work-language-observatory/blob/7db06ee/research/preregistration.md)
- **H1** For pressure tolerance, communication and responsibility separately: more than 50% of worker-directed or duty-related occurrences name an identifiable role or department in the focal item or its adjacent items.
- **H2** For independence, initiative and closing the loop separately: worker-directed uses state outcome responsibility more often than explicit decision rights for the same task.
- **H3** Compare the H2 difference between individual-task and explicit people-management groups, including within adequately represented occupational functions. Mixed and unclear roles remain separate.

### Measurement and status
The workflow follows Nelson’s (2020) sequence of pattern detection, close reading and confirmation. Grimmer and Stewart (2013) require validation specific to the text measure; this round uses rule candidates and AI review, with evidence and failure types retained; these do not constitute human validation.
- **Retrieval · Complete** — A fixed vocabulary is searched, with candidate exclusions retained and sampled hits reviewed by AI.
- **Rule candidate coding · Complete** — Rules cover 4,029 occurrences; 60 development cases are excluded, leaving 3,969 for analysis.
- **AI semantic review · Complete with error diagnosis** — A separate sample is read and compared with rule labels; authority detection fails the diagnostic.
- **Sensitivity checks · Complete** — Checks compare sources, length strata, clause distance and removal of exact and near repeats.
- **Hypothesis conclusions · Unresolved** — Automatic flags are not semantic estimates. Missed authority cases prevent a conclusion on H2; H3 lacks common occupational support.

### Alternative readings
#### Text length
Within-source median-length groups retain the same direction for pressure–coordination co-occurrence. This is a coarse stratified check; an association model adjusting for occupation and role is unfinished.
#### Repeated templates
After removing exact and near-duplicate candidates, the pressure–coordination odds ratio is 2.89 (95% CI 2.35–3.56); data–communication is 1.79 (95% CI 1.49–2.15). Candidates include short fragments and do not establish platform authorship.
#### Occupational composition
Occupation mapping lacks human validation. The current results do not establish the same difference within an occupation.
#### Archives and platforms
Archive sources also differ in collection period, selection and employer coverage. These factors cannot be separated into independent platform effects here.

### Limits on interpretation
- Historical secondary records and non-probability selection limit generalization of both lexical comparisons; they do not estimate current market shares.
- Lexical hits have not all been reviewed by humans and may refer to facilities or systems, affecting the interpretation of both associations.
- Occupational composition and undetected templates may still affect the associations after candidate removal.
- Human coding, model validation and DSL estimates for H1–H3 are unfinished. The earlier model pilot is not human validation.
- Ads do not record actual hours, experienced pressure or delivery of support; lexical associations cannot establish actual conditions.

### Reproducibility
Counts, intervals, repeat detection, rule candidates and AI-review diagnostics have scripts, versioned rules and input hashes. Aggregate statistics, the automated codebook and review prompt are available in the repository; raw text and item-level AI labels remain local. Keyword examples have received an AI editorial review. No human reference labels or DSL correction are available; earlier model pilots are kept separate.
[Scripts, rules and logs](https://github.com/Zhenguo-RUI/work-language-observatory/tree/main/research) · [Aggregate statistics](/research/stats.json)

### References
- David Deming & Lisa B. Kahn. [Skill Requirements across Firms and Labor Markets: Evidence from Job Postings for Professionals (2018)](https://doi.org/10.1086/694106)
- Bonnie Urciuoli. [Skills and Selves in the New Workplace (2008)](https://doi.org/10.1111/j.1548-1425.2008.00031.x)
- Laura K. Nelson. [Computational Grounded Theory: A Methodological Framework (2020)](https://doi.org/10.1177/0049124117729703)
- Justin Grimmer & Brandon M. Stewart. [Text as Data: The Promise and Pitfalls of Automatic Content Analysis Methods for Political Texts (2013)](https://doi.org/10.1093/pan/mps028)
- Naoki Egami, Musashi Hinck, Brandon M. Stewart & Hanying Wei. [Using Imperfect Surrogates for Downstream Inference: Design-based Supervised Learning for Social Science Applications of Large Language Models (2023)](https://proceedings.neurips.cc/paper_files/paper/2023/hash/d862f7f5445255090de13b825b880d59-Abstract.html)
