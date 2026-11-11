/* 共用：驗證每日題目資料（days/<日期>/day.json） */
"use strict";
const fs = require("fs");
const path = require("path");
const Pics = require("../app/pics.js");

const ROOT = path.join(__dirname, "..");
const ROLES = ["n", "w", "m", "b", "k", "g"];
const LKINDS = ["picaudio", "picaudio", "audioq", "audioq", "dialog", "dialog", "picopts", "picopts"];
const WKINDS = ["rewrite", "combine", "order", "picture"];
const GENRES = ["note", "notice", "menu", "schedule", "card", "message"];

function norm(t) { return String(t || "").toLowerCase().replace(/[’‘`]/g, "'").replace(/[.,!?;:"]/g, " ").replace(/\s+/g, " ").trim(); }
function words(t) { return String(t).replace(/[^A-Za-z0-9'\s-]/g, " ").split(/\s+/).filter(Boolean).length; }
function readJSON(p, fallback) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { return fallback; } }

function validateDay(day, date, history) {
  const E = [], W = [];
  const err = (m) => E.push(m), warn = (m) => W.push(m);
  const isStr = (s) => typeof s === "string" && s.trim().length > 0;
  if (day.date !== date) err("date 必須是 " + date);
  if (!(Number.isInteger(day.no) && day.no > 0)) err("no 必須是正整數（第幾天）");
  if (!isStr(day.focus)) err("focus（今天的重點，一句中文）必填");

  // listening
  if (!Array.isArray(day.listen) || day.listen.length !== 8) err("listen 必須剛好 8 題");
  else day.listen.forEach((it, i) => {
    const tag = "聽力第 " + (i + 1) + " 題";
    if (it.kind !== LKINDS[i]) err(tag + " 的 kind 應為 " + LKINDS[i]);
    if (!isStr(it.why)) err(tag + " 缺 why（中文解析）");
    if (!Number.isInteger(it.ans) || it.ans < 0 || it.ans > 2) err(tag + " 的 ans 必須是 0-2");
    if (it.kind === "picopts") {
      if (!Array.isArray(it.pics) || it.pics.length !== 3) err(tag + " 需要 3 張 pics");
      else it.pics.forEach((p, k) => { const e = Pics.validate(p); if (e) err(tag + " 圖 " + "ABC"[k] + "：" + e); });
      if (!Array.isArray(it.labels) || it.labels.length !== 3) err(tag + " 需要 3 個 labels（中文圖說，給家長區）");
      if (it.pics && JSON.stringify(it.pics[0]) === JSON.stringify(it.pics[1]) || it.pics && JSON.stringify(it.pics[1]) === JSON.stringify(it.pics[2]) || it.pics && JSON.stringify(it.pics[0]) === JSON.stringify(it.pics[2])) err(tag + " 三張圖不能一樣");
    } else {
      if (!Array.isArray(it.opts) || it.opts.length !== 3 || !it.opts.every(isStr)) err(tag + " 需要 3 個文字選項");
      else if (new Set(it.opts.map(norm)).size !== 3) err(tag + " 選項不能重複");
    }
    if (it.kind === "picaudio") {
      const e = Pics.validate(it.pic); if (e) err(tag + " 圖：" + e);
      if (!isStr(it.q)) err(tag + " 缺 q（英文問題）");
    } else {
      if (!Array.isArray(it.talk) || !it.talk.length) err(tag + " 缺 talk");
      else it.talk.forEach((ln) => { if (!Array.isArray(ln) || ROLES.indexOf(ln[0]) < 0 || !isStr(ln[1])) err(tag + " talk 格式錯：每行 [角色, 英文]，角色限 " + ROLES.join("/")); });
      if (it.kind !== "audioq" && !isStr(it.q)) err(tag + " 缺 q（英文問題）");
    }
    if (it.kind === "dialog" && it.talk && (it.talk.length < 2 || it.talk.length > 3)) err(tag + " 對話要 2-3 句");
    if (it.kind === "picopts" && it.talk) {
      const n = it.talk.reduce((a, ln) => a + words(ln[1]), 0);
      if (n < 18 || n > 40) err(tag + " 短文 " + n + " 字，需在 18-40 字（建議 25-32）");
      else if (n < 24 || n > 34) warn(tag + " 短文 " + n + " 字，建議 25-32");
    }
  });
  if (Array.isArray(day.listen)) {
    const cnt = [0, 0, 0]; day.listen.forEach((it) => { if (it.ans >= 0 && it.ans <= 2) cnt[it.ans]++; });
    if (Math.max.apply(null, cnt) > 5) err("聽力答案太集中：" + cnt.join("/"));
  }

  // reading
  const r = day.read || {};
  const mc4 = (it, tag, needStem) => {
    if (needStem && !isStr(it.stem)) err(tag + " 缺 stem");
    if (!Array.isArray(it.opts) || it.opts.length !== 4 || !it.opts.every(isStr)) err(tag + " 需要 4 個選項");
    else if (new Set(it.opts.map(norm)).size !== 4) err(tag + " 選項不能重複");
    if (!Number.isInteger(it.ans) || it.ans < 0 || it.ans > 3) err(tag + " 的 ans 必須是 0-3");
    if (!isStr(it.why)) err(tag + " 缺 why");
  };
  if (!Array.isArray(r.vocab) || r.vocab.length !== 3) err("read.vocab 必須 3 題");
  else r.vocab.forEach((it, i) => { mc4(it, "詞彙第 " + (i + 1) + " 題", true); if (it.stem && it.stem.indexOf("____") < 0) err("詞彙第 " + (i + 1) + " 題 stem 要有 ____"); });
  if (!r.cloze || !isStr(r.cloze.passage) || !Array.isArray(r.cloze.items) || r.cloze.items.length !== 2) err("read.cloze 需要 passage 與 2 題 items");
  else {
    if (r.cloze.passage.indexOf("{1}") < 0 || r.cloze.passage.indexOf("{2}") < 0) err("cloze passage 要有 {1} 和 {2}");
    const n = words(r.cloze.passage.replace(/\{\d\}/g, "x"));
    if (n < 28 || n > 58) err("段落填空短文 " + n + " 字，需在 28-58 字（建議 35-50）");
    r.cloze.items.forEach((it, i) => mc4(it, "段落填空第 " + (i + 1) + " 格", false));
  }
  if (!r.text || GENRES.indexOf(r.text.genre) < 0) err("read.text.genre 必須是 " + GENRES.join("/"));
  else {
    const t = r.text;
    if (!(Array.isArray(t.lines) && t.lines.length) && !(Array.isArray(t.rows) && t.rows.length)) err("read.text 需要 lines 或 rows");
    if (!Array.isArray(t.items) || t.items.length !== 3) err("read.text.items 必須 3 題");
    else t.items.forEach((it, i) => mc4(it, "閱讀理解第 " + (i + 1) + " 題", true));
    const n = words((t.title || "") + " " + (t.lines || []).join(" ") + " " + (t.rows || []).map((x) => x.slice(0, 2).join(" ")).join(" "));
    if (n > 70) err("閱讀理解內容 " + n + " 字，太長（上限 70）");
  }
  const allR = (r.vocab || []).concat((r.cloze && r.cloze.items) || [], (r.text && r.text.items) || []);
  const cR = [0, 0, 0, 0]; allR.forEach((it) => { if (it.ans >= 0 && it.ans <= 3) cR[it.ans]++; });
  if (Math.max.apply(null, cR) > 4) err("閱讀答案太集中：" + cR.join("/"));

  // writing
  if (!Array.isArray(day.write) || day.write.length !== 4) err("write 必須剛好 4 題");
  else day.write.forEach((w, i) => {
    const tag = "寫作第 " + (i + 1) + " 題";
    if (w.kind !== WKINDS[i]) err(tag + " 的 kind 應為 " + WKINDS[i]);
    if (!isStr(w.instr)) err(tag + " 缺 instr");
    if (!Array.isArray(w.hints) || w.hints.length !== 2) err(tag + " 需要 2 個 hints");
    if (w.kind === "rewrite" || w.kind === "combine") {
      if (w.kind === "rewrite" && !isStr(w.prompt)) err(tag + " 缺 prompt");
      if (w.kind === "combine" && (!Array.isArray(w.prompt) || w.prompt.length !== 2 || !isStr(w.word))) err(tag + " 需要 2 句 prompt 和 word");
      if (typeof w.needQ !== "boolean") err(tag + " 缺 needQ（true=句尾問號）");
      if (!Array.isArray(w.accept) || !w.accept.length) err(tag + " 缺 accept");
      else w.accept.forEach((a) => { if (norm(a) !== a) err(tag + " accept 必須是正規化字串（小寫、無標點）：" + a); });
      if (!isStr(w.model)) err(tag + " 缺 model");
      else if (w.accept && w.accept.indexOf(norm(w.model)) < 0) err(tag + " model 正規化後不在 accept 裡");
      else if (!/^[A-Z]/.test(w.model) || w.model.slice(-1) !== (w.needQ ? "?" : ".")) err(tag + " model 要大寫開頭、正確標點結尾");
      (w.near || []).forEach((nr) => { try { new RegExp(nr[0]); } catch (e) { err(tag + " near 正規表示式錯誤：" + nr[0]); } if (!isStr(nr[1])) err(tag + " near 缺提示文字"); });
    }
    if (w.kind === "order") {
      if (!Array.isArray(w.words) || w.words.length < 4 || w.words.length > 6) err(tag + " 字卡要 4-6 張");
      else {
        if (!isStr(w.ans)) err(tag + " 缺 ans");
        else {
          if (w.words.join(" ") === w.ans) err(tag + " 字卡不能已經排好");
          if (w.words.slice().sort().join("|") !== w.ans.split(" ").sort().join("|")) err(tag + " 字卡和 ans 的字不一致");
        }
      }
    }
    if (w.kind === "picture") {
      if (!Array.isArray(w.panels) || w.panels.length !== 3) err(tag + " 需要 3 張 panels");
      else w.panels.forEach((p, k) => { const e = Pics.validate(p); if (e) err(tag + " 圖 " + (k + 1) + "：" + e); });
      if (!Array.isArray(w.lines) || w.lines.length !== 3) err(tag + " 需要 3 行 lines");
      else w.lines.forEach((ln, k) => {
        if (!isStr(ln.pre) || typeof ln.post !== "string") err(tag + " 第 " + (k + 1) + " 行缺 pre/post");
        if (!Array.isArray(ln.accept) || !ln.accept.length) err(tag + " 第 " + (k + 1) + " 行缺 accept");
        else ln.accept.forEach((a) => { if (norm(a) !== a) err(tag + " 第 " + (k + 1) + " 行 accept 必須正規化：" + a); });
        if (!isStr(ln.model)) err(tag + " 第 " + (k + 1) + " 行缺 model");
        else if (!ln.free && ln.accept && ln.accept.indexOf(norm(ln.model)) < 0) err(tag + " 第 " + (k + 1) + " 行 model 不在 accept 裡");
      });
    }
  });

  // repeats vs history (last 30 days)
  const recent = (history || []).filter((h) => h.date !== date).slice(-30);
  const seen = new Set();
  recent.forEach((h) => (h.texts || []).forEach((t) => seen.add(norm(t))));
  textsOf(day).forEach((t) => { if (seen.has(norm(t))) err("和最近 30 天重複：" + t); });
  return { errors: E, warnings: W };
}

function textsOf(day) {
  const out = [];
  (day.listen || []).forEach((it) => {
    if (it.q) out.push(it.q);
    (it.talk || []).forEach((ln) => out.push(ln[1]));
  });
  const r = day.read || {};
  (r.vocab || []).forEach((it) => out.push(it.stem));
  if (r.cloze) out.push(r.cloze.passage);
  if (r.text) (r.text.items || []).forEach((it) => out.push(it.stem + " | " + (r.text.title || r.text.genre)));
  (day.write || []).forEach((w) => {
    if (w.kind === "rewrite") out.push(w.prompt);
    if (w.kind === "combine") out.push(w.prompt.join(" "));
    if (w.kind === "order") out.push(w.ans);
  });
  return out.filter(Boolean);
}

function summarize(day) {
  const types = (p) => p.type + (p.obj ? ":" + p.obj : "") + (p.w ? ":" + p.w : "") + (p.rel ? ":" + p.rel + "-" + p.ref : "");
  return {
    date: day.date,
    no: day.no,
    focus: day.focus,
    pictures: day.listen.filter((it) => it.kind === "picaudio").map((it) => types(it.pic)),
    questions: day.listen.filter((it) => it.kind !== "picaudio").map((it) => it.q || (it.talk[it.talk.length - 1] || [])[1]),
    vocabAnswers: day.read.vocab.map((it) => it.opts[it.ans]),
    clozeAnswers: day.read.cloze.items.map((it) => it.opts[it.ans]),
    textGenre: day.read.text.genre,
    rewrite: day.write[0].prompt + " → " + day.write[0].model,
    combine: day.write[1].word,
    order: day.write[2].ans,
    writePanels: day.write[3].panels.map(types),
    texts: textsOf(day)
  };
}

module.exports = { ROOT, readJSON, validateDay, summarize, norm, words };
