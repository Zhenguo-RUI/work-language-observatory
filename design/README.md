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
