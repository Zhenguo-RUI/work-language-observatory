# Research progress

| Date (UTC) | Step | Outputs | Waiting for people |
| --- | --- | --- | --- |
| 2026-11-08 | 0: input inventory | scripts/00_audit_inputs.py; aggregates/inputs.json; logs/00-audit.json; private corpus and source notes | Source permissions and missing provenance confirmation; no raw records published |
| 2026-11-08 | 1: exploratory design draft only | design-proposal.md; private/source-permissions.pending.json and instructions | User design choices and human-coder plan; no preregistration file or commit, no step 2 sampling |
| 2026-11-08 | 1: design approved and frozen | preregistration.md, separate commit 7db06ee; source-decision.md | User delegated source decisions; permissions remain unknown, local-only scope chosen |
| 2026-11-08 | 2: literal retrieval and review pack | config/terms.yaml; scripts/02_terms.py; aggregates/term_counts.json; logs/02-terms.json; private HTML/CSV packages | 400 advertisement-term reviews and 30 exclusion reviews await real human labels; no semantic estimates |
# 2026-11-08 页面发布接入

执行 `03_public_lexical.py`，生成 `aggregates/stats.json` 与 `aggregates/lexical-cross-tabs.json`，重新核验20词和两组词面交叉表。运行记录见 `public-lexical-run.json`。模型调用0，人工标签未填写。

执行 `scripts/build-public-study.mjs`，连接词典与研究页、双语Markdown和聚合下载。数字扫描与公共页面验收通过。研究仍在等待真实人工抽查；未执行后续语义比例估计。
