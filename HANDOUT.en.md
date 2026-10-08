# Qiuzhao Radar - Handout

Get your own copy of Qiuzhao Radar (mainland China + Hong Kong job-search dashboard) in about 10 minutes. Static site, no server, no database.

## What you get

- `index.html` - mainland overview, my applications (kanban / table / timeline), interview library, ZhuDi digest, SOE directory
- `hk.html` - Hong Kong zone (openings table + my applications + separate timeline)
- `data/*.js` - all data; edit and refresh
- `scripts/` - Excel importers, website checker, data validator

## Quick start

### Windows

    irm https://raw.githubusercontent.com/xhysnd666-alt/Qiuzhao-Radar/main/setup.ps1 | iex

or

    git clone https://github.com/xhysnd666-alt/Qiuzhao-Radar.git
    cd Qiuzhao-Radar
    npx serve .

No Node? Just double-click `index.html`.

### macOS / Linux

    git clone https://github.com/xhysnd666-alt/Qiuzhao-Radar.git
    cd Qiuzhao-Radar
    python3 -m http.server 8000

## Make it yours

1. Edit `data/ai_tips.js` - your profile line.
2. Add companies in `data/companies.js` (mainland) and `data/hk_companies.js` (Hong Kong).
3. Import applications: build an Excel with headers `Company | Position | Applied | Notes`, then run `python scripts/import_xlsx.py applications`. HK applications live in `data/hk_applications.js`.
4. Interviews and tests go into `data/schedule.js` / `data/hk_schedule.js`.
5. Validate with `node scripts/validate_data.mjs`.

## Pair it with Codex

Send an xlsx or just ask: "run today's campus recruiting", "I have an interview with X on Oct 20", "add this company to the HK zone". The bundled `qiuzhao-radar` skill verifies official sources, updates data, validates and pushes.

## Deploy

1. Fork or push to your own repo.
2. Settings -> Pages -> Source = GitHub Actions.
3. Every push to `main` deploys to `https://<user>.github.io/<repo>/`.

## FAQ

- Page not updating: hard refresh (`Ctrl + F5`) or add `?v=date` to the script tags.
- Excel import error: check the header order and that `openpyxl` is installed.
- Action fails: inspect the `configure-pages` / `deploy` step.
- Broken link: official sites change; search for the new careers page and update `applyUrl`.

## Reuse

Free to adapt. Please keep a credit line if you publish a fork, and never present third-party leads as official information.
