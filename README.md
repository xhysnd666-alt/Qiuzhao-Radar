# 秋招雷达 · Qiuzhao Radar

一个纯静态的秋招信息站：盯住「什么时候开、什么时候截止、我投了没有、下一步做什么」。
分 **内地秋招** 与 **留港专区（香港）** 两个板块，数据全部放在 `data/` 下，改完刷新页面即生效，无需后端。

> 当前快照：内地 101 家重点公司 · 180 条投递记录 · 朱迪汇总 3027 条岗位 / 300 条内推码；留港专区 7 家香港公司 · 9 条港投记录。

## 给谁用

- 正在准备 2027 届秋招、目标 **人力资源 / 游戏运营 / 游戏发行 / 游戏营销 / 用户研究 / 游戏策划 / 管培生 MT** 的同学（作者本人：应用心理学本科，9 月赴港读研）；
- 想留港工作的同学：猎头、HR、Management Trainee、Graduate Trainee、暑期 / 冬季实习等岗位都在留港专区里跟踪；
- 任何求职者都可以当作信息聚合与线索参考 —— 投递前请以公司官方页面为准。

## 核心功能

### 总览（内地）

- 101 家重点公司官方信息（互联网 / 科技 / 游戏 / 快消 / 外企 / 车企 / 国企），含行业、批次、岗位方向、起止时间、状态；
- **已投公司置顶**，再按岗位优先级排序：人力资源 > 游戏运营 > 游戏发行 > 游戏营销 > 用户研究 > 游戏策划；
- 状态徽章 + 批次徽章（提前批 / 正式批 / 补录）、截止倒计时、招聘窗口进度条、「最近节点」提醒；
- 支持按行业 / 岗位 / 批次 / 状态筛选，一键「重点公司在招 / 即将截止 / 提前批 / 已投」，可隐藏已投、过滤实习、点击统计卡直接筛选。

### 我的投递（内地）

- 与桌面 `秋招简历投递.xlsx` 同步（当前 180 条），更新表格后跑一次导入脚本即可；
- **看板 / 表格 / 时间线** 三视图：看板按「已投递 / 笔试 / 面试 / Offer / 已挂」分组，时间线集中展示笔试、面试、测评日程；
- 阶段用彩色大徽章 + 整行染色：面试=紫色跳动、已挂=红色警示、Offer=金色，一眼看出重点；
- 顶部统计胶囊可一键筛选阶段，支持「折叠已挂」；
- 每条投递都有「官网查进度」直达链接（京东、米哈游、B站、巨人、鹰角等已配到官方投递记录页）；
- 面试类日程过了时间会自动标「已参加」。

### 留港专区（香港）

- 独立页面 `hk.html`，港味 UI：霓虹夜景 + 维港天际线 + 港铁站牌页签 + 茶餐厅水牌统计卡；
- **香港总览**：公司 / 项目名 / 岗位类型（全职、管培生 MT、毕业培训生、暑期实习、冬季实习、普通实习、猎头顾问）/ **签证支持**（赞助、IANG 友好、需自带工作权、待核实）/ 语言要求 / 起止时间 / 状态 / 官方入口，支持搜索与筛选；
- **我的港投**：看板 + 表格 + **独立时间线**（与内地时间线分开），面试过时同样自动「已参加」；
- 数据文件独立：`data/hk_companies.js`、`data/hk_applications.js`、`data/hk_schedule.js`；当前 7 家公司 / 9 条港投（Vocalbeats、景福珠宝、东华三院、Michael Page、Teach For Hong Kong、HKTVmall、Sun Life 永明金融）。

### 朱迪汇总（第三方线索层）

- 3027 条岗位记录 + 300 条内推码，可按公司 / 岗位搜索、按行业 / 批次筛选、过滤实习；
- 总览会自动合并朱迪表中符合目标岗位的互联网 / 游戏公司作为「朱迪线索」行。

### 面经库 & AI 面试助手

- 85 条面经（企业面经 + 真实链接），挂在对应公司详情与面经库；
- 70 道通用面试问题（含考查意图、回答思路、参考答案）；
- AI 建议：面试锦囊 + 重点公司定制提示；「问 AI」按钮会生成一段个性化提示词，复制到任意 AI 对话即可使用。

### 其他板块

- **央国企名录**：119 家央国企与事业单位，含官方网址；
- **信息源**：精选账号清单，分「岗位信息 / 行业面试经验」；
- **反馈池**：面经、内推、资讯链接聚合（只存链接 + 摘要）；
- **待确认队列**：官网自动检测发现的变化，人工核实后才进正式数据。

