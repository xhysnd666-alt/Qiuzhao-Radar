---
name: qiuzhao-radar
description: 维护秋招雷达项目：收集和更新 2027 届秋招/校招信息、维护投递记录与面经库、验证官方投递链接、运行数据校验并提交推送。当用户提到"跑一次今天的秋招"、"今天有哪些公司开秋招"、"更新投递表格/我投了XX"、"加公司/检查官网链接/网站打不开"、"更新面经/面试准备"、发送「秋招简历投递.xlsx」或「朱迪学姐汇总表」xlsx 文件、秋招雷达项目维护等时使用。
---

# 秋招雷达

秋招雷达是一个纯静态校招信息站（无后端），所有数据都在 `data/` 下，改完刷新页面即生效。本技能指导如何正确更新数据、验证官方来源、跑校验并提交。

## 项目结构

- `data/companies.js` — 45 家重点公司官方信息（唯一可信的官方层）
- `data/applications.js` — 投递记录，由桌面「秋招简历投递.xlsx」生成，勿手改
- `data/zhudi.js` — 朱迪学姐汇总表（第三方线索层）
- `data/interviews.js` / `data/ai_tips.js` — 面经库与 AI 面试准备
- `data/guoqi.js` / `data/sources.js` — 央国企名录 / 信息源
- `data/watchlist.json` — 官网监控清单；`data/review_queue.json` — 待确认队列
- `scripts/` — 官网检测、飞书同步、Excel 导入、数据校验脚本
- `.github/workflows/` — Pages 部署、每日检测、飞书同步

所有数据文件字段定义见 `references/data-schema.md`，编辑数据前先读它。

## 铁律（数据政策）

1. 只收录官方来源：公司校招官网、官方公众号、高校就业网发布的公司官方信息。
2. 未核实的信息标 `status: "待核实"`、`verified: false`；第三方线索（朱迪/牛客/小红书/脉脉）绝不直接写进 `companies.js`。
3. 朱迪表是线索层：可以展示和参考，但不能当官方事实；投递前以官方页面为准。
4. `applications.js` 由用户更新的 Excel 重新生成，不要手改。
5. 每个新 URL 必须实际验证：`curl.exe -s -o NUL -L -w "%{http_code}" <url>`，DNS 解析失败 = 不可用，必须换官方新入口。
6. 官网停用/改版时，用 web search 查新官方入口（常为 Moka、飞书、智联等校招系统域名），并同步更新 `watchlist.json`。
7. 提交信息用英文（如 `feat: add xiaohongshu official campus info`），避免中文引号导致审批问题。

## 模式判断

- 首次设置 / 用户提供简历和偏好 → 模式 A
- 每日更新 / 新增公司 / 检查链接 / 定时触发 → 模式 B
- 用户报告投递动作、更新 Excel、问进度 → 模式 C

## 模式 A：首次设置

1. 读 `data/ai_tips.js` 的 `profile`（已有基线：心理学本科、9 月赴港读研、2027 届秋招，目标 HR/游戏运营/游戏发行/游戏营销/市场运营）。
2. 如用户提供简历，分析优势经历并映射到目标岗位；用问答确认：届别、岗位方向、意向城市、公司类型、排除项。
3. 更新 `data/ai_tips.js`：`profile` + `companyTips`（重点公司定制提示；页面有通用兜底）。
4. 立即执行一次模式 B 生成首日结果，并在回复中给出总结。

## 模式 B：每日收集 / 更新

1. 读 `references/data-schema.md`、`data/watchlist.json`、`data/companies.js` 当前状态。
2. 官网变化检测（可联网时）：
   `node scripts/check_career_pages.mjs`
   把 `data/review_queue.json` 里的新变化逐条核实（官方公告/页面）后入库。
3. 朱迪表更新（用户提供最新 xlsx 导出时）：
   用表格工具解析，更新 `data/zhudi.js` 的 `rows` 与 `codes`，保持字段结构；不要把它当官方数据。
4. 官方信息搜集：
   - 对 watchlist 公司逐一确认：是否开 2027 秋招/提前批、起止时间、批次、岗位方向；
   - 优先公司官网/官方公众号；搜索时带「2027 秋招 官方」限定；
   - 仅官方来源写入 `companies.js`；日期/状态按官方公告更新，不确定标待核实。
