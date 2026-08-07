(function () {
  "use strict";

  var DATA = window.QIUZHAO_DATA || { companies: [], feedback: [], reviewQueue: [] };
  var LS_KEY = "qiuzhao-radar-progress-v1";
  var POSITION_OPTIONS = ["人力资源", "游戏运营", "游戏发行", "游戏营销", "市场", "运营", "职能"];
  var STAGES = ["已投递", "笔试", "面试", "Offer", "已挂"];
  var STATUS_CLASS = {
    "进行中": "badge-ok",
    "即将截止": "badge-warn",
    "即将开启": "badge-primary",
    "已结束": "",
    "未开始": "",
    "待核实": "badge-muted"
  };
  var PLATFORM_CLASS = {
    "小红书": "badge-red",
    "脉脉": "badge-blue",
    "牛客": "badge-green",
    "知乎": "badge-blue"
  };

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    var t = new Date(dateStr + "T00:00:00");
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((t - now) / 86400000);
  }

  function statusOf(c) {
    if (c.status && c.status !== "待核实") return c.status;
    if (c.status === "待核实") return "待核实";
    var dEnd = daysUntil(c.endDate);
    if (dEnd !== null && dEnd < 0) return "已结束";
    var dStart = daysUntil(c.startDate);
    if (dStart !== null && dStart > 0) return "未开始";
    if (dEnd !== null && dEnd <= 3) return "即将截止";
    return "进行中";
  }

  function fmtDate(s) {
    if (!s) return "待定";
    var p = s.split("-");
    return parseInt(p[1], 10) + "/" + parseInt(p[2], 10);
  }

  function getProgress() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  var progress = getProgress();
  function saveProgress() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(progress)); }
    catch (e) { /* 隐私模式等场景下静默失败 */ }
  }

  function renderStats() {
    var companies = DATA.companies || [];
    var active = companies.filter(function (c) {
      var s = statusOf(c);
      return s === "进行中" || s === "即将截止" || s === "即将开启";
    });
    var expiring = companies.filter(function (c) { return statusOf(c) === "即将截止"; });
    var early = active.filter(function (c) { return c.batch === "提前批"; });
    $("#stat-active").textContent = active.length;
    $("#stat-expiring").textContent = expiring.length;
    $("#stat-early").textContent = early.length;
    $("#stat-review").textContent = (DATA.reviewQueue || []).length;
  }

  function renderFilters() {
    var industries = [];
    (DATA.companies || []).forEach(function (c) {
      if (industries.indexOf(c.industry) === -1) industries.push(c.industry);
    });
    industries.sort();
    $("#filter-industry").innerHTML = '<option value="">全部行业</option>' + industries.map(function (i) {
      return '<option value="' + esc(i) + '">' + esc(i) + "</option>";
    }).join("");

    $("#filter-position").innerHTML = '<option value="">全部岗位</option>' + POSITION_OPTIONS.map(function (p) {
      return '<option value="' + esc(p) + '">' + esc(p) + "</option>";
    }).join("");

    var statuses = ["进行中", "即将截止", "即将开启", "未开始", "已结束", "待核实"];
    $("#filter-status").innerHTML = '<option value="">全部状态</option>' + statuses.map(function (s) {
      return '<option value="' + esc(s) + '">' + esc(s) + "</option>";
    }).join("");
  }

  function renderTable() {
    var q = ($("#search").value || "").trim().toLowerCase();
    var ind = $("#filter-industry").value;
    var pos = $("#filter-position").value;
    var bat = $("#filter-batch").value;
    var sta = $("#filter-status").value;

    var rows = (DATA.companies || []).filter(function (c) {
      if (q && (c.name + " " + c.positions.join(" ")).toLowerCase().indexOf(q) === -1) return false;
      if (ind && c.industry !== ind) return false;
      if (pos && c.positions.indexOf(pos) === -1) return false;
      if (bat && c.batch !== bat) return false;
      var st = statusOf(c);
      if (sta && st !== sta) return false;
      return true;
    });

    var tbody = $("#company-rows");
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">没有符合条件的公司，试试放宽筛选</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (c) {
      var st = statusOf(c);
      return "<tr>" +
        "<td><b>" + esc(c.name) + "</b>" + (c.verified ? "" : ' <span class="badge badge-muted">待核实</span>') + "</td>" +
        "<td>" + esc(c.positions.join(" / ")) + "</td>" +
        '<td><span class="badge' + (c.batch === "提前批" ? " badge-primary" : "") + '">' + esc(c.batch) + "</span></td>" +
        '<td class="hide-sm">' + fmtDate(c.startDate) + "</td>" +
        '<td class="hide-sm">' + fmtDate(c.endDate) + "</td>" +
        '<td><span class="badge ' + (STATUS_CLASS[st] || "") + '">' + esc(st) + "</span></td>" +
        '<td class="actions-cell"><a class="btn btn-ghost" href="' + esc(c.applyUrl) + '" target="_blank" rel="noopener">投递</a>' +
        '<button class="btn btn-ghost" type="button" data-detail="' + esc(c.id) + '">详情</button></td>' +
        "</tr>";
    }).join("");
  }

  function feedbackFor(companyName) {
    return (DATA.feedback || []).filter(function (f) { return f.company === companyName; });
  }

  function renderDetail(c) {
    var st = statusOf(c);
    var saved = progress[c.id] || {};
    var panel = $("#detail");
    panel.hidden = false;

    var stageOptions = ["未投递", "已投递", "笔试", "面试", "Offer", "已挂"].map(function (s) {
      return '<option' + (saved.stage === s ? " selected" : "") + ">" + s + "</option>";
    }).join("");

    var feed = feedbackFor(c.name);
    var feedHtml = feed.length
      ? '<ul class="feedback-list">' + feed.map(function (f) {
          return "<li><a class=\"feedback-title\" href=\"" + esc(f.url) + "\" target=\"_blank\" rel=\"noopener\">" + esc(f.title) + "</a><span class=\"badge " + (PLATFORM_CLASS[f.platform] || "") + "\">" + esc(f.platform) + "</span></li>";
        }).join("") + "</ul>"
      : '<div class="text-small muted">还没有相关反馈，可以到「反馈池」添加</div>';

    panel.innerHTML =
      '<div class="row">' +
        "<b>" + esc(c.name) + "</b>" +
        '<span class="badge">' + esc(c.industry) + "</span>" +
        '<span class="badge ' + (STATUS_CLASS[st] || "") + '">' + esc(st) + "</span>" +
        (c.verified ? "" : '<span class="badge badge-muted">字段待核实</span>') +
        '<button class="btn btn-ghost" type="button" id="detail-close">关闭</button>' +
      "</div>" +
      '<div class="detail-meta text-small muted">' + esc(c.note || "") + " · 来源：" + esc(c.source || "") + "</div>" +
      '<div class="row">' +
        '<a class="btn" href="' + esc(c.careerUrl) + '" target="_blank" rel="noopener">官方校招页</a>' +
        '<a class="btn btn-primary" href="' + esc(c.applyUrl) + '" target="_blank" rel="noopener">去投递</a>' +
      "</div>" +
      '<div class="row detail-meta">' +
        "<div><b>批次</b><div class=\"text-small\">" + esc(c.batch) + " · " + fmtDate(c.startDate) + " 开启 · " + fmtDate(c.endDate) + " 截止</div></div>" +
        "<div><b>岗位方向</b><div class=\"text-small\">" + esc(c.positions.join(" / ")) + "</div></div>" +
      "</div>" +
      '<div class="row">' +
        "<label class=\"text-small muted\" for=\"progress-select\">我的进度</label>" +
        '<select class="select progress-select" id="progress-select" aria-label="我的投递进度">' + stageOptions + "</select>" +
        '<button class="btn btn-primary save-progress" type="button">保存</button>' +
        '<button class="btn clear-progress" type="button">清除</button>' +
      "</div>" +
      '<div class="detail-meta"><b>相关反馈</b>' + feedHtml + "</div>";

    $("#detail-close").addEventListener("click", function () { panel.hidden = true; });
    panel.querySelector(".save-progress").addEventListener("click", function () {
      progress[c.id] = { stage: panel.querySelector(".progress-select").value, updatedAt: todayStr(), position: (c.positions || [])[0] || "" };
      saveProgress();
      renderApplications();
      renderDetail(c);
    });
    panel.querySelector(".clear-progress").addEventListener("click", function () {
      delete progress[c.id];
      saveProgress();
      renderApplications();
      renderDetail(c);
    });
  }

  function showDetail(id) {
    var found = null;
    (DATA.companies || []).forEach(function (c) { if (c.id === id) found = c; });
    if (found) renderDetail(found);
  }

  function renderApplications() {
    var cols = $("#application-cols");
    cols.innerHTML = STAGES.map(function (stage) {
      var items = (DATA.companies || []).filter(function (c) { return progress[c.id] && progress[c.id].stage === stage; });
      var cards = items.map(function (c) {
        var p = progress[c.id];
        return '<div class="kanban-card">' +
          '<div class="kanban-title">' + esc(c.name) + "</div>" +
          '<div class="text-small muted">' + esc(p.position || "岗位未填") + " · " + esc(p.updatedAt || "") + "</div>" +
          '<button class="btn btn-ghost remove-progress" type="button" data-id="' + esc(c.id) + '">移除</button>' +
          "</div>";
      }).join("");
      return '<div class="kanban-col"><h4>' + stage + "（" + items.length + "）</h4>" + (cards || '<div class="text-small muted">暂无</div>') + "</div>";
    }).join("");
  }

  function renderFeedback() {
    var list = $("#feedback-list");
    var items = DATA.feedback || [];
    if (!items.length) {
      list.innerHTML = '<li class="empty-cell">暂无反馈，等自动采集/手动补充后显示</li>';
      return;
    }
    list.innerHTML = items.map(function (f) {
      return "<li>" +
        "<div>" +
          '<a class="feedback-title" href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.title) + "</a>" +
          (f.sample ? ' <span class="badge badge-muted">示例</span>' : "") +
          '<div class="text-small muted">' + esc(f.platform) + " · " + esc(f.company) + " · " + esc(f.addedAt || "") + "</div>" +
          '<div class="text-small muted">' + esc(f.summary || "") + "</div>" +
        "</div>" +
        '<span class="badge ' + (PLATFORM_CLASS[f.platform] || "") + '">' + esc(f.platform) + "</span>" +
        '<span class="badge ' + (f.status === "已收录" ? "badge-ok" : "badge-warn") + '">' + esc(f.status || "待确认") + "</span>" +
        "</li>";
    }).join("");
  }

  function renderReview() {
    var wrap = $("#review-list");
    var items = (DATA.reviewQueue || []).slice(0, 20);
    if (!items.length) {
      wrap.innerHTML = '<div class="empty-box">暂无待确认项。自动检测脚本跑起来后，官网页面变化会出现在这里，确认后即可收录进数据。</div>';
      return;
    }
    wrap.innerHTML = items.map(function (it) {
      var draft = it.aiDraft;
      var draftHtml = draft
        ? '<div class="text-small muted">AI解析：' + esc(draft.batch || "未知") + " · " + esc(draft.startDate || "开始日期待定") + " → " + esc(draft.endDate || "截止待定") + " · " + esc((draft.positions || []).join("、") || "岗位待定") + "</div>"
        : "";
      return '<div class="panel review-item">' +
        '<div class="row"><b>' + esc(it.companyName) + " · 页面变化</b><span class=\"badge badge-primary\">" + esc(it.status || "待确认") + "</span></div>" +
        '<div class="text-small muted">来源：' + esc(it.url) + " · 检测于 " + esc(it.detectedAt || "") + "</div>" +
        draftHtml +
        '<div class="row actions">' +
          '<button class="btn btn-primary review-action" type="button" data-action="confirm">确认收录</button>' +
          '<button class="btn review-action" type="button" data-action="ignore">忽略</button>' +
        "</div>" +
      "</div>";
    }).join("");
  }

  function switchView(name) {
    $$("[data-view-btn]").forEach(function (b) {
      b.setAttribute("aria-selected", b.getAttribute("data-view-btn") === name ? "true" : "false");
    });
    $$("[data-view]").forEach(function (v) {
      v.classList.toggle("active", v.getAttribute("data-view") === name);
    });
  }

  function init() {
    $("#data-date").textContent = DATA.updatedAt || "";
    $("#source-note").textContent = DATA.sourceNote || "";
    renderStats();
    renderFilters();
    renderTable();
    renderApplications();
    renderFeedback();
    renderReview();

    ["search", "filter-industry", "filter-position", "filter-batch", "filter-status"].forEach(function (id) {
      var el = $("#" + id);
      el.addEventListener("input", renderTable);
      el.addEventListener("change", renderTable);
    });

    $$("[data-view-btn]").forEach(function (b) {
      b.addEventListener("click", function () { switchView(b.getAttribute("data-view-btn")); });
    });

    $("#company-rows").addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("button[data-detail]") : null;
      if (btn) showDetail(btn.getAttribute("data-detail"));
    });

    $("#application-cols").addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("button.remove-progress") : null;
      if (!btn) return;
      delete progress[btn.getAttribute("data-id")];
      saveProgress();
      renderApplications();
    });

    $("#review-list").addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("button.review-action") : null;
      if (!btn) return;
      btn.textContent = btn.getAttribute("data-action") === "confirm" ? "已确认（本地）" : "已忽略（本地）";
      btn.disabled = true;
    });
  }

  init();
})();
