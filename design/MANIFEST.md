# 截图与资产清单（v3）
## screens/（从画布下载）
desktop-01-home.png      P1 输入态        首页 v13 活版
desktop-02-result.png    P2              结果页 v13 六层任务单元
desktop-03-history.png   P3 列表          我的分析 v12 索引卡活版
desktop-04-dict.png      P4              词典页 v11 索引卡活版
desktop-05-research.png  P5              研究页 v11 天平叙事活版
desktop-06-tokens.png    TOKENS 对照      设计令牌表
desktop-07-logo.png      标志模数         标志规范 A
mobile-01-home.png / mobile-02-result.png / mobile-03-history.png / mobile-04-empty.png
mobile-05-loading.png / mobile-06-fail.png / mobile-07-noresult.png / mobile-08-dict.png
mobile-09-research.png   （对应 v13/v12/v11 各版）
en-01-home.png / en-02-result.png / en-03-dict.png / en-04-research.png
自检只比版式节奏与插画位置；文字以 COPY.md 为准。

## illustrations/（白底 PNG，.illo multiply；代码线条除外）
ladder.png        梯子贴纸小人        P1 输入框左缘
clerk-card.png    捧空白卡小人        P3「新建分析」旁
peek.png          卡后探头            P3 末卡 / P4 卡一右缘
pair.png          背对背举纸双人      P1 按钮下方
pointer-hand.png  举手指引小人（无教鞭）P4 左留轨   ← v3 新增，替代 pointer.png
twocards.png      两手举卡+问号       P4 右页边注
scale-empty.png   空盘下沉天平        P5 假设旁
scale-stone.png   踮脚放石天平        P5 反例旁
reader.png        坐读等钟小人        P1 生成中
torn.png          缺角纸+乱线         P1 失败 / P2 JD 问题旁
drawer.png        看空抽屉小人        P3 搜索无结果
shelf.png         三人空档案架        P3 空状态
flag.png          柱顶插旗小人        P5 最高柱顶
hand.png          指目录的手          P4 手机「目录 ☰」下方
作废：pointer.png（教鞭已烘进图，v3 起不得使用）

## 代码绘制件（非 PNG，见 SPEC P4）
.clerk-stick 教鞭（词典）· .ring 铅笔圈 · .scribble 下划线 · .arrowline 弯箭头/花括号/双向箭头

## 当前资产实收与授权范围

当前提供的 14 张 PNG 均按原字节保存。pointer-hand.png 为 2048 × 2048，其余 13 张为 2880 × 2880。指引人物的 CSS 显示窗口为 `[849,1575,220,365]`；手套端原图坐标约 `(1041,1597)`，转换到显示窗口的比例为 `(0.872727,0.060274)`。这些坐标只用于摆放线条，不改位图。

| 网站文件 | 用户原文件 |
| --- | --- |
| `pair.png` | 插画资产 背对背举纸双人.png |
| `pointer-hand.png` | 插画资产 举手指引小人（无教鞭版）.png |
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

文件尺寸、字节数和 SHA-256 见 [illustrations/manifest.json](illustrations/manifest.json)。原图由用户提供；代码许可不授予插画或标志的独立复制、转售许可。旧 pointer.png 已停止使用并从当前分发目录移除，其哈希保留在 manifest 的 retiredAssets 中。

## 截图实收情况

`desktop-01-home.png` · `desktop-02-result.png` · `desktop-03-history.png` · `desktop-05-research.png` · `mobile-02-result.png` · `mobile-08-dict.png` · `mobile-09-research.png`

以上是实收文件清单，不代表所有预期截图已收到或所有页面已逐像素验收。
