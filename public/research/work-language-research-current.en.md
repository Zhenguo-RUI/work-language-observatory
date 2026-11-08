# What work surrounds a competence word?

Read named collaborators, expected results and decision rights alongside the words used to select people.

2,000 historical ads · Exploratory research · Lexical results available

This exploratory study examines how job advertisements connect competence words with collaborators, expected outcomes and decision rights. It uses 2,000 historical advertisements from secondary archives. The current results describe lexical co-occurrence: ads containing a pressure-tolerance term more often also mention coordination, and ads mentioning data more often also mention communication. These comparisons concern the wording of the archive. They do not identify employers’ intentions, working conditions or platform effects. An analysis plan now specifies human checks of retrieval, occupation mapping and semantic coding before model-assisted estimation. Human review remains pending, so the earlier model-coded independence pilot is excluded from the findings presented here. The report separates available counts, untested hypotheses and unfinished validation, and retains the code and aggregate evidence needed to check each stage.

## Question
When an ad asks for independence, pressure tolerance or communication, which collaborators, expected results and decision rights does it name for that work?
Deming and Kahn (2018) measure skill words in job postings as demand signals. Urciuoli (2008) examines how skill language describes work relations as personal qualities. This study reads the words alongside the duties to examine what work they describe.

## Exploratory hypotheses · Untested
These hypotheses were proposed after examining existing data and fixed before this round of sampling and new human coding. They remain untested and were not preregistered before seeing the data.
[2026-11-08 · 7db06ee](https://github.com/Zhenguo-RUI/work-language-observatory/blob/7db06ee/research/preregistration.md)
- **H1** For pressure tolerance, communication and responsibility separately: more than 50% of worker-directed or duty-related occurrences name an identifiable role or department in the focal item or its adjacent items.
- **H2** For independence, initiative and closing the loop separately: worker-directed uses state outcome responsibility more often than explicit decision rights for the same task.
- **H3** Compare the H2 difference between individual-task and explicit people-management groups, including within adequately represented occupational functions. Mixed and unclear roles remain separate.

## Data
The archive contains 1,000 51job ads, 500 BOSS ads and 500 Liepin ads. These are secondary historical records with deduplicated text. The 51job subset lacks employer and city fields; BOSS and Liepin lack posting dates.
Lexical counts use advertisements, counted once per word. Semantic coding uses a word’s occurrence within a clause. Occupational dispersion compares terms and awaits validated occupation mapping.

## Measurement and progress
The workflow follows Nelson’s (2020) sequence of pattern detection, close reading and confirmation. Grimmer and Stewart (2013) require validation specific to the text measure; new human validation is still pending.
- **Lexical counts · Available** — Literal hits and exclusion candidates are retained without assigning human-directed meanings.
- **Retrieval review · Human review pending** — 400 advertisement–term pairs are ready; human fields are blank.
- **Independent coding · Not started** — Check occupations, develop the codebook, then code independently and adjudicate.
- **Model validation · Pending** — Compare against adjudicated human labels and report the main errors.
- **DSL estimation · After validation** — Use random human labels to correct model-based estimates, following Egami et al. (2023).
- **Sensitivity checks · Partly available** — Source-by-length checks are available; template and occupation checks remain unfinished.

## Preliminary lexical findings
### Ads mentioning pressure tolerance more often mention coordination
284 / 501 ads, versus 467 / 1,499. Unadjusted odds ratio: 2.89.
Share also mentioning coordination

| Ad group | Hits / ads | Share |
| --- | --- | --- |
| Pressure term present | 284 / 501 | 56.7% |
| Pressure term absent | 467 / 1,499 | 31.2% |

The co-occurrence identifies texts in which pressure tolerance accompanies cooperation language. Identifiable collaborators under H1 have not yet been coded, and occupational composition has not been adjusted.

### Ads mentioning data also mention communication more often
619 / 905 ads, versus 614 / 1,095. Unadjusted odds ratio: 1.7.
Share also mentioning communication

| Ad group | Hits / ads | Share |
| --- | --- | --- |
| Data term present | 619 / 905 | 68.4% |
| Data term absent | 614 / 1,095 | 56.1% |

These ads invite a closer reading: who receives the numbers, and what must be explained? Co-occurrence does not establish that communication and data concern the same task.

## Alternative readings
### Text length
Within-source median-length groups retain the same direction for pressure–coordination co-occurrence. This is a coarse stratified check; an association model adjusting for occupation and role is unfinished.
### Repeated templates
Template influence has not been tested. Repeated clauses must be identified before comparing results with candidate templates removed.
### Occupational composition
Occupation mapping lacks human validation. The current results do not establish the same difference within an occupation.
### Archives and platforms
Archive sources also differ in collection period, selection and employer coverage. These factors cannot be separated into independent platform effects here.

## Discussion
The clearest current association links pressure tolerance with coordination. It directs attention from an individual’s ability to cope to the cooperation requirements written alongside it. Urciuoli’s (2008) work motivates examining this wording, but co-occurrence does not identify the collaborators or their tasks. The data–communication comparison also prompts questions about who needs the numbers explained and which decisions they inform. Human reading must next distinguish personal requirements, duties and organizational promises, then check whether outcome responsibility and decision rights concern the same task. Applicants can already use those distinctions to ask specific questions about how the work is arranged.
- When another department is delayed, who adjusts the original target?
- Who reads this analysis, and what decision will they make from it?
- Which standards may I change, and which changes require approval?

## Limitations
- Historical secondary records and non-probability selection limit generalization of both lexical comparisons; they do not estimate current market shares.
- Lexical hits have not all been reviewed by humans and may refer to facilities or systems, affecting the interpretation of both associations.
- Occupation and template checks are unfinished; either may affect the pressure–coordination association.
- Human coding, model validation and DSL estimates for H1–H3 are unfinished. The earlier model pilot is not human validation.
- Ads do not record actual hours, experienced pressure or delivery of support; lexical associations cannot establish actual conditions.

## Reproducibility
Numbers are resolved from aggregate statistic keys. Lexical counts, rule versions and input hashes are available for checking. Raw text and item-level review sheets remain local. Human review is unfinished and the codebook is in development; this new coding round has no frozen model prompt, model version or call record. The earlier model pilot remains an archive, not validation evidence on this page.
[Scripts, rules and logs](https://github.com/Zhenguo-RUI/work-language-observatory/tree/main/research) · [Aggregate statistics](/research/stats.json)

## Authorship
Rui Zhenguo proposed the research question and approved the design. Codex assisted with scripts, aggregate data preparation and bilingual drafts. Human annotation and paraphrase review are unfinished; model or tool output is not recorded as human judgment.

## References
- David Deming & Lisa B. Kahn. [Skill Requirements across Firms and Labor Markets: Evidence from Job Postings for Professionals (2018)](https://doi.org/10.1086/694106)
- Bonnie Urciuoli. [Skills and Selves in the New Workplace (2008)](https://doi.org/10.1111/j.1548-1425.2008.00031.x)
- Laura K. Nelson. [Computational Grounded Theory: A Methodological Framework (2020)](https://doi.org/10.1177/0049124117729703)
- Justin Grimmer & Brandon M. Stewart. [Text as Data: The Promise and Pitfalls of Automatic Content Analysis Methods for Political Texts (2013)](https://doi.org/10.1093/pan/mps028)
- Naoki Egami, Musashi Hinck, Brandon M. Stewart & Hanying Wei. [Using Imperfect Surrogates for Downstream Inference: Design-based Supervised Learning for Social Science Applications of Large Language Models (2023)](https://proceedings.neurips.cc/paper_files/paper/2023/hash/d862f7f5445255090de13b825b880d59-Abstract.html)
