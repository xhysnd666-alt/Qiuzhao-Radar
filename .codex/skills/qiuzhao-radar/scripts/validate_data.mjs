#!/usr/bin/env node
// 秋招雷达 · 数据一致性校验
// 用法：node scripts/validate_data.mjs
// 检查 data/ 下所有 JS/JSON 数据结构，发现问题输出到 stderr 并以非 0 退出。

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..", "..", "..");
const errors = [];
const warnings = [];
const warningSamples = {};

function warn(message, sample) {
  warnings.push(message);
  if (sample) {
    (warningSamples[message] = warningSamples[message] || []);
    if (warningSamples[message].length < 5 && warningSamples[message].indexOf(sample) === -1) {
      warningSamples[message].push(sample);
    }
  }
}

function readJs(rel) {
  const p = path.join(root, "data", rel);
  if (!existsSync(p)) {
    errors.push(`missing data/${rel}`);
    return {};
  }
  const code = readFileSync(p, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  try {
    vm.runInContext(code, sandbox);
    return sandbox.window;
  } catch (e) {
    errors.push(`data/${rel} cannot parse: ${e.message}`);
    return {};
  }
}

function readJson(rel, optional) {
  const p = path.join(root, "data", rel);
  if (!existsSync(p)) {
    if (!optional) errors.push(`missing data/${rel}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    errors.push(`data/${rel} invalid JSON: ${e.message}`);
    return null;
  }
}

function isHttpUrl(v) {
  return typeof v === "string" && /^https?:\/\//i.test(v);
}

const KNOWN_STATUS = ["进行中", "即将截止", "即将开启", "未开始", "已结束", "待核实"];

// ---- companies.js（官方层，严格校验）----
const W = readJs("companies.js");
const DATA = W.QIUZHAO_DATA || {};
const companies = DATA.companies;
if (!Array.isArray(companies)) {
  errors.push("companies.js: QIUZHAO_DATA.companies 缺失或不是数组");
} else {
  const ids = new Set();
  companies.forEach((c, i) => {
    const label = `companies[${i}] ${c && c.name ? c.name : "(无名字)"}`;
    if (!c || !c.id) errors.push(`${label}: 缺 id`);
    if (!c || !c.name) errors.push(`${label}: 缺 name`);
    if (c && c.id) {
      if (ids.has(c.id)) errors.push(`${label}: id 重复 (${c.id})`);
      ids.add(c.id);
    }
    if (!c || !isHttpUrl(c.applyUrl)) errors.push(`${label}: applyUrl 无效 (${c && c.applyUrl})`);
    if (!c || !isHttpUrl(c.careerUrl)) errors.push(`${label}: careerUrl 无效 (${c && c.careerUrl})`);
    if (!c || !Array.isArray(c.positions) || !c.positions.length) errors.push(`${label}: positions 缺失或为空`);
    if (c && c.status && KNOWN_STATUS.indexOf(c.status) === -1) errors.push(`${label}: 未知 status "${c.status}"`);
    if (c && typeof c.verified !== "boolean") warnings.push(`${label}: verified 不是布尔值`);
    if (c && (!c.sourceUrl || !isHttpUrl(c.sourceUrl))) warnings.push(`${label}: sourceUrl 缺失或不是 URL`);
    if (c && !c.sourceLabel) warnings.push(`${label}: sourceLabel 缺失`);
  });
}

// ---- zhudi.js（线索层，宽松校验）----
const ZH = readJs("zhudi.js");
const ZHUDI = ZH.QIUZHAO_ZHUDI || {};
if (!Array.isArray(ZHUDI.rows)) errors.push("zhudi.js: rows 缺失或不是数组");
if (!Array.isArray(ZHUDI.codes)) errors.push("zhudi.js: codes 缺失或不是数组");
(ZHUDI.rows || []).forEach((r, i) => {
  if (!r || !r.company) {
    errors.push(`zhudi.rows[${i}]: 缺 company`);
    return;
  }
  if (r.applyUrl && !isHttpUrl(r.applyUrl)) warn("zhudi: applyUrl 是文字占位/邮箱（非 URL），页面不显示投递按钮", r.company);
  if (r.announceUrl && !isHttpUrl(r.announceUrl)) warn("zhudi: announceUrl 是文字占位/邮箱（非 URL）", r.company);
});

// ---- applications.js（Excel 生成）----
const AP = readJs("applications.js");
const apps = AP.QIUZHAO_APPLICATIONS;
if (!Array.isArray(apps)) {
  errors.push("applications.js: QIUZHAO_APPLICATIONS 缺失或不是数组");
} else {
  apps.forEach((a, i) => {
    if (!a || !a.companyName || !a.position) errors.push(`applications[${i}]: 缺 companyName/position`);
    if (a && a.appliedAt && !/^\d{4}-\d{2}-\d{2}$/.test(a.appliedAt)) warnings.push(`applications[${i}]: appliedAt 格式 ${a.appliedAt}`);
  });
}

// ---- interviews.js ----
const IV = readJs("interviews.js");
const interviews = IV.QIUZHAO_INTERVIEWS || {};
if (!Array.isArray(interviews.items)) errors.push("interviews.js: items 缺失或不是数组");
(interviews.items || []).forEach((it, i) => {
  if (!it || !it.company || !it.title) errors.push(`interviews.items[${i}]: 缺 company/title`);
  if (it && it.url && !isHttpUrl(it.url)) warnings.push(`interviews.items[${i}]: url 不是 URL`);
});

// ---- ai_tips.js ----
const TIPS = readJs("ai_tips.js");
const ai = TIPS.QIUZHAO_AI_TIPS || {};
if (!ai.profile) errors.push("ai_tips.js: profile 为空");
if (!Array.isArray(ai.generalTips)) errors.push("ai_tips.js: generalTips 缺失");
if (!ai.companyTips || typeof ai.companyTips !== "object") errors.push("ai_tips.js: companyTips 缺失");

// ---- guoqi.js / sources.js ----
const GQ = readJs("guoqi.js");
if (!Array.isArray((GQ.QIUZHAO_GUOQI || {}).items)) errors.push("guoqi.js: items 缺失或不是数组");
const SRC = readJs("sources.js");
if (!Array.isArray(SRC.QIUZHAO_SOURCES)) errors.push("sources.js: QIUZHAO_SOURCES 缺失或不是数组");

// ---- JSON 文件 ----
const watch = readJson("watchlist.json");
if (watch && Array.isArray(watch)) {
  watch.forEach((w, i) => {
    if (!w || !w.id || !w.name) errors.push(`watchlist[${i}]: 缺 id/name`);
    if (w && !isHttpUrl(w.url)) errors.push(`watchlist[${i}] (${w.name || ""}): url 无效`);
  });
}
readJson("review_queue.json");
readJson("page_hashes.json", true);
readJson("feishu_sync_state.json", true);

// ---- 站点骨架 ----
for (const rel of ["index.html", "js/app.js", "css/style.css"]) {
  if (!existsSync(path.join(root, rel))) errors.push(`missing ${rel}`);
}

if (errors.length) {
  console.error("❌ 校验失败：");
  errors.forEach((e) => console.error("  - " + e));
  if (warnings.length) {
    printWarnings();
  }
  process.exit(1);
}

if (warnings.length) {
  console.log("✅ 数据结构通过（有警告）：");
  printWarnings();
} else {
  console.log("✅ 全部数据校验通过");
}

function printWarnings() {
  const counts = {};
  for (const w of warnings) {
    counts[w] = (counts[w] || 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = warnings.length;
  entries.slice(0, 8).forEach(([msg, n]) => {
    const samples = warningSamples[msg] || [];
    const sampleText = samples.length ? "；示例：" + samples.join("、") : "";
    console.log(`  ⚠️ ${msg}（${n} 条${n === total ? "" : "，共 " + total + " 条"}${sampleText}）`);
  });
  if (entries.length > 8) {
    console.log(`  … 还有 ${entries.length - 8} 类共 ${total - entries.slice(0, 8).reduce((s, e) => s + e[1], 0)} 条不同警告`);
  }
}
