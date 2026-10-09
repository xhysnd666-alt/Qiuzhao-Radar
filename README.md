# 秋招雷达 · Qiuzhao Radar

> 一个应用心理学毕业生，在被秋招反复教育之后，决定自己造一个雷达。
> 现在它盯着 102 家内地公司 + 一整个香港，替我记着：什么时候开、什么时候截止、我投了没、下一场面试几点。

> **数据快照**：内地 102 家公司 · 181 条投递 · 朱迪表 3027 条岗位 / 300 条内推码；留港专区 7 家公司 · 9 条港投。
> （已挂多少条就不写了，容易影响心情。）

## 这东西能干嘛

### 总览（内地）

- 102 家公司的官方信息：行业、批次、岗位方向、起止时间、状态，全是人工核过的；
- **已投公司置顶**——打开页面第一眼看到的就是自己踩过的坑，方便复盘；
- 排序按岗位优先级：人力资源 > 游戏运营 > 游戏发行 > 游戏营销 > 用户研究 > 游戏策划；
- 截止倒计时、招聘窗口进度条、「最近节点」提醒，再也不会「啊这个昨天截止了」；
- 筛选、统计卡一键筛，支持隐藏已投、过滤实习。

### 我的投递（内地）

- 跟桌面那张 `秋招简历投递.xlsx` 同步（当前 181 条，Excel 就是我的新陈代谢）；
- 看板 / 表格 / 时间线三视图：看板按「已投递 / 笔试 / 面试 / Offer / 已挂」分列；
- 阶段颜色分明：面试=紫色跳动、已挂=红色警示、Offer=金色。颜色的鲜艳程度和我的心情成反比；
- 顶部统计胶囊一键筛阶段，配一个「折叠已挂」按钮——官方名称叫折叠已挂，实际功能叫眼不见为净；
- 每条投递都有「官网查进度」直达官方页面，不用在收藏夹里翻二十个链接；
- 面试日程过了时间自动标「已参加」，毕竟人还是要往前看。

### 留港专区（香港）

- 独立页面 `hk.html`，霓虹夜景 + 维港天际线 + 港铁站牌 + 茶餐厅水牌。既然都要卷，不如卷得好看一点；
- **香港总览**：公司 / 项目 / 岗位类型（全职、MT、Graduate Trainee、暑期 · 冬季实习、猎头顾问）/ **签证支持**（赞助、IANG 友好、需自带工作权、待核实）/ 语言要求 / 起止时间 / 状态 / 官方入口；
- **我的港投**：看板 + 表格 + 独立时间线，跟内地的两套数据互不打扰；
- 目前 7 家公司 / 9 条港投：Vocalbeats、景福珠宝、东华三院、Michael Page、Teach For Hong Kong、HKTVmall、Sun Life 永明金融。

### 朱迪汇总（第三方线索层）

- 3027 条岗位 + 300 条内推码，可搜索、可筛选；
- 总览会自动挑出符合我目标岗位的公司，作为「朱迪线索」排在旁边——用来发现机会，不用来背书。

### 面经库 & AI 面试助手

- 85 条面经 + 70 道通用面试题（含考查意图、回答思路、参考答案）；
- AI 建议：面试锦囊 + 重点公司定制提示；「问 AI」按钮生成提示词，粘贴到任意 AI 对话就能用。

### 顺手加的

- **央国企名录**：119 家，含官方网址；
- **信息源**：精选账号，分「岗位信息 / 行业面试经验」；
- **反馈池**：链接 + 摘要，不搬原文；
- **待确认队列**：官网自动检测出来的变化，人工核实后才进正式数据。

## 为什么它靠谱（我不是严谨，是被坑怕了）

- **L1 官方层**（`companies.js`、`hk_companies.js`）：只写公司官网、官方招聘页、官方公众号、高校就业网的信息；没核实的字段一律标「待核实」，宁可空着也不瞎编日期；入口一个个点开验证过。
- **L2 线索层**（`zhudi.js`、`sources.js`）：第三方整理，用来发现机会，不代表官方事实。
- **L3 面经 / 反馈**（`interviews.js`、反馈池）：只存链接 + 摘要，保留原文关键信息。
- `applications.js`、`hk_applications.js` 由表格生成，不建议手改——手改一时爽，覆盖火葬场。

## 数据怎么更新

| 更新啥 | 咋整 |
| --- | --- |
| 内地投递记录 | 更新桌面 `秋招简历投递.xlsx` → 跑 `python scripts/import_xlsx.py applications` |
| 朱迪汇总表 | 导出最新 xlsx 到 Downloads → 跑 `python scripts/import_xlsx.py zhudi` |
| 香港投递记录 | 更新桌面 `香港岗位投递.xlsx` → 由 Codex 写进 `data/hk_applications.js` |
| 官方公司与岗位 | 核验官方来源后写进 `data/companies.js` / `data/hk_companies.js` |
| 面试 / 笔试安排 | 直接说一句「我 X 月 X 日有 XX 的面试」，它进时间线 |
| 提交前校验 | `node scripts/validate_data.mjs` + `node --check js/app.js` |

## 项目结构

    index.html              内地主页面
    hk.html                 留港专区
    css/style.css           全站样式
    js/app.js               内地页面逻辑
    data/
      companies.js          内地官方层（102 家）
      apply_rules.js        投递次数与规则
      applications.js       我的投递（Excel 生成）
      zhudi.js              朱迪汇总（线索层）
      interviews.js         面经库
      ai_tips.js            AI 面试建议
      guoqi.js              央国企名录
      sources.js            信息源
      schedule.js           内地时间线
      watchlist.json        官网监控清单
      hk_companies.js       香港官方层
      hk_applications.js    我的港投
      hk_schedule.js        香港时间线
    scripts/                导入 / 检测 / 校验脚本
    .github/workflows/      自动部署与定时任务
    HANDOUT.md              复刻指南
    setup.ps1               一键安装脚本

## 快速开始

    git clone https://github.com/xhysnd666-alt/Qiuzhao-Radar.git
    cd Qiuzhao-Radar
    npx serve .        # 或者直接双击 index.html

部署：仓库 Settings → Pages → Source 选 GitHub Actions，push 到 `main` 自动上线。

## 一键复刻（Handout）

想给同学 / 朋友复刻一套？看 [`HANDOUT.md`](HANDOUT.md)（English: [`HANDOUT.en.md`](HANDOUT.en.md)）。Windows 一行命令：

    irm https://raw.githubusercontent.com/xhysnd666-alt/Qiuzhao-Radar/main/setup.ps1 | iex

## 配合 Codex 使用（qiuzhao-radar skill）

把 Excel 丢给它，或者直接说人话：

- 「跑一次今天的秋招」
- 「我 10 月 20 日下午 3 点有 XX 公司的面试」
- 「把这家公司加到留港专区」

它会按「核验官方来源 → 写数据 → 跑校验 → 提交推送」走一遍。本仓库自带这个 skill（`.codex/skills/qiuzhao-radar/`）。

## Roadmap

- [ ] 核验留港专区 7 家公司的官方链接（现在标着「待核实」，看着有点心虚）
- [ ] 补齐内地 26 家新公司的官方入口
- [ ] 留港专区加银行 MT、四大、保险、更多猎头
- [ ] 微信 / 浏览器通知（开岗、临近截止、面试提醒）
- [ ] 学生面经 UGC（在站内投稿）

## 免责声明（认真版）

站内第三方线索（朱迪汇总、牛客、小红书等）只作参考，不构成官方信息；
所有岗位的开岗、截止、投递规则，请以公司官方页面为准——以及，祝我们都早日上岸。
