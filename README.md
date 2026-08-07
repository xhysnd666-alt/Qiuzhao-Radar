# 秋招雷达（2027届）

个人用的秋招信息聚合站：重点公司 + 招聘批次时间线 + 投递进度 + 面经链接聚合。

当前覆盖 45 家互联网 / 科技 / 游戏公司，后续再加快消、外企、国企、车企。

数据政策：只收录官方来源（公司校招官网、官方公众号、高校就业网发布的公司官方信息），
未能核实的字段一律标记为「待核实」，不猜测日期；所有官方网址已逐一检测可访问性，
打不开的地址已替换为权威官方入口。

## 数据分层

- **L1 官方数据**（`data/companies.js`）：只有官方来源能确认的信息才会入库，否则标「待核实」。
- **L2 线索/信息源**（`data/sources.js`、`data/zhudi.js`）：小红书账号推荐清单、朱迪学姐秋招汇总表等，用来发现机会和准备面试，不代表官方数据。
- **L3 经验/反馈**（`data/companies.js` 里的 `feedback`）：面经链接 + 摘要，只存链接不搬原文。

小红书、脉脉等平台没有开放接口，无法稳定全自动采集；L2/L3 的价值是「人工发现线索 + AI 摘要 + 链接收藏」，发现后仍要去 L1 的官方页面核实。

## 功能

- 总览：按行业、岗位方向、批次、状态筛选公司
- 详情：官网、投递链接、开始/截止时间、备注、相关反馈
- 我的投递：从「秋招简历投递.xlsx」导入（你更新表格后告诉我即可），看板式展示（已投递 / 笔试 / 面试 / Offer / 已挂）；也可在详情页临时调整阶段
- 反馈池：小红书、牛客等平台的面经链接聚合（只存链接和摘要，不搬运原文）
- 待确认：自动检测脚本发现的官网页面变化，确认后才收录

## 快速开始

方式一：直接双击 `index.html` 用浏览器打开（数据全部在本地文件里）。

方式二：本地起一个静态服务器：

```bash
npx serve .
```

## 目录结构

```text
index.html                页面
css/style.css             样式
js/app.js                 页面逻辑
data/companies.js         公司/批次/岗位/反馈数据（手动维护的主数据）
data/applications.js      你的投递记录（由 Excel 导入生成，请勿手改）
data/sources.js           信息源清单（小红书/公众号推荐账号）
data/zhudi.js             朱迪学姐汇总表（2027届岗位 + 内推码，由本地脚本生成）
data/watchlist.json       自动检测的官网清单
data/page_hashes.json     上次抓取的页面指纹
data/review_queue.json    检测到的待确认变化
scripts/check_career_pages.mjs  自动检测脚本
.github/workflows/        GitHub Actions（定时检测 + Pages 部署）
```

## 怎么改数据

编辑 `data/companies.js` 里的 `companies` 数组，字段说明：

| 字段 | 说明 |
| --- | --- |
| id | 唯一标识，英文小写 |
| name / industry | 公司名 / 行业 |
| batch | 提前批 / 正式批 / 补录 |
| startDate / endDate | YYYY-MM-DD，未知留空 |
| status | 进行中 / 即将截止 / 即将开启 / 已结束 / 未开始 / 待核实 |
| positions | 岗位方向数组 |
| applyUrl / careerUrl | 投递链接 / 校招官网 |
| note / source / verified | 备注 / 信息来源 / 是否已核实 |

修改后刷新页面即可看到效果。`feedback` 和 `reviewQueue` 同理。

### 投递记录（applications）

投递记录的源头是桌面上的 `秋招简历投递.xlsx`。更新表格后告诉 Codex，运行
导入脚本即可重新生成 `data/applications.js`（脚本在本地 work 目录，不入库）。

表格约定：公司 / 岗位 / 投递时间 / 面试 四列；只填了日期没有公司和岗位的行会被跳过。

