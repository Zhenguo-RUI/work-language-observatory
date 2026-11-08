# 两页的结构、字段和数字

## 一、数字怎么进入页面

所有统计数字由 `research/aggregates/stats.json` 提供。页面文案（`lib/research-observations.ts`、`lib/keyword-contexts.ts`、`data/public-study.json` 里的 `{zh, en}` 文本）只写占位：

- `{{stat:键}}`：该键的默认格式
- `{{stat:键|pct}}`：百分比；正文取整，表格保留一位小数
- `{{stat:键|ci}}`：置信区间，显示为"下限%–上限%"
- `{{stat:键|int}}`：整数，带千分位
- `{{stat:键|or}}`：比值比，保留两位小数

stats.json 里每个键的结构（字段名固定，数值由脚本写入）：

```json
"h1.抗压.counterpart": {
  "value": null,
  "ci": [null, null],
  "n": null,
  "n_gold": null,
  "unit": "occurrence",
  "method": "dsl",
  "source": "research/aggregates/estimates.json",
  "generated": "YYYY-MM-DD",
  "script": "research/scripts/07_estimate.py@<git sha>"
}
```

键名前缀：`corpus.` 语料规模与来源；`term.<词>.` 计数、精确率、职业分布；`occ.` 职业映射核对；`sense.<词>.` 已编码词的用法分布；`gold.` 金标准与 α；`llm.` 模型编码对照；`h1.` `h2.` `h3.` 假设估计；`assoc.` 广告层面的关联；`tmpl.` 模板句；`robust.` 稳健性重估。

新建两个文件：

- `lib/research-stats.ts`：导出 `fillStats(text, lang)`，在 keyword-atlas.tsx、research-report.tsx 和 Markdown 导出里统一调用。键不存在时，开发环境显示"—"并在控制台报错。
- `scripts/check-research-numbers.mjs`：读取 `research/config/copy-files.json` 列出的文件，扫描其中所有 `{zh, en}` 文本。出现以下任一情况就失败，并输出文件、字段路径和片段：
  - `{{stat:…}}` 之外的阿拉伯数字。例外：H1–H3、D1–D6、v2 这类编号；界面序号字段里的 01–99；参考文献条目里的年份和卷期；紧跟"CI"或"置信区间"的"95%"。
  - "过半""多数""大多数""少数""一半""近半""三成"之类的数量词，同一句里没有 stat 键。
  - 引用了 stats.json 里不存在的键。

## 二、工作关键词（`?page=keywords`）

### 左侧词表

- 分组替换现在统一的"语境对照"。初稿如下，用户确认后写进 `config/terms.yaml`。分组是作者的解释，方法说明里写明分法和理由。
  - 品质：独立、抗压、责任心、主动、严谨、耐心、细心、自驱、自主、适应、灵活、应变、学习
  - 协作：沟通、协调、协作、统筹、领导力、服务
  - 技能与工具：数据、分析、SQL、英语、熟练、逻辑、洞察、创新、时间管理
  - 管理用语：闭环、目标、结果导向、执行力、复盘
- 排序可以在"广告数"和"跨职业分布"之间切换。
- 计数含义不变：含该词的广告数。

### 词条详情，从上到下

1. 词、英文、一句话概括。现在页面底部那句（如"完成一段工作，并不自动获得全部决定权"）移到这里。
2. 数据行：`{{stat:term.X.ads|int}}` 份广告含这个词（共 `{{stat:corpus.n|int}}` 份），出现在 `{{stat:term.X.groups_present}}` 个职业大类。下面一行小字：抽查 `{{stat:term.X.n_checked}}` 条命中，`{{stat:term.X.k_correct}}` 条确实在说对人的要求。删除现在的大号百分比和"样本内"标签。
3. 职业分布：横向条形，每个职业大类里含该词的广告比例，旁边标该类广告总数。总数不到 30 的大类并入"其他"。
4. 常一起出现的词：选这个词出现处不少于 50 条的 2–3 个职业大类，每类列 5–8 个区分度最高的词。点开一个词，显示一条含这个搭配的去识别释义（要经人工确认）。没有任何大类达到 50 条时，只列整体的搭配词，并说明原因。
5. 几种用法（只对已编码的词）：用法分布条，每段写估计值和 95% 置信区间，条下写模型编码处数和金标准数。每种用法配一张卡。没编码的词，在卡片上方写一次"用法尚未编码，下面三例是挑选的对照，不代表比例"。
6. 卡片：岗位 · 这里指什么（一句）· 可能的交付 · 可以问。四项默认都显示。删除"举例 · 假设场景"；如果还想保留情景，挪到 JD 分析页。
7. 来源说明整页只写一次，放在卡片区下方：卡片文字是去识别释义，由谁起草、谁核对（读 `reviewStatus`）。
8. 方法折叠：匹配和排除规则、各词精确率表、职业分类方案与核对结果、分组理由、数据版本日期、下载聚合数据。

