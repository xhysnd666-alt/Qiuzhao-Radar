// 秋招雷达 · 官网变化检测脚本
// 用法：
//   node scripts/check_career_pages.mjs
// 可选环境变量：
//   DEEPSEEK_API_KEY  设置后会用 DeepSeek 解析页面变化，生成 aiDraft
//   DEEPSEEK_MODEL    默认 deepseek-chat
//
// 注意：很多校招官网是前端渲染的单页应用，静态抓取可能只能看到空壳页面。
// 第一版先检测可静态访问的页面；后续可以升级为无头浏览器（Playwright）。

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const watchlistPath = path.join(root, "data", "watchlist.json");
const hashesPath = path.join(root, "data", "page_hashes.json");
const queuePath = path.join(root, "data", "review_queue.json");

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

function readJson(file, fallback) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function normalizeHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50000);
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (qiuzhao-radar monitor)" }
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function aiExtract(companyName, url, text) {
  if (!DEEPSEEK_API_KEY) return null;
  const prompt =
    "你是校招信息整理助手。下面是从 " + companyName + " 校招页面抓取的文本片段。" +
    "请提取结构化信息，只输出一个 JSON 对象，字段：batch（提前批/正式批/补录/未知）、" +
    "startDate（YYYY-MM-DD 或空字符串）、endDate（YYYY-MM-DD 或空字符串）、" +
    "positions（岗位方向字符串数组）、summary（一句话概括当前校招状态）。不要输出其他内容。\n\n" +
    text.slice(0, 12000);
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + DEEPSEEK_API_KEY
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });
    if (!res.ok) throw new Error("DeepSeek HTTP " + res.status);
    const data = await res.json();
    const content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    return JSON.parse(content);
  } catch (err) {
    console.warn("AI extract failed for " + companyName + ": " + err.message);
    return null;
  }
}

const watchlist = readJson(watchlistPath, []);
const hashes = readJson(hashesPath, {});
const queue = readJson(queuePath, { items: [] });
const today = new Date().toISOString().slice(0, 10);

let initialized = 0;
let changed = 0;
let errors = 0;

for (const item of watchlist) {
  try {
    const html = await fetchPage(item.url);
    const text = normalizeHtml(html);
    const hash = createHash("sha1").update(text).digest("hex");
    const prev = hashes[item.url];
    hashes[item.url] = hash;

    if (!prev) {
      initialized++;
      console.log("[init] " + item.name);
      continue;
    }
    if (prev === hash) {
      console.log("[same] " + item.name);
      continue;
    }

    changed++;
    console.log("[changed] " + item.name);
    const aiDraft = text ? await aiExtract(item.name, item.url, text) : null;
    queue.items.unshift({
      id: item.id + "-" + Date.now(),
      companyId: item.id,
      companyName: item.name,
      url: item.url,
      detectedAt: today,
      oldHash: prev,
      newHash: hash,
      aiDraft: aiDraft,
      status: "待确认"
    });
    queue.items = queue.items.slice(0, 50);
  } catch (err) {
    errors++;
    console.warn("[error] " + item.name + ": " + err.message);
  }
}

writeJson(hashesPath, hashes);
writeJson(queuePath, queue);
console.log("done: initialized=" + initialized + " changed=" + changed + " errors=" + errors);
