没丢，是我上一轮只给了增量补丁（PATCH 1–3）和两句 SPEC 增补，没把它们合并回完整文件——你手里那份 WLO-HANDOFF.md 还是 v1，里面 P1/P3 仍是旧版描述，插画管线也还是会被 iOS 杀掉的 sprite 方案。这是我的疏漏。
下面是合并后的完整 v2 单文件：P1 首页 v13、P3 我的分析 v12 的活版结构已写进 SPEC，插画管线换成 PNG + multiply，防溢出条款进 TOKENS 和 SPEC。用它整个覆盖旧文件重新上传即可，Codex 的读取方式不用变。
# WLO HANDOFF v2 — 单文件交接包
# 给 Codex 的指令：本文件按 "==== FILE: 路径 ====" 分隔为多个文件，先拆分为 design/ 目录再实现。
# 读取顺序：README → TOKENS.css → SPEC.md → COPY.md → MANIFEST.md → logo.svg
# 硬禁令：禁止从 screenshots/*.png 转录任何文字（图中中文有坏笔画）；文字唯一来源 COPY.md。
# 禁止编造统计数字；占位数字一律 var(--placeholder) 灰字 + .slip 纸条。
# 禁止自绘新小人；缺插画资产时留空并写 TODO，不要补画。
# v2 变更：P1/P3 升级为活版（胶带索引卡/铅笔圈/文件签/小人）；插画改 PNG+multiply 管线；新增防横向溢出条款。

==== FILE: design/README.md ====
# Work Language Observatory — Design Handoff (v2)

本目录是 UI 的唯一设计真相。

## 真相层级（冲突时按序裁决）
1. COPY.md — 界面文字唯一来源。
2. TOKENS.css — 色值/字号/间距/圆角/组件唯一来源。
3. SPEC.md — 结构/状态/交互/断点唯一来源。
4. screens/*.png — 仅参考版式节奏与插画位置。
5. illustrations/*.png — 手绘插画唯一来源。
6. logo.svg — 标志唯一来源；改尺寸按模数表重建，不改路径比例。

## 占位与来源规则
- 未证实数字：灰字 var(--placeholder)，区块挂 .slip（「占位」或「假设」）。
- 例子来源仅两种标记：引用 → 灰字 `引用 · 出处`；生成 → .slip「假设」。
- 图表非主证柱必须带图案（斜纹/点/竖线）+ 60% 不透明；信息不得只靠颜色区分。
- 未验证假设挂 .pill「待检验」；反例与支持同字号同位置。
- 真实数据到位前保留钩子：/* TODO(real-data): replace placeholder figures */
- 失败色 var(--sand)，不用红。

## 字体（均 SIL OFL 1.1）
中文衬线 Source Han Serif CN（标题/词条/公式标题/引用原句）；中文无衬线 Source Han Sans SC；
英文 Inter，英文标题 Source Serif 4；数字/时间/频次/上标 Roboto Mono。字标上线前转曲。

## 标志模数
viewBox 0 0 24 24，u=1。五个矩形：top x4 y3 w16 h2；stem x4 y3 w2 h11；bottom x4 y12 w16 h2；
inner x7 y7 w9 h4；outer x4 y17 w9 h4。右边全开，端头平切。最小 16px；16px 时 inner/outer 高各 +5%。净空 4u。

## 插画管线 v2（取代 sprite 方案）
资产为白底 PNG（2880px，笔触与截图同源）。用法：
  <img class="illo" src="/design/illustrations/ladder.png" width="110" alt="" aria-hidden="true">
