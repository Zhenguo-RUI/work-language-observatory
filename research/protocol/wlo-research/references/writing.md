# 文风

这两页的文字要让人一读就知道测了什么、结果是多少、有多大把握。不靠语气显得严谨，靠分母、区间和具体例子。

## 中文

1. 一句话只说一件事。结论句先写方向和大小，再写条件。
2. 每个比例都带分母和单位。
3. 每条发现最多一句限定，挑最可能改变读者理解的那一句。其余限定集中写进"局限"。
4. "去识别释义""非原文"这类说明，同一页只出现一次。
5. 写广告怎么写，不写企业怎么想。"广告把检验写为'独立'，把管理写为'协助'"可以；"企业不想放权"不行。
6. 多用动词，少用名词堆叠。"评估流程的工具化沉淀"要改成"把评估步骤做成能反复运行的工具"。
7. 不用这些：不是……而是……式的反转；体现了、反映出、折射出、本质上、值得注意的是、综上所述、从某种意义上说；对仗句；段尾升华；用冒号引出结论；给普通词加引号表示特殊含义（引号只用来引原文和标出词条本身）。
8. 社会学概念一次只用一个，第一次出现时带上作者，用自己的话说清它在这里指什么。拿掉这个概念，句子照样成立，就把它删掉。
9. 给求职者的问题，要具体到一件能回答的事：谁决定、什么时候、按什么标准。
10. 比值比不说成"可能性高几倍"。

## English

1. Plain academic English. One claim per sentence. Concrete subjects and verbs.
2. Keep the claim strength identical to the Chinese. Translate the meaning, not the sentence shape.
3. Avoid: "it is worth noting", "underscores", "highlights", "sheds light on", "a testament to", "delve", "nuanced", "landscape", "multifaceted", "crucial", "serves to", "operates as", "functions as", "dual-facing", "discursive displacement". Use "robust" only in its statistical sense.
4. No "not X but Y" antithesis unless a test result supports both halves.
5. Report numbers as estimate, 95% CI, n and unit.

## 改写示例

数字一律写成 `{{stat:…}}` 或〈占位〉。这些示例只示范写法，里面的内容都不是研究结果，不能搬进页面。

**1. 限定语堆在正文里**（现页面"闭环"一条）

差：统计检索的是同一份广告内的词面同现。尚未逐条判定182份广告的全部词义，不能据此说其中多少比例属于AI劳动或责任转嫁。

好（编码前）：这里只数了"闭环"和"模型""异常"有没有出现在同一份广告里，还没有判断每处"闭环"指什么。

好（编码后）：在 `{{stat:sense.闭环.n|int}}` 处"闭环"里，`{{stat:sense.闭环.exception|pct}}` 指异常跟进（95% CI `{{stat:sense.闭环.exception|ci}}`），`{{stat:sense.闭环.datamodel|pct}}` 指数据或模型回路。

**2. 抽象的总论**（旧版报告）

差：能力词提供了一种筛选人的共同形式，却没有自动带来共同的工作标准。

好：广告用同一批词挑人，同一个词后面的活却可能很不一样。

**3. 名词堆叠的结尾**（旧版报告）

差：观察站把这种压缩展开为可对照的文本关系，让求职者能问到具体安排，也让研究者能重新检查"同一种能力"究竟是否可比。

好：把词放回它所在的职责里，求职者能问到具体安排，研究者能检查同一个词在不同岗位里是否指同一件事。

**4. 结论标题没有方向和大小**

差："抗压"常与"协调"同现

好：
- 标题：写"抗压"的广告，更常同时写"协调"
- 数字行：同一职业大类、同一平台内比较，比值比 `{{stat:assoc.抗压_协调.or|or}}`（95% CI `{{stat:assoc.抗压_协调.or|ci}}`）

**5. 概念当装饰**

差：该岗位处于组织层级的中间位置，体现了技能话语对劳动关系的建构。

好：Urciuoli 认为，技能词会把工作关系写成个人品质。品质组长这份广告里，"独立"只覆盖检验这一段；管理那一段，广告写的是"协助主管"。关系还在，只是没有写进能力要求。

**6. 英文辞藻**（旧版提示词）

差：High contextual dispersion enables elastic traits like self-driven to circulate across occupational boundaries, functioning as a dual-facing contract that promises moral agency to applicants while displacing organizational friction onto uncompensated emotional labor.

好：Self-driven appears in ads from 〈k〉 of 〈G〉 occupational groups. In 〈group A〉 ads it sits next to 〈collocate〉; in 〈group B〉 ads, next to 〈collocate〉.

**7. 英文限定语**（现页面）

差：These are model-coded results without an independent human accuracy estimate.

好：Two coders labelled `{{stat:gold.n|int}}` occurrences independently (Krippendorff's α = `{{stat:gold.alpha.counterpart}}` for named counterparts). On the same cases, the model agreed with the adjudicated labels `{{stat:llm.counterpart.acc|pct}}` of the time.

**8. 局限写得笼统**

差：本研究存在样本代表性等局限，结论仅供参考。

好：三个来源的采集时间不同（51job〈时间〉，BOSS〈时间〉，猎聘〈时间〉）。平台之间的差别可能部分来自时间差，这会影响 H3，不影响 H1 和 H2。

**9. 追问太泛**

差：可以追问团队的协作情况。

好：面试官或候选人延期时，原定的招聘目标由谁调整？

**10. 卡片里的重复说明**

差：每张卡都标"归档释义 · 非原文引句"。

好：卡片区下方写一次"以上为去识别释义，由〈谁〉起草，〈谁〉核对"。

## 写完自查

把页面文字通读一遍，找出下面几类句子改掉：名词堆叠的、对仗的、段尾在总结升华的、用冒号引出结论的、几条发现开头或结尾长得一样的、同一个限定说了两遍以上的。

词条short只写这个词要求什么，不描述案例卡片，不和其他段落重复。
