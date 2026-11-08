# 工作关键词与研究观察：可复跑研究目录

当前执行范围以 [编码前分析计划](preregistration.md) 为准。该计划在新抽样前单独提交，但假设形成于看到既有数据之后，因此全部标为探索性。资料使用边界见 [source-decision.md](source-decision.md)。

## 本轮完成

- 输入字段、哈希与来源清点：`scripts/00_audit_inputs.py` → `aggregates/inputs.json`。
- 20词规则和暂定复合词排除：`config/terms.yaml`。
- 词面计数、固定种子抽样、空白人评包：`scripts/02_terms.py` → `aggregates/term_counts.json`；正文和逐条样本只写 `private/`。
- 职业分类边界草案：`config/occupations.yaml`，状态为 `draft_not_applied`，尚未执行职业映射。

计数表示词面检索，不表示已验证的能力要求；`candidate_kept` 也不是人工语义标签。抽样单位是广告×词条，展示被抽广告中该词的全部命中。同一广告可因不同词被抽到多次。排除项复核使用独立 `review_kind`，不得与主精确率样本合并。

## 运行

私有原始档案和来源凭据没有进入Git。缺少它们时只能运行合成测试，不能从空输入制造研究结果。

```sh
python3 research/scripts/02_test_terms.py
python3 research/scripts/02_terms.py --run --plan-commit 7db06ee
python3 research/scripts/02_terms.py --run --plan-commit 7db06ee --verify-existing
```

首次运行生成新包。已存在的包不能覆盖；使用 `--verify-existing` 核对。脚本检查计划提交与输入哈希，运行指纹包含配置和脚本哈希。修改规则或脚本会另建私有目录，样本选择只受词、种子与记录身份影响。

日志记录生成时的仓库HEAD及脚本哈希。首次运行发生在脚本提交前，不应把该HEAD误称为已包含脚本的版本；提交后的代码核对另记日志。

## 人工审阅

本机入口为 `private/START-HERE.html`；具体版本入口记录在 `logs/02-terms.json`。主包和排除包有不同文件名、运行身份、输入哈希和配置哈希。人工字段初始为空。HTML只尝试在本机保存人工字段，浏览器不允许存储时仍可导出CSV。请在离开前保留导出备份。

编码员真实填写前，精确率、语义比例、金标准和模型验证均未完成。没有用模型模拟人，不把空标签计为错误，也不将候选例子批量标为作者审核。职业验证、搭配词、深度编码和DSL估计尚未执行。

## 发布

本轮没有改网站文案或统计。Git只包含脚本、规则、计划、来源元数据及聚合检查；不包含原文、公司清单、逐条记录ID或人评包。后续只有满足验证条件的结果才进入 `stats.json` 和页面；旧网站统计不能冒充新流程的验证结果。