融合：.illo{mix-blend-mode:multiply} —— 白底自动隐入纸白，无需抠图。
禁令：
- 禁止跨文件 <use href="外部.svg#id">：iOS Safari / WebView 不支持，移动端会整块消失。
- 如确需 SVG：symbol 必须内联进同一 HTML 文档再 <use>。
- 禁止 Codex 自绘新小人；缺形象时报告缺哪个文件。
尺寸：桌面 90–130px，手机 44–80px；每页 ≤4 处；只放页边/块间缝隙/空状态。
已交付并核验：ladder.png · clerk-card.png · peek.png · pair.png · pointer.png · twocards.png · scale-empty.png · scale-stone.png · reader.png · torn.png · drawer.png · shelf.png · flag.png · hand.png。14 张均为用户提供的原始 PNG，未重绘、重编码或改变像素。

## 工作流
分支 design/v13-handoff → 按读取顺序实现 → 每页对照 MANIFEST 截图自检版式 → 文字只取 COPY.md。
不要：OCR 截图文字；新增阴影/渐变/圆角体系；写死占位数字；导航图标换手绘风。


## 资产实装与来源（2026-11-07）

- 插画由项目用户从 Lovart 导出并提供；原图名称、尺寸、文件哈希和 CSS 显示窗口记录于 [illustrations/manifest.json](illustrations/manifest.json)。`design/illustrations/` 保存交接原件，`public/design/illustrations/` 是逐字节相同的网站文件。
- 本项目使用这些素材，不据此另行授予第三方复制、转售或使用插画与品牌标志的许可。代码许可不自动覆盖这些视觉资产。
- 插画组件采用外层 `span.wlo-illustration.illo-frame` 与内层 `img.illo`。`mix-blend-mode:multiply` 隐去白底；显示窗口仅隐藏空余画布，原 PNG 不变，所有笔画及梯子图左上水印均保留。不得对页面根节点设置隐藏横向溢出来掩盖布局问题。
- 外层定位由 CSS 控制，组件仅传递宽度变量和画幅比例，允许页边插画按布局绝对定位。教鞭原图很长，保持完整教鞭时默认约 130px 高。
- `design/illustrations.svg` 与其 `public/` 副本仅保留为旧交接档案；当前插画组件不再引用 SVG sprite，不自行绘制替代图。
- `logo.svg` 来自用户设计交接，组件按相同五矩形坐标呈现。

## 字体来源与处理

页面字体均本地托管，不向字体服务发送用户输入。下列字体各自遵循随包保存的 SIL Open Font License 1.1；字体许可与插画使用范围分开。

