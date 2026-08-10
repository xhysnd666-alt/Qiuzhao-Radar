# 数据文件结构（编辑前必读）

所有 `data/*.js` 都是 `window.XXX = ...` 形式的浏览器全局变量，UTF-8 编码，不要引入任何 npm 依赖。

## data/companies.js — 重点公司官方层

```js
window.QIUZHAO_DATA = {
  updatedAt: "YYYY-MM-DD",
  sourceNote: "数据来源说明",
  companies: [
    {
      id: "bytedance",            // 唯一英文 id，全小写/连字符
      name: "字节跳动",           // 公司名
      industry: "互联网",         // 互联网/科技/游戏/快消/外企/国企/车企
      batch: "正式批",            // 提前批/正式批/补录
      startDate: "2026-08-03",    // "" 表示未知
      endDate: "2026-11-30",      // "" 表示未知/长期
      status: "进行中",           // 进行中/即将截止/即将开启/未开始/已结束/待核实
      positions: ["人力资源", "运营"], // 岗位方向数组
      applyUrl: "https://...",    // 投递入口（必须官方且可访问）
      careerUrl: "https://...",   // 官网/总入口
      note: "一句话备注",
      source: "官网",             // 来源类型
      sourceUrl: "https://...",   // 来源出处
      sourceLabel: "字节跳动校招官网",
      verified: true              // true=官方入口已验证可访问；false=待核实
    }
  ],
  feedback: [ /* 线索/反馈条目 */ ],
  reviewQueue: []
};
```

规则：
- `status` 为「待核实」时页面显示待核实徽章；不要为省事编造日期。
- 每条新增公司必须有 id/name/applyUrl/careerUrl/positions/source/sourceUrl/sourceLabel/verified。
- `verified: true` 只代表入口可访问，不代表 2027 届已开；批次未开时 status 用「待核实」或「未开始」。
- 同步维护 `data/watchlist.json` 里的监控 URL，避免监控盯旧地址。

## data/apply_rules.js — 每人可投递次数与规则（官方已核实层）

```js
window.QIUZHAO_APPLY_RULES = {
  "mihoyo": {
    limit: 1,          // 数字 = 每人最多可投递次数；"" = 官方明确无上限/以官网为准
    perScope: false,   // true = 上限按业务集团/事业群分别计算（如阿里、网易雷火/互娱）
    unlimited: false,  // true = 官方明确投递无上限；limit 留 ""
    note: "一句话规则说明",
    sourceUrl: "https://...",  // 官方公告/高校就业网来源，必须可点开
    sourceLabel: "北京理工大学就业资讯网（公司官方信息）",
    verified: true
  }
};
```

规则：只收录官方公告、校招官网 FAQ、高校就业网发布的公司官方信息；未核实的公司不要加条目（页面会默认提示「以官网为准」）。`limit` 表示「当前批次/项目内每人最多可投递次数」，跨批次机会在 `note` 里说明（如提前批不占正式批）。

## data/applications.js — 投递记录（Excel 生成，勿手改）

```js
window.QIUZHAO_APPLICATIONS = [
  {
    companyId: "mihoyo",          // 尽量对齐 companies.js 的 id
    companyName: "米哈游",
    position: "游戏运营统招",
    appliedAt: "2026-08-04",
    stage: "已投递",              // 已投递/待面试/面试中/已offer/流程终止等
    note: ""
  }
];
```

来源：桌面 `C:\Users\Lenovo\Desktop\秋招简历投递.xlsx`。用户更新表格后重新导入生成，不要直接手改。

## data/zhudi.js — 朱迪学姐汇总表（第三方线索层）

```js
window.QIUZHAO_ZHUDI = {
  updatedAt: "YYYY-MM-DD",
  source: "朱迪学姐汇总表（第三方整理）",
  sourceUrl: "https://acnr1ayjzqxf.feishu.cn/base/ISNobVuXAagJBFssvszcYeqQnfb",
  rows: [
    {
      company: "公司名",
      industry: "互联网",
      batch: "秋招",              // 秋招/提前批/实习/春招…
      grad: "2027届",
      locations: "北京",
      positions: "岗位1,岗位2",
      startDate: "2026-08-08",
      endDate: "2026-10-31",
      applyUrl: "https://...",    // 允许为空或非 URL（页面会自动不显示投递按钮）
      announceUrl: "https://mp.weixin.qq.com/...",
      exam: "有笔试"
    }
  ],
  codes: [ { company: "4399", code: "s9oy7" } ]
};
```

注意：这是线索层，不能当官方数据；`applyUrl` 经常是公众号文章或表单，投递前必须核实。

## data/interviews.js — 面经库

```js
window.QIUZHAO_INTERVIEWS = {
  updatedAt: "YYYY-MM-DD",
  source: "来源说明",
  items: [
    {
      id: "iv-1",
      company: "米哈游",          // "通用"= 通用面经
      platform: "牛客",           // 牛客/小红书/脉脉/PDF…
      title: "标题",
      url: "https://...",
      summary: "摘要（保留原文关键内容）",
      category: "面经",           // 面经/日程/问答…
      tags: ["标签"]
    }
  ],
  generalQuestions: [ /* 通用面试问题与参考答案 */ ]
};
```

面经内容尽量原样保留关键细节（轮次、问题、注意事项），不要随意删减。

## data/ai_tips.js — AI 面试助手

```js
window.QIUZHAO_AI_TIPS = {
  profile: "用户画像与求职目标一句话",
  zhudiNotes: [ { title: "注意事项标题", content: "原样内容" } ],
  generalTips: [ { id: "tip-1", title: "标题", content: "正文" } ],
  companyTips: { "米哈游": "这家公司的定制提示" }
};
```

## data/guoqi.js / data/sources.js

- `guoqi.js`: `window.QIUZHAO_GUOQI = { updatedAt, source, items: [{ name, url }] }`，央国企名录。
- `sources.js`: `window.QIUZHAO_SOURCES = [ { group, name, platform, priority, note, url } ]`，信息源清单（核心/参考/补充）。

## data/*.json

- `watchlist.json` — `[{ id, name, url }]`，官网监控清单；URL 必须与 companies.js 官方入口一致。
- `review_queue.json` — `{ items: [{ id, source, companyName, position, applyUrl, status: "待确认", ... }] }`，待确认队列。
- `page_hashes.json` / `feishu_sync_state.json` — 脚本自动维护，不要手改。

## 校验

提交前运行：

```bash
node scripts/validate_data.mjs
node --check js/app.js
```