## 自动检测（可选）

脚本会每天抓取 `watchlist.json` 里的官网，计算页面指纹；页面变化时写入 `data/review_queue.json`，并（可选）用 DeepSeek 提取批次、日期、岗位等字段。

使用步骤：

1. 把仓库推送到 GitHub（私有仓库即可）。
2. 到 DeepSeek 开放平台（https://platform.deepseek.com/）创建 API Key。
3. 仓库 Settings → Secrets and variables → Actions，添加 `DEEPSEEK_API_KEY`。
4. `.github/workflows/daily-update.yml` 每天 UTC 17:00（北京时间次日 01:00）自动运行；也可以在 Actions 页面手动触发。

局限：很多校招官网是前端渲染的单页应用，静态抓取可能检测不到变化；后续计划升级为无头浏览器方案。

## 飞书多维表格同步（可选）

你分享的秋招信息飞书表格（`acnr1ayjzqxf.feishu.cn/base/ISNobVuXAagJBFssvszcYeqQnfb`）
是实时更新的第三方整理源。飞书页面是前端加载的，程序无法直接抓取内容，有三种接入方式：

**方案 A（最快，推荐先跑起来）**：把表格导出为 Excel/CSV 发给 Codex，按「投递记录」一样
导入。频率由你定，每次导出即可。

**方案 B（全自动）**：用飞书开放平台的 Bitable API 每天自动读取。需要：

1. 到飞书开放平台（https://open.feishu.cn/）创建企业自建应用，获取 App ID / App Secret（免费）。
2. 给应用开通「多维表格」读取权限，并把应用添加为这个多维表格的协作者（可查看）。
3. 在 GitHub 仓库 Secrets 里配置 `FEISHU_APP_ID`、`FEISHU_APP_SECRET`、
   `FEISHU_BASE_TOKEN`、`FEISHU_TABLE_ID`。
4. `.github/workflows/sync-feishu.yml` 每天自动运行 `scripts/sync_feishu.mjs`，
   把新增/变化的记录写入 `data/review_queue.json`（待确认队列），确认并核实官方来源后再入库。

**方案 C（最省事）**：每天把新增或变化的行复制粘贴给 Codex，由 AI 整理入库。

注意：第三方整理表属于线索层，自动同步只进「待确认」，不会直接污染正式数据。

## 朱迪学姐汇总表（线索层）

「朱迪汇总」页包含你导出的汇总表内容：

- 岗位汇总：2027 届相关记录 2354 条，可按公司/岗位搜索，按行业、批次筛选，支持分页加载；
  每条包含批次、行业、地点、开始/截止时间、投递链接、公告链接、是否笔试。
- 内推码：297 条企业内推码，可按公司搜索。

重新生成方法（本机）：运行 `work/build_zhudi.mjs`（使用本地 artifact-tool 依赖），
重新导出最新 xlsx 后覆盖 `data/zhudi.js` 即可。该数据属第三方整理，投递前请以公告链接中的官方信息为准。

## 部署到 GitHub Pages

1. 仓库 Settings → Pages → Source 选择 GitHub Actions。
2. 推送 `main` 分支后，`.github/workflows/deploy-pages.yml` 会自动部署。
3. 访问地址形如 `https://xhysnd666-alt.github.io/qiuzhao-radar/`。

## 路线图

- [x] 第一版静态站点 + 25 家互联网/游戏公司数据
- [ ] 自动检测 + DeepSeek 解析 + 待确认流程（脚本已就绪，待配置密钥）
- [ ] 浏览器推送通知
- [ ] 微信提醒（企业微信机器人 / Server酱）
- [ ] 更多行业（快消 / 外企 / 国企 / 车企）
- [ ] 香港岗位
- [ ] 用户评分与站内面经（开源后）

## 免责声明

数据来自公开新闻与官网，部分字段标记为「待核实」。本项目不保证信息完全准确，投递前请以公司官方招聘页面为准。
