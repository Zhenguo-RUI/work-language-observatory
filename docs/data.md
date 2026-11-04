# Data notes / 数据说明

The public source contains **aggregate results only**. The individual archive is not a downloadable dataset in this repository.

| Field | Historical count | Interpretation |
| --- | ---: | --- |
| Archived records | 2,000 | Project archive count, not public corpus rows |
| Platform labels | 1,000 / 500 / 500 | 51job / BOSS / Liepin labels in the historical archive |
| Exploratory semantic pilot | 120 texts | Model-coded subset, not independent human validation |
| Occurrences of “独立” | 168 | Term occurrences in that pilot; not 168 independent jobs |

The JSON retains its `model_coded_exploratory_not_human_validated` status. Sense counts and document counts can have different denominators. Co-occurrence does not establish employer intent, actual working conditions or platform effects. Sample composition does not establish market prevalence.

The public export deliberately empties:

- `data/corpus.json`: individual titles, employers, source links and annotations;
- `data/seeds.json`: previously prepared case readings and full JDs;
- `data/seed-translations.json`: full translations tied to those cases.

User-created records are stored at runtime, never written into these source fixtures. Anonymous analysis is an ephemeral preview rather than a retrievable saved reading. An identity-based deployment still needs a real authentication gateway before private history and operations can be considered protected in that deployment.

## 中文说明

2,000是历史归档数量；120份全文、168处“独立”是探索性模型编码试验的不同分母。它们不代表市场分布，也不是人工确认的正确率。公开文件不包含逐条语料，因此第三方目前不能仅靠此仓库完整复算历史结果。

若未来公开可复现的数据集，应另行记录抽样、抓取日期、平台字段、去重、文本完整性、编码版本、复核与再利用条件，不能只把当前汇总数字包装成已验证发现。