### 数据字段（`data/public-study.json` 的 `keywords[]`）

- `group`：品质 / 协作 / 技能与工具 / 管理用语
- `precisionKeys`：指向 `term.X.n_checked`、`term.X.k_correct`、`term.X.precision`
- `occupations[]`：`{group, adsKey, totalKey}`
- `collocates[]`：`{group, words: [{word, zKey, windowsKey, exampleId}]}`
- `senses[]`（已编码的词）：`{id, label, statKey}`
- `examples[]`：在现有字段上增加 `senseId`、`reviewStatus`（`model_draft` / `author_reviewed` / `revised`）
- `lib/keyword-contexts.ts`：保留 task、expertTake、deliverable，`scenario` 不再显示

`lib/public-study-types.ts` 同步更新类型。

## 三、研究观察（`?page=research`）

### 顺序

0. 头部：标题、一句导语、数据规模、版本日期、下载（PDF、Markdown、聚合数据、编码手册）。英文模式在顶部加 120–150 词的摘要。
1. 问题：一句话。下面 2–3 句说为什么值得问，每句接一篇文献。经济学把招聘广告里的技能词当作需求信号来数（Deming & Kahn 2018）；语言人类学认为技能话语把工作关系写成个人品质（Urciuoli 2008）。这项研究在语境里检查这些词实际在描述什么。
2. 假设：H1–H3 照录 preregistration.md，标"编码前写定于 YYYY-MM-DD"，链接到那次提交。探索性分析单列，标明是看过数据后加的。
3. 数据：总数、三个来源各多少、已知的采集信息、缺什么（雇主、薪资、发布日期等）。三种分析单位（广告、出现处、词条）各用在哪一步。
4. 怎么测：一张流程图，词表计数 → 抽样 → 双人编码 → 模型编码 → DSL 估计 → 稳健性。每个框下标关键数字（全部用 stat 键）。图下每步写一两句。
5. 发现：2–3 条。每条依次是结论句（写方向和大小）、数字行（估计值、置信区间、n、单位）、一张小图、一对对照例子（去识别释义）、最多一句限定。
6. 不同读法：模板、文本长度、职业构成、平台。每条写检验了什么、结果怎样。没检验的写"未检验"，不写推测性的回应。
7. 讨论：150–250 字。先说结果对"技能语言"这个讨论意味着什么，再说求职者可以据此问什么，问题最多 3 个。用社会学概念时，按 writing.md 第 8 条检验。
8. 局限：最多 5 条，每条写明会影响哪条结论。
9. 可复现：代码地址、编码手册版本、提示词版本和哈希、模型名称和调用日期、哪些数据公开、哪些不公开及原因。
10. 作者与分工：谁提出问题和设计、谁编码、模型编码了什么、Codex 等工具写了哪些代码和文字草稿。
11. 参考文献：只列正文引用过的。

### 现有页面里要去掉或合并的

- 每条观察里重复的限定语（"可重叠的词面同现计数""尚无独立人评准确率"等）合并进"局限"。
- 每条观察后面的"可以追问"挪到讨论末尾，合成一组。
- `researchObservations` 里所有手写数字换成 stat 键。没有键可用的数字，连同它支撑的句子一起删掉。
- 现在的三条观察（独立、抗压与协调、闭环）是发现的候选。最后保留哪几条，由估计结果决定；结果不支持的，照实写。

### 数据字段（`data/public-study.json` 的 `report`）

- `findings[]`：`{id, hypothesis, headline, statKeys[], chart, examples[], caveat}`
- `pipeline[]`：`{step, label, statKeys[]}`
- `robustness[]`：`{threat, test, result, statKeys[]}`
- `limitations[]`：`{text, affects}`
- `authorship`：`{design, coding, model, tools}`

## 四、现有内容怎么处理

`lib/keyword-contexts.ts`、`lib/research-observations.ts` 和 `data/public-study.json` 里的解释文字，大多由模型起草。保留下来的每一条都要有 `reviewStatus`。用户核对之前一律是 `model_draft`，页面上不能说它"经人工确认"。

`public/work-language-research.zh.md` 和 `.en.md` 是旧版报告的存档，不改内容；新版报告另出文件，页面上的下载指向新版。
