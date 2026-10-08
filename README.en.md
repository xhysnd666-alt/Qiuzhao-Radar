Qiuzhao Radar
A static campus-recruiting dashboard for the 2027 season — mainland China and Hong Kong.
Everything lives in data/; edit and refresh, no backend needed.
Snapshot: 101 mainland companies · 180 applications · 3,027 ZhuDi job rows / 300 referral codes; HK zone: 7 companies · 9 applications.

What it does
- Mainland Overview — official info for 101 companies (industry, batch, roles, dates, status), applied companies pinned on top, priority sort by role (HR > game ops > publishing > marketing > user research > game design), filters and quick stat cards.
- My Applications — synced from 秋招简历投递.xlsx (180 records) with kanban / table / timeline views, colour-coded stages (interview purple, rejected red, offer gold), stage filter pills, collapse-rejected toggle, and direct "check progress" links to official portals.
- Hong Kong Zone (hk.html) — neon-harbour themed page with an HK openings table (job type, visa support incl. IANG, language requirements, deadlines) and a separate HK applications kanban / table / timeline (7 companies, 9 applications so far).
- ZhuDi Digest — third-party lead layer (3,027 rows + 300 referral codes).
- Interview Library & AI Assistant — 85 experience entries, 70 common questions, tailored AI prompts.
- Extras — SOE directory, curated sources, feedback pool, review queue.
Data policy
- L1 Official (companies.js, hk_companies.js): company career sites, official accounts, university job boards only. Unverified fields are marked "待核实"; links are checked before publishing.
- L2 Leads (zhudi.js, sources.js): third-party digests — leads, not facts.
- L3 Experience (interviews.js, feedback): links + summaries only.
- applications.js / hk_applications.js are generated from spreadsheets.
Updating
WhatHow
Mainland applicationsupdate 秋招简历投递.xlsx → python scripts/import_xlsx.py applications
ZhuDi digestexport latest xlsx → python scripts/import_xlsx.py zhudi
HK applicationsupdate 香港岗位投递.xlsx → Codex writes data/hk_applications.js
Official companiesverified by Codex, written into companies.js / hk_companies.js
Interviews / testsjust tell Codex the time — it lands in schedule.js / hk_schedule.js
Validate before commitnode scripts/validate_data.mjs + node --check js/app.js


Quick start
git clone https://github.com/xhysnd666-alt/Qiuzhao-Radar.git
cd Qiuzhao-Radar
npx serve .
Deploy: Settings → Pages → Source = GitHub Actions. Pushing to main deploys automatically.
With Codex (qiuzhao-radar skill)
Send an xlsx, or just talk: "run today's campus recruiting", "update my applications", "add this company", "I have an interview on Oct 15". Codex verifies official sources, updates the data, validates, and pushes.
Roadmap
- [ ] Verify the 7 HK official links (currently marked unverified)
- [ ] Fill in official portals for 26 new mainland companies
- [ ] Expand HK coverage: bank MT programmes, Big Four, insurers, more recruiters
- [ ] WeChat / browser notifications
- [ ] Community interview-experience submissions
Disclaimer
Third-party leads are for reference only. Always confirm openings, deadlines and rules on the company's official pages.
