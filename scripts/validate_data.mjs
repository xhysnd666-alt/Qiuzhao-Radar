// 秋招雷达 · 数据一致性校验（提交前运行）
// 用法：node scripts/validate_data.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadJs(rel) {
  const src = readFileSync(path.join(root, rel), "utf8");
  const m = src.match(/window\.([A-Z_]+)\s*=\s*([\s\S]*?)\s*;\s*$/);
  if (!m) throw new Error(`cannot parse ${rel}`);
  const name = m[1];
  const value = m[2];
  const w = Object.create(null);
  Function("window", `window.${name} = ${value};`)(w);
  return w[name];
}

const errors = [];

const data = loadJs("data/companies.js");
const companies = data.companies || [];
const required = [
  "id", "name", "industry", "batch", "startDate", "endDate", "status",
  "positions", "applyUrl", "careerUrl", "note", "source", "sourceUrl",
  "sourceLabel", "verified"
];
const ids = new Set();
for (const c of companies) {
  for (const k of required) {
    if (!(k in c)) errors.push(`${c.id || "(no id)"} missing field: ${k}`);
  }
  if (ids.has(c.id)) errors.push(`duplicate id: ${c.id}`);
  ids.add(c.id);
  if (c.applyUrl && !String(c.applyUrl).startsWith("http")) errors.push(`${c.id} bad applyUrl`);
  if (c.careerUrl && !String(c.careerUrl).startsWith("http")) errors.push(`${c.id} bad careerUrl`);
  if (!Array.isArray(c.positions) || c.positions.length === 0) errors.push(`${c.id} empty positions`);
  if (typeof c.verified !== "boolean") errors.push(`${c.id} verified not boolean`);
}

let applyRuleCount = 0;
try {
  const rules = loadJs("data/apply_rules.js");
  applyRuleCount = Object.keys(rules || {}).length;
  for (const [id, rule] of Object.entries(rules || {})) {
    if (!ids.has(id)) errors.push(`apply rule for unknown company: ${id}`);
    if (typeof rule.limit !== "number" && rule.limit !== "") errors.push(`apply rule ${id}: limit must be number or ""`);
    if (!rule.note) errors.push(`apply rule ${id}: note missing`);
    if (!rule.sourceUrl || !String(rule.sourceUrl).startsWith("http")) errors.push(`apply rule ${id}: bad sourceUrl`);
    if (rule.verified !== true) errors.push(`apply rule ${id}: verified not true`);
    if (rule.perScope !== undefined && typeof rule.perScope !== "boolean") errors.push(`apply rule ${id}: perScope not boolean`);
    if (rule.unlimited !== undefined && typeof rule.unlimited !== "boolean") errors.push(`apply rule ${id}: unlimited not boolean`);
  }
} catch (e) {
  errors.push("apply_rules.js: " + e.message);
}

const watchlist = JSON.parse(readFileSync(path.join(root, "data/watchlist.json"), "utf8"));
for (const w of watchlist) {
  if (!ids.has(w.id)) errors.push(`watchlist id not in companies: ${w.id}`);
}
for (const c of companies) {
  if (!watchlist.some((w) => w.id === c.id)) errors.push(`company not in watchlist: ${c.id}`);
}

try {
  JSON.parse(readFileSync(path.join(root, "data/review_queue.json"), "utf8"));
} catch (e) {
  errors.push("review_queue.json invalid: " + e.message);
}

let zhudiRows = 0;
let zhudiCodes = 0;
try {
  const zhudi = loadJs("data/zhudi.js");
  zhudiRows = (zhudi.rows || []).length;
  zhudiCodes = (zhudi.codes || []).length;
} catch (e) {
  errors.push("zhudi.js: " + e.message);
}

let appCount = 0;
try {
  const apps = loadJs("data/applications.js");
  appCount = (apps || []).length;
} catch (e) {
  errors.push("applications.js: " + e.message);
}

console.log(`companies=${companies.length} watchlist=${watchlist.length} applyRules=${applyRuleCount} zhudiRows=${zhudiRows} zhudiCodes=${zhudiCodes} applications=${appCount}`);
if (errors.length) {
  console.error("ERRORS:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("VALIDATION OK");
