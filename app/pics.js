/* Kyro 每日英檢｜圖片庫
 * 所有圖片都是 200x150 的 SVG，由「圖片規格」產生：
 *   {type:"clock", h:3, m:30}
 *   {type:"price", obj:"apple", color?:"red", amount:50}
 *   {type:"position", obj:"cat", color?, rel:"on|under|in|next to", ref:"table|chair|box|tree"}
 *   {type:"weather", w:"sunny|rainy|cloudy|snowy|windy"}
 *   {type:"count", obj:"bird", color?, n:1-9}
 *   {type:"object", obj:"hat", color?}
 *   {type:"calendar", mon:"NOV", day:12, wd:"FRIDAY"}
 * 瀏覽器與 Node 都能載入（Node 用來驗證題目資料）。
 */
(function (root) {
  "use strict";

  var COLORS = {
    red: "var(--il-red)", blue: "var(--il-blue)", green: "var(--il-green)", yellow: "var(--il-yellow)",
    orange: "var(--il-orange)", pink: "var(--il-pink)", purple: "var(--il-purple)", brown: "var(--il-brown)",
    black: "var(--il-black)", white: "var(--il-white)", gray: "var(--il-gray)", tan: "var(--il-tan)"
  };
  function col(c, d) { return COLORS[c] || COLORS[d]; }
  function fill(c, d) { return 'style="fill:' + col(c, d) + '"'; }
  function f2(n) { return (Math.round(n * 10) / 10).toString(); }

  /* ---------- objects: local coordinates, centred on (0,0), about 72 x 64 ---------- */
  var OBJ = {
    apple: function (c) {
      return '<path class="s-line" ' + fill(c, "red") + ' d="M0 -20 C -12 -30, -34 -22, -33 2 C -32 26, -14 36, 0 30 C 14 36, 32 26, 33 2 C 34 -22, 12 -30, 0 -20 Z"/>' +
        '<path class="f-none s-line" d="M0 -20 C 0 -26, 2 -30, 5 -34"/>' +
        '<ellipse class="f-green s-line" cx="15" cy="-30" rx="9" ry="4.5" transform="rotate(-25 15 -30)"/>';
    },
    banana: function () {
      return '<path class="f-yellow s-line" d="M-32 -14 C -24 18, 18 26, 34 2 C 31 -1, 28 -1, 25 2 C 12 14, -12 10, -24 -16 Z"/>' +
        '<path class="f-none s-line" d="M-32 -14 L-35 -20"/>';
    },
    orange: function () {
      return '<circle class="f-orange s-line" cx="0" cy="4" r="25"/>' +
        '<path class="f-none s-line" d="M0 -21 L1 -27"/>' +
        '<ellipse class="f-green s-line" cx="10" cy="-26" rx="8" ry="4" transform="rotate(-20 10 -26)"/>' +
        '<circle class="f-ink" cx="-8" cy="0" r="1.2"/><circle class="f-ink" cx="6" cy="12" r="1.2"/>';
    },
    ball: function (c) {
      return '<circle class="s-line" ' + fill(c, "blue") + ' cx="0" cy="0" r="26"/>' +
        '<path class="f-none s-thin" d="M-25 -6 Q0 8 25 -6"/><path class="f-none s-thin" d="M-6 -25 Q8 0 -6 25"/>';
    },
    book: function (c) {
      return '<rect class="s-line" ' + fill(c, "green") + ' x="-30" y="-24" width="60" height="48" rx="3"/>' +
        '<line class="s-thin" x1="-21" y1="-24" x2="-21" y2="24"/>' +
        '<rect class="f-white s-thin" x="-12" y="-12" width="32" height="10" rx="2"/>';
    },
    cat: function (c) {
      var f = fill(c, "orange"), sc = 'style="stroke:' + col(c, "orange") + '"';
      return '<g transform="translate(-8 4)">' +
        '<path class="s-tail" ' + sc + ' d="M32 6 C 50 2, 50 -16, 40 -24"/>' +
        '<ellipse class="s-line" ' + f + ' cx="0" cy="19" rx="6" ry="4"/><ellipse class="s-line" ' + f + ' cx="22" cy="19" rx="6" ry="4"/>' +
        '<ellipse class="s-line" ' + f + ' cx="10" cy="6" rx="26" ry="14"/>' +
        '<polygon class="s-line" ' + f + ' points="-26,-12 -24,-28 -15,-19"/><polygon class="s-line" ' + f + ' points="-13,-19 -4,-28 -2,-12"/>' +
        '<circle class="s-line" ' + f + ' cx="-14" cy="-6" r="14"/>' +
        '<circle class="f-ink" cx="-19" cy="-8" r="2"/><circle class="f-ink" cx="-9" cy="-8" r="2"/>' +
        '<path class="f-none s-thin" d="M-17 -1 Q-14 2 -11 -1"/></g>';
    },
    dog: function (c) {
      var f = fill(c, "tan"), sc = 'style="stroke:' + col(c, "tan") + ';stroke-width:5"';
      return '<g transform="translate(-8 2) scale(1.35)">' +
        '<path class="s-tail" ' + sc + ' d="M24 -2 Q34 -10 32 -18"/>' +
        '<rect class="s-line" ' + f + ' x="-6" y="6" width="7" height="11" rx="2"/><rect class="s-line" ' + f + ' x="15" y="6" width="7" height="11" rx="2"/>' +
        '<ellipse class="s-line" ' + f + ' cx="8" cy="2" rx="18" ry="10"/>' +
        '<circle class="s-line" ' + f + ' cx="-14" cy="-6" r="10"/>' +
        '<ellipse class="f-brown s-line" cx="-11" cy="-10" rx="4" ry="8" transform="rotate(20 -11 -10)"/>' +
        '<circle class="f-ink" cx="-17" cy="-8" r="1.8"/><circle class="f-ink" cx="-24" cy="-4" r="2.2"/></g>';
    },
    fish: function (c) {
      var f = fill(c, "blue");
      return '<g transform="translate(-56 -50)">' +
        '<polygon class="s-line" ' + f + ' points="82,50 104,34 104,66"/>' +
        '<path class="s-line" ' + f + ' d="M44 34 Q56 22 68 33"/>' +
        '<ellipse class="s-line" ' + f + ' cx="52" cy="50" rx="32" ry="19"/>' +
        '<circle class="f-white s-line" cx="36" cy="45" r="5"/><circle class="f-ink" cx="35" cy="45" r="2.2"/>' +
        '<path class="f-none s-thin" d="M21 54 Q25 57 29 54"/></g>';
    },
    frog: function (c) {
      var f = fill(c, "green");
      return '<g transform="translate(-60 -60)">' +
        '<ellipse class="s-line" ' + f + ' cx="30" cy="80" rx="15" ry="7"/><ellipse class="s-line" ' + f + ' cx="90" cy="80" rx="15" ry="7"/>' +
        '<ellipse class="s-line" ' + f + ' cx="60" cy="63" rx="34" ry="22"/>' +
        '<ellipse class="f-lime" cx="60" cy="70" rx="20" ry="11"/>' +
        '<circle class="s-line" ' + f + ' cx="44" cy="40" r="12"/><circle class="s-line" ' + f + ' cx="76" cy="40" r="12"/>' +
        '<circle class="f-white" cx="44" cy="40" r="6.5"/><circle class="f-white" cx="76" cy="40" r="6.5"/>' +
        '<circle class="f-ink" cx="45" cy="41" r="3"/><circle class="f-ink" cx="77" cy="41" r="3"/>' +
        '<path class="f-none s-line" d="M46 58 Q60 68 74 58"/></g>';
    },
    bird: function (c) {
      var f = fill(c, "blue");
      return '<line class="s-line" x1="-4" y1="18" x2="-4" y2="28"/><line class="s-line" x1="6" y1="18" x2="6" y2="28"/>' +
        '<polygon class="s-line" ' + f + ' points="-18,0 -36,-10 -34,10"/>' +
        '<ellipse class="s-line" ' + f + ' cx="0" cy="4" rx="22" ry="16"/>' +
        '<circle class="s-line" ' + f + ' cx="18" cy="-12" r="11"/>' +
        '<polygon class="f-orange s-line" points="28,-15 39,-11 28,-7"/>' +
        '<circle class="f-ink" cx="21" cy="-14" r="2"/>' +
        '<path class="f-none s-line" d="M-10 0 Q2 -10 12 4"/>';
    },
    cake: function () {
      return '<rect class="f-tan s-line" x="-30" y="-6" width="60" height="30" rx="4"/>' +
        '<path class="f-pink s-line" d="M-30 -2 V-12 Q-30 -16 -26 -16 H26 Q30 -16 30 -12 V-2 Q24 4 18 -2 Q12 4 6 -2 Q0 4 -6 -2 Q-12 4 -18 -2 Q-24 4 -30 -2 Z"/>' +
        '<rect class="f-blue s-line" x="-3" y="-34" width="6" height="18" rx="1"/>' +
        '<ellipse class="f-yellow s-thin" cx="0" cy="-40" rx="3.5" ry="5"/>';
    },
    pencil: function (c) {
      return '<g transform="rotate(-20)"><rect class="f-pink s-line" x="-40" y="-7" width="8" height="14" rx="2"/>' +
        '<rect class="s-line" ' + fill(c, "yellow") + ' x="-32" y="-7" width="50" height="14"/>' +
        '<polygon class="f-tan s-line" points="18,-7 34,0 18,7"/><polygon class="f-ink" points="29,-2.4 34,0 29,2.4"/></g>';
    },
    umbrella: function (c) {
      return '<g transform="translate(-60 -52)">' +
        '<path class="f-none s-line" d="M60 24 L60 16"/>' +
        '<path class="f-none s-line" style="stroke-width:4" d="M60 54 L60 82 Q60 90 52 90 Q45 90 45 83"/>' +
        '<path class="s-line" ' + fill(c, "red") + ' d="M12 54 Q60 -2 108 54 Q96 46 84 54 Q72 46 60 54 Q48 46 36 54 Q24 46 12 54 Z"/></g>';
    },
    hat: function (c) {
      var f = fill(c, "yellow");
      return '<ellipse class="s-line" ' + f + ' cx="0" cy="12" rx="34" ry="9"/>' +
        '<path class="s-line" ' + f + ' d="M-19 12 A19 19 0 0 1 19 12 Z"/>' +
        '<path class="s-band" d="M-18 5 Q0 0 18 5"/>';
    },
    bottle: function (c) {
      var f = fill(c, "blue");
      return '<rect class="s-line" ' + f + ' x="-9" y="-36" width="18" height="12" rx="3"/>' +
        '<rect class="f-sky s-line" x="-15" y="-25" width="30" height="58" rx="9"/>' +
        '<rect ' + f + ' x="-11" y="-2" width="22" height="31" rx="6"/>';
    },
    box: function () {
      return '<polygon class="f-tan2 s-line" points="-30,-12 -18,-24 38,-24 26,-12"/>' +
        '<polygon class="f-tan3 s-line" points="26,-12 38,-24 38,16 26,28"/>' +
        '<rect class="f-tan s-line" x="-30" y="-12" width="56" height="40"/>';
    },
    car: function (c) {
      var f = fill(c, "red");
      return '<path class="s-line" ' + f + ' d="M-22 -6 L-13 -22 L14 -22 L25 -6 Z"/>' +
        '<polygon class="f-sky s-thin" points="-15,-8 -10,-18 10,-18 17,-8"/>' +
        '<rect class="s-line" ' + f + ' x="-37" y="-7" width="74" height="21" rx="7"/>' +
        '<circle class="f-ink" cx="-20" cy="16" r="8"/><circle class="f-ink" cx="20" cy="16" r="8"/>' +
        '<circle class="f-white" cx="-20" cy="16" r="3"/><circle class="f-white" cx="20" cy="16" r="3"/>';
    },
    cup: function (c) {
      return '<path class="f-none s-line" style="stroke-width:5" d="M18 -10 C 34 -10, 34 12, 16 12"/>' +
        '<path class="s-line" ' + fill(c, "blue") + ' d="M-20 -18 L20 -18 L16 22 L-16 22 Z"/>' +
        '<path class="f-none s-thin" d="M-6 -24 Q-10 -30 -6 -36"/><path class="f-none s-thin" d="M6 -24 Q2 -30 6 -36"/>';
    },
    flower: function (c) {
      var f = fill(c, "pink"), s = '<line class="s-stem" x1="0" y1="2" x2="0" y2="34"/>' +
        '<ellipse class="f-green s-line" cx="9" cy="22" rx="8" ry="4" transform="rotate(-30 9 22)"/>';
      for (var k = 0; k < 5; k++) {
        var a = (k * 72 - 90) * Math.PI / 180;
        s += '<circle class="s-line" ' + f + ' cx="' + f2(11 * Math.cos(a)) + '" cy="' + f2(-10 + 11 * Math.sin(a)) + '" r="9"/>';
      }
      return s + '<circle class="f-yellow s-line" cx="0" cy="-10" r="7"/>';
    },
    tree: function () {
      return '<rect class="f-brown s-line" x="-7" y="0" width="14" height="34" rx="2"/>' +
        '<circle class="f-green s-line" cx="-17" cy="-4" r="16"/><circle class="f-green s-line" cx="17" cy="-4" r="16"/>' +
        '<circle class="f-green s-line" cx="0" cy="-18" r="22"/>';
    },
    star: function (c) {
      var pts = [];
      for (var k = 0; k < 10; k++) {
        var r = k % 2 ? 12 : 28, a = (k * 36 - 90) * Math.PI / 180;
        pts.push(f2(r * Math.cos(a)) + "," + f2(2 + r * Math.sin(a)));
      }
      return '<polygon class="s-line" ' + fill(c, "yellow") + ' points="' + pts.join(" ") + '"/>';
    },
    house: function (c) {
      return '<rect class="f-tan2 s-line" x="-26" y="-6" width="52" height="38"/>' +
        '<polygon class="s-line" ' + fill(c, "red") + ' points="-34,-6 0,-34 34,-6"/>' +
        '<rect class="f-brown s-line" x="-7" y="12" width="14" height="20"/>' +
        '<rect class="f-sky s-line" x="9" y="2" width="12" height="12"/>';
    },
    egg: function () {
      return '<ellipse class="f-white s-line" cx="0" cy="2" rx="19" ry="25"/>';
    },
    bag: function (c) {
      var f = fill(c, "purple");
      return '<path class="f-none s-line" style="stroke-width:4" d="M-12 -18 Q-12 -34 0 -34 Q12 -34 12 -18"/>' +
        '<rect class="s-line" ' + f + ' x="-26" y="-20" width="52" height="50" rx="10"/>' +
        '<path class="s-line" ' + f + ' d="M-26 -6 Q0 8 26 -6 L26 -10 Q26 -20 16 -20 L-16 -20 Q-26 -20 -26 -10 Z"/>' +
        '<rect class="f-yellow s-thin" x="-4" y="0" width="8" height="8" rx="2"/>';
    }
  };
  var OBJ_NAMES = Object.keys(OBJ);
  /* how far each object reaches below its centre, so it can stand on a surface */
  var BOTTOM = { apple: 36, banana: 20, orange: 29, ball: 26, book: 24, cat: 27, dog: 25, fish: 19, frog: 27, bird: 28, cake: 24,
    pencil: 13, umbrella: 40, hat: 21, bottle: 33, box: 28, car: 24, cup: 22, flower: 34, tree: 34, star: 25, house: 32, egg: 27, bag: 30 };
  function stand(obj, color, x, surface, s) { return place(obj, color, x, surface - (BOTTOM[obj] || 28) * s, s); }

  function place(obj, color, x, y, s) {
    return '<g transform="translate(' + f2(x) + ' ' + f2(y) + ') scale(' + s + ')">' + OBJ[obj](color) + '</g>';
  }
  function svg(inner, label) {
    return '<svg viewBox="0 0 200 150" role="img" aria-label="' + (label || "圖") + '">' + inner + '</svg>';
  }
  function floor() { return '<line class="s-line" x1="8" y1="138" x2="192" y2="138"/>'; }
  function grass() { return '<rect class="f-grass" x="0" y="130" width="200" height="20"/>'; }
  function cloud(x, y, s, cls) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path class="s-line ' + (cls || "f-white") + '" d="M-40 10 Q-46 -8 -26 -10 Q-22 -28 -2 -24 Q10 -36 24 -22 Q44 -22 40 -4 Q52 8 36 14 Z"/></g>';
  }
  function drop(x, y) { return '<path class="f-blue" d="M' + x + ' ' + y + ' q5 8 0 11 q-5 -3 0 -11z"/>'; }
  function flake(x, y) {
    return '<g class="s-thin"><line x1="' + (x - 5) + '" y1="' + y + '" x2="' + (x + 5) + '" y2="' + y + '"/><line x1="' + x + '" y1="' + (y - 5) + '" x2="' + x + '" y2="' + (y + 5) + '"/><line x1="' + (x - 3.5) + '" y1="' + (y - 3.5) + '" x2="' + (x + 3.5) + '" y2="' + (y + 3.5) + '"/><line x1="' + (x - 3.5) + '" y1="' + (y + 3.5) + '" x2="' + (x + 3.5) + '" y2="' + (y - 3.5) + '"/></g>';
  }

  /* ---------- picture types ---------- */
  function clock(p) {
    var s = '<circle class="f-white s-line" style="stroke-width:5" cx="100" cy="75" r="62"/>';
    for (var k = 1; k <= 12; k++) {
      var a = k * 30 * Math.PI / 180;
      s += '<text class="clk-num" x="' + f2(100 + 47 * Math.sin(a)) + '" y="' + f2(75 - 47 * Math.cos(a) + 5) + '">' + k + '</text>';
    }
    var ha = ((p.h % 12) + p.m / 60) * 30 * Math.PI / 180, ma = p.m * 6 * Math.PI / 180;
    s += '<line class="s-hand" style="stroke-width:7" x1="100" y1="75" x2="' + f2(100 + 26 * Math.sin(ha)) + '" y2="' + f2(75 - 26 * Math.cos(ha)) + '"/>';
    s += '<line class="s-hand" style="stroke-width:4" x1="100" y1="75" x2="' + f2(100 + 42 * Math.sin(ma)) + '" y2="' + f2(75 - 42 * Math.cos(ma)) + '"/>';
    s += '<circle class="f-ink" cx="100" cy="75" r="5"/>';
    return svg(s, "時鐘");
  }
  function price(p) {
    var s = '<path class="f-none s-thin" d="M70 34 C 96 22, 112 48, 121 72"/>' + place(p.obj, p.color, 64, 80, 1.25) +
      '<path class="f-yellow s-line" d="M124 50 H192 V100 H124 L110 75 Z"/>' +
      '<circle class="f-white s-line" cx="124" cy="75" r="4"/>' +
      '<text class="tag-txt" x="160" y="' + (p.amount >= 100 ? 83 : 84) + '"' + (p.amount >= 100 ? ' style="font-size:18px"' : '') + '>$' + p.amount + '</text>';
    return svg(s, "價錢");
  }
  function chairShape(dx) {
    return '<g transform="translate(' + dx + ' 0)"><rect class="f-brown s-line" x="70" y="30" width="10" height="108"/>' +
      '<rect class="f-brown s-line" x="120" y="94" width="10" height="44"/>' +
      '<rect class="f-brown s-line" x="70" y="84" width="60" height="10" rx="2"/></g>';
  }
  function tableShape(dx) {
    return '<g transform="translate(' + dx + ' 0)"><rect class="f-brown s-line" x="40" y="62" width="10" height="76"/><rect class="f-brown s-line" x="150" y="62" width="10" height="76"/>' +
      '<rect class="f-brown s-line" x="28" y="50" width="144" height="12" rx="3"/></g>';
  }
  function bigTree(dx) {
    return '<g transform="translate(' + dx + ' 0)"><rect class="f-brown s-line" x="112" y="68" width="16" height="70" rx="2"/>' +
      '<circle class="f-green s-line" cx="98" cy="62" r="26"/><circle class="f-green s-line" cx="142" cy="62" r="26"/><circle class="f-green s-line" cx="120" cy="40" r="32"/></g>';
  }
  function position(p) {
    var o = p.obj, c = p.color, r = p.rel, s = "";
    if (p.ref === "table") {
      s += floor();
      if (r === "on") s += tableShape(0) + stand(o, c, 100, 50, 0.7);
      else if (r === "under") s += tableShape(0) + stand(o, c, 100, 136, 0.7);
      else s += tableShape(-26) + stand(o, c, 170, 136, 0.68);
    } else if (p.ref === "chair") {
      s += floor();
      if (r === "on") s += chairShape(0) + stand(o, c, 106, 84, 0.62);
      else if (r === "under") s += chairShape(0) + stand(o, c, 100, 136, 0.5);
      else s += chairShape(-40) + stand(o, c, 160, 136, 0.7);
    } else if (p.ref === "box") {
      s += floor();
      if (r === "on") s += '<g transform="translate(96 104) scale(1.3)">' + OBJ.box() + '</g>' + stand(o, c, 100, 82, 0.7);
      else if (r === "in") {
        s += '<g transform="translate(96 104) scale(1.3)"><polygon class="f-tan3 s-line" points="-30,-12 -18,-24 38,-24 26,-12"/></g>' +
          place(o, c, 100, 74, 0.7) +
          '<g transform="translate(96 104) scale(1.3)"><polygon class="f-tan3 s-line" points="26,-12 38,-24 38,16 26,28"/><rect class="f-tan s-line" x="-30" y="-12" width="56" height="40"/></g>';
      } else s += '<g transform="translate(64 108) scale(1.1)">' + OBJ.box() + '</g>' + stand(o, c, 160, 136, 0.7);
    } else if (p.ref === "tree") {
      s += grass();
      if (r === "under") s += bigTree(0) + stand(o, c, 82, 134, 0.6);
      else if (r === "in") s += bigTree(0) + place(o, c, 122, 42, 0.55);
      else s += bigTree(-48) + stand(o, c, 164, 134, 0.7);
    }
    return svg(s, "位置");
  }
  function weather(p) {
    var s = "", w = p.w;
    if (w === "sunny") {
      for (var k = 0; k < 8; k++) {
        var a = k * Math.PI / 4;
        s += '<line class="s-ray" x1="' + f2(100 + 36 * Math.cos(a)) + '" y1="' + f2(75 + 36 * Math.sin(a)) + '" x2="' + f2(100 + 50 * Math.cos(a)) + '" y2="' + f2(75 + 50 * Math.sin(a)) + '"/>';
      }
      s += '<circle class="f-yellow s-line" cx="100" cy="75" r="27"/>';
    } else if (w === "rainy") {
      s += cloud(100, 50, 1.3, "f-gray") + drop(62, 90) + drop(86, 104) + drop(110, 92) + drop(134, 106) + drop(74, 122) + drop(122, 124);
    } else if (w === "cloudy") {
      s += cloud(128, 46, 0.9, "f-gray") + cloud(86, 82, 1.35, "f-white");
    } else if (w === "snowy") {
      s += cloud(100, 50, 1.3, "f-white") + flake(64, 96) + flake(92, 110) + flake(120, 96) + flake(144, 114) + flake(78, 128) + flake(112, 130);
    } else if (w === "windy") {
      s += '<path class="f-none s-line" style="stroke-width:4" d="M18 48 Q70 30 116 48 Q150 60 142 36 Q136 22 122 32"/>' +
        '<path class="f-none s-line" style="stroke-width:4" d="M30 82 Q90 66 170 84"/>' +
        '<path class="f-none s-line" style="stroke-width:4" d="M14 112 Q70 98 110 112 Q140 122 136 104"/>' +
        '<ellipse class="f-green s-line" cx="160" cy="58" rx="9" ry="5" transform="rotate(-30 160 58)"/>' +
        '<ellipse class="f-orange s-line" cx="176" cy="112" rx="9" ry="5" transform="rotate(25 176 112)"/>';
    }
    return svg(s, "天氣");
  }
  function count(p) {
    var n = p.n, cols = n <= 3 ? n : (n <= 6 ? 3 : (n <= 8 ? 4 : 3)), rows = Math.ceil(n / cols);
    var cw = 196 / cols, ch = 140 / rows, sc = Math.min(cw / 84, ch / 76, 0.9), s = "";
    for (var i = 0; i < n; i++) {
      var r = Math.floor(i / cols), k = i % cols;
      var inRow = Math.min(cols, n - r * cols), off = (cols - inRow) * cw / 2;
      s += place(p.obj, p.color, 2 + off + cw * (k + 0.5), 5 + ch * (r + 0.5), f2(sc));
    }
    return svg(s, "數量");
  }
  function object(p) { return svg(place(p.obj, p.color, 100, 78, 1.6), "物品"); }
  function calendar(p) {
    var s = '<rect class="f-white s-line" x="56" y="16" width="88" height="124" rx="6"/>' +
      '<rect class="f-red s-line" x="56" y="16" width="88" height="30" rx="6"/>' +
      '<circle class="f-ink" cx="78" cy="16" r="3.5"/><circle class="f-ink" cx="122" cy="16" r="3.5"/>' +
      '<text class="cal-mon" x="100" y="37">' + esc(p.mon) + '</text>' +
      '<text class="cal-day" x="100" y="104">' + esc(String(p.day)) + '</text>' +
      '<text class="cal-wd" x="100" y="128">' + esc(p.wd) + '</text>';
    return svg(s, "日曆");
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  var TYPES = { clock: clock, price: price, position: position, weather: weather, count: count, object: object, calendar: calendar };
  var RELS = { table: ["on", "under", "next to"], chair: ["on", "under", "next to"], box: ["on", "in", "next to"], tree: ["in", "under", "next to"] };
  var WEATHER = ["sunny", "rainy", "cloudy", "snowy", "windy"];

  function validate(p) {
    if (!p || typeof p !== "object") return "圖片規格不是物件";
    if (!TYPES[p.type]) return "未知圖片類型：" + p.type;
    var needObj = ["price", "position", "count", "object"];
    if (needObj.indexOf(p.type) >= 0 && !OBJ[p.obj]) return "未知物品：" + p.obj + "（可用：" + OBJ_NAMES.join(", ") + "）";
    if (p.color && !COLORS[p.color]) return "未知顏色：" + p.color;
    if (p.type === "clock") { if (!(p.h >= 1 && p.h <= 12) || [0, 15, 30, 45].indexOf(p.m) < 0) return "時鐘 h 需 1-12、m 需 0/15/30/45"; }
    if (p.type === "price") { if (!(p.amount > 0 && p.amount < 1000)) return "價錢需 1-999"; }
    if (p.type === "position") { if (!RELS[p.ref]) return "未知參考物：" + p.ref; if (RELS[p.ref].indexOf(p.rel) < 0) return p.ref + " 只能用：" + RELS[p.ref].join(", "); }
    if (p.type === "weather") { if (WEATHER.indexOf(p.w) < 0) return "天氣需為：" + WEATHER.join(", "); }
    if (p.type === "count") { if (!(p.n >= 1 && p.n <= 9)) return "數量需 1-9"; }
    if (p.type === "calendar") { if (!p.mon || !p.day || !p.wd) return "日曆需 mon/day/wd"; }
    return null;
  }
  function render(p) {
    var e = validate(p);
    if (e) throw new Error(e);
    return TYPES[p.type](p);
  }

  var api = { render: render, validate: validate, OBJECTS: OBJ_NAMES, COLORS: Object.keys(COLORS), RELS: RELS, WEATHER: WEATHER, TYPES: Object.keys(TYPES) };
  root.KyroPics = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
