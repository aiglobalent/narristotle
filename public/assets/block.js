/* THE WRITER'S BLOCK — all tools 100% client-side. No network calls beyond the page itself. */
(function () {
  "use strict";
  var RDM = "https://roughdraftmaker.com/?source=play&mode=novel&prompt=";
  function rdmUrl(prompt) { return RDM + encodeURIComponent(prompt); }
  function $(id) { return document.getElementById(id); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function clean(s) { return (s || "").trim().replace(/[.\s]+$/, ""); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* ---------- street navigation ---------- */
  document.querySelectorAll("[data-goto]").forEach(function (b) {
    b.addEventListener("click", function () {
      var el = $(b.getAttribute("data-goto"));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  document.querySelectorAll("[data-top]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  /* ================= THE CUT-UP CAFE ================= */
  var SAMPLE = "The lighthouse keeper had not spoken to another living soul since the ferry stopped running in October. " +
    "Every morning she polished the great lens as if the fog were a debt she intended to repay. " +
    "The stranger arrived on a Tuesday with no luggage and a key that fit her door. " +
    "He claimed the sea had taken his name, so the town would have to lend him one. " +
    "June hid the letter from the mainland in the flour tin where she kept all dangerous things. " +
    "By Friday, three gulls had learned to knock at the window for bread. " +
    "The radio, which had been silent for a decade, began to read the weather in her mother's voice. " +
    "She decided that if the light could not save the ships, it could at least warn them.";

  var HOOKS = { and: 1, but: 1, or: 1, yet: 1, so: 1, because: 1, when: 1, while: 1, until: 1, before: 1,
    after: 1, as: 1, if: 1, though: 1, although: 1, since: 1, with: 1, into: 1, through: 1, from: 1,
    who: 1, which: 1, that: 1, where: 1, once: 1, unless: 1, like: 1 };

  function splitSentences(text) {
    var flat = text.replace(/\s+/g, " ").trim();
    var m = flat.match(/[^.!?…]+[.!?…]+["'”’)]?\s*/g) || [];
    var out = m.map(function (s) { return s.trim(); }).filter(Boolean);
    var used = m.join(" ").length;
    if (flat.length > used + 3) {
      var rest = flat.slice(used).trim();
      if (rest) out.push(rest);
    }
    if (!out.length && flat) out = [flat];
    return out.slice(0, 9);
  }

  function splitHalf(sentence) {
    var words = sentence.split(/\s+/).filter(Boolean);
    if (words.length < 4) return [sentence, ""];
    var n = words.length, lo = Math.ceil(n * 0.3), hi = Math.floor(n * 0.7), best = -1, bestScore = 1e9;
    for (var i = lo; i <= hi; i++) {
      var w = (words[i] || "").toLowerCase().replace(/[^a-z'-]/g, "");
      var prevComma = /,$/.test(words[i - 1] || "");
      if (HOOKS[w] || prevComma) {
        var score = Math.abs(i - n / 2) - (prevComma ? 0.4 : 0);
        if (score < bestScore) { bestScore = score; best = i; }
      }
    }
    if (best < 1) best = Math.round(n / 2);
    return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
  }

  var cafe = { lefts: [], rights: [], offset: 0, center: 0, sparks: [] };

  function collided() {
    var ri = cafe.center + cafe.offset;
    var L = (cafe.lefts[cafe.center] || "").trim();
    var R = (cafe.rights[ri] || "").trim();
    if (!L) return "";
    var out = L + (R ? " " + R : "");
    out = cap(out);
    if (!/[.!?…]["'”’]?$/.test(out)) out += ".";
    return out;
  }

  function rowH() {
    var h = document.querySelector("#leftCol .half");
    return h ? h.offsetHeight : 58;
  }

  function renderCafe() {
    var N = cafe.lefts.length;
    var lc = $("leftCol"); lc.innerHTML = "";
    cafe.lefts.forEach(function (t, i) {
      var d = document.createElement("div");
      d.className = "half left" + (i === cafe.center ? " focus" : "");
      d.textContent = t;
      lc.appendChild(d);
    });
    var track = $("rTrack"); track.innerHTML = "";
    for (var i = 0; i < N; i++) {
      var ri = i + cafe.offset;
      var d2 = document.createElement("div");
      var has = ri >= 0 && ri < N && cafe.rights[ri];
      d2.className = "half right" + (has ? "" : " blank") + (i === cafe.center ? " focus" : "");
      d2.textContent = has ? cafe.rights[ri] : "";
      track.appendChild(d2);
    }
    track.style.transform = "translateY(0px)";
    var c = collided();
    $("focusText").textContent = c || "—";
    $("sparkSend").href = c ? rdmUrl(c) : "https://roughdraftmaker.com";
  }

  function clampOffset() {
    var N = cafe.lefts.length;
    var lo = -cafe.center, hi = N - 1 - cafe.center;
    cafe.offset = Math.max(lo, Math.min(hi, cafe.offset));
  }

  function sliceDraft() {
    var text = $("draft").value;
    var sents = splitSentences(text);
    if (sents.length < 2) {
      alert("The Slicer needs at least two sentences to rip. Paste a little more of the draft — or load the sample.");
      return;
    }
    cafe.lefts = []; cafe.rights = [];
    sents.forEach(function (s) {
      var h = splitHalf(s);
      cafe.lefts.push(h[0]); cafe.rights.push(h[1]);
    });
    cafe.center = Math.floor(sents.length / 2);
    cafe.offset = 0;
    $("tableWrap").style.display = "block";
    renderCafe();
    $("tableWrap").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  $("sampleBtn").addEventListener("click", function () { $("draft").value = SAMPLE; sliceDraft(); });
  $("sliceBtn").addEventListener("click", sliceDraft);
  $("slideDown").addEventListener("click", function () { cafe.offset -= 1; clampOffset(); renderCafe(); });
  $("slideUp").addEventListener("click", function () { cafe.offset += 1; clampOffset(); renderCafe(); });
  $("shuffleBtn").addEventListener("click", function () {
    for (var i = cafe.rights.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = cafe.rights[i]; cafe.rights[i] = cafe.rights[j]; cafe.rights[j] = t;
    }
    cafe.offset = 0; renderCafe();
  });
  $("saveSpark").addEventListener("click", function () {
    var c = collided();
    if (!c || cafe.sparks.indexOf(c) >= 0) return;
    cafe.sparks.unshift(c);
    var ul = $("sparksList"); ul.innerHTML = "";
    cafe.sparks.forEach(function (s) {
      var li = document.createElement("li");
      var span = document.createElement("span"); span.textContent = s;
      var a = document.createElement("a");
      a.href = rdmUrl(s); a.target = "_blank"; a.rel = "noopener"; a.textContent = "Make it a story →";
      li.appendChild(span); li.appendChild(a); ul.appendChild(li);
    });
    $("sparksBox").style.display = "block";
  });

  /* drag the right strip */
  (function () {
    var wrap = $("rWrap"), drag = null;
    wrap.addEventListener("pointerdown", function (e) {
      if (!cafe.lefts.length) return;
      drag = { y: e.clientY, off: cafe.offset };
      wrap.setPointerCapture(e.pointerId);
    });
    wrap.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dy = e.clientY - drag.y, rh = rowH();
      var maxShift = rh * 0.9;
      var px = Math.max(-maxShift, Math.min(maxShift, dy));
      /* the render already reflects drag.off; the transform previews one step of slide */
      $("rTrack").style.transform = "translateY(" + px + "px)";
      drag.dy = px;
    });
    function endDrag() {
      if (!drag) return;
      var rh = rowH();
      var steps = Math.round((drag.dy || 0) / rh); /* one step per gesture, past the half-row */
      cafe.offset = drag.off - steps; /* dragging down brings earlier endings down into place */
      clampOffset();
      drag = null;
      renderCafe();
    }
    wrap.addEventListener("pointerup", endDrag);
    wrap.addEventListener("pointercancel", endDrag);
  })();

  /* ================= THE PITCH BAR ================= */
  $("fixPitch").addEventListener("click", function () {
    var hero = clean($("pf1").value), world = clean($("pf2").value), twist = clean($("pf3").value),
        must = clean($("pf4").value), cost = clean($("pf5").value);
    if (!hero || !world || !twist || !must || !cost) {
      $("pitchNote").textContent = "All five blanks, writer. A pitch with a hole in it is just a rumor.";
      return;
    }
    var pitch = "In " + world + " lives " + hero + ". Then " + twist + ". " +
      "To set it right, they must " + must + ", even if it means " + cost + ".";
    pitch = pitch.replace(/\.\./g, ".");
    $("pitchOut").textContent = pitch;
    var send = $("pitchSend");
    send.href = rdmUrl(pitch); send.style.display = "inline-block";
    $("pitchNote").textContent = "Three sentences. Say it out loud once — that's the workshop test.";
  });
  $("copyPitch").addEventListener("click", function () {
    var t = $("pitchOut").textContent;
    if (!t) { $("pitchNote").textContent = "Fix the pitch first, then copy it."; return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () { $("pitchNote").textContent = "Copied. Go say it like you mean it."; });
    }
  });

  /* ================= THE TOWN ALMANAC ================= */
  var T_HEAD = ["Cedar", "Port", "Fort", "Mount", "Elk", "Juniper", "Hollis", "Marigold", "Gravel", "Verdigris", "Tamarack", "Soda"];
  var T_TAIL = ["Falls", "Crossing", "Hollow", "Springs", "Bend", "Flats", "Junction", "Creek", "Bluff", "Switch"];
  var T_STATE = ["Kansas", "Vermont", "West Virginia", "Oregon", "Mississippi", "New Mexico", "Maine", "Iowa", "the Texas Panhandle", "upstate New York"];
  var T_IND = ["the county's last typewriter-ribbon factory, holding on out of spite",
    "a turkey processing plant that employs everyone and feeds almost no one locally",
    "a state seed vault, and the three families who guard its schedule",
    "a button factory that switched to poker chips in 1994 and never told the sign painter",
    "the regional DMV, a water tower, and a high school with a suspiciously good jazz band",
    "a failing outlet mall anchored by a tax office and a store that only sells calendars",
    "a marble quarry that ships headstones to four states",
    "a cannery that labels everything 'fancy' and answers no questions",
    "a wind farm the town voted for twice and complains about daily",
    "a paper mill that smells like boiled cabbage and pays for the public library",
    "the world's third-largest ball of twine (contested), and the gift shop attached to it"];
  var T_BIZ = ["Darlene's Taxidermy & Tanning — 'You got it, we stuff it; walk-ins tan free on Tuesdays'",
    "Hooked for Life, a combination bait shop and wedding chapel",
    "The Night Deposit — a locksmith who works only after midnight, cash only",
    "Pruitt's Clock Repair & Lie Detection, est. 1978 — one chair per service",
    "a drive-thru prayer window behind the car wash, tips appreciated",
    "Mabel's House of Maps — maps of places that no longer exist, nothing else",
    "a pet grooming salon with a two-month waitlist and a bouncer named Tiny",
    "The Second Notice, a stationery store run by a retired collections agent",
    "an ear-piercing studio inside a hearing-aid office, sharing one waiting room",
    "Gus's Bait, Tackle & Notary Public",
    "a funeral home with a drive-in movie screen on the back wall — double features Fridays",
    "one courthouse vending machine that dispenses only hard-boiled eggs and, once, a harmonica"];
  var T_RUMOR = ["the mayor's wife vanished in 1983, leaving a roast in the oven and a note that said 'back by six'",
    "every dog in town barked at 3:13 a.m. for one week in 1997, then never again",
    "the water tower was painted the wrong color in 1974; the painter was never seen again, and the tower is still that color",
    "a man in a gray suit photographs the grain elevator every spring, and nobody has ever asked him why",
    "the 1962 championship trophy was stolen, returned, and stolen again — the display case is empty by tradition",
    "the last train stopped in 1979 for exactly four minutes, let off nobody, and took one passenger the conductor refused to name",
    "someone keeps leaving dimes on the war memorial, in stacks of eleven, always on Thursdays",
    "the lake froze in a perfect circle the winter the Hartmann twins were born",
    "a radio station that went off the air in 1988 still broadcasts the farm report on one frequency, some nights",
    "the town clock has run eleven minutes fast since the fire, and the council votes every year to keep it that way"];
  var T_DRINK = ["the back bar at the VFW, where the jukebox has exactly one working letter",
    "Suds & Sorrows, the bar attached to the laundromat — your wash buys your first round",
    "the bowling alley lounge, the only place in town with a liquor license and working air conditioning",
    "a converted grain silo called The Hollow Leg",
    "the Moose Lodge, if your grandfather vouches for you and brings the key",
    "an establishment legally named The Office, so everyone can say they're staying late at it",
    "the pastor's brother's barn — BYOB, hymns optional after ten"];

  var lastTown = null;
  $("spinMap").addEventListener("click", function () {
    var name = pick(T_HEAD) + " " + pick(T_TAIL);
    var state = pick(T_STATE);
    var pop = (214 + Math.floor(Math.random() * 18186)).toLocaleString("en-US");
    var ind = pick(T_IND), biz = pick(T_BIZ), rumor = pick(T_RUMOR), drink = pick(T_DRINK);
    $("townName").textContent = name + ", " + state;
    $("townCounty").textContent = "From the county almanac, page " + (40 + Math.floor(Math.random() * 160));
    $("townPop").textContent = pop;
    $("townInd").textContent = cap(ind) + ".";
    $("townBiz").textContent = cap(biz) + ".";
    $("townRumor").textContent = "They say " + rumor + ".";
    $("townDrink").textContent = cap(drink) + ".";
    $("townCard").style.display = "block";
    lastTown = "A story set in " + name + ", " + state + " (population " + pop + "), where the main industry is " +
      ind + ". The strangest business in town is " + biz + ". Local rumor: " + rumor + ". After dark, everybody ends up at " + drink + ".";
    var send = $("townSend");
    send.href = rdmUrl(lastTown); send.style.display = "inline-block";
    $("townCard").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  /* ================= THE NAME APOTHECARY ================= */
  var A_FIRST = ["Wanda", "Cletus", "Marlowe", "Ines", "Hollis", "Pearl", "Gus", "Tammy-Lynn", "Ezra", "Beulah",
    "Nico", "Fern", "Doyle", "Alma", "Rufus", "Opal", "Silas", "Juanita", "Emmett", "Lorraine"];
  var A_LAST = ["Pruitt", "Kowalski", "Delacroix", "Hennig", "Okafor", "Trout", "Vane", "Mulligan", "Satterfield",
    "Reyes", "Holloway", "Grubb", "Fenstermacher", "Baranski", "Trueblood", "Meriwether", "Slade", "Quimby", "Harkness"];
  var A_JOB = ["night-shift Zamboni driver at a rink that seats 400 and draws 40",
    "the courthouse sketch artist, kept on a very slow retainer",
    "a traveling knife sharpener with a route older than the interstate",
    "the mall's off-season Santa wrangler",
    "a lightning-rod installer who is afraid of heights, but only on Tuesdays",
    "the last full-time typewriter repair tech in the county",
    "a toll-booth operator on a bridge everyone avoids",
    "the voice of the high-school PA system, twenty-two years running",
    "the lighthouse relief keeper, two weekends a month",
    "a carousel operator who knows every horse's name and backstory",
    "the county fair's butter-sculpture judge",
    "a beekeeper who rents hives to orchards and enemies alike",
    "the projectionist at a drive-in that shows one movie per season",
    "a funeral-home cosmetologist with a five-star rating and no website"];
  var A_SECRET = ["has been faking a British accent at work for six years and cannot stop now",
    "hoards expired coupons and trades them like currency",
    "secretly writes fan fiction in which the mayor is a werewolf",
    "is the anonymous author of the town's beloved restaurant column — and has reviewed their own workplace twice",
    "still owes the library $412 in fines under a childhood nickname",
    "won a regional polka championship in 2009 and tells absolutely no one",
    "keeps a ranked, color-coded spreadsheet of everyone who has ever wronged them",
    "has never actually read the book their book club is named after",
    "was the high-school mascot for exactly one game in 1998 and considers it their peak",
    "practices acceptance speeches in the shower for an award that does not exist",
    "is the one who has been leaving the dimes on the war memorial",
    "bids against themself at silent auctions to drive up the price of their own donated items"];

  function drawCharacter() {
    var name = pick(A_FIRST) + " " + pick(A_LAST);
    var job = pick(A_JOB), secret = pick(A_SECRET);
    return { name: name, job: job, secret: secret,
      prompt: name + " is a " + job + " who " + secret + "." };
  }

  $("pullDrawers").addEventListener("click", function () {
    var cab = $("cabinet"); cab.innerHTML = "";
    for (var k = 0; k < 3; k++) {
      var c = drawCharacter();
      var d = document.createElement("div"); d.className = "drawer";
      var plate = document.createElement("div"); plate.className = "plate";
      plate.innerHTML = "";
      var pn = document.createElement("div"); pn.className = "pname"; pn.textContent = c.name;
      var pj = document.createElement("div"); pj.className = "pjob"; pj.textContent = c.job;
      var ps = document.createElement("div"); ps.className = "psec"; ps.textContent = "Petty secret: " + c.secret + ".";
      plate.appendChild(pn); plate.appendChild(pj); plate.appendChild(ps);
      var a = document.createElement("a");
      a.className = "shop-btn gold send"; a.href = rdmUrl(c.prompt);
      a.target = "_blank"; a.rel = "noopener";
      a.textContent = "Send " + c.name.split(" ")[0] + " to RoughDraft Maker →";
      d.appendChild(plate); d.appendChild(a);
      cab.appendChild(d);
    }
    cab.style.display = "block";
    cab.scrollIntoView({ behavior: "smooth", block: "center" });
  });
})();
