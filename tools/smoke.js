/* 模擬作答測試：node tools/smoke.js 2026-11-12
 * 在 jsdom 裡載入當天練習頁，把每題都用正確答案作答一次，確認畫面和計分都正常。
 * 需要先在 tools/ 執行一次 npm install（只裝 jsdom）。
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const { ROOT, readJSON } = require("./lib.js");

const date = process.argv[2];
const day = readJSON(path.join(ROOT, "days", date, "day.json"), null);
if (!day) { console.error("找不到 day.json"); process.exit(1); }

const dom = new JSDOM('<!doctype html><html><body><div class="wrap" id="app"></div></body></html>', {
  url: "https://example.test/days/" + date + "/", runScripts: "outside-only", pretendToBeVisual: true
});
const w = dom.window;
w.scrollTo = function () {};
w.DAY = JSON.parse(JSON.stringify(day));
w.eval(fs.readFileSync(path.join(ROOT, "app", "pics.js"), "utf8"));
w.eval(fs.readFileSync(path.join(ROOT, "app", "engine.js"), "utf8"));
const doc = w.document;
const fail = [];
const click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
const $ = (s) => doc.querySelector(s);

const items = doc.querySelectorAll("article.item").length;
if (items !== 20) fail.push("題目數 " + items + "，應為 20");
if (doc.body.innerHTML.indexOf("圖片無法顯示") >= 0) fail.push("有圖片無法顯示");

// answer all multiple choice correctly
const mc = [];
day.listen.forEach((it, i) => mc.push(["L" + (i + 1), it.ans]));
const R = day.read.vocab.concat(day.read.cloze.items, day.read.text.items);
R.forEach((it, i) => mc.push(["R" + (i + 1), it.ans]));
mc.forEach(([id, ans]) => {
  const btn = doc.querySelector('.opts[data-for="' + id + '"] .opt[data-i="' + ans + '"]');
  if (!btn) { fail.push(id + " 找不到選項"); return; }
  click(btn);
  if (!btn.classList.contains("right")) fail.push(id + " 正確答案沒有判為正確");
});

// writing
day.write.forEach((wq, i) => {
  const id = "W" + (i + 1);
  if (wq.kind === "rewrite" || wq.kind === "combine") {
    const inp = $("#in-" + id);
    inp.value = wq.model; inp.dispatchEvent(new w.Event("input", { bubbles: true }));
  } else if (wq.kind === "order") {
    const target = wq.ans.split(" "), used = {};
    target.forEach((word) => {
      const k = wq.words.findIndex((x, j) => x === word && !used[j]); used[k] = true;
      click(doc.querySelector('[data-chip="' + id + '"][data-k="' + k + '"]'));
    });
  } else {
    wq.lines.forEach((ln, k) => {
      const inp = $("#in-" + id + "-" + k);
      inp.value = ln.free ? ln.accept[0] : ln.model; inp.dispatchEvent(new w.Event("input", { bubbles: true }));
    });
  }
  click(doc.querySelector('[data-wcheck="' + id + '"]'));
  if (!$("#item-" + id).classList.contains("done")) fail.push(id + " 參考答案沒有判為正確：" + $("#fb-" + id).textContent);
});

click(doc.querySelector('[data-tab="result"]'));
const sum = ($("#sumText") || {}).value || "";
if (sum.indexOf("首聽答對 8/8") < 0) fail.push("成績摘要的聽力不是 8/8");
if (sum.indexOf("答對 8/8") < 0) fail.push("成績摘要的閱讀不是 8/8");
if (sum.indexOf("完成 4/4") < 0) fail.push("成績摘要的寫作不是 4/4");

if (fail.length) { fail.forEach((f) => console.error("失敗：" + f)); process.exit(1); }
console.log("模擬作答通過：20 題都能正確作答與計分。");
console.log(sum);
