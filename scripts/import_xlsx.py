#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""秋招雷达 · Excel 自动导入脚本。

用法：
  python scripts/import_xlsx.py applications   # 只导入「秋招简历投递.xlsx」
  python scripts/import_xlsx.py zhudi          # 只导入朱迪学姐汇总表
  python scripts/import_xlsx.py                # 两者都导入

依赖：openpyxl（Codex 桌面版自带 Python 已安装）。
数据政策：applications.js 由用户 Excel 生成，勿手改；zhudi.js 为第三方线索层。
"""

import json
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

import openpyxl

REPO_ROOT = Path(__file__).resolve().parent.parent
APPLICATIONS_XLSX = Path(r"C:\Users\Lenovo\Desktop\秋招简历投递.xlsx")
APPLICATIONS_OUT = REPO_ROOT / "data" / "applications.js"
ZHUDI_OUT = REPO_ROOT / "data" / "zhudi.js"


def newest_zhudi_xlsx() -> Path:
    """自动选择 Downloads 里最新的朱迪学姐汇总表（支持带 (1) 的重复导出）。"""
    pattern = "27-【暑期实习_秋招_春招】汇总表*.xlsx"
    candidates = sorted(
        (Path(r"C:\Users\Lenovo\Downloads").glob(pattern)),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if not candidates:
        raise FileNotFoundError(f"未在 Downloads 找到 {pattern}")
    return candidates[0]


ZHUDI_XLSX = newest_zhudi_xlsx()

COMPANY_MAP = {
    "米哈游": "mihoyo",
    "莉莉丝": "lilith",
    "字节跳动": "bytedance",
    "大疆": "dji",
    "影石": "insta360",
    "网易雷火": "netease_game",
    "网易互娱": "netease_game",
    "鹰角": "hypergryph",
    "京东": "jd",
    "联想": "lenovo",
    "百度": "baidu",
    "OPPO": "oppo",
    "拼多多": "pinduoduo",
    "阿里千问": "alibaba",
    "阿里灵犀互娱": "alibaba",
    "b站": "bilibili",
    "G社": "garena",
    "得物": "dewu",
    "盛趣游戏": "shengqu",
    "去哪儿旅行": "qunar",
    "巨人网络": "ztgame",
    "小米": "xiaomi",
    "蚂蚁集团": "antgroup",
}


def pad(n: int) -> str:
    return str(n).zfill(2)


def excel_to_iso(v):
    if isinstance(v, datetime):
        return f"{v.year}-{pad(v.month)}-{pad(v.day)}"
    if isinstance(v, (int, float)):
        d = datetime(1899, 12, 31) + timedelta(days=float(v))
        return f"{d.year}-{pad(d.month)}-{pad(d.day)}"
    return ""


def norm_date(v):
    if v is None:
        return ""
    if isinstance(v, datetime):
        return excel_to_iso(v)
    if isinstance(v, (int, float)):
        return excel_to_iso(v)
    s = str(v).strip()
    m = re.match(r"^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})", s)
    if m:
        return f"{m.group(1)}-{pad(int(m.group(2)))}-{pad(int(m.group(3)))}"
    return s[:40]


def text(v):
    if v is None:
        return ""
    if isinstance(v, str):
        return v.strip()
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (list, tuple)):
        return "、".join(text(x) for x in v)
    return str(v)


def trunc(s: str, n: int) -> str:
    return s if len(s) <= n else s[:n] + "…"


def cell(row, idx):
    return row[idx] if row is not None and idx < len(row) else None


def import_applications() -> int:
    wb = openpyxl.load_workbook(APPLICATIONS_XLSX, data_only=True)
    sheet = wb.worksheets[0]
    rows = list(sheet.iter_rows(values_only=True))
    apps = []
    for i in range(1, len(rows)):
        row = rows[i]
        company = text(cell(row, 0))
        position = text(cell(row, 1))
        if not company or not position:
            continue
        apps.append(
            {
                "companyId": COMPANY_MAP.get(company, ""),
                "companyName": company,
                "position": position,
                "appliedAt": excel_to_iso(cell(row, 2)),
                "stage": text(cell(row, 3)) or "已投递",
                "note": "",
            }
        )
    header = "// 自动从「秋招简历投递.xlsx」生成，请勿手改；用户更新表格后重新运行导入脚本\n"
    body = "window.QIUZHAO_APPLICATIONS = " + json.dumps(apps, ensure_ascii=False, indent=2) + ";\n"
    APPLICATIONS_OUT.write_text(header + body, encoding="utf-8")
    print(f"applications: imported {len(apps)} rows -> {APPLICATIONS_OUT.name}")
    return len(apps)


def import_zhudi() -> tuple:
    wb = openpyxl.load_workbook(ZHUDI_XLSX, data_only=True)
    main = wb.worksheets[0]
    codes_sheet = wb.worksheets[4]
    rows = list(main.iter_rows(values_only=True))
    code_rows = list(codes_sheet.iter_rows(values_only=True))

    out_rows = []
    for i in range(1, len(rows)):
        r = rows[i]
        company = text(cell(r, 1))
        if not company or "（必看）" in company:
            continue
        grad = text(cell(r, 5))
        if "2027" not in grad:
            continue
        out_rows.append(
            {
                "company": trunc(company, 60),
                "industry": trunc(text(cell(r, 3)), 40),
                "batch": trunc(text(cell(r, 4)), 20),
                "grad": trunc(grad, 40),
                "locations": trunc(text(cell(r, 6)), 90),
                "positions": trunc(text(cell(r, 7)), 160),
                "startDate": norm_date(cell(r, 8)),
                "endDate": norm_date(cell(r, 9)),
                "applyUrl": text(cell(r, 10))[:300],
                "announceUrl": text(cell(r, 11))[:300],
                "exam": trunc(text(cell(r, 12)), 20),
            }
        )

    codes = []
    for i in range(1, len(code_rows)):
        r = code_rows[i]
        company = text(cell(r, 0))
        code = text(cell(r, 1))
        if company and code:
            codes.append({"company": trunc(company, 60), "code": code[:60]})

    data = {
        "updatedAt": datetime.now().strftime("%Y-%m-%d"),
        "source": "朱迪学姐汇总表（第三方整理）",
        "sourceUrl": "https://acnr1ayjzqxf.feishu.cn/base/ISNobVuXAagJBFssvszcYeqQnfb",
        "rows": out_rows,
        "codes": codes,
    }
    header = (
        "// 自动生成：朱迪学姐秋招汇总表（2027届 + 内推码）\n"
        "// 来源为第三方整理，属线索层；投递前请以官方公告为准\n"
    )
    body = "window.QIUZHAO_ZHUDI = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"
    ZHUDI_OUT.write_text(header + body, encoding="utf-8")
    print(
        f"zhudi: rows={len(out_rows)} codes={len(codes)} -> {ZHUDI_OUT.name}"
    )
    return len(out_rows), len(codes)


def main():
    targets = sys.argv[1:] or ["applications", "zhudi"]
    for t in targets:
        if t == "applications":
            import_applications()
        elif t == "zhudi":
            import_zhudi()
        else:
            print(f"unknown target: {t}", file=sys.stderr)
            sys.exit(2)


if __name__ == "__main__":
    main()
