# concise-v1 离线候选评测

候选仍为离线实验，生产提示词未修改。20份均为合成JD，开发与留出各10份、各覆盖8类职能。

基线完整运行后才编写本候选；仅参考开发组问题，候选冻结后未再修改。对同一对输出按甲乙、乙甲分别实际请求评分；不一致计平局。评审与生成均为DeepSeek Flash，独立提示词不能消除同模型偏差。

修改范围：保留输出结构、证据与双语规则；减少短JD的重复模块，按信息密度分配篇幅；AI评测内容拆为313字领域说明，按关键词选择0–1份。领域选择有5个检查案例，但本固定集没有AI岗位，领域内容效果尚未实测。

已完成生成 10/20，提供方生成请求 11；实际比较评分 20/40。

## dev

双顺序一致率 20%；已完成比较中的候选胜 0、平 8、负 2。
生成中位耗时：基线 82521.5 ms，候选 90675.0 ms。

| 职能 | 候选胜 | 平 | 负 |
| --- | --- | --- | --- |
| everyday_services | 0 | 0 | 1 |
| operations | 0 | 1 | 0 |
| organizational_support | 0 | 1 | 0 |
| other | 0 | 1 | 0 |
| product | 0 | 1 | 1 |
| production_manufacturing | 0 | 1 | 0 |
| sales_customer | 0 | 1 | 0 |
| technical_rd | 0 | 2 | 0 |

| 门槛 | 通过 |
| --- | --- |
| complete | True |
| hard_checks_not_worse | True |
| order_agreement_at_least_70pct | False |
| wins_at_least_losses | False |
| no_family_all_losses | False |
| median_not_over_20pct_slower | True |

## holdout

双顺序一致率 未评测；已完成比较中的候选胜 0、平 0、负 0。
生成中位耗时：基线 94222.0 ms，候选 None ms。

| 职能 | 候选胜 | 平 | 负 |
| --- | --- | --- | --- |
| everyday_services | 0 | 0 | 0 |
| operations | 0 | 0 | 0 |
| organizational_support | 0 | 0 | 0 |
| other | 0 | 0 | 0 |
| product | 0 | 0 | 0 |
| production_manufacturing | 0 | 0 | 0 |
| sales_customer | 0 | 0 | 0 |
| technical_rd | 0 | 0 | 0 |

| 门槛 | 通过 |
| --- | --- |
| complete | False |
| hard_checks_not_worse | None |
| order_agreement_at_least_70pct | None |
| wins_at_least_losses | None |
| no_family_all_losses | None |
| median_not_over_20pct_slower | None |

## 逐条长度与检查

中文字符统计覆盖全部中文字段，排除专用引用字段；它不是去重正文长度。

| ID | 基线中文字符 | 候选中文字符 | 候选应用接受 | 引文/结构/双语 |
| --- | --- | --- | --- | --- |
| D01 | 1928 | 1544 | True | True |
| D02 | 1380 | 818 | True | True |
| D03 | 1555 | 1190 | True | True |
| D04 | 2237 | 1457 | True | True |
| D05 | 1878 | 1513 | True | True |
| D06 | 1933 | 1678 | True | True |
| D07 | 1413 | 1023 | True | True |
| D08 | 2201 | 1427 | True | True |
| D09 | 2049 | 1837 | True | True |
| D10 | 2500 | 1350 | True | True |

上线判断仅使用留出组全部门槛；程序检查通过不等于解释正确。本报告不证明真实用户效用，也不用于CV或研究页。候选生成、双顺序评分的token实耗见同名JSON；未查询账单，不估算美元费用。
