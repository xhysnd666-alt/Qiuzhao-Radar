# Qiuzhao Radar · 秋招雷达 (Class of 2027)

> A personal command center for the 2027 campus recruiting season: official job openings at key companies, application tracking, interview experience library, and an AI interview assistant — all in one page.
> It is a fully static site: edit the data, refresh, done. Ready for one-click deployment to GitHub Pages.
>
> [中文版 →](README.md)

## What It Is

Qiuzhao Radar is a personal tool built for the 2027 autumn campus recruiting season ("秋招"). It solves three problems:

1. **Information is scattered** — recruiting announcements live on company career sites, WeChat official accounts, and university job boards. Miss one, lose one.
2. **Applications get messy** — which companies, which positions, which stage? Easy to lose track.
3. **No central place for interview prep** — interview experiences, common questions, and company-specific tips are spread across platforms.

The site is organized into four main areas: **Overview** (official company radar), **My Applications** (progress tracking), **ZhuDi Digest** (third-party leads), and **Interview Library + AI Tips** (preparation).

## Who It's For

- Students preparing for the 2027 campus recruiting season targeting **HR, game operations, game publishing, game marketing, user research, and game design** positions (the author: applied psychology bachelor, heading to Hong Kong for a master's in September);
- Any campus-recruiting job seeker can use it as an aggregation and lead-finding reference — but always verify with the company's official pages before applying.

## Core Features

### Overview (Radar Main View)

- Official info for 46 key companies (internet / tech / games): industry, batch, position directions, start/end dates, and status;
- **Applied companies on top**, then sorted by position priority: HR > Game Operations > Game Publishing > Game Marketing > User Research > Game Design;
- Color-coded status badges (In Progress / Closing Soon / Opening Soon / Ended / Unverified) and batch badges (Early Batch ⚡ / Regular Batch / Supplementary) with subtle animations;
- Countdown chips, recruitment-window progress bars, and a "Upcoming Milestones" banner (auto-aggregates deadlines within 14 days and openings within 7 days);
- Filters by industry, position, batch, and status, plus one-click quick filters (Active / Closing Soon / Early Batch / Applied) and options to hide applied companies or internships.

### My Applications

- Synced from the desktop `秋招简历投递.xlsx` (tell the AI assistant to re-import after updating the spreadsheet);
- Kanban and table views, with stage management (Applied / Written Test / Interview / Offer / Rejected).

### ZhuDi Digest (Third-Party Lead Layer)

- 2,380 job records + 297 referral codes (latest export 2026-08-08); search by company/position, filter by industry/batch, and hide internships;
- The Overview automatically merges non-internship companies relevant to the target positions from this table (~27 companies), for ~73 rows in total.

### Interview Library & AI Assistant

- 85 interview-experience items (73 company entries extracted from a provided PDF + 12 real links), attached to each company's detail view and filterable in the library;
- 70 common interview questions with intent, approach, and sample answers;
- AI tips: 10 general interview strategies + custom tips for 30 key companies;
- "Ask AI" buttons generate a personalized prompt based on your profile — copy it into any AI chat for a tailored answer (the static site itself does not call AI APIs).

### Other Sections

- **SOE/State-Owned Enterprise Directory**: 119 organizations with official websites;
- **Sources**: 21 curated accounts (Xiaohongshu / WeChat), split into job-info and interview-experience categories;
- **Feedback Pool**: aggregated links to interview experiences, referrals, and news (links + summaries only, no copied articles);
- **Review Queue**: changes detected by automated website monitoring, only promoted to official data after manual verification.

## Data Policy (Why You Can Trust It)

- **L1 Official layer** (`data/companies.js`): only company career sites, official WeChat accounts, and university job boards relaying official company info. Unverified fields are marked "待核实" (unverified) — dates are never guessed. All official links are checked for accessibility.
- **L2 Lead layer** (`data/zhudi.js`, `data/sources.js`): the ZhuDi digest and recommended accounts help you find opportunities and prepare; they are not official data.
- **L3 Experience/feedback** (`data/interviews.js`, `feedback`): links + summaries only, keeping key details without copying full articles.
- `data/applications.js` is generated from your Excel file — never edit it by hand.

## Quick Start

**Run locally**

```bash
git clone https://github.com/xhysnd666-alt/Qiuzhao-Radar.git
cd Qiuzhao-Radar
npx serve .
```

Or just double-click `index.html` (all data lives in local files).

**Deploy to GitHub Pages**

1. Repo Settings → Pages → Build and deployment → Source: **GitHub Actions**;
2. Push to `main` — `.github/workflows/deploy-pages.yml` deploys automatically;
3. Visit `https://xhysnd666-alt.github.io/Qiuzhao-Radar/`.

## The Codex Skill (Let AI Maintain It For You)

The repo includes a Codex skill at `.codex/skills/qiuzhao-radar/` that lets the AI assistant maintain the site through a fixed workflow. It has three modes:

- **Mode A · First-time setup**: initialize your profile and company-specific tips from your resume and preferences;
- **Mode B · Daily update**: detect career-page changes → verify official sources → update data → validate → commit & push;
- **Mode C · Application tracking**: regenerate application records from Excel.

**Daily usage examples**

| You say | AI does |
| --- | --- |
| "跑一次今天的秋招" (run today's update) | Runs Mode B automatically and pushes to GitHub |
| "我投了 XX / 更新投递表格" (I applied / update the sheet) | Re-imports Excel and syncs applications |
| "加 XX 公司 / 检查官网链接" (add a company / check links) | Verifies the official entry before adding it |
| "更新面经" (update interview library) | Parses your PDF / links into the library |

**GitHub Actions scheduled jobs**

- `deploy-pages.yml`: automatic deploy on every push;
- `daily-update.yml`: daily career-page check at UTC 17:00 (requires `DEEPSEEK_API_KEY`, otherwise skipped);
- `sync-feishu.yml`: daily sync of the Feishu spreadsheet into the review queue (requires Feishu app credentials).

## Project Structure

```text
index.html / css/ / js/            Page and interaction
data/                              Data layer
  companies.js                     Official layer (companies / batches / positions / status)
  applications.js                  Application records (Excel-generated, do not edit)
  zhudi.js                         ZhuDi digest (lead layer)
  interviews.js / ai_tips.js       Interview library / AI assistant
  guoqi.js / sources.js            SOE directory / info sources
  watchlist.json / page_hashes.json Career-site watchlist and fingerprints
scripts/                           Career-page check & Feishu sync scripts
.github/workflows/                 GitHub Actions (deploy + scheduled jobs)
.codex/skills/qiuzhao-radar/       The Codex skill
```

## How to Edit Data

Edit the `companies` array in `data/companies.js`:

| Field | Description |
| --- | --- |
| id | Unique lowercase-English ID |
| name / industry | Company name / industry |
| batch | 提前批 (early) / 正式批 (regular) / 补录 (supplementary) |
| startDate / endDate | YYYY-MM-DD; leave empty if unknown |
| status | 进行中 / 即将截止 / 即将开启 / 已结束 / 未开始 / 待核实 |
| positions | Array of position directions |
| applyUrl / careerUrl | Application link / career site |
| note / source / verified | Notes / source / whether verified |

Refresh the page after editing. Run `node --check js/app.js` before committing for a syntax sanity check.

## Roadmap

- [ ] Backend + database for true auto-sync and multi-device consistency
- [ ] WeChat / browser push notifications when companies open or deadlines approach
- [ ] Hong Kong job section
- [ ] AI assistant upgrade: jump directly into an AI chat instead of copying a prompt
- [ ] More industries: FMCG / foreign companies / SOEs / automakers
- [ ] User-generated interview experiences, ratings, and feedback (open-source after it's stable)

## Disclaimer

Data comes from public sources and official pages; some fields are marked as unverified. This project does not guarantee complete accuracy — always check the company's official recruiting page before applying.
