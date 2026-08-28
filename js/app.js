(function () {
  "use strict";

  var DATA = window.QIUZHAO_DATA || { companies: [], feedback: [], reviewQueue: [] };
  var APPLY_RULES = window.QIUZHAO_APPLY_RULES || {};
  var APPLICATIONS = window.QIUZHAO_APPLICATIONS || [];
  var SOURCES = window.QIUZHAO_SOURCES || [];
  var ZHUDI = window.QIUZHAO_ZHUDI || { rows: [], codes: [] };
  var INTERVIEWS = window.QIUZHAO_INTERVIEWS || { items: [], generalQuestions: [] };
  var GUOQI = window.QIUZHAO_GUOQI || { items: [] };
  var AI_TIPS = window.QIUZHAO_AI_TIPS || { profile: "", zhudiNotes: [], generalTips: [], companyTips: {} };
  var SCHEDULE = window.QIUZHAO_SCHEDULE || { updatedAt: "", events: [] };
  var LS_KEY = "qiuzhao-radar-progress-v1";
  var edgeOpen = true;
  try { edgeOpen = localStorage.getItem("qiuzhao-edge-open") !== "0"; } catch (e) { /* ignore */ }

  function extHref(url) {
    if (!edgeOpen) return url;
    if (/Edg\//.test(navigator.userAgent || "")) return url;
    return "microsoft-edge:" + url;
  }
  var POSITION_OPTIONS = ["人力资源", "游戏运营", "游戏发行", "游戏营销", "用户研究", "游戏策划", "市场", "运营", "职能"];
  var POSITION_PRIORITY = ["人力资源", "游戏运营", "游戏发行", "游戏营销", "用户研究", "游戏策划"];
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

  function batchBadgeHtml(batch) {
    var cls = batch === "提前批" ? " badge-early" : (batch === "正式批" ? " badge-official" : (batch === "补录" ? " badge-supply" : ""));
    return '<span class="badge' + cls + '">' + esc(batch || "待定") + "</span>";
  }

  function statusBadgeHtml(row) {
    var cls = {
      "进行中": "badge-live",
      "即将截止": "badge-urgent",
      "即将开启": "badge-soon",
      "未开始": "badge-wait",
      "已结束": "badge-done",
      "待核实": "badge-muted badge-dashed"
    }[row.status] || "";
    return '<span class="badge ' + cls + '">' + esc(row.status) + "</span>";
  }

  function progressBarHtml(row) {
    if (!row.startDate || !row.endDate) return "";
    var s = new Date(row.startDate + "T00:00:00").getTime();
    var e = new Date(row.endDate + "T00:00:00").getTime();
    var now = new Date().getTime();
    if (e <= s) return "";
    var pct = Math.max(0, Math.min(100, (now - s) / (e - s) * 100));
    var cls = pct >= 100 ? "bar-done" : (pct >= 90 ? "bar-urgent" : (pct >= 75 ? "bar-soon" : "bar-ok"));
    return '<span class="deadline-bar"><i class="' + cls + '" style="width:' + pct.toFixed(0) + '%"></i></span>';
  }

  function startCellHtml(row) {
    var d = daysUntil(row.startDate);
    var chip = "";
    if (d !== null && d >= 0 && d <= 3) {
      chip = d === 0 ? '<span class="chip chip-hot">今日开启</span>' : '<span class="chip chip-soon">' + d + " 天后开启</span>";
    }
    return fmtDate(row.startDate) + chip;
  }

  function deadlineCellHtml(row) {
    var d = daysUntil(row.endDate);
    var chip = "";
    var bar = "";
    if (d !== null) {
      if (d < 0) chip = '<span class="chip chip-done">已截止</span>';
      else if (d <= 3) chip = '<span class="chip chip-urgent">剩 ' + d + " 天</span>";
      else if (d <= 7) chip = '<span class="chip chip-soon">剩 ' + d + " 天</span>";
      else chip = '<span class="chip chip-ok">剩 ' + d + " 天</span>";
      bar = progressBarHtml(row);
    }
    return fmtDate(row.endDate) + chip + bar;
  }

  function applyChanceCellHtml(row) {
    var rule = APPLY_RULES[row.id];
    if (!rule) return "";
    var applied = applicationsForRow(row).length;
    var title = rule.note ? ' title="' + esc(rule.note) + '"' : "";
    var chips = [];
    if (rule.unlimited) {
      chips.push('<span class="chip chip-ok">无上限</span>');
    } else if (rule.limit === "" || rule.limit == null) {
      chips.push('<span class="chip chip-muted">以官网为准</span>');
    } else {
      var left = Math.max(0, rule.limit - applied);
      if (rule.perScope && applied >= rule.limit) {
        chips.push('<span class="chip chip-soon">按项目/集团计</span>');
      } else {
        var cls = left <= 0 ? "chip-done" : (left <= 1 ? "chip-urgent" : "chip-ok");
        chips.push('<span class="chip ' + cls + '">剩 ' + left + " 次</span>");
      }
    }
    if (applied) chips.push('<span class="text-small muted">已投 ' + applied + "</span>");
    return '<span' + title + ">" + chips.join(" ") + "</span>";
  }

  function companyById(id) {
    var found = null;
    (DATA.companies || []).forEach(function (c) { if (c.id === id) found = c; });
    return found;
  }

  function progressUrlFor(app, c) {
    if (app && PROGRESS_URL_OVERRIDES[app.companyName]) return PROGRESS_URL_OVERRIDES[app.companyName];
    if (app && PROGRESS_URL_OVERRIDES[app.companyId]) return PROGRESS_URL_OVERRIDES[app.companyId];
    return c ? (c.progressUrl || c.careerUrl || "") : "";
  }

  var TARGET_KEYWORDS = ["人力资源", "HR", "游戏运营", "游戏发行", "游戏营销", "用户研究", "游戏策划", "游戏市场", "游戏生态", "游戏用户", "游戏社区", "游戏内容", "游戏商业化"];
  var BROAD_POSITION_KEYWORDS = ["运营", "发行", "营销", "市场", "策划", "人力", "HR", "用研", "用户研究", "品牌", "广告", "渠道", "社区", "内容", "商业化", "本地化", "GS", "GM"];
  var COMPANY_NAME_ALIASES = { "G社": ["Garena"] };
  var PROGRESS_URL_OVERRIDES = {
    "G社": "https://app.mokahr.com/candidate/applications/deliver-query/garena",
    "理想": "https://www.lixiang.com/employ/campus/list.html",
    "掌趣": "https://app.mokahr.com/candidate/applications/deliver-query/ourpalm",
    "作业帮": "https://app.mokahr.com/candidate/applications/deliver-query/zuoyebang",
    "迅雷": "https://campus.xunlei.com/"
  };

  function positionRank(row) {
    var s = row.positions || "";
    for (var i = 0; i < POSITION_PRIORITY.length; i++) {
      if (s.indexOf(POSITION_PRIORITY[i]) !== -1) return i;
    }
    if (s.indexOf("HR") !== -1) return 0;
    return POSITION_PRIORITY.length;
  }

  function isInternBatch(b) {
    return b && (b.indexOf("实习") !== -1 || b.indexOf("训练营") !== -1);
  }

  function zhuDiRowHit(r) {
    if (!r.positions) return false;
    if (TARGET_KEYWORDS.some(function (k) { return r.positions.indexOf(k) !== -1; })) return true;
    var ind = r.industry || "";
    if (ind.indexOf("游戏") === -1 && ind.indexOf("互联网") === -1) return false;
    return BROAD_POSITION_KEYWORDS.some(function (k) { return r.positions.indexOf(k) !== -1; });
  }

  function overviewNoIntern() {
    var el = $("#overview-no-intern");
    return !el || el.checked;
  }

  function applicationsForRow(row) {
    if (row._clue) {
      return APPLICATIONS.filter(function (a) {
        var aliases = COMPANY_NAME_ALIASES[a.companyName] || [];
        return a.companyName.indexOf(row.name) !== -1 || row.name.indexOf(a.companyName) !== -1 ||
          aliases.some(function (n) { return n.indexOf(row.name) !== -1 || row.name.indexOf(n) !== -1; });
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
      var hit = zhuDiRowHit(r);
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
  var quickFilter = null;

  function activeStatuses() {
    return ["进行中", "即将截止", "即将开启"];
  }

  function setQuickFilter(key) {
    if (key === "applied") {
      switchView("applications");
      return;
    }
    quickFilter = quickFilter === key ? null : key;
    overviewShown = 30;
    updateQuickUI();
    renderTable();
  }

  function clearQuickFilter() {
    if (quickFilter) {
      quickFilter = null;
      updateQuickUI();
    }
  }

  function updateQuickUI() {
    $$(".stat").forEach(function (el) {
      var on = el.getAttribute("data-quick") === quickFilter;
      el.classList.toggle("active", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
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

  function appKey(app) {
    return app.companyId + "::" + app.position;
  }

  function stageOf(app) {
    var o = progress[appKey(app)];
    return o && o.stage ? o.stage : (app.stage || "已投递");
  }

  var currentCompany = null;

  function renderAlert() {
    var el = $("#overview-alert");
    if (!el) return;
    var items = [];
    (DATA.companies || []).forEach(function (c) {
      var ds = daysUntil(c.startDate);
      if (ds !== null && ds >= 0 && ds <= 7) {
        var openLbl = ds === 0 ? "今天开启" : (ds === 1 ? "明天开启" : ds + " 天后开启");
        items.push({ sort: ds, html: "<b>" + esc(c.name) + "</b> " + fmtDate(c.startDate) + " " + openLbl });
      }
      var de = daysUntil(c.endDate);
      if (de !== null && de >= 0 && de <= 14) {
        var endLbl = de === 0 ? "今天截止" : (de === 1 ? "明天截止" : "剩 " + de + " 天截止");
        items.push({ sort: de + 100, html: "<b>" + esc(c.name) + "</b> " + fmtDate(c.endDate) + " " + endLbl });
      }
    });
    items.sort(function (a, b) { return a.sort - b.sort; });
    if (!items.length) { el.hidden = true; return; }
    el.innerHTML = '<span class="alert-ico" aria-hidden="true">⏰</span><span class="alert-title">最近节点</span>' +
      items.slice(0, 4).map(function (i) { return '<span class="alert-item">' + i.html + "</span>"; }).join("");
    el.hidden = false;
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
    $("#stat-applied").textContent = APPLICATIONS.length;
    renderAlert();
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
    detachDetail();
    currentCompany = null;
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
    if (quickFilter === "active") {
      rows = rows.filter(function (r) { return !r._clue && activeStatuses().indexOf(r.status) !== -1; });
    } else if (quickFilter === "expiring") {
      rows = rows.filter(function (r) { return r.status === "即将截止"; });
    } else if (quickFilter === "early") {
      rows = rows.filter(function (r) { return !r._clue && r.batch === "提前批" && activeStatuses().indexOf(r.status) !== -1; });
    }

    var tbody = $("#company-rows");
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-cell">没有符合条件的公司，试试放宽筛选</td></tr>';
      return;
    }
    rows.sort(function (a, b) {
      var aa = applicationsForRow(a).length > 0 ? 1 : 0;
      var ab = applicationsForRow(b).length > 0 ? 1 : 0;
      if (aa !== ab) return ab - aa;
      var ra = positionRank(a);
      var rb = positionRank(b);
      if (ra !== rb) return ra - rb;
      var ia = interviewsFor(a.name).length > 0 ? 1 : 0;
      var ib = interviewsFor(b.name).length > 0 ? 1 : 0;
      return ib - ia;
    });
    var slice = rows.slice(0, overviewShown);
    tbody.innerHTML = slice.map(function (r) {
      var apps = applicationsForRow(r);
      var appliedBadge = apps.length ? ' <span class="badge badge-ok">已投</span>' : "";
      var rejectedApps = apps.filter(function (a) { return stageOf(a) === "已挂"; }).length;
      if (rejectedApps) appliedBadge += ' <span class="badge badge-red">已挂 ' + rejectedApps + "</span>";
      var sourceBadge = r._clue
        ? ' <span class="badge badge-muted">朱迪线索</span>'
        : (r.verified ? "" : ' <span class="badge badge-muted">待核实</span>');
      var appliedNote = apps.length
        ? '<div class="text-small applied-note">已投：' + esc(apps.map(function (a) {
            return a.position + (stageOf(a) === "已挂" ? "（已挂）" : "");
          }).join("、")) + "</div>"
        : "";
      var batchBadge = batchBadgeHtml(r.batch);
      var ivCount = interviewsFor(r.name).length;
      var ivBtn = ivCount ? '<button class="btn btn-ghost btn-iv" type="button" data-iv-company="' + esc(r.name) + '">面经 ' + ivCount + "</button>" : "";
      var links;
      if (r._clue) {
        links = (isUrl(r.applyUrl) ? '<a class="btn btn-ghost" href="' + esc(extHref(r.applyUrl)) + '" target="_blank" rel="noopener">投递</a>' : "") +
          (isUrl(r.announceUrl) && r.announceUrl !== r.applyUrl ? '<a class="btn btn-ghost" href="' + esc(extHref(r.announceUrl)) + '" target="_blank" rel="noopener">公告</a>' : "") +
          ivBtn;
      } else {
        links = '<a class="btn btn-ghost" href="' + esc(extHref(r.applyUrl)) + '" target="_blank" rel="noopener">投递</a>' +
          '<button class="btn btn-ghost" type="button" data-detail="' + esc(r.id) + '">详情</button>' +
          ivBtn;
      }
      var rowCls = (apps.length ? " row-applied" : "") + (r._clue ? " row-clue" : "");
      return '<tr class="' + rowCls + '">' +
        "<td><b>" + esc(r.name) + "</b>" + appliedBadge + sourceBadge + appliedNote + "</td>" +
        "<td>" + esc(r.positions) + "</td>" +
        '<td class="hide-sm">' + applyChanceCellHtml(r) + "</td>" +
        "<td>" + batchBadge + "</td>" +
        '<td class="hide-sm">' + startCellHtml(r) + "</td>" +
        '<td class="hide-sm">' + deadlineCellHtml(r) + "</td>" +
        "<td>" + statusBadgeHtml(r) + "</td>" +
        '<td class="actions-cell">' + links + "</td>" +
        "</tr>";
    }).join("");
    var more = $("#overview-more");
    more.innerHTML = rows.length > overviewShown
      ? '<button class="btn btn-block" type="button" id="table-more">加载更多（' + (rows.length - overviewShown) + "）</button>"
      : "";
  }

  function feedbackFor(companyName) {
    return (DATA.feedback || []).filter(function (f) { return f.company === companyName; });
  }

  function interviewsFor(companyName) {
    return (INTERVIEWS.items || []).filter(function (i) {
      return i.company !== "通用" && (companyName.indexOf(i.company) !== -1 || i.company.indexOf(companyName) !== -1);
    });
  }

  function companyTipFor(name) {
    if (AI_TIPS.companyTips && AI_TIPS.companyTips[name]) return AI_TIPS.companyTips[name];
    var key = null;
    Object.keys(AI_TIPS.companyTips || {}).forEach(function (k) {
      if (!key && (name.indexOf(k) !== -1 || k.indexOf(name) !== -1)) key = k;
    });
    if (key) return AI_TIPS.companyTips[key];
    return "这家公司暂未定制提示。通用准备：1) 打开官方校招页看 JD 和业务；2) 准备一个和目标岗位相关的项目/实习案例（STAR 结构）；3) 了解公司核心产品与近半年动态；4) 反问环节准备 2-3 个问题。";
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  function copyText(text, label) {
    function done() {
      var toast = $("#toast");
      toast.textContent = label + "已复制，可粘贴到任意 AI 对话";
      toast.hidden = false;
      clearTimeout(copyText._timer);
      copyText._timer = setTimeout(function () { toast.hidden = true; }, 2200);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else {
      fallbackCopy(text);
      done();
    }
  }

  function detachDetail() {
    var panel = $("#detail");
    if (!panel) return;
    var tr = panel.closest("tr.detail-tr");
    if (tr) {
      panel.hidden = true;
      var tableWrap = document.querySelector(".table-wrap");
      if (tableWrap) tableWrap.insertAdjacentElement("afterend", panel);
      tr.remove();
    } else {
      panel.hidden = true;
    }
  }

  function renderDetail(c) {
    currentCompany = c;
    var st = statusOf(c);
    var panel = $("#detail");
    detachDetail();
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

    var appliedCount = APPLICATIONS.filter(function (a) { return a.companyId === c.id; }).length;
    var rule = APPLY_RULES[c.id];
    var ruleHtml;
    if (rule) {
      var leftText = rule.unlimited
        ? "投递次数无上限"
        : (rule.limit === "" || rule.limit == null)
          ? "官网未明确，投递前以官网为准"
        : (rule.perScope && appliedCount >= rule.limit
            ? "上限按集团/项目分别计算，详情见规则"
            : "本轮剩余 <b>" + Math.max(0, rule.limit - appliedCount) + "</b> 次");
      ruleHtml =
        '<div class="detail-rule">' +
          "<b>投递次数与规则</b>" +
          '<div class="rule-note">' + esc(rule.note) + "</div>" +
          '<div class="text-small">你已投 <b>' + appliedCount + "</b> 条 · " + leftText + "</div>" +
          (rule.sourceUrl
            ? '<div class="text-small">来源：<a class="source-link" href="' + esc(extHref(rule.sourceUrl)) + '" target="_blank" rel="noopener">' + esc(rule.sourceLabel || "官方来源") + "</a></div>"
            : "") +
          (rule.verified ? '<span class="badge badge-ok">官方已核实</span>' : "") +
        "</div>";
    } else {
      ruleHtml =
        '<div class="detail-rule">' +
          "<b>投递次数与规则</b>" +
          '<div class="text-small muted">官网暂未明确公布每人可投递次数，投递前请以官网为准</div>' +
          '<div class="text-small">来源：<a class="source-link" href="' + esc(extHref(c.careerUrl)) + '" target="_blank" rel="noopener">' + esc(c.sourceLabel || c.careerUrl) + "</a></div>" +
        "</div>";
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
        ? '<div class="detail-meta text-small">信息来源：<a class="source-link" href="' + esc(extHref(c.sourceUrl)) + '" target="_blank" rel="noopener">' + esc(c.sourceLabel || c.source || "官方来源") + "</a></div>"
        : "") +
      '<div class="row">' +
        '<a class="btn" href="' + esc(extHref(c.careerUrl)) + '" target="_blank" rel="noopener">官方校招页</a>' +
        '<a class="btn btn-primary" href="' + esc(extHref(c.applyUrl)) + '" target="_blank" rel="noopener">去投递</a>' +
      "</div>" +
      '<div class="row detail-meta">' +
        "<div><b>批次</b><div class=\"text-small\">" + esc(c.batch) + " · " + fmtDate(c.startDate) + " 开启 · " + fmtDate(c.endDate) + " 截止</div></div>" +
        "<div><b>岗位方向</b><div class=\"text-small\">" + esc(c.positions.join(" / ")) + "</div></div>" +
      "</div>" +
      ruleHtml +
      '<div class="detail-meta"><b>我的投递</b>' + progressHtml + "</div>" +
      '<div class="detail-meta"><b>相关面经/咨询</b>' + feedHtml + "</div>";

    var tbody = $("#company-rows");
    var targetRow = null;
    tbody.querySelectorAll("button[data-detail]").forEach(function (btn) {
      if (btn.getAttribute("data-detail") === c.id) targetRow = btn.closest("tr");
    });
    if (!targetRow) {
      panel.hidden = true;
      return;
    }
    var tr = document.createElement("tr");
    tr.className = "detail-tr";
    var td = document.createElement("td");
    td.colSpan = 8;
    td.appendChild(panel);
    tr.appendChild(td);
    targetRow.insertAdjacentElement("afterend", tr);
  }

  function showDetail(id) {
    var found = companyById(id);
    if (!found) return;
    var openTr = $("#company-rows").querySelector("tr.detail-tr");
    if (openTr && currentCompany && currentCompany.id === id) {
      detachDetail();
      currentCompany = null;
      return;
    }
    renderDetail(found);
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
        var key = appKey(app);
        var cur = stageOf(app);
        var opts = STAGES.map(function (s) {
          return '<option' + (cur === s ? " selected" : "") + ">" + s + "</option>";
        }).join("");
        var ivBtn = ivCount ? '<button class="btn btn-ghost btn-iv" type="button" data-iv-company="' + esc(c.name) + '">面经 ' + ivCount + "</button>" : "";
        var progUrl = progressUrlFor(app, c);
        var progBtn = progUrl
          ? '<a class="btn btn-ghost app-progress-link" href="' + esc(extHref(progUrl)) + '" target="_blank" rel="noopener" title="登录官网后进入「投递记录/我的投递」查看进度">官网查进度</a>'
          : "";
        return '<div class="kanban-card stage-' + esc(cur) + (cur === "已挂" ? " card-rejected" : "") + '">' +
          '<div class="kanban-top">' +
            '<span class="kanban-title">' + esc(app.companyName || (c && c.name) || "未知公司") + "</span>" +
            '<span class="badge ' + (cur === "已挂" ? "badge-red" : "badge-muted") + '">' + (cur === "已挂" ? "已挂" : esc(c ? c.batch : "")) + "</span>" +
          "</div>" +
          '<div class="kanban-pos">' + esc(app.position) + "</div>" +
          '<div class="text-small muted">投递于 ' + fmtDate(app.appliedAt) + "</div>" +
          '<div class="kanban-actions">' +
            '<select class="select app-stage-select" data-key="' + esc(key) + '" aria-label="' + esc(app.position) + ' 的阶段">' + opts + "</select>" +
            ivBtn +
            progBtn +
          "</div>" +
          "</div>";
      }).join("");
      return '<div class="kanban-col"><h4 class="kanban-col-title' + (stage === "已挂" ? " stage-rejected" : "") + '">' + stage + "（" + items.length + "）</h4>" + (cards || '<div class="text-small muted">暂无</div>') + "</div>";
    }).join("");

    var summary = $("#app-summary");
    if (summary) {
      var total = APPLICATIONS.length;
      var active = APPLICATIONS.filter(function (a) {
        var s = stageOf(a);
        return s !== "Offer" && s !== "已挂";
      }).length;
      summary.innerHTML = "共 " + total + " 条投递 · 推进中 " + active + " · Offer " + groups["Offer"].length +
        ' · <span class="rejected-sum">已挂 ' + groups["已挂"].length + "</span>" +
        '<div class="text-small muted">点「官网查进度」直达公司官网，登录后进入「投递记录 / 我的投递」查看实时状态</div>';
    }

    var tbody = $("#application-table-rows");
    if (!tbody) return;
    tbody.innerHTML = APPLICATIONS.map(function (app) {
      var c = companyById(app.companyId);
      var key = appKey(app);
      var cur = stageOf(app);
      var o = progress[key];
      var ivCount = c ? interviewsFor(c.name).length : 0;
      var progUrl = progressUrlFor(app, c);
      var progCell = progUrl
        ? '<a class="btn btn-ghost app-progress-link" href="' + esc(extHref(progUrl)) + '" target="_blank" rel="noopener">官网查进度</a>'
        : '<span class="text-small muted">—</span>';
      var opts = ["已投递", "笔试", "面试", "Offer", "已挂"].map(function (s) {
        return '<option' + (cur === s ? " selected" : "") + ">" + s + "</option>";
      }).join("");
      return '<tr class="' + (cur === "已挂" ? "app-row-rejected" : "") + '">' +
        "<td><b>" + esc(app.companyName || (c && c.name) || "未知公司") + "</b></td>" +
        "<td>" + esc(app.position) + "</td>" +
        "<td>" + (ivCount ? '<button class="btn btn-ghost btn-iv" type="button" data-iv-company="' + esc(c.name) + '">面经 ' + ivCount + "</button>" : '<span class="text-small muted">—</span>') + "</td>" +
        '<td class="hide-sm">' + progCell + "</td>" +
        '<td class="hide-sm">' + fmtDate(app.appliedAt) + "</td>" +
        '<td><select class="select app-stage-select" data-key="' + esc(key) + '" aria-label="' + esc(app.position) + ' 的阶段">' + opts + "</select></td>" +
        '<td class="hide-sm">' + (o && o.updatedAt ? esc(o.updatedAt) : '<span class="text-small muted">默认</span>') + "</td>" +
        "</tr>";
    }).join("") || '<tr><td colspan="7" class="empty-cell">暂无投递记录</td></tr>';
  }

  function weekdayCn(dateStr) {
    var d = new Date(String(dateStr) + "T00:00:00");
    return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()] || "";
  }

  function scheduleTypeClass(type) {
    var t = String(type || "");
    if (t.indexOf("笔试") > -1) return "badge-warn";
    if (t.indexOf("测评") > -1) return "badge-blue";
    if (t.indexOf("面") > -1) return "badge-primary";
    return "badge-muted";
  }

  function renderScheduleTimeline() {
    var wrap = $("#application-timeline");
    if (!wrap) return;
    var events = (SCHEDULE.events || []).slice().sort(function (a, b) {
      return (a.date + " " + (a.time || "")).localeCompare(b.date + " " + (b.time || ""));
    });
    if (!events.length) {
      wrap.innerHTML =
        '<div class="empty-box timeline-empty">' +
          '<div class="timeline-empty-title">还没有笔试 / 面试安排</div>' +
          '<div class="text-small muted">收到笔试、面试或测评通知后，把时间发给我（或发「时间线数据」表格），我会同步到这里</div>' +
        "</div>";
      return;
    }
    var today = todayStr();
    var groups = {};
    events.forEach(function (e) {
      (groups[e.date] = groups[e.date] || []).push(e);
    });
    var html = Object.keys(groups).sort().map(function (date) {
      var diff = daysUntil(date);
      var past = diff !== null && diff < 0;
      var flag = diff === 0
        ? '<span class="timeline-flag flag-today">今天</span>'
        : diff === 1
          ? '<span class="timeline-flag flag-soon">明天</span>'
          : diff !== null && diff > 1 && diff <= 7
            ? '<span class="timeline-flag flag-soon">' + diff + "天后</span>"
            : past
              ? '<span class="timeline-flag flag-past">' + Math.abs(diff) + "天前</span>"
              : "";
      var items = groups[date].map(function (e) {
        var st = e.status || "待参加";
        var stCls = st === "已完成" || st === "已结束" ? "badge-done" : "badge-wait";
        return '<div class="timeline-item' + (past ? " is-past" : "") + '">' +
          '<div class="timeline-item-head">' +
            '<span class="badge ' + scheduleTypeClass(e.type) + '">' + esc(e.type) + "</span>" +
            "<b>" + esc(e.company) + "</b>" +
            (e.position ? '<span class="muted text-small">' + esc(e.position) + "</span>" : "") +
            '<span class="badge ' + stCls + '">' + esc(st) + "</span>" +
          "</div>" +
          (e.time || e.location
            ? '<div class="timeline-item-meta">' +
              (e.time ? "<span>⏰ " + esc(e.time) + "</span>" : "") +
              (e.location ? "<span>📍 " + esc(e.location) + "</span>" : "") +
            "</div>"
            : "") +
          (e.note ? '<div class="text-small muted timeline-item-note">' + esc(e.note) + "</div>" : "") +
        "</div>";
      }).join("");
      return '<div class="timeline-group' + (past ? " is-past" : "") + '">' +
        '<div class="timeline-date">' +
          '<span class="timeline-day">' + esc(parseInt(date.split("-")[2], 10)) + "</span>" +
          '<span class="timeline-month">' + esc(parseInt(date.split("-")[1], 10)) + "月 · " + weekdayCn(date) + "</span>" +
          flag +
        "</div>" +
        '<div class="timeline-items">' + items + "</div>" +
      "</div>";
    }).join("");
    wrap.innerHTML = '<div class="timeline">' + html + "</div>";
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
          '<a class="feedback-title" href="' + esc(extHref(f.url)) + '" target="_blank" rel="noopener">' + esc(f.title) + "</a>" +
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
      '<a class="btn btn-ghost" href="' + esc(extHref(s.url)) + '" target="_blank" rel="noopener">打开</a>' +
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
      ? '<a class="btn btn-ghost" href="' + esc(extHref(r.applyUrl)) + '" target="_blank" rel="noopener">投递</a>'
      : "";
    var announce = isUrl(r.announceUrl)
      ? '<a class="btn btn-ghost" href="' + esc(extHref(r.announceUrl)) + '" target="_blank" rel="noopener">公告</a>'
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
    var round = roundOf(i.title);
    var roundBadge = round ? '<span class="round-badge">' + esc(round) + "</span>" : "";
    if (i.url) {
      return '<div class="clue-row">' +
        '<div class="row"><a class="feedback-title" href="' + esc(extHref(i.url)) + '" target="_blank" rel="noopener">' + esc(i.title) + "</a>" + roundBadge + badges + "</div>" +
        '<div class="text-small muted">' + esc(i.summary || "") + (i.tags && i.tags.length ? " · 标签：" + esc(i.tags.join("、")) : "") + "</div></div>";
    }
    return '<details class="clue-row iv-item"><summary class="iv-summary">' +
      "<b>" + esc(i.title) + "</b>" + roundBadge + badges +
      "</summary><div class=\"clue-content\">" + formatContent(i.content || i.summary || "") + "</div></details>";
  }

  var ROUND_RE = /(一面|二面|三面|四面|五面|终面|群面|HR面|业务面|初面|二轮|一轮|笔试|电面)/;

  function roundOf(title) {
    var m = String(title || "").match(ROUND_RE);
    return m ? m[1] : "";
  }

  function formatContent(text) {
    var qRe = /^(\d+[.、．]|Q\d|q\d)/;
    var labelRe = /^(面试官考查意图|回答思路要点|参考答案|反问|自我介绍|面试流程|面试时间|面试配置|面试题目|问题整理)/;
    var out = [];
    String(text || "").split("\n").forEach(function (line) {
      var t = line.trim();
      if (!t) return;
      var cls = "";
      if (qRe.test(t)) cls = "iv-q";
      else if (labelRe.test(t)) cls = "iv-label";
      out.push('<div class="' + cls + '">' + esc(t) + "</div>");
    });
    return out.join("");
  }

  function renderInterviews() {
    var view = "items";
    $$("[data-interview-view]").forEach(function (b) {
      if (b.getAttribute("aria-selected") === "true") view = b.getAttribute("data-interview-view");
    });
    var q = ($("#interview-search").value || "").trim().toLowerCase();
    $("#interview-list").hidden = view === "general";
    $("#interview-general").hidden = view !== "general";

    if (view === "general") {
      var qs = INTERVIEWS.generalQuestions || [];
      $("#interview-summary").textContent = "共 " + qs.length + " 个通用问题（朱迪版）";
      $("#interview-general").innerHTML = '<div class="panel">' + qs.map(function (q, idx) {
        return '<details class="qa-item"><summary class="iv-summary"><b>' + (idx + 1) + ". " + esc(q.question) + '</b><span class="badge">' + esc(q.section) + '</span><button class="btn btn-ghost ask-ai" type="button" data-ask-ai="question" data-q="' + esc(q.question) + '">问 AI</button></summary>' +
          '<div class="clue-content">' +
          (q.intent ? "<p><b>考查意图：</b>" + esc(q.intent) + "</p>" : "") +
          (q.keypoints ? "<p><b>回答思路：</b>" + esc(q.keypoints) + "</p>" : "") +
          (q.answer ? "<p><b>参考答案：</b>" + esc(q.answer) + "</p>" : "") +
          "</div></details>";
      }).join("") + "</div>";
      return;
    }

    if (view === "ai") {
      var tips = (AI_TIPS.generalTips || []).filter(function (t) {
        return !q || t.title.indexOf(q) !== -1 || t.content.indexOf(q) !== -1;
      });
      var companies = Object.keys(AI_TIPS.companyTips || {}).filter(function (n) {
        return !q || n.indexOf(q) !== -1;
      });
      $("#interview-summary").textContent = "锦囊 " + tips.length + " 条 · 公司提示 " + companies.length + " 家 · 朱迪注意事项 " + (AI_TIPS.zhudiNotes || []).length + " 条";
      var html = "";
      html += '<div class="panel"><div class="row" style="margin-bottom:8px"><b>朱迪表使用说明 · 注意事项</b></div>' +
        (AI_TIPS.zhudiNotes || []).map(function (n) {
          return '<details class="qa-item"><summary class="iv-summary"><b>' + esc(n.title) + "</b></summary><div class=\"clue-content\">" + esc(n.content) + "</div></details>";
        }).join("") +
        "</div>";
      html += tips.map(function (t) {
        return '<div class="ai-tip"><div class="ai-tip-head"><b>' + esc(t.title) + '</b><button class="btn btn-ghost ask-ai" type="button" data-ask-ai="tip" data-tip="' + esc(t.title) + '">问 AI</button></div><div class="ai-tip-content">' + esc(t.content) + "</div></div>";
      }).join("");
      html += '<div class="panel"><div class="row" style="margin-bottom:8px"><b>重点公司定制提示</b></div>' +
        companies.map(function (name) {
          return '<details class="qa-item"><summary class="iv-summary"><b>' + esc(name) + "</b></summary><div class=\"clue-content\">" + esc(companyTipFor(name)) + "</div></details>";
        }).join("") +
        "</div>";
      $("#interview-list").innerHTML = html;
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
          ? '<a class="btn btn-ghost" href="' + esc(extHref(i.url)) + '" target="_blank" rel="noopener">官网</a>'
          : '<span class="badge badge-muted">无链接</span>';
        return '<div class="clue-row"><div class="row"><b>' + esc(i.name) + "</b>" + link + "</div></div>";
      }).join("") ||
      '<div class="empty-box">没有匹配的单位</div>';
  }

  function openInterviewModal(companyName) {
    var items = (INTERVIEWS.items || []).filter(function (i) {
      return i.company !== "通用" && (companyName.indexOf(i.company) !== -1 || i.company.indexOf(companyName) !== -1);
    });
    var tipHtml = '<div class="ai-tip"><div class="ai-tip-head"><b>AI 小提示</b>' +
      '<button class="btn btn-ghost ask-ai" type="button" data-ask-ai="company" data-company="' + esc(companyName) + '">问 AI 定制准备</button></div>' +
      '<div class="ai-tip-content">' + esc(companyTipFor(companyName)) + "</div></div>";
    $("#iv-modal-title").textContent = companyName + " · 面经库（" + items.length + "）";
    $("#iv-modal-list").innerHTML = tipHtml + (items.length
      ? items.map(interviewCardHtml).join("")
      : '<div class="empty-box">暂无该公司的面经</div>');
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
    var edgeCheck = $("#edge-open");
    if (edgeCheck) edgeCheck.checked = edgeOpen;
    renderStats();
    renderFilters();
    renderTable();
    updateQuickUI();
    renderApplications();
    renderScheduleTimeline();
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
      el.addEventListener("input", function () { clearQuickFilter(); overviewShown = 30; renderTable(); });
      el.addEventListener("change", function () { clearQuickFilter(); overviewShown = 30; renderTable(); });
    });

    $("#overview-no-intern").addEventListener("change", function () {
      clearQuickFilter();
      overviewShown = 30;
      renderFilters();
      renderTable();
    });
    $("#overview-hide-applied").addEventListener("change", function () {
      clearQuickFilter();
      overviewShown = 30;
      renderTable();
    });

    $$(".stat[data-quick]").forEach(function (el) {
      el.addEventListener("click", function () { setQuickFilter(el.getAttribute("data-quick")); });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setQuickFilter(el.getAttribute("data-quick"));
        }
      });
    });

    $$("[data-view-btn]").forEach(function (b) {
      b.addEventListener("click", function () { switchView(b.getAttribute("data-view-btn")); });
    });

    $("#company-rows").addEventListener("click", function (e) {
      var ivBtn = e.target && e.target.closest ? e.target.closest("button.btn-iv") : null;
      if (ivBtn) {
        openInterviewModal(ivBtn.getAttribute("data-iv-company"));
        return;
      }
      var btn = e.target && e.target.closest ? e.target.closest("button[data-detail]") : null;
      if (btn) showDetail(btn.getAttribute("data-detail"));
    });

    $("#overview-more").addEventListener("click", function (e) {
      if (e.target && e.target.id === "table-more") {
        overviewShown += 30;
        renderTable();
        var more = $("#overview-more");
        if (more && more.scrollIntoView) more.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });

    $$("[data-app-view]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = btn.getAttribute("data-app-view");
        $$("[data-app-view]").forEach(function (b) {
          b.setAttribute("aria-selected", b === btn ? "true" : "false");
        });
        $("#application-cols").hidden = v !== "kanban";
        $("#application-table").hidden = v !== "table";
        var tl = $("#application-timeline");
        if (tl) tl.hidden = v !== "timeline";
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

    $("#application-cols").addEventListener("change", function (e) {
      var sel = e.target && e.target.closest ? e.target.closest("select.app-stage-select") : null;
      if (!sel) return;
      var key = sel.getAttribute("data-key");
      progress[key] = { stage: sel.value, updatedAt: todayStr() };
      saveProgress();
      renderApplications();
    });

    $("#application-table-rows").addEventListener("click", function (e) {
      var ivBtn = e.target && e.target.closest ? e.target.closest("button.btn-iv") : null;
      if (ivBtn) openInterviewModal(ivBtn.getAttribute("data-iv-company"));
    });

    $("#detail").addEventListener("click", function (e) {
      if (e.target && e.target.id === "detail-close") {
        detachDetail();
        currentCompany = null;
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

    if (edgeCheck) {
      edgeCheck.addEventListener("change", function () {
        edgeOpen = edgeCheck.checked;
        try { localStorage.setItem("qiuzhao-edge-open", edgeOpen ? "1" : "0"); } catch (e) { /* ignore */ }
        detachDetail();
        renderTable();
        renderApplications();
        renderSources();
        renderZhudi();
        renderInterviews();
        renderFeedback();
        renderGuoqi();
      });
    }

    var openInEdge = $("#open-in-edge");
    if (openInEdge) {
      openInEdge.addEventListener("click", function () {
        var url = location.href;
        if (location.protocol === "file:") {
          copyText(url, "本地文件无法直接调起 Edge，地址已复制 · ");
          return;
        }
        location.href = "microsoft-edge:" + url;
      });
    }

    document.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("button[data-ask-ai]") : null;
      if (!btn) return;
      var kind = btn.getAttribute("data-ask-ai");
      var profile = AI_TIPS.profile || "";
      var prompt = "";
      if (kind === "question") {
        prompt = "我是" + profile + "面试官问我：「" + btn.getAttribute("data-q") + "」。请给我一个符合我背景的个性化参考答案，不要太像通用模板。";
      } else if (kind === "company") {
        prompt = "我是" + profile + "请以面试官视角帮我准备「" + btn.getAttribute("data-company") + "」的面试：1) 这家公司/岗位可能重点考察什么；2) 给出 3 个最可能被问的问题并示范回答；3) 结合我的背景给差异化建议。";
      } else if (kind === "tip") {
        prompt = "我是" + profile + "关于「" + btn.getAttribute("data-tip") + "」，请给我具体可执行的准备建议和示例。";
      }
      copyText(prompt, "提问已生成 · ");
    });

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
