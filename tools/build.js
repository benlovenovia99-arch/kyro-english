/* 建置一天的練習頁：node tools/build.js 2026-11-12
 * 1. 驗證 days/<日期>/day.json
 * 2. 產生 days/<日期>/index.html
 * 3. 更新 data/days.json、data/history.json 與首頁 index.html
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { ROOT, readJSON, validateDay, summarize } = require("./lib.js");

const VERSION = "3";
const date = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) { console.error("用法：node tools/build.js YYYY-MM-DD"); process.exit(2); }
const dayDir = path.join(ROOT, "days", date);
const day = readJSON(path.join(dayDir, "day.json"), null);
if (!day) { console.error("找不到或無法解析 " + path.join("days", date, "day.json")); process.exit(1); }

const historyPath = path.join(ROOT, "data", "history.json");
const daysPath = path.join(ROOT, "data", "days.json");
const history = readJSON(historyPath, []);
const res = validateDay(day, date, history);
res.warnings.forEach((w) => console.log("提醒：" + w));
if (res.errors.length) { res.errors.forEach((e) => console.error("錯誤：" + e)); process.exit(1); }

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const json = JSON.stringify(day).replace(/</g, "\\u003c");
const head = (title, base) =>
  '<!doctype html>\n<html lang="zh-Hant">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n' +
  '<meta name="apple-mobile-web-app-title" content="英檢練習">\n' +
  '<link rel="apple-touch-icon" href="' + base + 'app/icon.png">\n' +
  '<title>' + esc(title) + '</title>\n' +
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Lexend:wght@400;500;600;700&display=swap">\n' +
  '<link rel="stylesheet" href="' + base + 'app/style.css?v=' + VERSION + '">\n</head>\n';

const m = date.split("-");
fs.writeFileSync(path.join(dayDir, "index.html"),
  head("Kyro 每日英檢 " + (+m[1]) + "/" + (+m[2]), "../../") +
  '<body>\n<div class="wrap" id="app"><p>載入中…</p></div>\n' +
  '<script>window.DAY = ' + json + ';</script>\n' +
  '<script src="../../app/pics.js?v=' + VERSION + '"></script>\n' +
  '<script src="../../app/engine.js?v=' + VERSION + '"></script>\n</body>\n</html>\n');

// days list
const days = readJSON(daysPath, []).filter((d) => d.date !== date);
days.push({ date: date, no: day.no, focus: day.focus });
days.sort((a, b) => a.date.localeCompare(b.date));
fs.mkdirSync(path.dirname(daysPath), { recursive: true });
fs.writeFileSync(daysPath, JSON.stringify(days, null, 1) + "\n");

// history
const hist = history.filter((h) => h.date !== date);
hist.push(summarize(day));
hist.sort((a, b) => a.date.localeCompare(b.date));
fs.writeFileSync(historyPath, JSON.stringify(hist, null, 1) + "\n");

// home page
const home = head("Kyro 英檢練習", "./") +
  '<body>\n<div class="wrap">\n<header class="top">\n<p class="eyebrow">英檢組・全民英檢初級題型・小二版</p>\n<h1>Kyro 英檢練習</h1>\n' +
  '<p class="lede">每天早上會有一份新的練習。做完到「成績」按「複製結果」，回覆當天的 Email 貼上。</p>\n</header>\n' +
  '<div id="today"></div>\n<h2 class="h3">之前的練習</h2>\n<ul class="days" id="days"></ul>\n' +
  '<h2 class="h3">其他</h2>\n<ul class="days"><li><a href="r1/"><span class="d-l"><span class="d-date">Kyro 英檢小挑戰 第 1 回</span><span class="d-focus">聽力 10、閱讀 10、寫作 4、口說選做</span></span><span class="state">挑戰</span></a></li></ul>\n</div>\n' +
  '<script>\n(function(){\nvar DAYS=' + JSON.stringify(days).replace(/</g, "\\u003c") + ';\n' +
  'var WD=["日","一","二","三","四","五","六"];\n' +
  'function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}\n' +
  'function lab(d){var p=d.split("-"),x=new Date(+p[0],+p[1]-1,+p[2]);return (+p[1])+"/"+(+p[2])+"（"+WD[x.getDay()]+"）";}\n' +
  'function state(d){try{var s=JSON.parse(localStorage.getItem("kyro-daily-"+d)||"null");if(!s)return["","還沒做"];if(s.done)return[" done","完成"];var n=Object.keys(s.mc||{}).length;return n?[" part","做了 "+n+" 題"]:["","還沒做"];}catch(e){return["","還沒做"];}}\n' +
  'var now=new Date(),t=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");\n' +
  'var avail=DAYS.filter(function(d){return d.date<=t;});\n' +
  'var cur=avail.length?avail[avail.length-1]:DAYS[0];\n' +
  'var el=document.getElementById("today");\n' +
  'if(cur){var s=state(cur.date);el.innerHTML=\'<a class="today" href="days/\'+cur.date+\'/"><span class="t-date">第 \'+cur.no+\' 天・\'+lab(cur.date)+\'</span><span class="t-title">\'+(cur.date===t?"今天的練習":"最新的練習")+\'</span><span class="t-focus">\'+esc(cur.focus)+\'</span><span class="t-go">\'+(s[0]===" done"?"再看一次":"開始練習")+\' →</span></a>\';}\n' +
  'else el.innerHTML=\'<p class="sec-intro">第一份練習還在準備中。</p>\';\n' +
  'var list=avail.slice(0,-1).reverse();\n' +
  'document.getElementById("days").innerHTML=list.length?list.map(function(d){var s=state(d.date);return \'<li><a href="days/\'+d.date+\'/"><span class="d-l"><span class="d-date">第 \'+d.no+\' 天・\'+lab(d.date)+\'</span><span class="d-focus">\'+esc(d.focus)+\'</span></span><span class="state\'+s[0]+\'">\'+s[1]+\'</span></a></li>\';}).join(""):\'<li class="sec-intro">還沒有。</li>\';\n' +
  '})();\n</script>\n</body>\n</html>\n';
fs.writeFileSync(path.join(ROOT, "index.html"), home);

console.log("完成：days/" + date + "/index.html（第 " + day.no + " 天），共 " + days.length + " 天");
