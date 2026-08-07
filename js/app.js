(function () {
  "use strict";

  var DATA = window.QIUZHAO_DATA || { companies: [], feedback: [], reviewQueue: [] };
  var APPLICATIONS = window.QIUZHAO_APPLICATIONS || [];
  var SOURCES = window.QIUZHAO_SOURCES || [];
  var ZHUDI = window.QIUZHAO_ZHUDI || { rows: [], codes: [] };
  var INTERVIEWS = window.QIUZHAO_INTERVIEWS || { items: [], generalQuestions: [] };
  var GUOQI = window.QIUZHAO_GUOQI || { items: [] };
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
    if (p.length !== 3 || isNaN(parseInt(p[1], 10)) || isNaN(parseInt(p[2], 10))) return s;
    return parseInt(p[1], 10) + "/" + parseInt(p[2], 10);
  }

  function companyById(id) {
    var found = null;
    (DATA.companies || []).forEach(function (c) { if (c.id === id) found = c; });
    return found;
  }

  var TARGET_KEYWORDS = ["人力资源", "游戏运营", "游戏发行", "游戏营销"];

  function isInternBatch(b) {
    return b && (b.indexOf("实习") !== -1 || b.indexOf("训练营") !== -1);
  }

  function overviewNoIntern() {
    var el = $("#overview-no-intern");
    return !el || el.checked;
  }

  function applicationsForRow(row) {
    if (row._clue) {
      return APPLICATIONS.filter(function (a) {
        return a.companyName.indexOf(row.name) !== -1 || row.name.indexOf(a.companyName) !== -1;
      });
    }
    return APPLICATIONS.filter(function (a) { return a.companyId === row.id; });
  }

  function overviewRows() {
    var noIntern = overviewNoIntern();
    var rows = (DATA.companies || []).map(function (c) {
      return {
        _clue: false,
        id: c.id,
        name: c.name,
        industry: c.industry,
        batch: c.batch,
        positions: c.positions.join(" / "),
        startDate: c.startDate,
        endDate: c.endDate,
        status: statusOf(c),
        applyUrl: c.applyUrl,
        announceUrl: c.careerUrl,
        verified: c.verified,
        data: c
      };
    });
    var seen = {};
    (ZHUDI.rows || []).forEach(function (r) {
      if (noIntern && isInternBatch(r.batch)) return;
      var hit = TARGET_KEYWORDS.some(function (k) { return r.positions && r.positions.indexOf(k) !== -1; });
      if (!hit) return;
      var dup = rows.some(function (x) {
        return x.name === r.company || x.name.indexOf(r.company) !== -1 || r.company.indexOf(x.name) !== -1;
      });
      if (dup || seen[r.company]) return;
      seen[r.company] = true;
      rows.push({
        _clue: true,
        id: r.company,
        name: r.company,
        industry: r.industry || "",
        batch: r.batch || "",
        positions: r.positions || "",
        startDate: r.startDate || "",
        endDate: r.endDate || "",
        status: "待核实",
        applyUrl: r.applyUrl || "",
        announceUrl: r.announceUrl || "",
        verified: false,
        data: r
      });
    });
    return rows;
  }

  var overviewShown = 30;

  function getProgress() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  var progress = getProgress();
  function saveProgress() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(progress)); }
    catch (e) { /* 隐私模式等场景下静默失败 */ }
  }

  function appKey(app) {
    return app.companyId + "::" + app.position;
  }

  function stageOf(app) {
    var o = progress[appKey(app)];
    return o && o.stage ? o.stage : (app.stage || "已投递");
  }

  var currentCompany = null;

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
    $("#stat-applied").textContent = APPLICATIONS.length;
  }

  function renderFilters() {
    var rows = overviewRows();
    var industries = [];
    var batches = [];
    rows.forEach(function (r) {
      if (r.industry && industries.indexOf(r.industry) === -1) industries.push(r.industry);
      if (r.batch && batches.indexOf(r.batch) === -1) batches.push(r.batch);
    });
    industries.sort();
    batches.sort();
    $("#filter-industry").innerHTML = '<option value="">全部行业</option>' + industries.map(function (i) {
      return '<option value="' + esc(i) + '">' + esc(i) + "</option>";
    }).join("");

    $("#filter-batch").innerHTML = '<option value="">全部批次</option>' + batches.map(function (b) {
      return '<option value="' + esc(b) + '">' + esc(b) + "</option>";
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
    var hideApplied = $("#overview-hide-applied") && $("#overview-hide-applied").checked;

    var rows = overviewRows().filter(function (r) {
      if (q && (r.name + " " + r.positions + " " + r.industry).toLowerCase().indexOf(q) === -1) return false;
      if (ind && r.industry !== ind) return false;
      if (pos && r.positions.indexOf(pos) === -1) return false;
      if (bat && r.batch !== bat) return false;
      if (sta && r.status !== sta) return false;
      if (hideApplied && applicationsForRow(r).length) return false;
      return true;
    });

    var tbody = $("#company-rows");
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-cell">没有符合条件的公司，试试放宽筛选</td></tr>';
      return;
    }
    var slice = rows.slice(0, overviewShown);
    tbody.innerHTML = slice.map(function (r) {
      var apps = applicationsForRow(r);
      var appliedBadge = apps.length ? ' <span class="badge badge-ok">已投</span>' : "";
      var sourceBadge = r._clue
        ? ' <span class="badge badge-muted">朱迪线索</span>'
        : (r.verified ? "" : ' <span class="badge badge-muted">待核实</span>');
      var appliedNote = apps.length
        ? '<div class="text-small applied-note">已投：' + esc(apps.map(function (a) { return a.position; }).join("、")) + "</div>"
        : "";
      var batchBadge = r._clue
        ? '<span class="badge ' + batchClass(r.batch) + '">' + esc(r.batch || "待定") + "</span>"
        : '<span class="badge' + (r.batch === "提前批" ? " badge-primary" : "") + '">' + esc(r.batch) + "</span>";
      var ivCount = interviewsFor(r.name).length;
      var ivBtn = ivCount ? '<button class="btn btn-ghost btn-iv" type="button" data-iv-company="' + esc(r.name) + '">面经 ' + ivCount + "</button>" : "";
      var links;
      if (r._clue) {
        links = (isUrl(r.applyUrl) ? '<a class="btn btn-ghost" href="' + esc(r.applyUrl) + '" target="_blank" rel="noopener">投递</a>' : "") +
          (isUrl(r.announceUrl) && r.announceUrl !== r.applyUrl ? '<a class="btn btn-ghost" href="' + esc(r.announceUrl) + '" target="_blank" rel="noopener">公告</a>' : "") +
          ivBtn;
      } else {
        links = '<a class="btn btn-ghost" href="' + esc(r.applyUrl) + '" target="_blank" rel="noopener">投递</a>' +
          '<button class="btn btn-ghost" type="button" data-detail="' + esc(r.id) + '">详情</button>' +
          ivBtn;
      }
      return "<tr>" +
        "<td><b>" + esc(r.name) + "</b>" + appliedBadge + sourceBadge + appliedNote + "</td>" +
        "<td>" + esc(r.positions) + "</td>" +
        "<td>" + batchBadge + "</td>" +
        '<td class="hide-sm">' + fmtDate(r.startDate) + "</td>" +
        '<td class="hide-sm">' + fmtDate(r.endDate) + "</td>" +
        '<td><span class="badge ' + (STATUS_CLASS[r.status] || "") + '">' + esc(r.status) + "</span></td>" +
        '<td class="actions-cell">' + links + "</td>" +
        "</tr>";
    }).join("") + (rows.length > overviewShown
      ? '<tr><td colspan="7"><button class="btn btn-block" type="button" id="table-more">加载更多（' + (rows.length - overviewShown) + "）</button></td></tr>"
      : "");
  }

  function feedbackFor(companyName) {
    return (DATA.feedback || []).filter(function (f) { return f.company === companyName; });
  }

  function interviewsFor(companyName) {
    return (INTERVIEWS.items || []).filter(function (i) {
      return i.company !== "通用" && (companyName.indexOf(i.company) !== -1 || i.company.indexOf(companyName) !== -1);
    });
  }

  function renderDetail(c) {
    currentCompany = c;
    var st = statusOf(c);
    var panel = $("#detail");
    panel.hidden = false;

    var apps = APPLICATIONS.filter(function (a) { return a.companyId === c.id; });
    var progressHtml;
    if (apps.length) {
      progressHtml = '<ul class="app-list">' + apps.map(function (app) {
        var key = appKey(app);
        var cur = stageOf(app);
        var opts = ["已投递", "笔试", "面试", "Offer", "已挂"].map(function (s) {
          return '<option' + (cur === s ? " selected" : "") + ">" + s + "</option>";
        }).join("");
        return "<li class=\"app-row\">" +
          "<div><b>" + esc(app.position) + "</b>" +
          (app.companyName !== c.name ? ' <span class="badge badge-muted">' + esc(app.companyName) + "</span>" : "") +
          '<div class="text-small muted">投递于 ' + fmtDate(app.appliedAt) + "</div></div>" +
          '<div class="row">' +
          '<select class="select progress-select" aria-label="' + esc(app.position) + ' 的进度">' + opts + "</select>" +
          '<button class="btn btn-primary" type="button" data-progress-action="save" data-key="' + esc(key) + '">保存</button>' +
          '<button class="btn" type="button" data-progress-action="clear" data-key="' + esc(key) + '">恢复默认</button>' +
          "</div></li>";
      }).join("") + "</ul>";
    } else {
      progressHtml = '<div class="text-small muted">暂无投递记录——你在「秋招简历投递.xlsx」里更新后告诉我，我会同步到这里。</div>';
    }

    var related = interviewsFor(c.name);
    var feedHtml;
    if (related.length) {
      feedHtml = related.map(interviewCardHtml).join("");
    } else {
      feedHtml = '<div class="text-small muted">还没有相关面经，可以到「面经库」添加</div>';
    }

    panel.innerHTML =
      '<div class="row">' +
        "<b>" + esc(c.name) + "</b>" +
        '<span class="badge">' + esc(c.industry) + "</span>" +
        '<span class="badge ' + (STATUS_CLASS[st] || "") + '">' + esc(st) + "</span>" +
        (c.verified ? "" : '<span class="badge badge-muted">字段待核实</span>') +
        '<button class="btn btn-ghost" type="button" id="detail-close">关闭</button>' +
      "</div>" +
      '<div class="detail-meta text-small muted">' + esc(c.note || "") + "</div>" +
      (c.sourceUrl
        ? '<div class="detail-meta text-small">信息来源：<a class="source-link" href="' + esc(c.sourceUrl) + '" target="_blank" rel="noopener">' + esc(c.sourceLabel || c.source || "官方来源") + "</a></div>"
        : "") +
      '<div class="row">' +
        '<a class="btn" href="' + esc(c.careerUrl) + '" target="_blank" rel="noopener">官方校招页</a>' +
        '<a class="btn btn-primary" href="' + esc(c.applyUrl) + '" target="_blank" rel="noopener">去投递</a>' +
      "</div>" +
      '<div class="row detail-meta">' +
        "<div><b>批次</b><div class=\"text-small\">" + esc(c.batch) + " · " + fmtDate(c.startDate) + " 开启 · " + fmtDate(c.endDate) + " 截止</div></div>" +
        "<div><b>岗位方向</b><div class=\"text-small\">" + esc(c.positions.join(" / ")) + "</div></div>" +
      "</div>" +
      '<div class="detail-meta"><b>我的投递</b>' + progressHtml + "</div>" +
      '<div class="detail-meta"><b>相关面经/咨询</b>' + feedHtml + "</div>";
  }

  function showDetail(id) {
    var found = companyById(id);
    if (found) renderDetail(found);
  }

  function renderApplications() {
    var cols = $("#application-cols");
    var groups = {};
    STAGES.forEach(function (s) { groups[s] = []; });
    APPLICATIONS.forEach(function (app) {
      var st = stageOf(app);
      if (!groups[st]) groups[st] = [];
      groups[st].push(app);
    });
    cols.innerHTML = STAGES.map(function (stage) {
      var items = groups[stage];
      var cards = items.map(function (app) {
        var c = companyById(app.companyId);
        var ivCount = c ? interviewsFor(c.name).length : 0;
        var ivBtn = ivCount ? '<div class="row actions"><button class="btn btn-ghost btn-iv" type="button" data-iv-company="' + esc(c.name) + '">面经 ' + ivCount + "</button></div>" : "";
        return '<div class="kanban-card">' +
          '<div class="kanban-title">' + esc(app.companyName || (c && c.name) || "未知公司") + "</div>" +
          '<div class="text-small">' + esc(app.position) + "</div>" +
          '<div class="text-small muted">投递于 ' + fmtDate(app.appliedAt) + "</div>" +
          ivBtn +
          "</div>";
      }).join("");
      return '<div class="kanban-col"><h4>' + stage + "（" + items.length + "）</h4>" + (cards || '<div class="text-small muted">暂无</div>') + "</div>";
    }).join("");

    var summary = $("#app-summary");
    if (summary) {
      var total = APPLICATIONS.length;
      var active = APPLICATIONS.filter(function (a) {
        var s = stageOf(a);
        return s !== "Offer" && s !== "已挂";
      }).length;
      summary.textContent = "共 " + total + " 条投递 · 推进中 " + active + " · Offer " + groups["Offer"].length + " · 已结束 " + groups["已挂"].length;
    }

    var tbody = $("#application-table-rows");
    if (!tbody) return;
    tbody.innerHTML = APPLICATIONS.map(function (app) {
      var c = companyById(app.companyId);
      var key = appKey(app);
      var cur = stageOf(app);
      var o = progress[key];
      var ivCount = c ? interviewsFor(c.name).length : 0;
      var opts = ["已投递", "笔试", "面试", "Offer", "已挂"].map(function (s) {
        return '<option' + (cur === s ? " selected" : "") + ">" + s + "</option>";
      }).join("");
      return "<tr>" +
        "<td><b>" + esc(app.companyName || (c && c.name) || "未知公司") + "</b></td>" +
        "<td>" + esc(app.position) + "</td>" +
        "<td>" + (ivCount ? '<button class="btn btn-ghost btn-iv" type="button" data-iv-company="' + esc(c.name) + '">面经 ' + ivCount + "</button>" : '<span class="text-small muted">—</span>') + "</td>" +
        '<td class="hide-sm">' + fmtDate(app.appliedAt) + "</td>" +
        '<td><select class="select app-stage-select" data-key="' + esc(key) + '" aria-label="' + esc(app.position) + ' 的阶段">' + opts + "</select></td>" +
        '<td class="hide-sm">' + (o && o.updatedAt ? esc(o.updatedAt) : '<span class="text-small muted">默认</span>') + "</td>" +
        "</tr>";
    }).join("") || '<tr><td colspan="6" class="empty-cell">暂无投递记录</td></tr>';
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

  function renderSources() {
    var wrap = $("#sources-list");
    if (!SOURCES.length) {
      wrap.innerHTML = '<div class="empty-box">暂无信息源，后续补充</div>';
      return;
    }
    var groups = [];
    SOURCES.forEach(function (s) {
      var g = null;
      groups.forEach(function (item) { if (item.name === s.group) g = item; });
      if (!g) {
        g = { name: s.group, items: [] };
        groups.push(g);
      }
      g.items.push(s);
    });
    var PRIORITY_CLASS = { "核心": "badge-ok", "参考": "badge-primary", "补充": "badge-muted" };
    wrap.innerHTML = groups.map(function (g) {
      return '<div class="panel source-group"><h4>' + esc(g.name) + "</h4><ul class=\"source-list\">" +
        g.items.map(function (s) {
          return "<li class=\"source-item\">" +
            "<div><b>" + esc(s.name) + "</b>" +
            ' <span class="badge ' + (PRIORITY_CLASS[s.priority] || "") + '">' + esc(s.priority) + "</span>" +
            ' <span class="badge">' + esc(s.platform) + "</span>" +
            '<div class="text-small muted">' + esc(s.note || "") + "</div></div>" +
            '<a class="btn btn-ghost" href="' + esc(s.url) + '" target="_blank" rel="noopener">打开</a>' +
            "</li>";
        }).join("") +
        "</ul></div>";
    }).join("");
  }

  function isUrl(s) {
    return /^https?:\/\//i.test(s || "");
  }

  function batchClass(b) {
    if (!b) return "";
    if (b.indexOf("秋招") !== -1) return "badge-primary";
    if (b.indexOf("提前批") !== -1) return "badge-purple";
    if (b.indexOf("春招") !== -1) return "badge-ok";
    return "";
  }

  function clueRowHtml(r) {
    var apply = isUrl(r.applyUrl)
      ? '<a class="btn btn-ghost" href="' + esc(r.applyUrl) + '" target="_blank" rel="noopener">投递</a>'
      : "";
    var announce = isUrl(r.announceUrl)
      ? '<a class="btn btn-ghost" href="' + esc(r.announceUrl) + '" target="_blank" rel="noopener">公告</a>'
      : "";
    var exam = "";
    if (r.exam && r.exam.indexOf("免笔试") !== -1) exam = '<span class="badge badge-ok">免笔试</span>';
    else if (r.exam && r.exam !== "/" && r.exam !== "未明确" && r.exam !== "待定") exam = '<span class="badge">' + esc(r.exam) + "</span>";
    return '<div class="clue-row">' +
      '<div class="row"><b>' + esc(r.company) + "</b>" +
      '<span class="badge ' + batchClass(r.batch) + '">' + esc(r.batch || "待定") + "</span>" +
      '<span class="badge">' + esc(r.industry || "待定") + "</span>" +
      exam +
      "</div>" +
      '<div class="text-small muted">岗位：' + esc(r.positions || "见公告") + "</div>" +
      '<div class="text-small muted">' + esc(r.locations || "地点待定") + " · " + esc(r.grad || "") + " · 开始 " + esc(r.startDate || "待定") + " · 截止 " + esc(r.endDate || "待定") + "</div>" +
      '<div class="row actions">' + apply + announce + "</div>" +
      "</div>";
  }

  var zhudiShown = 50;
  var zhudiCodesShown = 100;

  function renderZhudiFilters() {
    var industries = [];
    var batches = [];
    var noIntern = $("#zhudi-no-intern") && $("#zhudi-no-intern").checked;
    ZHUDI.rows.forEach(function (r) {
      if (r.industry && industries.indexOf(r.industry) === -1) industries.push(r.industry);
      if (r.batch && batches.indexOf(r.batch) === -1 && !(noIntern && isInternBatch(r.batch))) batches.push(r.batch);
    });
    industries.sort();
    batches.sort();
    $("#zhudi-industry").innerHTML = '<option value="">全部行业</option>' + industries.map(function (i) {
      return '<option value="' + esc(i) + '">' + esc(i) + "</option>";
    }).join("");
    $("#zhudi-batch").innerHTML = '<option value="">全部批次</option>' + batches.map(function (b) {
      return '<option value="' + esc(b) + '">' + esc(b) + "</option>";
    }).join("");
  }

  function renderZhudiCodes(q) {
    var codes = ZHUDI.codes.filter(function (c) {
      return !q || c.company.toLowerCase().indexOf(q) !== -1;
    });
    $("#zhudi-summary").textContent = "共 " + codes.length + " 个内推码";
    var slice = codes.slice(0, zhudiCodesShown);
    $("#zhudi-codes").innerHTML = slice.map(function (c) {
      return '<div class="clue-row code-row"><div class="row"><b>' + esc(c.company) + '</b><span class="badge badge-primary">' + esc(c.code) + "</span></div></div>";
    }).join("") + (codes.length > zhudiCodesShown
      ? '<button class="btn btn-block" type="button" id="zhudi-codes-more">加载更多（' + (codes.length - zhudiCodesShown) + "）</button>"
      : "");
  }

  function renderZhudi() {
    var view = "rows";
    $$("[data-zhudi-view]").forEach(function (b) {
      if (b.getAttribute("aria-selected") === "true") view = b.getAttribute("data-zhudi-view");
    });
    var q = ($("#zhudi-search").value || "").trim().toLowerCase();
    $("#zhudi-list").hidden = view !== "rows";
    $("#zhudi-codes").hidden = view !== "codes";
    if (view === "codes") {
      renderZhudiCodes(q);
      return;
    }
    var ind = $("#zhudi-industry").value;
    var bat = $("#zhudi-batch").value;
    var noIntern = $("#zhudi-no-intern") && $("#zhudi-no-intern").checked;
    var rows = ZHUDI.rows.filter(function (r) {
      if (q && (r.company + " " + r.positions + " " + r.industry).toLowerCase().indexOf(q) === -1) return false;
      if (ind && r.industry !== ind) return false;
      if (bat && r.batch !== bat) return false;
      if (noIntern && r.batch && (r.batch.indexOf("实习") !== -1 || r.batch.indexOf("训练营") !== -1)) return false;
      return true;
    });
    var noExam = rows.filter(function (r) { return r.exam && r.exam.indexOf("免笔试") !== -1; }).length;
    var autumn = rows.filter(function (r) { return r.batch && r.batch.indexOf("秋招") !== -1; }).length;
    $("#zhudi-summary").textContent = "共 " + rows.length + " 条" + (noIntern ? "（已过滤实习）" : "") + " · 秋招/提前批 " + autumn + " · 免笔试 " + noExam;
    var slice = rows.slice(0, zhudiShown);
    $("#zhudi-list").innerHTML = slice.map(clueRowHtml).join("") +
      (rows.length > zhudiShown
        ? '<button class="btn btn-block" type="button" id="zhudi-more">加载更多（' + (rows.length - zhudiShown) + "）</button>"
        : "");
  }

  function renderInterviewFilters() {
    var platforms = [];
    var cats = [];
    INTERVIEWS.items.forEach(function (i) {
      if (i.platform && platforms.indexOf(i.platform) === -1) platforms.push(i.platform);
      if (i.category && cats.indexOf(i.category) === -1) cats.push(i.category);
    });
    platforms.sort();
    cats.sort();
    $("#interview-platform").innerHTML = '<option value="">全部平台</option>' + platforms.map(function (p) {
      return '<option value="' + esc(p) + '">' + esc(p) + "</option>";
    }).join("");
    $("#interview-category").innerHTML = '<option value="">全部类型</option>' + cats.map(function (c) {
      return '<option value="' + esc(c) + '">' + esc(c) + "</option>";
    }).join("");
  }

  function interviewCardHtml(i) {
    var badges =
      '<span class="badge ' + (PLATFORM_CLASS[i.platform] || "") + '">' + esc(i.platform) + "</span>" +
      '<span class="badge">' + esc(i.category || "面经") + "</span>" +
      (i.company && i.company !== "通用" ? '<span class="badge">' + esc(i.company) + "</span>" : "");
    if (i.url) {
      return '<div class="clue-row">' +
        '<div class="row"><a class="feedback-title" href="' + esc(i.url) + '" target="_blank" rel="noopener">' + esc(i.title) + "</a>" + badges + "</div>" +
        '<div class="text-small muted">' + esc(i.summary || "") + (i.tags && i.tags.length ? " · 标签：" + esc(i.tags.join("、")) : "") + "</div></div>";
    }
    return '<details class="clue-row iv-item"><summary class="iv-summary">' +
      "<b>" + esc(i.title) + "</b>" + badges +
      "</summary><div class=\"clue-content\">" + esc(i.content || i.summary || "") + "</div></details>";
  }

  function renderInterviews() {
    var view = "items";
    $$("[data-interview-view]").forEach(function (b) {
      if (b.getAttribute("aria-selected") === "true") view = b.getAttribute("data-interview-view");
    });
    var q = ($("#interview-search").value || "").trim().toLowerCase();
    $("#interview-list").hidden = view !== "items";
    $("#interview-general").hidden = view !== "general";

    if (view === "general") {
      var qs = INTERVIEWS.generalQuestions || [];
      $("#interview-summary").textContent = "共 " + qs.length + " 个通用问题（朱迪版）";
      $("#interview-general").innerHTML = '<div class="panel">' + qs.map(function (q, idx) {
        return '<details class="qa-item"><summary class="iv-summary"><b>' + (idx + 1) + ". " + esc(q.question) + '</b><span class="badge">' + esc(q.section) + "</span></summary>" +
          '<div class="clue-content">' +
          (q.intent ? "<p><b>考查意图：</b>" + esc(q.intent) + "</p>" : "") +
          (q.keypoints ? "<p><b>回答思路：</b>" + esc(q.keypoints) + "</p>" : "") +
          (q.answer ? "<p><b>参考答案：</b>" + esc(q.answer) + "</p>" : "") +
          "</div></details>";
      }).join("") + "</div>";
      return;
    }

    var pf = $("#interview-platform").value;
    var cat = $("#interview-category").value;
    var items = INTERVIEWS.items.filter(function (i) {
      if (q && (i.company + " " + i.title + " " + i.platform + " " + (i.tags || []).join(" ")).toLowerCase().indexOf(q) === -1) return false;
      if (pf && i.platform !== pf) return false;
      if (cat && i.category !== cat) return false;
      return true;
    });
    var mians = items.filter(function (i) { return i.category === "面经"; }).length;
    var neitui = items.filter(function (i) { return i.category === "内推"; }).length;
    $("#interview-summary").textContent = "共 " + items.length + " 条 · 面经 " + mians + " · 内推 " + neitui;
    $("#interview-list").innerHTML = items.map(interviewCardHtml).join("") || '<div class="empty-box">暂无匹配内容</div>';
  }

  function renderGuoqi() {
    var q = ($("#guoqi-search").value || "").trim().toLowerCase();
    var items = GUOQI.items.filter(function (i) {
      return !q || i.name.toLowerCase().indexOf(q) !== -1;
    });
    $("#guoqi-list").innerHTML =
      '<div class="text-small muted" style="margin-bottom:8px">共 ' + items.length + " 家单位</div>" +
      items.map(function (i) {
        var link = isUrl(i.url)
          ? '<a class="btn btn-ghost" href="' + esc(i.url) + '" target="_blank" rel="noopener">官网</a>'
          : '<span class="badge badge-muted">无链接</span>';
        return '<div class="clue-row"><div class="row"><b>' + esc(i.name) + "</b>" + link + "</div></div>";
      }).join("") ||
      '<div class="empty-box">没有匹配的单位</div>';
  }

  function openInterviewModal(companyName) {
    var items = (INTERVIEWS.items || []).filter(function (i) {
      return i.company !== "通用" && (companyName.indexOf(i.company) !== -1 || i.company.indexOf(companyName) !== -1);
    });
    $("#iv-modal-title").textContent = companyName + " · 面经库（" + items.length + "）";
    $("#iv-modal-list").innerHTML = items.length
      ? items.map(interviewCardHtml).join("")
      : '<div class="empty-box">暂无该公司的面经</div>';
    $("#iv-modal").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeInterviewModal() {
    $("#iv-modal").hidden = true;
    document.body.style.overflow = "";
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
    renderSources();
    $("#zhudi-date").textContent = ZHUDI.updatedAt || "";
    renderZhudiFilters();
    renderZhudi();
    renderInterviewFilters();
    renderInterviews();
    renderGuoqi();
    renderFeedback();
    renderReview();

    ["search", "filter-industry", "filter-position", "filter-batch", "filter-status"].forEach(function (id) {
      var el = $("#" + id);
      el.addEventListener("input", function () { overviewShown = 30; renderTable(); });
      el.addEventListener("change", function () { overviewShown = 30; renderTable(); });
    });

    $("#overview-no-intern").addEventListener("change", function () {
      overviewShown = 30;
      renderFilters();
      renderTable();
    });
    $("#overview-hide-applied").addEventListener("change", function () {
      overviewShown = 30;
      renderTable();
    });

    $$("[data-view-btn]").forEach(function (b) {
      b.addEventListener("click", function () { switchView(b.getAttribute("data-view-btn")); });
    });

    $("#company-rows").addEventListener("click", function (e) {
      if (e.target && e.target.id === "table-more") {
        overviewShown += 30;
        renderTable();
        return;
      }
      var ivBtn = e.target && e.target.closest ? e.target.closest("button.btn-iv") : null;
      if (ivBtn) {
        openInterviewModal(ivBtn.getAttribute("data-iv-company"));
        return;
      }
      var btn = e.target && e.target.closest ? e.target.closest("button[data-detail]") : null;
      if (btn) showDetail(btn.getAttribute("data-detail"));
    });

    $$("[data-app-view]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = btn.getAttribute("data-app-view");
        $$("[data-app-view]").forEach(function (b) {
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        $("#application-cols").hidden = v !== "kanban";
        $("#application-table").hidden = v !== "table";
      });
    });

    $("#application-table-rows").addEventListener("change", function (e) {
      var sel = e.target && e.target.closest ? e.target.closest("select.app-stage-select") : null;
      if (!sel) return;
      var key = sel.getAttribute("data-key");
      progress[key] = { stage: sel.value, updatedAt: todayStr() };
      saveProgress();
      renderApplications();
    });

    $("#application-cols").addEventListener("click", function (e) {
      var ivBtn = e.target && e.target.closest ? e.target.closest("button.btn-iv") : null;
      if (ivBtn) openInterviewModal(ivBtn.getAttribute("data-iv-company"));
    });

    $("#application-table-rows").addEventListener("click", function (e) {
      var ivBtn = e.target && e.target.closest ? e.target.closest("button.btn-iv") : null;
      if (ivBtn) openInterviewModal(ivBtn.getAttribute("data-iv-company"));
    });

    $("#detail").addEventListener("click", function (e) {
      if (e.target && e.target.id === "detail-close") {
        $("#detail").hidden = true;
        return;
      }
      var btn = e.target && e.target.closest ? e.target.closest("button[data-progress-action]") : null;
      if (!btn || !currentCompany) return;
      var key = btn.getAttribute("data-key");
      var action = btn.getAttribute("data-progress-action");
      if (action === "save") {
        var select = btn.parentElement.querySelector(".progress-select");
        progress[key] = { stage: select.value, updatedAt: todayStr() };
      } else {
        delete progress[key];
      }
      saveProgress();
      renderApplications();
      renderDetail(currentCompany);
    });

    $("#review-list").addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("button.review-action") : null;
      if (!btn) return;
      btn.textContent = btn.getAttribute("data-action") === "confirm" ? "已确认（本地）" : "已忽略（本地）";
      btn.disabled = true;
    });

    $("#zhudi-search").addEventListener("input", function () {
      zhudiShown = 50;
      zhudiCodesShown = 100;
      renderZhudi();
    });
    $("#zhudi-industry").addEventListener("change", function () {
      zhudiShown = 50;
      renderZhudi();
    });
    $("#zhudi-batch").addEventListener("change", function () {
      zhudiShown = 50;
      renderZhudi();
    });
    $("#zhudi-no-intern").addEventListener("change", function () {
      zhudiShown = 50;
      renderZhudiFilters();
      renderZhudi();
    });
    $$("[data-zhudi-view]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$("[data-zhudi-view]").forEach(function (b) {
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        zhudiShown = 50;
        zhudiCodesShown = 100;
        renderZhudi();
      });
    });
    $("#zhudi-list").addEventListener("click", function (e) {
      if (e.target && e.target.id === "zhudi-more") {
        zhudiShown += 50;
        renderZhudi();
      }
    });
    $("#zhudi-codes").addEventListener("click", function (e) {
      if (e.target && e.target.id === "zhudi-codes-more") {
        zhudiCodesShown += 100;
        renderZhudi();
      }
    });

    $("#interview-search").addEventListener("input", renderInterviews);
    $("#interview-platform").addEventListener("change", renderInterviews);
    $("#interview-category").addEventListener("change", renderInterviews);
    $$("[data-interview-view]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$("[data-interview-view]").forEach(function (b) {
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        renderInterviews();
      });
    });
    $("#guoqi-search").addEventListener("input", renderGuoqi);

    $("#iv-modal-close").addEventListener("click", closeInterviewModal);
    $("#iv-modal").addEventListener("click", function (e) {
      if (e.target && e.target.hasAttribute && e.target.hasAttribute("data-iv-close")) closeInterviewModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && $("#iv-modal") && !$("#iv-modal").hidden) closeInterviewModal();
    });
  }

  init();
})();
