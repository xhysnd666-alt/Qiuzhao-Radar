# Qiuzhao Radar

> Built by an applied-psychology grad who got tired of losing track of campus recruiting, so she built a radar instead.
> It watches 101 mainland companies plus Hong Kong, and remembers what I keep forgetting: openings, deadlines, applications, interviews.

> Snapshot: 101 mainland companies, 180 applications, 3,027 ZhuDi job rows / 300 referral codes; HK zone: 7 companies, 9 applications.
> (Rejection count omitted for morale reasons.)

## What it does

- **Mainland Overview** - official info for 101 companies (industry, batch, roles, dates, status); applied companies pinned on top so I can see my own battlefield; priority sort by role (HR > game ops > publishing > marketing > user research > game design); countdown chips and filters.
- **My Applications** - synced from the application spreadsheet (180 records) with kanban / table / timeline; colour-coded stages (interview purple, rejected red, offer gold); stage filter pills and a collapse-rejected button that is really a mental-health feature.
- **Hong Kong Zone** (`hk.html`) - neon-harbour theme with an HK openings table (job type, visa support incl. IANG, language requirements, deadlines) and a separate HK kanban / table / timeline.
- **ZhuDi Digest** - third-party lead layer (3,027 rows, 300 referral codes), for finding chances, not for quoting as facts.
- **Interview Library and AI Assistant** - 85 experience entries, 70 common questions, one-click AI prompts.

## Why you can trust it (mostly)

- **L1 Official** (`companies.js`, `hk_companies.js`): company career sites, official accounts and university job boards only. Unverified fields are marked "待核实"; links are checked one by one. I would rather leave a date blank than invent one.
- **L2 Leads** (`zhudi.js`, `sources.js`): third-party digests, clearly labelled as leads.
- **L3 Experience** (`interviews.js`, feedback): links and summaries only.
- `applications.js` and `hk_applications.js` are generated from spreadsheets - editing them by hand is a temporary pleasure with permanent consequences.

## Updating

| What | How |
| --- | --- |
| Mainland applications | update the xlsx, then run `python scripts/import_xlsx.py applications` |
| ZhuDi digest | export the latest xlsx, then run `python scripts/import_xlsx.py zhudi` |
| HK applications | update the HK xlsx; Codex writes `data/hk_applications.js` |
| Official companies | verified by Codex, written into `companies.js` / `hk_companies.js` |
| Interviews and tests | just say "interview with X on Oct 20"; it lands in the timeline |
| Validate before commit | `node scripts/validate_data.mjs` and `node --check js/app.js` |

## Quick start

    git clone https://github.com/xhysnd666-alt/Qiuzhao-Radar.git
    cd Qiuzhao-Radar
    npx serve .

Deploy: Settings -> Pages -> Source = GitHub Actions. Push to `main` and it ships itself.

## Handout

Want your own copy? See [`HANDOUT.md`](HANDOUT.md) / [`HANDOUT.en.md`](HANDOUT.en.md). One-liner for Windows:

    irm https://raw.githubusercontent.com/xhysnd666-alt/Qiuzhao-Radar/main/setup.ps1 | iex

## With Codex (qiuzhao-radar skill)

Send a spreadsheet, or just talk: "run today's campus recruiting", "I have an interview with X on Oct 20", "add this company to the HK zone". The skill verifies official sources, updates data, validates and pushes.

## Roadmap

- [ ] Verify the 7 HK official links (currently marked unverified, slightly embarrassing)
- [ ] Fill in official portals for 26 new mainland companies
- [ ] Expand HK coverage: bank MT programmes, Big Four, insurers, more recruiters
- [ ] WeChat / browser notifications
- [ ] Community interview-experience submissions

## Disclaimer (the serious part)

Third-party leads are for reference only. Always confirm openings, deadlines and rules on the company official pages. And good luck to all of us.
