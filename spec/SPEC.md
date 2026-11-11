# Kyro 每日英檢｜出題規格

每天產生一份 `days/<YYYY-MM-DD>/day.json`，再用 `node tools/build.js <日期>` 建成練習頁。
範例與格式以 `days/2026-11-12/day.json` 為準。

## 1. 對象與難度（一般進階微調，沿用至家長另行指示）

- Kyro，國小二年級，雙語學制，全民英檢初級題型的小二版。
- 聽力：語速由 iPad 語音控制；對話 2～3 句；短文聽解 25～32 字。
- 閱讀：段落 35～50 字，每句 5～10 字；只考細節和簡單代名詞。
- **不考**：原因（why）、先後順序、隱含推論、多步驟時間或金額計算。
- 寫作：每題都有句首、關鍵字或提示；看圖寫句每句都給開頭。
- 單字以全民英檢初級字表中最常見、小學課本會出現的字為主，外加下方學校 LA 單字。
- **難度不自動調整**：只有 Kyro 或家長在回覆中明確說「太難」或「太簡單」時才調一級，並記在 commit 訊息裡。

## 2. 每日固定結構（20 題，順序不可變）

| 區 | 題號 | kind | 說明 |
|---|---|---|---|
| 聽力 | 1–2 | picaudio | 看圖辨義：一張圖＋英文問題 q＋3 個英文選項（選項只用聽的） |
| 聽力 | 3–4 | audioq | 問答：talk 為一句問句，3 個印出的回答選項 |
| 聽力 | 5–6 | dialog | 簡短對話：talk 2～3 句＋問題 q，3 個文字選項 |
| 聽力 | 7–8 | picopts | 短文聽解：talk 一段 25～32 字＋問題 q，3 張圖當選項（pics＋labels） |
| 閱讀 | 1–3 | vocab | 詞彙：stem 含 `____`，4 個選項 |
| 閱讀 | 4–5 | cloze | 段落填空：passage 含 `{1}` `{2}`，各 4 個選項 |
| 閱讀 | 6–8 | text | 閱讀理解：一份短文件＋3 題，各 4 個選項 |
| 寫作 | 1 | rewrite | 改寫 |
| 寫作 | 2 | combine | 合併 |
| 寫作 | 3 | order | 重組（4～6 張字卡，第一個字大寫、最後一張帶標點） |
| 寫作 | 4 | picture | 看圖寫句：3 張 panels＋3 行 lines |

每題都要有中文 `why`（解析）。聽力答案 0–2、閱讀答案 0–3，答案位置要分散。
`focus` 寫一句「今天的重點：……」，`notes` 寫 2～3 個給家長的觀察點。`no` 是第幾天（前一天 +1）。

## 3. 每天輪換（先讀 `data/history.json` 最近 14 天）

- **看圖辨義的圖片類型**：clock、price、position、weather、count、object、calendar 輪流，兩題用不同類型，且不和前一天相同。
- **問答的問句**：What color / Where / Who / How many / How old / What time / When / Can you / Do you / Is this / Are you / What do you … 輪流，最近 5 天用過的句型不要再用。
- **簡短對話主題**：食物、學校、購物、天氣、家人、嗜好、時間、動物、生日、運動、交通 輪流。
- **短文聽解**：公告、自我介紹、物品描述、老師指示、電話留言 輪流；三張圖要明顯不同。
- **詞彙 3 題**：1 題日常名詞或形容詞、1 題學校 LA 單字（見下）、1 題文法（be 動詞、There is/are、第三人稱 -s、can、代名詞、介系詞、a/an、複數）。
- **段落填空文體**：日記、小故事、信、明信片 輪流。
- **閱讀理解文體**（text.genre）：note、notice、menu、schedule、card、message 輪流，不和前兩天相同。
- **改寫**：be 問句、be 否定、can 問句、can 否定、Do/Does 問句、There is/are 問句、現在進行式（is + -ing）輪流。
- **合併**：and、but、or 輪流。
- **看圖寫句**：3 張不同類型的圖，句首各不相同。
- 前一天回覆中答錯的題型，今天放 1 題同類型的新題（換情境，不重複原題）。
- 任何題目文字都不能和最近 30 天重複（build 會檢查）。

## 4. 人物與聲音

人物：Ben（Dad）、Novia（Mom）、Kane（哥哥）、Kyro（主角，常出現），也可以用 Amy、Tom、Ms. Lee 等常見名字。
talk 角色代號：`n` 旁白、`w` 女聲（媽媽、老師）、`m` 男聲（爸爸、老師）、`b` Kyro、`k` Kane、`g` 女孩。

## 5. 圖片規格（只能用這些，見 `app/pics.js`）

| type | 參數 |
|---|---|
| clock | h 1–12、m 只能 0/15/30/45 |
| price | obj、color?、amount 1–999 |
| position | obj、color?、rel、ref：table（on/under/next to）、chair（on/under/next to）、box（on/in/next to）、tree（in/under/next to） |
| weather | w：sunny/rainy/cloudy/snowy/windy |
| count | obj、color?、n 1–9 |
| object | obj、color? |
| calendar | mon（如 NOV）、day、wd（如 FRIDAY） |

obj：apple, banana, orange, ball, book, cat, dog, fish, frog, bird, cake, pencil, umbrella, hat, bottle, box, car, cup, flower, tree, star, house, egg, bag
color：red, blue, green, yellow, orange, pink, purple, brown, black, white, gray, tan

**不能畫人物或動作**，所以題目不要問「他在做什麼」這類需要人物動作圖的問題。

## 6. 學校 LA 單字（Reach Higher 2A Unit 1–2，每天最多用 1～2 個）

job, doctor, teacher, cook, nurse, belong, build, care, community, neighbor, city, hospital, building, school, park, home, library, area, locate, place, animals, insects, habitat, color, shape, size, defend, hide, safe, survive, water, food, shelter, prey, predators, features, attack, attract, recognize, seem

## 7. 寫作答案格式

- `accept` 一律寫「正規化」字串：全小寫、去掉 . , ! ? ; : "，多個空白變一個。
- `model` 是標準答案，大寫開頭、正確標點結尾；`needQ: true` 代表句尾要問號。
- `near` 是常見錯誤：`[正規表示式字串, 中文提示]`，比對對象是正規化後的答案。
- 看圖寫句的 `lines[k].free: true` 代表自由發揮，`accept` 放可以自動判對的幾個答案。

## 8. 原則

- 題目全部原創，不照抄出版社或官方題目，也不宣稱是官方考題。
- 不寫和孩子不適合的內容；情境以家庭、學校、公園、動物、食物為主。