| 页面用途 | 上游来源 | 本项目处理 | 随包许可 |
| --- | --- | --- | --- |
| 中文正文：WLO Han Sans（派生字体） | [Adobe Source Han Sans](https://github.com/adobe-fonts/source-han-sans)，`release/Variable/TTF/SourceHanSansSC-VF.ttf` | 保留基本汉字与标点，实例化为 400 字重，转 WOFF2 | `public/fonts/OFL-SourceHan-sans.txt` |
| 中文标题与引文：WLO Han Serif（派生字体） | [Adobe Source Han Serif](https://github.com/adobe-fonts/source-han-serif)，`release/Variable/TTF/SourceHanSerifSC-VF.ttf` | 同上 | `public/fonts/OFL-SourceHan-serif.txt` |
| 英文正文：Inter | [Google Fonts / Inter](https://github.com/google/fonts/tree/main/ofl/inter) | 拉丁字符 WOFF2；保留变量字重 | `public/fonts/OFL-Inter.txt` |
| 英文标题：Source Serif 4 | [Google Fonts / Source Serif 4](https://github.com/google/fonts/tree/main/ofl/sourceserif4) | 拉丁字符 WOFF2；保留变量字重 | `public/fonts/OFL-SourceSerif4.txt` |
| 数字与状态：Roboto Mono | [Google Fonts / Roboto Mono](https://github.com/google/fonts/tree/main/ofl/robotomono) | 拉丁字符 WOFF2；保留变量字重 | `public/fonts/OFL-RobotoMono.txt` |
| PDF 中文文字：Noto Sans SC Regular | [Google Fonts / Noto Sans SC](https://github.com/google/fonts/tree/main/ofl/notosanssc) | 原样 TTF，按需载入并嵌入导出的 PDF | `public/fonts/OFL-NotoSansSC.txt` |

Source Han 的 OFL 保留名称为 `Source`。本项目子集化、实例化的修改版已改用内部字体族名 `WLO Han Sans` 与 `WLO Han Serif`，字形样式为 `Regular`，完整名分别为 `WLO Han Sans Regular`、`WLO Han Serif Regular`，PostScript 名为 `WLOHanSans-Regular`、`WLOHanSerif-Regular`。原始版权和 OFL 条文保持不变；改名核验同时确认字形、度量、字符映射与 GPOS/GSUB 布局表没有变化。现有文件路径和 CSS 字体别名仅用于兼容已接入的页面，不表示这是上游未修改原版。PDF 字体的原始来源和哈希另见 `public/fonts/README.md`。

==== FILE: design/TOKENS.css ====
:root{
  --paper:#FCFCFA; --panel:#F7F7F5; --hover:#F2F2EE;
  --ink:#1A1A1A; --grey:#6B6B66; --placeholder:#9A9A92;
  --hairline:#EBEBE6; --slate:#4A6B7C; --sage:#899B8E; --sand:#D9C7A8;
  --chart-neutral:#C9C9C2;
  --sp-1:4px; --sp-2:8px; --sp-3:16px; --sp-4:24px; --sp-5:40px; --sp-6:56px;
  --radius:6px; --hair:1px; --touch:44px;
  --col-read:680px; --col-read-en-label:200px; --margin-m:20px;
  --f-serif:"Source Han Serif CN","Source Serif 4",serif;
  --f-sans:"Source Han Sans SC","Inter",sans-serif;
  --f-mono:"Roboto Mono",monospace;
}
.t-h1{font:400 28px/1.3 var(--f-serif);color:var(--ink)}
.t-h2{font:500 16px/1.4 var(--f-sans);color:var(--ink)}
.t-formula{font:400 20px/1.35 var(--f-serif);color:var(--ink)}
.t-body{font:400 15px/1.75 var(--f-sans);color:var(--ink)}
.t-sub{font:400 13px/1.7 var(--f-sans);color:var(--grey)}
.t-mono{font:400 11px/1.4 var(--f-mono);color:var(--grey)}
.t-mono.ph{color:var(--placeholder)}
.btn-primary{height:44px;padding:0 20px;border:0;border-radius:var(--radius);background:var(--slate);color:#fff;font:500 15px var(--f-sans)}
.btn-ghost{height:40px;padding:0 14px;border:var(--hair) solid var(--hairline);border-radius:var(--radius);background:transparent;color:var(--slate);font:400 13px var(--f-sans)}
.pill{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:999px;font:400 11px var(--f-sans)}
.pill--ok{background:color-mix(in srgb,var(--sage) 18%,transparent);color:#3F5442;outline:1px solid color-mix(in srgb,var(--sage) 55%,transparent)}
.pill--draft{background:color-mix(in srgb,var(--sand) 22%,transparent);color:#6B5636}
.pill--fail{background:transparent;color:var(--grey);outline:1px solid var(--hairline)}
.slip{display:inline-block;transform:rotate(-6deg);padding:1px 6px;background:#fff;border:1.5px solid var(--ink);border-radius:2px;font:400 10px var(--f-mono)}
.quote{border-left:2px solid var(--sage);background:var(--panel);border-radius:var(--radius);padding:14px 16px;font:400 14px/1.8 var(--f-serif)}
.quote .hl{background:color-mix(in srgb,var(--sage) 26%,transparent)}
.quote .en{display:block;margin-top:6px;font:400 13px/1.6 var(--f-sans);color:var(--grey)}
.chip-word{background:color-mix(in srgb,var(--sage) 16%,transparent);border-radius:999px;padding:2px 10px;font:400 12px var(--f-sans)}
/* 索引卡系统 */
.card-index{position:relative;max-width:100%;background:#fff;border:var(--hair) solid var(--hairline);
  border-radius:var(--radius);padding:20px;transform:rotate(var(--tilt,-1deg))}
.card-index .tape{position:absolute;top:-8px;left:50%;width:min(70px,18%);height:16px;
  transform:translateX(-50%) rotate(2deg);background:var(--sand);border:1.5px solid var(--ink)}
.card-index .fold{position:absolute;right:8px;bottom:8px;width:14px;height:14px;
  border-left:1.5px solid var(--ink);border-top:1.5px solid var(--ink);background:var(--paper)}
.card-index .peek{position:absolute;right:4px;bottom:-6px}
.card-index .tab{position:absolute;top:-7px;left:14px;width:56px;height:14px;
  border:1.5px solid var(--ink);border-radius:2px}
.tab--ok{background:var(--sage)} .tab--draft{background:var(--sand)} .tab--fail{background:transparent}
/* 手绘笔触（内联 SVG 用） */
.scribble{fill:none;stroke:var(--sage);stroke-width:2;stroke-linecap:round}
.ring{fill:none;stroke:var(--slate);stroke-width:2;stroke-linecap:round}
.arrowline{fill:none;stroke:var(--ink);stroke-width:1.5;stroke-linecap:round}
/* 插画 */
.illo{display:block;mix-blend-mode:multiply}
/* 状态/进度 */
.stepper i{width:16px;height:16px;border-radius:50%}
.stepper .done{background:var(--sage)} .stepper .now{outline:2px solid var(--slate)} .stepper .todo{outline:1px solid var(--hairline)}
.progress{display:flex;gap:4px}
.progress i{height:6px;flex:1;border-radius:3px;outline:1px solid var(--hairline)}
.progress .done{background:var(--sage);outline:0}
.drawer{border-top:var(--hair) solid var(--hairline);border-radius:var(--radius) var(--radius) 0 0;background:var(--paper)}
.hairline{border-top:var(--hair) solid var(--hairline)}
/* 防横向溢出（手机硬约束） */
@media (max-width:430px){
  .card-index{--tilt:0deg}
  .card-index .tape{width:min(56px,18%)}
}
/* QA：375px 下必须满足 document.documentElement.scrollWidth === clientWidth；
   不通过先修偏移，禁止用 overflow-x:hidden 掩盖。 */

==== FILE: design/SPEC.md ====
# SPEC v13.2
## 全局
断点 1440/768/390/375。桌面阅读栏 620–680px；手机边距 20px。
顶栏 56px：标志 28px + 品牌双行；导航四项，当前项=灰绿底圆角药丸；右 中/EN 分段。
Quiet strip 28px：左 mono 状态，右 mono 计数（灰字）。
手机底栏 62px 含安全区：四项，几何线性图标 20px + 10px 标签；图标永不手绘。
触控 ≥44px；无 hover 依赖；抽屉/模态一律不用暗遮罩。
长文默认折叠，入口标字数（桌面）；手机 EN 译文默认折叠。
插画一律 <img class="illo">；禁止跨文件 SVG use（iOS 不支持）。
手机 ≤430px：卡片不旋转；胶带/折角/探头正内偏移或 ≤6px 微出卡片；任何元素不得超出视口宽。
375px 自检：scrollWidth === clientWidth。

## P1 JD 分析（v13 活版）
输入态：H1 28px 衬线一行，末五字「放回具体工作。」加 .scribble 铅笔下划线；副题五行。
主输入框（桌面 620×260 / 手机 350×220）；左缘 ladder.png（桌面 90–110px；手机 60px 或隐藏）。
「试试示例（假设）」到输入框左下角一条 .arrowline 手绘弯箭头，箭头端 slate 圆点。
字段脚行：左示例链接，右 mono 计数+清空；岗位/公司并排（手机纵排）+「查背景」；
可展开「来源链接与更多分析选项」；主按钮+次入口+两行承诺；按钮下 pair.png（桌面 180px/手机 140px）。
桌面右区 / 手机预览：一词两事项，两张 .card-index（tilt −1.0/+0.8，胶带+折角）；
卡 A hover=第二条胶带+⋯；卡间手绘花括号 .arrowline；卡 B 内左留白拨盘小人（twocards.png）；
来源标记：引用 pill / 假设纸条。
生成中：输入只读可见+「已保留」角标；四步 stepper；计时行+纸条「估计」；四段进度条无百分比；reader.png。
失败：sand 左边框面板；stepper 断点 ✕；「输入与草稿已保留，无需重贴」；重试+查看草稿/返回修改；下方最近成功记录；torn.png。

## P2 结果页
顺序：操作栏（修改/下载/下一份）→ 标题+纸条+定位两句 → 条件条（手机 2×2）→ 公司行+「背景 ▾」
→ 工作链（三步 .arrowline 箭头；手机竖排）→ 页内导航（桌面右边注三项，当前项前手绘箭头）。
任务单元六层，层间 12px，单元间 40px+细线，不套卡片：
① 动作式标题 20px 衬线 ② .quote（¶定位+词高亮；EN 加 .quote .en）③ 说人话三行（对象/行动/用途）
④ 举例+来源标记 ⑤ 交付+.slip「建议」 ⑥ 做得好。
能力四档：pill 明确要求 / pill 优先考虑（+slip「原文截断，不补写」）/ slip 建议 / slip 待确认。
准备：材料两条；面试练习两条（pill 练习+思路行）；「要问对方的」单列。
社会学三行衬线+「展开完整分析 →」。反馈行：赞/踩+「我会怎样理解这个词 ✎」。
桌面原文栏 300px #F7F7F5 常驻，引用同步高亮；手机「拆解/原文」分段，可返回原位置。
边注插画位：ladder.png（事项一旁）/ torn.png（JD 问题旁）。

## P3 我的分析（v12 活版）
记录 = .card-index + 状态文件签 .tab：sage 完整 / sand 草稿 / outline 失败；草稿卡加胶带+折角。
tilt 交替 −0.5/+0.4/−0.4/+0.5/−0.3（手机 0）。卡内：serif 17px 标题 / 13px 灰 公司·mono 日期 / 右 ⋯。
长标题：桌面省略号，手机换行。
筛选选中态 = .ring 铅笔圈（slate 2px，右上开口），其余纯灰字；不用填充药丸。
「新建分析」按钮旁 clerk-card.png（桌面 64px / 手机 48px）。
首卡 hover = 第二胶带 + ⋯ + 标题 .scribble 下划线。末卡右缘 peek.png（头+一手）。
删除确认卡内行内展开（#F7F7F5 底），无模态无遮罩。
空状态：shelf.png + 一行标题 + 三提示 + 双按钮。
搜索无结果：查询保留可编辑 + drawer.png + 清除搜索 + 去词典查该词 + 最近记录两条。

## P4 工作关键词
桌面左索引 260px：搜索+12 行；选中词=.ring 铅笔圈；索引底 pointer.png 举教鞭指圈。
右正文：词+.scribble 下划线、频次+分母+纸条、「出现在哪些事项」三行（手绘图标位暂留空+计数+›）、
三张 .card-index（tilt −1.2/+0.8/−0.6，胶带+折角；hover 抬起=第二胶带+折角翻开）、
卡一右缘 peek.png、卡间手绘双向箭头、结论+.scribble 下划线、边注 twocards.png。
手机：目录进底部抽屉（无遮罩）；卡片纵排不横滑；「目录 ☰」旁 hand.png。

## P5 研究观察
边注导航 140px 纯灰列表（当前项前手绘箭头）。正文 620px：H1+纸条、副题两行、下载；
问题一行；假设+pill「待检验」；支持=横向条形图（标签左、灰值右、›；首行选中；
最高柱顶 flag.png；页边 .arrowline 指它；轴注仅 n=…）；
反例同权重两行+结论；「可能的不同读法」pill+「补充你的读法 ›」；讨论/方法折叠。
天平叙事：假设旁 scale-empty.png、反例旁 scale-stone.png（原始 PNG 已交付）。
手机：图表两行式；天平两位保留；目录抽屉无遮罩。

## EN 规范差
1 标题区预留两行高。2 图表标签列 200px。3 手机 EN 译文默认折叠。
品牌双行反转：EN 主行+中文 10px 字距副行；全页中文仅此处+引用原句。

==== FILE: design/COPY.md ====
# COPY（唯一文字来源）
## 品牌与导航
工作语言观察站 / Work Language Observatory
JD 分析 · 我的分析 · 工作关键词 · 研究观察
JD Analysis · My Analyses · Work Keywords · Research Notes
## P1
把招聘里的词，放回具体工作。 / Put hiring words back into the work.
“自驱”“沟通”“抗压”，在不同岗位里意味着什么？粘贴一份招聘描述，查看这些词与哪些职责、协作和工作条件共同出现，再对照其他岗位中的用法。
分析一份 JD / 从一个关键词开始 / 试试示例（假设） / 查背景 / 来源链接与更多分析选项
文本仅用于本次分析，不做训练。 / 结果存到这台设备的「我的分析」。
## P2 结构词
修改这份 JD · 下载 · 分析下一份 · 工作链 · 逐条拆解工作职责 · 这项里的词
层标签：举例 / 交付 / 做得好
能力档：明确要求 / 优先考虑 / 原文截断，不补写 / 建议 / 待确认
可以准备的材料 · 面试可以练什么 · 要问对方的
社会学分析 · 展开完整分析 → · 这份拆解有帮助吗？ · 我会怎样理解这个词 ✎
原文 · 公开招引 ↗ · 公司背景 ▾
## P3
我的分析 · 新建分析 · 搜索岗位或公司 · 全部/完整/草稿/失败
删除这条记录？ / 删除后无法恢复。 / 取消 / 删除
分析过的岗位都会留在这里。 / 只存在这台设备上 / 可随时导出 Markdown / 不会同步给其他人
没有匹配「X」的记录 / 换个岗位词，或去词典查这个词。 / 清除搜索 / 在「工作关键词」里查「X」→
## P4
同一个词，不同的工作要求。 / 保留岗位与原句，比较熟悉的能力词在不同工作中如何被使用。
出现在哪些事项 / 三个语境 / 差异不在能力，在有无接口。 / 看全部语境 → / 词条目录
## P5
招聘如何描绘“合适的人”？
从反复出现的表达出发，观察工作要求如何被写成个人品质，以及这些词语留下了哪些解释空间。
问题 / 假设 / 待检验 / 支持 / 反例 / 讨论 / 方法 · 口径 · 局限 · 参考
含义越弹性，出现的岗位越广。 / 弹性不是充分条件，行业也在筛选。
可能的不同读法 / 补充你的读法 ›
## 状态
分析完成 · 41 秒 / 已存本机 / 草稿已保存 / 已保留 / 分析未完成 / 证据核对中断 · 网络不稳定
输入与草稿已保留，无需重贴。 / 重试 / 查看草稿 / 返回修改 / 历史记录不受本次失败影响。
已等待 42 秒 / 预计约 1 分钟 / 取消并保留草稿
## 页脚
© 2025 工作语言观察站 / 联系与反馈 · 研究伦理
## 规则
引用标记 `引用 · 出处`（灰字无框）；假设标记纸条「假设」。仅此两种。
占位=纸条「占位」+灰字数字。每行 ≤22 汉字；无段落级正文（社会学三行除外）。

==== FILE: design/MANIFEST.md ====
# 截图与资产清单
## screens/（从画布下载）
desktop-01-home.png      P1 输入态        首页 v13 活版
desktop-02-result.png    P2              结果页 v13 六层任务单元
desktop-03-history.png   P3 列表          我的分析 v12 索引卡活版
desktop-04-dict.png      P4              词典页 v11 索引卡活版
desktop-05-research.png  P5              研究页 v11 天平叙事活版
desktop-06-tokens.png    TOKENS 对照      设计令牌表
desktop-07-logo.png      标志模数         标志规范 A
mobile-01-home.png       P1 手机          手机端首页 v13 活版
mobile-02-result.png     P2 手机          手机端结果页 v13
mobile-03-history.png    P3 手机          手机端我的分析 v12 活版
mobile-04-empty.png      P3 空态          手机端我的分析 空状态
mobile-05-loading.png    P1 生成中        手机端生成中状态
mobile-06-fail.png       P1 失败          手机端失败重试状态
mobile-07-noresult.png   P3 无结果        手机端搜索无结果状态
mobile-08-dict.png       P4 手机          手机端词典页 v11
mobile-09-research.png   P5 手机          手机端研究页 v11
en-01-home.png / en-02-result.png / en-03-dict.png / en-04-research.png
## illustrations/（14 张原始 PNG，multiply 融合）

全部文件已按最终清单到位，原始尺寸均为 2880 × 2880。文件名与交付源一一对应：

| 网站文件名 | 用户交付原名 |
| --- | --- |
| `pair.png` | 插画资产 背对背举纸双人.png |
| `pointer.png` | 插画资产 举教鞭小人.png |
| `peek.png` | 插画资产 卡后探头小人.png |
| `clerk-card.png` | 插画资产 捧空白卡小人.png |
| `ladder.png` | 插画资产 梯子贴纸小人.png |
| `scale-stone.png` | 插画资产 踮脚放石天平.png |
| `drawer.png` | 插画资产 看空抽屉小人.png |
| `scale-empty.png` | 插画资产 空盘天平.png |
| `twocards.png` | 插画资产 两手举卡小人.png |
| `torn.png` | 插画资产 缺角纸与乱线小人.png |
| `shelf.png` | 插画资产 三人空档案架.png |
| `reader.png` | 插画资产 坐读等钟小人.png |
| `flag.png` | 插画资产 柱顶插旗小人.png |
| `hand.png` | 插画资产 指目录的手.png |

原图哈希、字节数、色彩模式及页面显示窗口见 [illustrations/manifest.json](illustrations/manifest.json)。显示窗口仅处理空余画布，不编辑 PNG，不截掉人物、手、脚、教鞭或原图标记。`ladder.png` 的左上生成标记保留。

## 截图实收情况

当前 `screens/` 已收到并归档：`desktop-02-result.png`、`desktop-05-research.png`、`mobile-02-result.png`、`mobile-08-dict.png`、`mobile-09-research.png`。上面其他截图名为设计清单中的预期参考，未据此伪称已完成逐像素核对。

自检只比较版式节奏与插画位置；界面文字以 COPY.md 为准，研究数字来自实际数据。

==== FILE: design/logo.svg ====
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" role="img" aria-label="Work Language Observatory">
  <rect x="4" y="3" width="16" height="2"/>
  <rect x="4" y="3" width="2" height="11"/>
  <rect x="4" y="12" width="16" height="2"/>
  <rect x="7" y="7" width="9" height="4"/>
  <rect x="4" y="17" width="9" height="4"/>
</svg>
操作：覆盖旧 WLO-HANDOFF.md 重新上传；把 14 个插画 PNG 按最终清单放进 design/illustrations/；截图按 MANIFEST 更新四张新版（desktop-01/03、mobile-01/03）。
给 Codex 的增量提示（如果它已经按 v1 实现过）：只需改 P1/P3 两页 + 加 .illo/.tab/防溢出 CSS + 把 <use> 全换成 <img class="illo">，其余页面不动。
2026-11-07 实收更新：14 个原始插画均已归档；不再保留“缺 9 张”的过期交付状态。