## 数据政策（为什么可以信）

- **L1 官方层**：`data/companies.js`、`data/hk_companies.js` — 只收录公司官网、官方招聘页、官方公众号、高校就业网发布的官方信息；未核实字段标「待核实」，不猜日期；官方入口逐一实测。
- **L2 线索层**：`data/zhudi.js`、`data/sources.js` — 第三方整理，用来发现机会，不等于官方事实。
- **L3 面经 / 反馈**：`data/interviews.js`、`feedback` — 只存链接 + 摘要，保留原文关键细节。
- `data/applications.js`、`data/hk_applications.js` 由表格生成，不建议手改。

## 数据怎么更新

| 更新内容 | 操作 |
| --- | --- |
| 内地投递记录 | 更新桌面 `秋招简历投递.xlsx` → 跑 `python scripts/import_xlsx.py applications` |
| 朱迪汇总表 | 导出最新 xlsx 到 Downloads → 跑 `python scripts/import_xlsx.py zhudi` |
| 香港投递记录 | 更新桌面 `香港岗位投递.xlsx` → 目前由 Codex 整理写入 `data/hk_applications.js` |
| 官方公司与岗位 | 由 Codex 核验官方来源后写入 `data/companies.js` / `data/hk_companies.js` |
| 面试 / 笔试安排 | 直接告诉我时间，我写进 `data/schedule.js` 或 `data/hk_schedule.js` |
| 提交前校验 | `node scripts/validate_data.mjs` + `node --check js/app.js` |

## 项目结构

    index.html            内地主页面
    hk.html               留港专区（香港）
    css/style.css         全站样式
    js/app.js             内地页面逻辑
    data/
      companies.js        内地官方层（101 家）
      apply_rules.js      投递次数与规则
      applications.js     我的投递（Excel 生成）
      zhudi.js            朱迪汇总表（线索层）
      interviews.js       面经库与通用问题
      ai_tips.js          AI 面试建议
      guoqi.js            央国企名录
      sources.js          信息源清单
      schedule.js         内地笔试 / 面试时间线
      watchlist.json      官网监控清单
      hk_companies.js     香港官方层
      hk_applications.js  我的港投
      hk_schedule.js      香港时间线
    scripts/              导入、检测、校验脚本
    .github/workflows/    Pages 部署、每日检测、飞书同步

## 一键复刻（Handout）

想给同学 / 朋友复刻一套？看 [`HANDOUT.md`](HANDOUT.md)（English: [`HANDOUT.en.md`](HANDOUT.en.md)）。
Windows 一行命令：

    irm https://raw.githubusercontent.com/xhysnd666-alt/Qiuzhao-Radar/main/setup.ps1 | iex
## 快速开始

    git clone https://github.com/xhysnd666-alt/Qiuzhao-Radar.git
    cd Qiuzhao-Radar
    npx serve .        # 或直接双击 index.html

部署：仓库 Settings → Pages → Source 选 GitHub Actions，push 到 `main` 后自动部署。

## 自动化

- `Deploy to GitHub Pages`：push 后自动部署；
- `Daily / Sync` 工作流：定时检测官网变化、同步飞书多维表（需要配置 Secrets）。

## 配合 Codex 使用（qiuzhao-radar skill）

把 `秋招简历投递.xlsx`（或 `香港岗位投递.xlsx`）发给我，或用自然语言说：

- 「跑一次今天的秋招」「更新投递表格」「帮我加公司 / 检查官网链接」
- 「我 X 月 X 日有 XX 公司的面试」→ 自动写进时间线
- 「把这个岗位加到留港专区」

我会按「核验官方来源 → 写入数据 → 跑校验 → 提交推送」的流程处理。

## Roadmap

- [ ] 核验留港专区 7 家公司的官方链接（当前标「待核实」）
- [ ] 补齐内地 26 家新公司的官方校招入口
- [ ] 留港专区扩充：银行 MT、四大、保险、更多猎头公司
- [ ] 微信 / 浏览器通知（开岗、临近截止、面试提醒）
- [ ] 学生反馈与面经 UGC（在站内提交）

## 免责声明

站内第三方线索（朱迪汇总、小红书、牛客等）仅作参考，不构成官方信息；
所有岗位的开岗、截止、投递规则请以公司官方页面为准。
