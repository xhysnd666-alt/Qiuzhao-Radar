// 秋招雷达 · 飞书多维表格每日同步脚本
//
// 原理：通过飞书开放平台 Bitable API 读取分享的多维表格，
// 把新增/变化的记录写入 data/review_queue.json（待确认队列），
// 不直接修改正式数据——确认并核实官方来源后再入库。
//
// 需要环境变量：
//   FEISHU_APP_ID      飞书开放平台自建应用的 App ID
//   FEISHU_APP_SECRET  飞书开放平台自建应用的 App Secret
//   FEISHU_BASE_TOKEN  多维表格链接里的 app_token（默认已填分享链接中的值）
//   FEISHU_TABLE_ID    数据表 ID（可选，不填则自动使用第一个数据表）

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const queuePath = path.join(root, "data", "review_queue.json");
const statePath = path.join(root, "data", "feishu_sync_state.json");

const APP_ID = process.env.FEISHU_APP_ID || "";
const APP_SECRET = process.env.FEISHU_APP_SECRET || "";
const BASE_TOKEN = process.env.FEISHU_BASE_TOKEN || "ISNobVuXAagJBFssvszcYeqQnfb";
const TABLE_ID = process.env.FEISHU_TABLE_ID || "";

if (!APP_ID || !APP_SECRET) {
  console.error("缺少 FEISHU_APP_ID / FEISHU_APP_SECRET，请先在飞书开放平台创建自建应用并配置密钥");
  process.exit(1);
}

function readJson(file, fallback) {
  try { return JSON.parse(readFileSync(file, "utf8")); }
  catch { return fallback; }
}

function writeJson(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function toText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value.map(function (v) {
      if (v && typeof v === "object" && v.link) return v.link;
      return toText(v);
    }).join("、");
  }
  if (typeof value === "object" && value.link) return value.link;
  return String(value);
}

function pickField(fields, names) {
  const keys = Object.keys(fields || {});
  for (const name of names) {
    const hit = keys.find(function (k) { return k.indexOf(name) !== -1 || name.indexOf(k) !== -1; });
    if (hit) return toText(fields[hit]);
  }
  return "";
}

async function getToken() {
  const res = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET })
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error("获取 token 失败: " + JSON.stringify(data).slice(0, 300));
  return data.tenant_access_token;
}

async function apiGet(token, url) {
  const res = await fetch(url, { headers: { Authorization: "Bearer " + token } });
  const data = await res.json();
  if (data.code !== 0) throw new Error("API 错误: " + JSON.stringify(data).slice(0, 300));
  return data;
}

const token = await getToken();
let tableId = TABLE_ID;
if (!tableId) {
  const tables = await apiGet(token, "https://open.feishu.cn/open-apis/bitable/v1/apps/" + BASE_TOKEN + "/tables?page_size=100");
  const items = (tables.data && tables.data.items) || [];
  if (!items.length) throw new Error("多维表格里没有数据表，或应用没有访问权限");
  tableId = items[0].table_id;
  console.log("自动选择数据表: " + items[0].name + " (" + tableId + ")");
}

const queue = readJson(queuePath, { items: [] });
const state = readJson(statePath, { recordHashes: {} });
const today = new Date().toISOString().slice(0, 10);
let pageToken = "";
let newCount = 0;
let changedCount = 0;

do {
  let url = "https://open.feishu.cn/open-apis/bitable/v1/apps/" + BASE_TOKEN + "/tables/" + tableId + "/records?page_size=500";
  if (pageToken) url += "&page_token=" + pageToken;
  const data = await apiGet(token, url);
  const records = (data.data && data.data.items) || [];

  for (const rec of records) {
    const fields = rec.fields || {};
    const company = pickField(fields, ["公司", "企业", "单位"]) || rec.record_id;
    const position = pickField(fields, ["岗位", "职位", "方向"]);
    const batch = pickField(fields, ["批次", "类型"]);
    const start = pickField(fields, ["开始", "开启"]);
    const end = pickField(fields, ["截止", "结束"]);
    const link = pickField(fields, ["链接", "官网", "投递", "网申", "地址"]);
    const status = pickField(fields, ["状态"]);
    const note = pickField(fields, ["备注", "说明", "更新"]);
    const hash = [company, position, batch, start, end, link, status, note].join("|");
    const old = state.recordHashes[rec.record_id];

    if (!old) newCount++;
    else if (old !== hash) changedCount++;
    state.recordHashes[rec.record_id] = hash;
    if (old === hash) continue;

    queue.items.unshift({
      id: "feishu-" + rec.record_id + "-" + Date.now(),
      source: "feishu",
      sourceUrl: "https://acnr1ayjzqxf.feishu.cn/base/" + BASE_TOKEN,
      companyName: company,
      position: position,
      batch: batch,
      startDate: start,
      endDate: end,
      applyUrl: link || "",
      statusNote: status || "",
      note: note || "",
      recordId: rec.record_id,
      detectedAt: today,
      aiDraft: null,
      status: "待确认"
    });
  }
  pageToken = (data.data && data.data.page_token) || "";
} while (pageToken);

queue.items = queue.items.slice(0, 100);
writeJson(statePath, state);
writeJson(queuePath, queue);
console.log("sync done: new=" + newCount + " changed=" + changedCount + " queue=" + queue.items.length);