5. 新增公司：
   - 只加有官方投递入口的公司；先验证 URL（见铁律 5）；
   - 字段齐全（见 schema），industry 用「互联网/科技/游戏/快消/外企/国企/车企」等；
   - 用户重点关注游戏运营/游戏发行/游戏营销/人力资源方向，新增公司优先覆盖这些岗位。
6. 面经与反馈（线索层）：
   - 用户提供面经 PDF/链接时，更新 `data/interviews.js`（保留原文关键内容）与 `data/ai_tips.js`；
   - 小红书/脉脉等需登录的平台，放进 `feedback`/`sources` 并注明需登录查看，不假装能抓取。
7. 校验与提交：
   - `node scripts/validate_data.mjs`（必须通过）；
   - `node --check js/app.js`；
   - `git add` 相关数据文件 → `git commit -m "..."` → `git push origin main`（联网需用户批准）。
8. 总结：新增/变化公司数、批次与截止时间、提前批倒计时、需要用户去投递的重点公司；如环境支持定时任务，创建每日自动化，否则提醒用户手动触发。

## 模式 C：投递与进度管理

1. 用户更新了「秋招简历投递.xlsx」：运行 `python scripts/import_xlsx.py applications` 重新生成 `data/applications.js`（保持字段结构；`companyId` 尽量与 `companies.js` 对齐）。新增公司名若不在 `COMPANY_MAP`，先补映射再导入。
2. 用户口头报告「投了 XX」：优先请用户更新 Excel 或授权直接改 Excel；若只临时更新站点，写入 `applications.js` 并注明下次以 Excel 为准。
3. 页面上的进度（localStorage）只是本地视图；正式记录以 Excel 为准，导入后覆盖。
4. 更新后跑模式 B 第 7 步的校验与提交。

## 模式 D：文件自动导入（用户发文件时自动执行）

触发条件：用户发送「秋招简历投递.xlsx」（桌面路径 `C:\Users\Lenovo\Desktop\秋招简历投递.xlsx`）或朱迪学姐汇总表（`C:\Users\Lenovo\Downloads\27-【暑期实习_秋招_春招】汇总表（持续更新）-朱迪学姐 .xlsx`）。两个文件可能只发一个，也可能一起发；如果用户直接拖了新文件但路径未变，以用户提供的文件为准并先检查 LastWriteTime 是否为最新。

步骤：

1. 运行导入脚本（用 Codex 桌面版自带 Python，含 openpyxl）：
   - 只发投递表：`python scripts/import_xlsx.py applications`
   - 只发朱迪表：`python scripts/import_xlsx.py zhudi`
   - 两个都发：`python scripts/import_xlsx.py`
2. 检查输出：投递条数应与表格行数一致（当前约 20 条）；朱迪 rows≈2400、codes≈300；`data/zhudi.js` 的 `updatedAt` 应为当天。
3. 总览自动合并朱迪表中符合目标岗位（人力资源/游戏运营/游戏发行/游戏营销/用户研究/游戏策划等）的非实习公司为「朱迪线索」行，无需手动改 `js/app.js`；如发现值得升级官方层的公司（有可验证的官方投递入口），按模式 B 第 5 步核验后写入 `data/companies.js` 并同步 `data/watchlist.json`。
4. 校验与提交（模式 B 第 7 步）：`node scripts/validate_data.mjs`、`node --check js/app.js`，通过后提交并推送。
5. 总结：新增投递数、朱迪新增/变化行数、总览新增公司、需要用户投递的重点公司。

## 平台注意

- 纯静态站无后端：改数据文件后刷新页面即生效。
- GitHub Pages 部署要求仓库 Settings → Pages → Source = GitHub Actions；失败先看 `configure-pages` 步骤日志。
- 定时任务：在 Codex 桌面端用平台自动化机制创建每日任务；应用没开时到点不跑，下次触发补跑。
- 通知：本项目在 Windows，没有 macOS `osascript`；把每日总结写在回复里，或用平台支持的通知。
- 推送：网络不稳时用备用 git 并加 HTTP/1.1 与缓冲参数：
  `& 'C:\Users\Lenovo\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe' -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push origin main`

## 资源

- `references/data-schema.md` — 全部数据文件字段说明（编辑前必读）
- `scripts/import_xlsx.py` — 投递表/朱迪表 Excel 导入（模式 C/D 使用）
- `scripts/validate_data.mjs` — 数据一致性校验（提交前必跑）
