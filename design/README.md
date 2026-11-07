# Work Language Observatory — Design Handoff (v3)

本目录是 UI 的唯一设计真相。

## 真相层级（冲突时按序裁决）
1. COPY.md — 界面文字唯一来源。
2. TOKENS.css — 色值/字号/间距/圆角/组件唯一来源。
3. SPEC.md — 结构/状态/交互/断点唯一来源。
4. screens/*.png — 仅参考版式节奏与插画位置。
5. illustrations/*.png — 手绘插画唯一来源。
6. logo.svg — 标志唯一来源；改尺寸按模数表重建，不改路径比例。

以上是视觉参考层级；现有数据、来源与许可记录仍优先于模板示例，详见下方实施边界。

## 占位与来源规则
- 未证实数字：灰字 var(--placeholder)，区块挂 .slip（「占位」或「假设」）。
- 例子来源仅两种标记：引用 → 灰字 `引用 · 出处`；生成 → .slip「假设」。
- 图表非主证柱必须带图案（斜纹/点/竖线）+ 60% 不透明；信息不得只靠颜色区分。
- 未验证假设挂 .pill「待检验」；反例与支持同字号同位置。
- 真实数据到位前保留钩子：/* TODO(real-data): replace placeholder figures */
- 失败色 var(--sand)，不用红。

## 数字与序号（v3）
- 所有 mono 序号补前导零，两位起：`String(n).padStart(2,'0')`。
  错：`9 适应` / `11 目标`　对：`09 适应` / `11 目标`（≥100 时自然三位，不截断）。
- 计数、频次、日期、时长一律 var(--placeholder) 灰字；正文数字才用 ink。

## 字体（均 SIL OFL 1.1）
中文衬线 Source Han Serif CN（标题/词条/公式标题/引用原句）；中文无衬线 Source Han Sans SC；
英文 Inter，英文标题 Source Serif 4；数字/时间/频次/上标 Roboto Mono。字标上线前转曲。

## 标志模数
viewBox 0 0 24 24，u=1。五个矩形：top x4 y3 w16 h2；stem x4 y3 w2 h11；bottom x4 y12 w16 h2；
inner x7 y7 w9 h4；outer x4 y17 w9 h4。右边全开，端头平切。最小 16px；16px 时 inner/outer 高各 +5%。净空 4u。

## 插画管线 v2（PNG + multiply）
资产为白底 PNG，笔触与截图同源。用法：
  <img class="illo" src="/design/illustrations/ladder.png" width="110" alt="" aria-hidden="true">
融合：.illo{mix-blend-mode:multiply} —— 白底自动隐入纸白，无需抠图。
注意：multiply 只用于 PNG。代码绘制的线条（如教鞭 .clerk-stick）直接上 stroke 色，不要套 multiply。
禁令：
- 禁止跨文件 <use href="外部.svg#id">：iOS Safari / WebView 不支持，移动端会整块消失。
- 如确需 SVG：symbol 必须内联进同一 HTML 文档再 <use>。
- 禁止 Codex 自绘新小人；禁止把会随选中项移动的部件（教鞭、连线、指示箭头）烘进 PNG。
尺寸：桌面 90–130px，手机 44–80px；每页 ≤4 处；只放页边/块间缝隙/空状态。
14 张当前插画均已提供；其中 pointer-hand.png 为 2048 × 2048，其余 13 张为 2880 × 2880。清单见 MANIFEST.md。

## 工作流
分支 design/v13-handoff → 按读取顺序实现 → 每页对照 MANIFEST 截图自检版式 → 文字只取 COPY.md。
不要：OCR 截图文字；新增阴影/渐变/圆角体系；写死占位数字；导航图标换手绘风。

## v3 实施范围与证据边界（2026-11-07）

本轮只更新 P4 指引插画、代码教鞭、索引单行口径，以及显示序号的补零；其余页面与刚完成的词典内容增强不回退。交接中的固定时长、年份、示例图数字和研究口号不是运行数据。

- 当前公开词表是固定 33 项候选表达中的 Top 20，源于 2,000 份历史招聘归档，公开 60 条去识别的语境释义；词频取自现有数据，不改为示例图的 1,240、34% 或事项分组数字。
- 60 条语境仍标为「归档释义 · 非原文引句」；新增业务场景与交付物标明「举例」「交付示例」。不能把这些材料改成原文引用，也不把未见支持解释为没有支持。
- 词典的解释、例子和交付示例保持当前 `lib/keyword-contexts.ts` 内容；研究页保持已有真实分母、反例与方法说明。模板中的统一「无接口」结论和「含义越弹性，出现的岗位越广」不构成已验证发现。
- 01、09、11 是显示序号；2,000、618、33、频率、日期与耗时是实际计数或值。只给序号补前导零，不给真实计数改值。
- 指引小人的 PNG 原文件完整保存，显示窗口只藏空余画布。v3.1 线条使用实际测量的元素坐标，向左鼓出的短弧不套 multiply；详见 [P4 指引短弧补丁](patches/p4-pointer-v3.1.md)。
- v3.1 桌面与手机均使用左下开口的选中圈，小人脚底跟随选中行。指引短弧桌面≤34px、手机≤22px，避开词名、英文副名及序号；人物与连线均不得拦截点击。
- 375px 是否无溢出、教鞭锚点是否吻合，须由运行页面实测；本归档文件不宣称视觉验收已经完成。

## 资产实装与来源（2026-11-07）

- 插画由项目用户从 Lovart 导出并提供；原图名称、尺寸、文件哈希和 CSS 显示窗口记录于 [illustrations/manifest.json](illustrations/manifest.json)。`design/illustrations/` 保存交接原件，`public/design/illustrations/` 是逐字节相同的网站文件。
- 本项目使用这些素材，不据此另行授予第三方复制、转售或使用插画与品牌标志的许可。代码许可不自动覆盖这些视觉资产。
- 插画组件采用外层 `span.wlo-illustration.illo-frame` 与内层 `img.illo`。`mix-blend-mode:multiply` 隐去白底；显示窗口仅隐藏空余画布，原 PNG 不变，所有笔画及梯子图左上水印均保留。不得对页面根节点设置隐藏横向溢出来掩盖布局问题。
- 页面通过 Next Image 为屏幕加载尺寸适配的图片副本；仓库中的原始 PNG 保持不变，组件仍输出 img.illo，并保留原有显示窗口、笔触与 multiply 融合。
- 外层定位由 CSS 控制，组件仅传递宽度变量和画幅比例，允许页边插画按布局绝对定位。v3 指引小人使用无教鞭 PNG；教鞭由代码按当前布局实测坐标绘制，不写进位图。
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
