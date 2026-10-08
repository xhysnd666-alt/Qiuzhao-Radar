# 秋招雷达 · 复刻指南（Handout）

> 目标：10 分钟内在自己的电脑上拥有同款「秋招雷达」——内地秋招 + 留港专区，纯静态、无需服务器、无需数据库。

## 0. 你会得到什么

- `index.html`：内地总览 + 我的投递（看板 / 表格 / 时间线）+ 面经库 + 朱迪汇总 + 央国企名录 + 信息源
- `hk.html`：留港专区（香港公司总览 + 我的港投 + 独立时间线）
- `data/*.js`：全部数据文件，改哪个改哪个，刷新即生效
- `scripts/`：Excel 导入脚本（投递表 / 朱迪表）、官网检测脚本、数据校验脚本

## 1. 一键开始

### Windows（PowerShell）

    # 方式 A：一行命令（自动 clone 并打开）
    irm https://raw.githubusercontent.com/xhysnd666-alt/Qiuzhao-Radar/main/setup.ps1 | iex

    # 方式 B：手动三步
    git clone https://github.com/xhysnd666-alt/Qiuzhao-Radar.git
    cd Qiuzhao-Radar
    npx serve .

没有装 Node 也没关系：直接双击 `index.html`（内地）或 `hk.html`（留港专区）就能用。

### Mac / Linux

    git clone https://github.com/xhysnd666-alt/Qiuzhao-Radar.git
    cd Qiuzhao-Radar
    python3 -m http.server 8000      # 然后打开 http://localhost:8000

## 2. 改成「你自己的」（约 10 分钟）

1. **换求职画像**：打开 `data/ai_tips.js`，改 `profile` 一行（例如「××大学市场营销，目标快消 MT」）。
2. **加关注的公司**：打开 `data/companies.js`，照已有条目复制一条，改 `name` / `positions` / `applyUrl`；香港公司写到 `data/hk_companies.js`。
3. **导入投递记录**：建一个 Excel，表头建议 `公司 | 岗位 | 投递时间 | 面试（阶段备注）`，然后运行
   `python scripts/import_xlsx.py applications`；香港投递写进 `data/hk_applications.js`（字段见文件注释）。
4. **面试 / 笔试安排**：写进 `data/schedule.js`（内地）或 `data/hk_schedule.js`（香港）。
5. **改完先校验**：`node scripts/validate_data.mjs`。

## 3. 让 Codex 帮你全自动

把 `秋招简历投递.xlsx`（或 `香港岗位投递.xlsx`）丢给 Codex，或者说：

- 「跑一次今天的秋招」
- 「我 10 月 20 日下午 3 点有 XX 公司的面试」
- 「把这家公司加到留港专区」

本仓库自带 `qiuzhao-radar` skill（`.codex/skills/qiuzhao-radar/`），会按「核验官方来源 → 写入数据 → 跑校验 → 提交推送」执行。

## 4. 部署到 GitHub Pages（免费）

1. fork 或 push 到你自己的仓库；
2. 仓库 Settings → Pages → Source 选 **GitHub Actions**；
3. 之后每次 push 到 `main` 会自动部署，网址形如 `https://你的用户名.github.io/仓库名/`。

## 5. 目录速查

    index.html            内地主页面
    hk.html               留港专区
    css/style.css         全站样式
    js/app.js             内地页面逻辑
    data/companies.js     内地官方层
    data/applications.js  我的投递（Excel 生成）
    data/zhudi.js         朱迪汇总（线索层）
    data/interviews.js    面经库
    data/schedule.js      内地时间线
    data/hk_companies.js  香港官方层
    data/hk_applications.js 我的港投
    data/hk_schedule.js   香港时间线
    scripts/              导入 / 检测 / 校验脚本
    .github/workflows/    自动部署与定时任务

## 6. 常见问题

- **页面改了没变化**：浏览器缓存，按 `Ctrl + F5`；或在引用后面加 `?v=日期`。
- **Excel 导入报错**：确认表头顺序是「公司 / 岗位 / 投递时间 / 面试」，并确认 Python 环境有 `openpyxl`。
- **GitHub Actions 失败**：打开 Actions 日志，看 `configure-pages` 或 `deploy` 那一步。
- **公司链接打不开**：官网常改版，用搜索找新的官方招聘页，更新 `applyUrl` 并标 `verified: true`。

## 7. 开源与二次创作

- 代码和数据都可以按你的需求改；
- 基于它做自己的版本时，欢迎在 README 里保留一句来源；
- 第三方线索（朱迪表、牛客、小红书等）请勿当作官方信息传播，投递前以公司官方页面为准。
