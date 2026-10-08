#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""留港专区 · 香港投递表导入脚本。用法：python scripts/import_hk_xlsx.py"""
import json
import re
from datetime import datetime, timedelta
from pathlib import Path

import openpyxl

REPO_ROOT = Path(__file__).resolve().parent.parent
HK_XLSX = Path(r"C:\Users\Lenovo\Desktop\香港岗位投递.xlsx")
OUT = REPO_ROOT / "data" / "hk_applications.js"

COMPANY_MAP = {
    "vocalbeats": "vocalbeats",
    "kingfookholdingslimited景福珠宝": "kingfook",
    "景福珠宝": "kingfook",
    "tungwahgroupofhospital": "tungwah",
    "东华三院": "tungwah",
    "michaelpage": "michaelpage",
    "teachforhongkongtfhk": "teach4hk",
    "teachforhongkong": "teach4hk",
    "hktvmall": "hktvmall",
    "sunlifecareers": "sunlife",
    "sunlife": "sunlife",
    "永明": "sunlife",
}


def norm(s):
    return re.sub(r"[\s（）()\-_/,.]", "", str(s or "")).lower()


def company_id(name):
    n = norm(name)
    if n in COMPANY_MAP:
        return COMPANY_MAP[n]
    for k, v in COMPANY_MAP.items():
        if k and (k in n or n in k):
            return v
    return ""


def to_iso(v):
    if isinstance(v, datetime):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, (int, float)):
        d = datetime(1899, 12, 31) + timedelta(days=float(v))
        return d.strftime("%Y-%m-%d")
    s = str(v or "").strip()
    m = re.match(r"(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})", s)
    if m:
        return m.group(1) + "-" + m.group(2).zfill(2) + "-" + m.group(3).zfill(2)
    return ""


def job_type(position, note):
    p = str(position or "").lower()
    s = str(note or "").lower()
    if "management trainee" in p or "管培" in p or re.search(r"\bmt\b", p):
        return "管培生MT"
    if "graduate trainee" in p or "graduate" in p:
        return "毕业培训生"
    if "recruitment consultant" in p or "猎头" in p:
        return "猎头顾问"
    if "fellowship" in p:
        return "全职"
    if "暑期" in s or "summer" in s:
        return "暑期实习"
    if "冬季" in s or "winter" in s:
        return "冬季实习"
    if "intern" in s or "实习" in s:
        return "普通实习"
    if "management trainee" in s or "管培" in s:
        return "管培生MT"
    if "graduate" in s:
        return "毕业培训生"
    return "全职"


def stage_of(raw):
    s = str(raw or "").strip()
    if not s:
        return "已投递"
    if "挂" in s or "拒" in s:
        return "已挂"
    if "offer" in s.lower():
        return "Offer"
    if "面试" in s:
        return "面试"
    if "笔试" in s or "测评" in s:
        return "笔试"
    return "已投递"


def main():
    wb = openpyxl.load_workbook(HK_XLSX, data_only=True)
    ws = wb.worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    apps = []
    unmapped = set()
    for i in range(1, len(rows)):
        r = rows[i]
        company = str(r[0] or "").strip() if len(r) > 0 else ""
        position = str(r[1] or "").strip() if len(r) > 1 else ""
        if not company or not position:
            continue
        cid = company_id(company)
        if not cid:
            unmapped.add(company)
        note_type = str(r[3] or "").strip() if len(r) > 3 else ""
        jt = job_type(position, note_type)
        st = stage_of(r[4] if len(r) > 4 else "")
        apps.append({
            "companyId": cid,
            "companyName": company,
            "position": position,
            "jobType": jt,
            "appliedAt": to_iso(r[2] if len(r) > 2 else ""),
            "stage": st,
            "note": note_type,
        })
        print("  - " + company + " | " + position + " | " + jt + " | " + apps[-1]["appliedAt"] + " | " + st + " | " + note_type)
    body = "window.QIUZHAO_HK_APPLICATIONS = " + json.dumps(apps, ensure_ascii=False, indent=2) + ";\n"
    header = "// 留港专区 · 我的港投（由「香港岗位投递.xlsx」自动生成，请勿手改）\n"
    OUT.write_text(header + body, encoding="utf-8")
    print("hk applications: imported " + str(len(apps)) + " rows -> " + OUT.name)
    if unmapped:
        print("unmapped companies (need COMPANY_MAP): " + str(sorted(unmapped)))


if __name__ == "__main__":
    main()
