/* Kyro 每日英檢｜練習頁引擎
 * 讀取 window.DAY（每天的題目資料），畫出聽力、閱讀、寫作、成績四個分頁。
 * 作答紀錄存在這台裝置的瀏覽器（localStorage，鍵名 kyro-daily-<日期>）。
 */
(function () {
  "use strict";
  var D = window.DAY, P = window.KyroPics;
  var LETTERS = "ABCD";
  var NUMW = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  var CN = ["", "一", "二", "三", "四"];
  var WD = ["日", "一", "二", "三", "四", "五", "六"];
  var ROLE_LABEL = { n: "旁白", w: "女聲", m: "男聲", b: "Kyro", k: "Kane", g: "女孩" };
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function pic(spec) { try { return P.render(spec); } catch (e) { return '<p class="notice">圖片無法顯示：' + esc(e.message) + '</p>'; } }

  /* ---------- index the day ---------- */
  var LPARTS = [
    { kind: "picaudio", title: "看圖辨義", desc: "看圖，聽英文題目和 A、B、C 三個說法。選項不印出來，要用聽的，選出和圖最相符的一個。" },
    { kind: "audioq", title: "問答", desc: "聽一個問句，從下面 A、B、C 三個回答中，選出最適合的一個。" },
    { kind: "dialog", title: "簡短對話", desc: "聽一段對話和一個問題，從 A、B、C 選出最適合的答案。" },
    { kind: "picopts", title: "短文聽解", desc: "先看三張圖，再聽一段短文和問題，選出正確的圖。" }
  ];
  var ITEM = {}, LIST = [], READ = [], WRITE = [];
  D.listen.forEach(function (it, i) {
    it.id = "L" + (i + 1); it.n = i + 1; it.sec = "listen";
    var w = NUMW[it.n];
    if (it.kind === "picaudio") {
      var sc = [["n", "Look at the picture for question " + w + "."], ["n", "Question: " + it.q]];
      it.opts.forEach(function (o, k) { sc.push(["n", LETTERS[k] + "."]); sc.push(["n", o]); });
      it.script = sc;
    } else if (it.kind === "audioq") {
      it.script = [["n", "Question number " + w + "."]].concat(it.talk);
    } else if (it.kind === "dialog") {
      it.script = [["n", "Question number " + w + "."]].concat(it.talk, [["n", "Question: " + it.q]]);
    } else {
      it.script = [["n", "Question number " + w + ". Please look at the three pictures."]].concat(it.talk, [["n", "Question: " + it.q]]);
    }
    ITEM[it.id] = it; LIST.push(it);
  });
  var rn = 0;
  function addRead(it, part) { rn++; it.id = "R" + rn; it.n = rn; it.sec = "read"; it.part = part; ITEM[it.id] = it; READ.push(it); }
  D.read.vocab.forEach(function (it) { addRead(it, 1); });
  D.read.cloze.items.forEach(function (it) { addRead(it, 2); });
  D.read.text.items.forEach(function (it) { addRead(it, 3); });
  D.write.forEach(function (w, i) { w.id = "W" + (i + 1); w.n = i + 1; w.sec = "write"; ITEM[w.id] = w; WRITE.push(w); });

  /* ---------- state ---------- */
  var KEY = "kyro-daily-" + D.date, SPEED = "kyro-speed";
  function fresh() { return { mc: {}, plays: {}, shown: {}, wr: {}, tab: "listen", done: false }; }
  var st = load() || fresh();
  var slow = false;
  try { slow = localStorage.getItem(SPEED) === "slow"; } catch (e) {}
  function load() { try { var s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  var saveTimer = null;
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 300); }
  function wr(id) {
    if (!st.wr[id]) st.wr[id] = { val: "", lines: ["", "", ""], chips: [], hints: 0, status: null, msg: "", tries: 0, lineRes: null };
    return st.wr[id];
  }

  /* ---------- speech ---------- */
  var synth = ("speechSynthesis" in window) ? window.speechSynthesis : null;
  var V = { f: null, m: null };
  function loadVoices() {
    if (!synth) return;
    var all = [];
    try { all = synth.getVoices() || []; } catch (e) {}
    var bad = /bubbles|bells|boing|bad news|good news|cellos|organ|trinoids|whisper|zarvox|jester|superstar|wobble|albert|hysterical|deranged|pipe|grandma|grandpa|eddy|flo\b|reed|rocko|sandy|shelley|fred|ralph|junior|kathy|princess/i;
    var en = all.filter(function (v) { return /^en[-_]/i.test(v.lang) && !bad.test(v.name); });
    var us = en.filter(function (v) { return /US/i.test(v.lang); });
    var pool = us.length ? us : en;
    var fem = /samantha|ava|allison|susan|zoe|nicky|joelle|karen|zira|jenny|aria|female|google us english/i;
    var mal = /alex|fred|aaron|tom\b|evan|nathan|daniel|david|guy|\bmale\b|ralph/i;
    V.f = pool.find(function (v) { return fem.test(v.name); }) || pool.find(function (v) { return !mal.test(v.name); }) || pool[0] || null;
    V.m = null;
    [/aaron/i, /evan/i, /nathan/i, /\btom\b/i, /alex/i, /google uk english male/i, /daniel/i, /guy|david|mark/i, /\bmale\b/i].some(function (re) {
      V.m = pool.find(function (v) { return re.test(v.name); }) || en.find(function (v) { return re.test(v.name); }) || null;
      return !!V.m;
    });
  }
  if (synth) { loadVoices(); try { synth.onvoiceschanged = loadVoices; } catch (e) {} }
  var ROLE = {
    n: { v: "f", p: 1, r: 1 }, w: { v: "f", p: 1.08, r: 1 }, m: { v: "m", p: 1, alt: 0.92, r: 0.95 },
    b: { v: "f", p: 1.4, r: 1.02 }, g: { v: "f", p: 1.3, r: 1.02 }, k: { v: "m", p: 1.18, alt: 1.12, r: 1 }
  };
  var curDone = null;
  function speakLines(lines, onDone) {
    if (!synth) { if (onDone) onDone(); return; }
    try { synth.cancel(); } catch (e) {}
    if (curDone) { var prev = curDone; curDone = null; prev(); }
    var base = slow ? 0.72 : 0.88, finished = false, tm = null, chars = 0;
    function finish() {
      if (finished) return; finished = true;
      if (curDone === finish) curDone = null;
      clearTimeout(tm);
      if (onDone) onDone();
    }
    curDone = finish;
    lines.forEach(function (ln, i) {
      var R = ROLE[ln[0]] || ROLE.n, text = ln[1];
      chars += text.length;
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      var voice = R.v === "m" ? (V.m || V.f) : V.f;
      if (voice) u.voice = voice;
      u.pitch = (R.v === "m" && !V.m) ? R.alt : R.p;
      u.rate = base * (R.r || 1);
      if (i === lines.length - 1) { u.onend = finish; u.onerror = finish; }
      synth.speak(u);
    });
    tm = setTimeout(finish, 2500 + chars * 95 / base);
  }
  function setPlaying(btn) {
    document.querySelectorAll(".play.is-playing").forEach(function (b) { b.classList.remove("is-playing"); });
    if (btn) btn.classList.add("is-playing");
  }
  function clearPlaying(btn) { if (btn) btn.classList.remove("is-playing"); }

  /* ---------- layout ---------- */
  var PLAY_IC = '<svg class="ic" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4 L16 10 L6 16 Z"/></svg>';
  function dateLabel() {
    var p = D.date.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]);
    return (+p[1]) + "/" + (+p[2]) + "（" + WD[d.getDay()] + "）";
  }
  function shell() {
    document.title = "Kyro 每日英檢 " + dateLabel().replace(/（.*/, "");
    $("#app").innerHTML =
      '<header class="top"><a class="back" href="../../">← 所有練習</a>' +
      '<p class="eyebrow">每日英檢・第 ' + D.no + ' 天・' + dateLabel() + '</p>' +
      '<h1>今天的英檢練習</h1>' +
      '<p class="lede">' + esc(D.focus || "") + '</p>' +
      '<div class="tools"><div class="seg" role="group" aria-label="英文語速"><span class="seg-lab">語速</span>' +
      '<button type="button" data-speed="normal">一般</button><button type="button" data-speed="slow">慢一點</button></div></div></header>' +
      '<nav class="tabs" id="tabs" role="tablist" aria-label="練習部分" style="--tabs:4">' +
      tabBtn("listen", "聽力", LIST.length) + tabBtn("read", "閱讀", READ.length) + tabBtn("write", "寫作", WRITE.length) +
      '<button type="button" class="tab" role="tab" data-tab="result" id="tab-result"><span class="tl">成績</span><span class="tc" id="tc-result">—</span></button></nav>' +
      '<section class="sec" id="sec-listen" data-sec="listen" role="tabpanel"></section>' +
      '<section class="sec" id="sec-read" data-sec="read" role="tabpanel" hidden></section>' +
      '<section class="sec" id="sec-write" data-sec="write" role="tabpanel" hidden></section>' +
      '<section class="sec" id="sec-result" data-sec="result" role="tabpanel" hidden></section>' +
      '<details class="parent"><summary>家長區：聽稿與答案（請孩子先別打開）</summary><div class="parent-body" id="parentBody"></div></details>';
  }
  function tabBtn(id, label, total) {
    return '<button type="button" class="tab" role="tab" data-tab="' + id + '" id="tab-' + id + '"><span class="tl">' + label + '</span><span class="tc" id="tc-' + id + '">0/' + total + '</span></button>';
  }
  function partHead(no, title, desc) {
    return '<div class="part-head"><p class="part-no">第' + CN[no] + '部分</p><h2>' + title + '</h2><p class="part-desc">' + desc + '</p></div>';
  }
  function nextRow(tab, label) { return '<div class="next-row"><button type="button" class="btn" data-tab="' + tab + '">' + label + ' →</button></div>'; }
  function scriptHTML(script) {
    var out = [], prefix = "";
    script.forEach(function (ln) {
      if (/^[A-D]\.$/.test(ln[1])) { prefix = ln[1] + " "; return; }
      out.push('<p><span class="who">' + (ROLE_LABEL[ln[0]] || "") + '</span>' + esc(prefix + ln[1]) + '</p>');
      prefix = "";
    });
    return '<div class="script">' + out.join("") + '</div>';
  }
  function optsHTML(it) {
    if (it.kind === "picopts") {
      return '<div class="opts pics" data-for="' + it.id + '">' + it.pics.map(function (p, i) {
        return '<button type="button" class="opt pic-opt" data-item="' + it.id + '" data-i="' + i + '" aria-label="' + LETTERS[i] + '：' + esc(it.labels[i]) + '"><span class="bubble">' + LETTERS[i] + '</span><span class="opt-pic">' + pic(p) + '</span></button>';
      }).join("") + '</div>';
    }
    return '<div class="opts" data-for="' + it.id + '">' + it.opts.map(function (o, i) {
      var txt = it.kind === "picaudio" ? '<span class="hush">（用聽的）</span><span class="real">' + esc(o) + '</span>' : esc(o);
      return '<button type="button" class="opt" data-item="' + it.id + '" data-i="' + i + '"><span class="bubble">' + LETTERS[i] + '</span><span class="otext">' + txt + '</span></button>';
    }).join("") + '</div>';
  }

  function renderListen() {
    var h = "";
    if (!synth) h += '<p class="notice">這個瀏覽器不能播放英文語音。請家長打開最下面的「家長區」，照聽稿念給 Kyro 聽。</p>';
    h += '<p class="sec-intro">正式考試每題只播一次。這裡可以重播，但會記下作答前聽了幾次。沒有聲音的話，先確認 iPad 的靜音已關閉。</p>';
    LPARTS.forEach(function (part, pi) {
      var items = LIST.filter(function (it) { return it.kind === part.kind; });
      if (!items.length) return;
      h += partHead(pi + 1, part.title, part.desc);
      items.forEach(function (it) {
        var b = "";
        if (it.kind === "picaudio") b += '<div class="pic">' + pic(it.pic) + '</div>';
        b += '<div class="play-row"><button type="button" class="play" data-play="' + it.id + '">' + PLAY_IC + '<span>播放題目</span></button><span class="plays" id="plays-' + it.id + '"></span>' +
          (it.kind === "picaudio" ? '<button type="button" class="ghost sm" data-show="' + it.id + '" id="show-' + it.id + '">顯示選項文字</button>' : '') + '</div>';
        b += optsHTML(it) + '<p class="fb" id="fb-' + it.id + '" aria-live="polite"></p>';
        b += '<details class="tx" id="tx-' + it.id + '" hidden><summary>看這題的英文聽稿</summary>' + scriptHTML(it.script) + '</details>';
        h += '<article class="item ' + it.kind + '" id="item-' + it.id + '"><div class="item-top"><span class="qno">' + it.n + '</span></div>' + b + '</article>';
      });
    });
    h += nextRow("read", "下一部分：閱讀");
    $("#sec-listen").innerHTML = h;
  }

  function docHTML(t) {
    var g = t.genre, h = "", title = t.title ? '<p class="doc-title">' + esc(t.title) + '</p>' : "";
    var lines = (t.lines || []).map(function (l) { return '<p>' + esc(l) + '</p>'; }).join("");
    var rows = t.rows ? '<table>' + t.rows.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join("") + '</table>' : "";
    var sign = (t.signoff || t.from) ? '<p class="sign">' + (t.signoff ? esc(t.signoff) + '<br>' : '') + esc(t.from || "") + '</p>' : "";
    if (g === "message") {
      h = '<div class="doc message" aria-label="訊息">' + (t.rows || []).map(function (r) {
        return '<div class="bub' + (r[2] === "me" ? " me" : "") + '"><b>' + esc(r[0]) + '</b>' + esc(r[1]) + '</div>';
      }).join("") + '</div>';
    } else if (g === "menu" || g === "schedule") {
      h = '<div class="doc ' + g + '">' + title + rows + lines + '</div>';
    } else {
      h = '<div class="doc ' + (g || "note") + '">' + title + lines + rows + sign + '</div>';
    }
    return h;
  }
  function readItemHTML(it) {
    var stem = "";
    if (it.part === 2) stem = '<p class="stem small">第 (' + it.n + ') 格</p>';
    else if (it.stem) stem = '<p class="stem">' + esc(it.stem).replace("____", '<span class="gap" aria-label="空格"></span>') + '</p>';
    return '<article class="item" id="item-' + it.id + '"><div class="item-top"><span class="qno">' + it.n + '</span></div>' + stem + optsHTML(it) + '<p class="fb" id="fb-' + it.id + '" aria-live="polite"></p></article>';
  }
  function renderRead() {
    var r = D.read, h = "";
    h += partHead(1, "詞彙", "句子裡有一個空格，從四個選項中選出最適合的字。");
    READ.filter(function (it) { return it.part === 1; }).forEach(function (it) { h += readItemHTML(it); });
    h += partHead(2, "段落填空", "短文裡有空格，每格從四個選項中選出最適合的答案。");
    var cl = READ.filter(function (it) { return it.part === 2; });
    h += '<div class="passage">' + esc(r.cloze.passage).replace(/\{(\d+)\}/g, function (m, k) {
      var it = cl[+k - 1]; return '<span class="blank">(' + (it ? it.n : k) + ')</span>';
    }) + '</div>';
    cl.forEach(function (it) { h += readItemHTML(it); });
    h += partHead(3, "閱讀理解", esc(r.text.intro || "讀下面的內容，回答問題。"));
    h += docHTML(r.text);
    READ.filter(function (it) { return it.part === 3; }).forEach(function (it) { h += readItemHTML(it); });
    h += nextRow("write", "下一部分：寫作");
    $("#sec-read").innerHTML = h;
  }

  var INPUT_ATTR = ' type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"';
  var WLABEL = { rewrite: "改寫句子", combine: "句子合併", order: "重組句子", picture: "看圖寫句" };
  function writeItemHTML(w) {
    var b = '<p class="w-type">' + WLABEL[w.kind] + '</p><p class="w-instr">' + esc(w.instr) + '</p>';
    if (w.kind === "rewrite") b += '<p class="w-prompt">' + esc(w.prompt) + '</p><input class="w-input" id="in-' + w.id + '" data-winput="' + w.id + '"' + INPUT_ATTR + ' aria-label="寫出句子" placeholder="在這裡寫完整的句子">';
    if (w.kind === "combine") b += '<p class="w-prompt">' + w.prompt.map(esc).join("<br>") + ' <span class="w-word">（用 ' + esc(w.word) + '）</span></p><input class="w-input" id="in-' + w.id + '" data-winput="' + w.id + '"' + INPUT_ATTR + ' aria-label="寫出合併後的句子" placeholder="在這裡寫完整的句子">';
    if (w.kind === "order") b += '<div class="built" id="built-' + w.id + '" aria-label="排好的句子"></div><div class="chips" id="chips-' + w.id + '"></div><div class="row"><button type="button" class="ghost sm" data-wclear="' + w.id + '">字卡全部放回</button></div>';
    if (w.kind === "picture") {
      b += '<div class="panels">' + w.panels.map(function (p, k) { return '<div class="panel"><span>' + (k + 1) + '</span>' + pic(p) + '</div>'; }).join("") + '</div>';
      b += '<div class="lines">' + w.lines.map(function (ln, k) {
        return '<label class="line" for="in-' + w.id + '-' + k + '"><span>' + (k + 1) + '. ' + esc(ln.pre) + '</span><input class="w-input inl" id="in-' + w.id + '-' + k + '" data-wline="' + w.id + '" data-k="' + k + '"' + INPUT_ATTR + '><span>' + esc(ln.post) + '</span></label>';
      }).join("") + '</div>';
    }
    b += '<div class="hints" id="hints-' + w.id + '"></div><div class="row"><button type="button" class="btn" data-wcheck="' + w.id + '">檢查</button><button type="button" class="ghost" data-whint="' + w.id + '" id="hintbtn-' + w.id + '">提示</button></div><p class="fb" id="fb-' + w.id + '" aria-live="polite"></p>';
    return '<article class="item" id="item-' + w.id + '"><div class="item-top"><span class="qno">' + w.n + '</span></div>' + b + '</article>';
  }
  function renderWrite() {
    var h = partHead(1, "單句寫作", "依照題目要求寫出完整的句子。開頭大寫，句尾記得加標點。");
    WRITE.filter(function (w) { return w.kind !== "picture"; }).forEach(function (w) { h += writeItemHTML(w); });
    h += partHead(2, "看圖寫句", "正式考試要看圖寫約 50 字的短文。這裡先練 3 句，每句都給了開頭。");
    WRITE.filter(function (w) { return w.kind === "picture"; }).forEach(function (w) { h += writeItemHTML(w); });
    h += nextRow("result", "看成績");
    $("#sec-write").innerHTML = h;
  }

  /* ---------- multiple choice ---------- */
  function reveal(id) {
    var el = $("#item-" + id); if (el) el.classList.add("revealed");
    var b = $("#show-" + id); if (b) b.hidden = true;
  }
  function updatePlays(id) {
    var n = st.plays[id] || 0, el = $("#plays-" + id);
    if (el) el.textContent = n ? "已播 " + n + " 次" : "";
  }
  function applyMC(id) {
    var it = ITEM[id], rec = st.mc[id];
    var box = document.querySelector('.opts[data-for="' + id + '"]');
    if (!box) return;
    var btns = Array.prototype.slice.call(box.querySelectorAll(".opt"));
    btns.forEach(function (b) { b.classList.remove("right", "wrong"); b.disabled = false; });
    box.classList.remove("done");
    var fb = $("#fb-" + id); fb.className = "fb"; fb.innerHTML = "";
    var tx = $("#tx-" + id);
    if (!rec) { if (tx) tx.hidden = true; return; }
    var done = false, isL = it.sec === "listen";
    if (rec.first === it.ans) {
      btns[rec.first].classList.add("right"); done = true;
      fb.classList.add("ok");
      fb.textContent = (isL && rec.plays <= 1 && !rec.hint) ? "答對了！只聽一次就答對。" : "答對了！";
    } else {
      btns[rec.first].classList.add("wrong"); btns[rec.first].disabled = true;
      if (rec.second == null) {
        fb.classList.add("no");
        fb.textContent = isL ? "再聽一次，再選一次。" : "再讀一次，再選一次。";
      } else {
        done = true;
        if (rec.second === it.ans) {
          btns[rec.second].classList.add("right");
          fb.classList.add("ok"); fb.innerHTML = '訂正成功！<span class="why">' + esc(it.why) + '</span>';
        } else {
          btns[rec.second].classList.add("wrong"); btns[it.ans].classList.add("right");
          fb.classList.add("no"); fb.innerHTML = '正確答案是 ' + LETTERS[it.ans] + '。<span class="why">' + esc(it.why) + '</span>';
        }
      }
    }
    if (done) {
      box.classList.add("done");
      btns.forEach(function (b) { b.disabled = true; });
      if (tx) tx.hidden = false;
      if (it.kind === "picaudio") reveal(id);
    }
  }
  function choose(id, i) {
    var it = ITEM[id], rec = st.mc[id];
    if (!rec) st.mc[id] = { first: i, plays: it.sec === "listen" ? (st.plays[id] || 0) : 0, hint: !!st.shown[id], second: null };
    else if (rec.first !== it.ans && rec.second == null && i !== rec.first) rec.second = i;
    else return;
    save(); applyMC(id); updateTabs();
  }
  function playListen(id) {
    var it = ITEM[id];
    st.plays[id] = (st.plays[id] || 0) + 1; save(); updatePlays(id);
    var btn = document.querySelector('[data-play="' + id + '"]');
    setPlaying(btn);
    speakLines(it.script, function () { clearPlaying(btn); });
  }
  function showText(id) { st.shown[id] = true; save(); reveal(id); }

  /* ---------- writing ---------- */
  function norm(t) { return String(t || "").toLowerCase().replace(/[’‘`]/g, "'").replace(/[.,!?;:"]/g, " ").replace(/\s+/g, " ").trim(); }
  function checkSentence(w, raw) {
    var v = norm(raw);
    if (!v) return { s: "empty", m: "先寫寫看，再按檢查。" };
    if (w.accept.indexOf(v) >= 0) {
      var t = String(raw).trim(), cap = /^[A-Z]/.test(t), end = t.slice(-1);
      var p = w.needQ ? end === "?" : end === ".";
      if (cap && p) return { s: "ok", m: "完全正確！" };
      var tips = [];
      if (!cap) tips.push("第一個字母要大寫");
      if (!p) tips.push(w.needQ ? "句尾要加問號 ?" : "句尾要加句點 .");
      return { s: "almost", m: "句子寫對了！再注意：" + tips.join("、") + "。" };
    }
    var near = w.near || [];
    for (var k = 0; k < near.length; k++) {
      try { if (new RegExp(near[k][0]).test(v)) return { s: "retry", m: near[k][1] }; } catch (e) {}
    }
    return { s: "retry", m: "還差一點，再看一次題目，或按「提示」。" };
  }
  function renderChips(id) {
    var w = ITEM[id], s = wr(id), used = {};
    s.chips.forEach(function (k) { used[k] = true; });
    $("#built-" + id).innerHTML = s.chips.length ? s.chips.map(function (k, pos) {
      return '<button type="button" class="chip on" data-unchip="' + id + '" data-pos="' + pos + '">' + esc(w.words[k]) + '</button>';
    }).join("") : '<span class="built-ph">點下面的字卡，排成一句話</span>';
    $("#chips-" + id).innerHTML = w.words.map(function (t, k) {
      return '<button type="button" class="chip" data-chip="' + id + '" data-k="' + k + '"' + (used[k] ? " hidden" : "") + '>' + esc(t) + '</button>';
    }).join("");
  }
  function applyWriting(id) {
    var w = ITEM[id], s = wr(id);
    if (w.kind === "rewrite" || w.kind === "combine") { var inp = $("#in-" + id); if (inp && inp.value !== s.val) inp.value = s.val; }
    if (w.kind === "picture") {
      w.lines.forEach(function (ln, k) {
        var el = $("#in-" + id + "-" + k); if (!el) return;
        var val = s.lines[k] || ""; if (el.value !== val) el.value = val;
        el.classList.remove("ok", "no");
        if (s.lineRes) { if (s.lineRes[k] === "ok") el.classList.add("ok"); else if (s.lineRes[k] === "no" || s.lineRes[k] === "empty") el.classList.add("no"); }
      });
    }
    if (w.kind === "order") renderChips(id);
    $("#hints-" + id).innerHTML = w.hints.slice(0, s.hints).map(function (t, i) { return '<p class="hint"><span>提示 ' + (i + 1) + '</span>' + esc(t) + '</p>'; }).join("");
    var hb = $("#hintbtn-" + id), solved = s.status === "ok" || s.status === "almost";
    hb.textContent = s.hints >= w.hints.length ? "提示已用完" : "提示（" + s.hints + "/" + w.hints.length + "）";
    hb.disabled = s.hints >= w.hints.length || solved;
    var fb = $("#fb-" + id);
    fb.className = "fb" + (solved ? " ok" : s.status === "retry" ? " no" : "");
    fb.textContent = s.msg || "";
    $("#item-" + id).classList.toggle("done", solved);
  }
  function checkWriting(id) {
    var w = ITEM[id], s = wr(id), res;
    if (w.kind === "rewrite" || w.kind === "combine") res = checkSentence(w, s.val);
    else if (w.kind === "order") {
      if (!s.chips.length) res = { s: "empty", m: "先點字卡排一排。" };
      else if (s.chips.length < w.words.length) res = { s: "retry", m: "還有字卡沒用到喔。" };
      else {
        var built = s.chips.map(function (k) { return w.words[k]; }).join(" ");
        res = built === w.ans ? { s: "ok", m: "完全正確！" } : { s: "retry", m: "字都用到了，順序再想想。" };
      }
    } else {
      var lr = w.lines.map(function (ln, k) {
        var v = norm(s.lines[k]);
        if (!v) return "empty";
        if (ln.accept.indexOf(v) >= 0) return "ok";
        return ln.free ? "parent" : "no";
      });
      s.lineRes = lr;
      if (lr.every(function (x) { return x === "empty"; })) res = { s: "empty", m: "先寫寫看，再按檢查。" };
      else {
        var bad = []; lr.forEach(function (x, k) { if (x === "no" || x === "empty") bad.push(k + 1); });
        if (bad.length) res = { s: "retry", m: "第 " + bad.join("、") + " 句再看看圖。" };
        else if (lr.indexOf("parent") >= 0) res = { s: "ok", m: "寫好了！有一句是自由發揮，請家長看看。" };
        else res = { s: "ok", m: "三句都寫對了！" };
      }
    }
    if (res.s === "empty") { s.msg = res.m; s.status = null; }
    else { s.tries = (s.tries || 0) + 1; s.status = res.s; s.msg = res.m; }
    save(); applyWriting(id); updateTabs();
  }
  function addHint(id) { var w = ITEM[id], s = wr(id); s.hints = Math.min(w.hints.length, s.hints + 1); save(); applyWriting(id); }
  function chipsChanged(id) { var s = wr(id); if (s.status === "retry") { s.status = null; s.msg = ""; } save(); applyWriting(id); }
  function addChip(id, k) { var s = wr(id); if (s.chips.indexOf(k) < 0) s.chips.push(k); chipsChanged(id); }
  function removeChip(id, pos) { wr(id).chips.splice(pos, 1); chipsChanged(id); }
  function clearChips(id) { wr(id).chips = []; chipsChanged(id); }

  /* ---------- stats & results ---------- */
  function computeStats() {
    var o = { L: { first: 0, replay: 0, wrong: 0, left: 0, wrongN: [] }, R: { right: 0, wrong: 0, left: 0, wrongN: [] }, W: { done: 0, hints: 0, fmt: [], parent: false } };
    LIST.forEach(function (it) {
      var r = st.mc[it.id];
      if (!r) { o.L.left++; return; }
      if (r.first === it.ans) { if (r.plays <= 1 && !r.hint) o.L.first++; else o.L.replay++; }
      else { o.L.wrong++; o.L.wrongN.push(it.n); }
    });
    READ.forEach(function (it) {
      var r = st.mc[it.id];
      if (!r) { o.R.left++; return; }
      if (r.first === it.ans) o.R.right++; else { o.R.wrong++; o.R.wrongN.push(it.n); }
    });
    WRITE.forEach(function (w) {
      var s = wr(w.id);
      o.W.hints += s.hints;
      if (s.status === "ok" || s.status === "almost") o.W.done++;
      if (s.status === "almost") o.W.fmt.push(w.n);
      if (w.kind === "picture" && s.lineRes && s.lineRes.indexOf("parent") >= 0) o.W.parent = true;
    });
    return o;
  }
  function summaryText(o) {
    var nL = LIST.length, nR = READ.length, nW = WRITE.length;
    var t = "Kyro 每日英檢 " + dateLabel() + "（第 " + D.no + " 天）\n";
    t += "聽力：首聽答對 " + o.L.first + "/" + nL + "，重播或看文字後答對 " + o.L.replay + "，答錯 " + o.L.wrong + (o.L.wrongN.length ? "（第 " + o.L.wrongN.join("、") + " 題）" : "") + (o.L.left ? "，未作答 " + o.L.left : "") + "\n";
    t += "閱讀：答對 " + o.R.right + "/" + nR + (o.R.wrongN.length ? "，答錯第 " + o.R.wrongN.join("、") + " 題" : "") + (o.R.left ? "，未作答 " + o.R.left : "") + "\n";
    t += "寫作：完成 " + o.W.done + "/" + nW + "，用了 " + o.W.hints + " 次提示" + (o.W.fmt.length ? "，第 " + o.W.fmt.join("、") + " 題大寫或標點要注意" : "") + (o.W.parent ? "，自由句請家長確認" : "") + "\n";
    t += "感覺（請圈一個）：太簡單／剛好／有點難";
    return t;
  }
  function renderResult() {
    var o = computeStats();
    function tile(lab, big, sub) { return '<div class="tile"><span class="lab">' + lab + '</span><span class="big">' + big + '</span><span class="sub">' + sub + '</span></div>'; }
    var h = '<div class="part-head"><p class="part-no">成績</p><h2>今天的三個數字</h2><p class="part-desc">聽力首聽答對幾題、閱讀答對幾題、寫作用了幾次提示。</p></div>';
    h += '<div class="tiles">' +
      tile("聽力・首聽答對", o.L.first + "<small>/" + LIST.length + "</small>", "重播或看文字後答對 " + o.L.replay + "・答錯 " + o.L.wrong + (o.L.left ? "・未作答 " + o.L.left : "")) +
      tile("閱讀・答對", o.R.right + "<small>/" + READ.length + "</small>", o.R.left ? "未作答 " + o.R.left : "答錯 " + o.R.wrong) +
      tile("寫作・提示次數", o.W.hints + "<small>次</small>", "完成 " + o.W.done + "/" + WRITE.length) + '</div>';
    var rows = "";
    LPARTS.forEach(function (part) {
      var items = LIST.filter(function (it) { return it.kind === part.kind; });
      rows += partRow("聽力・" + part.title, items);
    });
    [["詞彙", 1], ["段落填空", 2], ["閱讀理解", 3]].forEach(function (p) {
      rows += partRow("閱讀・" + p[0], READ.filter(function (it) { return it.part === p[1]; }));
    });
    h += '<h3 class="h3">各題型表現</h3><div class="tbl-wrap"><table><thead><tr><th>題型</th><th>題數</th><th>第一次就選對</th><th>要再練</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    var wl = [];
    LIST.concat(READ).forEach(function (it) {
      var r = st.mc[it.id];
      if (r && r.first !== it.ans) wl.push('<li><b>' + (it.sec === "listen" ? "聽力" : "閱讀") + ' 第 ' + it.n + ' 題</b>：' + esc(it.why) + '</li>');
    });
    if (wl.length) h += '<h3 class="h3">第一次選錯的題目</h3><ul class="wrong-list">' + wl.join("") + '</ul>';
    h += '<h3 class="h3">把結果交給英檢組老師</h3><p class="part-desc">按「複製結果」，打開今天的練習 Email 按「回覆」，貼上後寄出。老師明天出題時會參考。</p>';
    h += '<textarea id="sumText" rows="6" readonly aria-label="結果文字">' + esc(summaryText(o)) + '</textarea>';
    h += '<div class="row"><button type="button" class="btn" id="copyBtn">複製結果</button><span class="copy-msg" id="copyMsg" aria-live="polite"></span></div>';
    h += '<div class="row reset-row"><button type="button" class="ghost" id="resetBtn">清除作答，重新做一次</button></div>';
    $("#sec-result").innerHTML = h;
  }
  function partRow(name, items) {
    var ans = 0, right = 0, bad = [];
    items.forEach(function (it) { var r = st.mc[it.id]; if (!r) return; ans++; if (r.first === it.ans) right++; else bad.push(it.n); });
    return '<tr><td>' + name + '</td><td class="num">' + items.length + '</td><td class="num">' + (ans ? right + " / " + ans : "—") + '</td><td>' + (bad.length ? "第 " + bad.join("、") + " 題" : (ans ? "沒有" : "—")) + '</td></tr>';
  }
  function copySummary() {
    var ta = $("#sumText"), msg = $("#copyMsg"), txt = ta.value;
    function fallback() { ta.focus(); ta.select(); try { ta.setSelectionRange(0, txt.length); } catch (e) {} msg.textContent = "文字已選取，請按「拷貝」。"; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { msg.textContent = "已複製！到 Email 按回覆，貼上後寄出。"; }).catch(fallback);
    } else fallback();
  }
  function resetAll(btn) {
    if (!btn.dataset.armed) {
      btn.dataset.armed = "1"; btn.textContent = "再按一次，確定清除"; btn.classList.add("danger");
      setTimeout(function () { if (btn.isConnected && btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = "清除作答，重新做一次"; btn.classList.remove("danger"); } }, 4000);
      return;
    }
    st = fresh(); save(); renderAll(); setTab("listen");
  }

  /* ---------- parent key ---------- */
  function renderParent() {
    var h = '<h3>怎麼用</h3><ul>' +
      '<li>每題只算第一次的答案。答錯可以再選一次當訂正，不影響分數。</li>' +
      '<li>聽力可以重播，頁面會分開記「只聽一次就答對」和「重播或看文字後答對」。</li>' +
      '<li>聲音太快時按上方「慢一點」。沒有聲音時，可照下面的聽稿念給他聽。</li>' +
      '<li>做完到「成績」按「複製結果」，回覆今天的 Email 貼上。作答紀錄只存在這台裝置。</li></ul>';
    h += '<h3>聽力聽稿與答案</h3><ol>' + LIST.map(function (it) {
      var a = it.kind === "picopts" ? it.labels[it.ans] : it.opts[it.ans];
      return '<li><p class="k-ans">答案 ' + LETTERS[it.ans] + '：' + esc(a) + '</p>' + scriptHTML(it.script) + '<p class="k-why">' + esc(it.why) + '</p></li>';
    }).join("") + '</ol>';
    h += '<h3>閱讀答案</h3><ol>' + READ.map(function (it) {
      return '<li><span class="k-ans">' + LETTERS[it.ans] + ' ' + esc(it.opts[it.ans]) + '</span>　<span class="k-why">' + esc(it.why) + '</span></li>';
    }).join("") + '</ol>';
    h += '<h3>寫作參考答案</h3><ol>' + WRITE.map(function (w) {
      if (w.kind === "picture") return '<li>' + w.lines.map(function (ln) { return esc(ln.pre + " " + ln.model + " " + ln.post).replace(/ \./g, "."); }).join(" / ") + '</li>';
      return '<li>' + esc(w.kind === "order" ? w.ans : w.model) + '</li>';
    }).join("") + '</ol>';
    if (D.notes && D.notes.length) h += '<h3>今天的觀察點</h3><ul>' + D.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join("") + '</ul>';
    $("#parentBody").innerHTML = h;
  }

  /* ---------- tabs ---------- */
  function updateTabs() {
    var L = LIST.filter(function (it) { return st.mc[it.id]; }).length;
    var R = READ.filter(function (it) { return st.mc[it.id]; }).length;
    var W = WRITE.filter(function (w) { var s = wr(w.id); return s.status === "ok" || s.status === "almost"; }).length;
    $("#tc-listen").textContent = L + "/" + LIST.length;
    $("#tc-read").textContent = R + "/" + READ.length;
    $("#tc-write").textContent = W + "/" + WRITE.length;
    var all = L === LIST.length && R === READ.length && W === WRITE.length;
    $("#tc-result").textContent = all ? "完成" : "—";
    if (all !== st.done) { st.done = all; save(); }
    if (st.tab === "result") renderResult();
  }
  function setTab(t) {
    st.tab = t; save();
    document.querySelectorAll(".sec").forEach(function (s) { s.hidden = s.dataset.sec !== t; });
    document.querySelectorAll(".tab").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.tab === t ? "true" : "false"); });
    if (t === "result") renderResult();
    var nav = $("#tabs");
    if (nav && window.scrollY > nav.offsetTop) window.scrollTo(0, nav.offsetTop);
  }
  function setSpeed(v) {
    slow = v === "slow";
    try { localStorage.setItem(SPEED, slow ? "slow" : "normal"); } catch (e) {}
    document.querySelectorAll("[data-speed]").forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.speed === "slow") === slow ? "true" : "false"); });
  }

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("button"); if (!t) return;
    var d = t.dataset;
    if (d.play) return playListen(d.play);
    if (d.show) return showText(d.show);
    if (t.classList.contains("opt")) return choose(d.item, parseInt(d.i, 10));
    if (d.tab) return setTab(d.tab);
    if (d.wcheck) return checkWriting(d.wcheck);
    if (d.whint) return addHint(d.whint);
    if (d.chip) return addChip(d.chip, parseInt(d.k, 10));
    if (d.unchip) return removeChip(d.unchip, parseInt(d.pos, 10));
    if (d.wclear) return clearChips(d.wclear);
    if (d.speed) return setSpeed(d.speed);
    if (t.id === "copyBtn") return copySummary();
    if (t.id === "resetBtn") return resetAll(t);
  });
  document.addEventListener("input", function (e) {
    var t = e.target, d = t.dataset;
    if (d.winput) {
      var s = wr(d.winput); s.val = t.value;
      if (s.status === "retry") { s.status = null; s.msg = ""; applyWriting(d.winput); }
      saveSoon();
    } else if (d.wline) {
      var s2 = wr(d.wline); s2.lines[parseInt(d.k, 10)] = t.value;
      if (s2.status === "retry") { s2.status = null; s2.msg = ""; s2.lineRes = null; applyWriting(d.wline); }
      saveSoon();
    }
  });
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (e.key === "Enter" && t.classList && t.classList.contains("w-input")) { e.preventDefault(); checkWriting(t.dataset.winput || t.dataset.wline); }
  });

  function renderAll() {
    renderListen(); renderRead(); renderWrite();
    Object.keys(ITEM).forEach(function (id) {
      var it = ITEM[id];
      if (it.sec === "listen" || it.sec === "read") {
        applyMC(id);
        if (it.sec === "listen") { updatePlays(id); if (st.shown[id]) reveal(id); }
      } else applyWriting(id);
    });
    updateTabs();
  }
  shell();
  renderParent();
  renderAll();
  setSpeed(slow ? "slow" : "normal");
  setTab(st.tab || "listen");
})();
