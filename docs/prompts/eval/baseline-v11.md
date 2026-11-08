# baseline-v11 跨职能基线评测

状态：complete_baseline。合成案例20份，真实案例0份；完成20份。

当前仅建立生产提示词基线，未运行候选、未进行成对评审、未更改线上提示词。

现有应用校验接受 20/20；实际提供方请求 20 次，其中重试/修复 0 次。
生成中位耗时 91975.5 ms；最大 119845 ms。token以同名JSON中提供方实际返回usage为准，账单金额未查询。

| ID | 分组 | 职能 | 应用接受 | 耗时ms | 调用数 | 硬项 |
| --- | --- | --- | --- | --- | --- | --- |
| D01 | dev | technical_rd | True | 76569 | 1 | True |
| D02 | dev | product | True | 62841 | 1 | True |
| D03 | dev | operations | True | 79529 | 1 | True |
| D04 | dev | sales_customer | True | 103675 | 1 | True |
| D05 | dev | organizational_support | True | 85514 | 1 | True |
| D06 | dev | production_manufacturing | True | 105793 | 1 | True |
| D07 | dev | everyday_services | True | 70871 | 1 | True |
| D08 | dev | other | True | 105881 | 1 | True |
| D09 | dev | technical_rd | True | 117192 | 1 | True |
| D10 | dev | product | True | 68531 | 1 | True |
| H01 | holdout | technical_rd | True | 80821 | 1 | True |
| H02 | holdout | product | True | 92945 | 1 | True |
| H03 | holdout | operations | True | 95499 | 1 | True |
| H04 | holdout | sales_customer | True | 77655 | 1 | True |
| H05 | holdout | organizational_support | True | 119845 | 1 | True |
| H06 | holdout | production_manufacturing | True | 113699 | 1 | True |
| H07 | holdout | everyday_services | True | 66017 | 1 | True |
| H08 | holdout | other | True | 105101 | 1 | True |
| H09 | holdout | technical_rd | True | 100714 | 1 | True |
| H10 | holdout | product | True | 91006 | 1 | True |

已另行完成 20/20 次模型评分。评分者与生成者同为 DeepSeek Flash，使用独立请求和评审提示词，未引入独立模型或人类评分。

| 维度（1–3分） | 均值 | 1分 | 2分 | 3分 |
| --- | --- | --- | --- | --- |
| 忠实 | 2.75 | 0 | 5 | 15 |
| 具体 | 2.75 | 1 | 3 | 16 |
| 有用 | 2.65 | 1 | 5 | 14 |
| 不像模板 | 2.00 | 3 | 14 | 3 |
| 篇幅合适 | 1.95 | 7 | 7 | 6 |

这些是单次、同模型评审的序数评分，均值仅作描述；不能换算成准确率或视为人评结论。

本轮优先改进线索是短输入的内容膨胀和固定模块重复，已经跨职能出现。四份预先标记的稀疏案例，其中文字段字符数如下（不含专门的引用字段，包含标题与其他中文字段，并非精确正文篇幅）：

| ID | 职能 | 中文字段字符数 |
| --- | --- | --- |
| D02 | product | 1380 |
| D07 | everyday_services | 1413 |
| H03 | operations | 1218 |
| H07 | everyday_services | 1254 |

这只是下一轮候选修改的线索，尚未证明缩短输出会提高效用。评分理由可能复述原句，全部保留在本机，不进入公开报告。

生成 usage 合计：输入 130656、输出 315545、总计 446201 tokens；评分另计 87289 tokens。提供方输出计数可能包含推理消耗；本项目未保存推理正文。账单金额未查询。

原始输入、模型完整输出和详细评审理由仅存本机private目录。合成集表现不代表真实招聘总体；不进入CV或研究页。

版本记录：baseline-v11 使用冻结的生产 v11 代码和提示词，生成与评审各运行20次；没有候选版本，没有实际双顺序比较，没有上线变更。已有留出组本轮仅用于基线评测，未来规则调整只能使用开发组；不能再按留出组的个案理由调参。
