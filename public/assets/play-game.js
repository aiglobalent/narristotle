/* Narristotle /play — a stark black-and-white card game.
   100% client-side. No accounts, no API calls, no tracking.
   One black prompt card, four white answer cards, five taps. */
(function () {
  "use strict";

  function lowerFirst(t) { return t ? t.charAt(0).toLowerCase() + t.slice(1) : t; }
  function capFirst(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }
  function fill(tpl, inputs) {
    return tpl.replace(/\[\[(\d)([lc]?)\]\]/g, function (m, d, mod) {
      var v = inputs[Number(d) - 1] || "";
      if (mod === "l") return lowerFirst(v);
      if (mod === "c") return capFirst(v);
      return v;
    });
  }
  /* Split a filled template into plain / answer segments for pill rendering. */
  function tokenize(tpl, inputs) {
    var segs = [], last = 0, re = /\[\[(\d)([lc]?)\]\]/g, m;
    while ((m = re.exec(tpl)) !== null) {
      if (m.index > last) segs.push({ t: tpl.slice(last, m.index), mark: false });
      var v = inputs[Number(m[1]) - 1] || "";
      if (m[2] === "l") v = lowerFirst(v);
      if (m[2] === "c") v = capFirst(v);
      segs.push({ t: v, mark: true });
      last = m.index + m[0].length;
    }
    if (last < tpl.length) segs.push({ t: tpl.slice(last), mark: false });
    /* Sentence punctuation stays with its pill — no orphan periods. */
    for (var i = 1; i < segs.length; i++) {
      if (segs[i - 1].mark && !segs[i].mark) {
        var pm = segs[i].t.match(/^[.,;:!?\u201D\u2019)\]]+/);
        if (pm) {
          segs[i - 1].t += pm[0];
          segs[i].t = segs[i].t.slice(pm[0].length);
        }
      }
    }
    return segs;
  }

  var POOLS = {
story: [
      ["A forgetful detective", "A retired pirate turned librarian", "A wedding planner afraid of cake", "An astronaut with motion sickness", "A ghost who failed haunting school"],
      ["A rubber duck", "A spoon engraved with coordinates", "A kazoo that only plays sad songs", "A snow globe of a different city", "A key labeled DO NOT USE"],
      ["A haunted motel", "A lighthouse during a blackout", "A ski lodge with no skis", "A submarine-themed bed and breakfast", "A mall Santa training camp"],
      ["A second chance", "The last train ticket home", "A recipe everyone swore was lost", "One quiet night of sleep", "Their name in the morning paper"],
      ["The duck talks", "The map is upside down on purpose", "The butler is three kids in a coat", "The treasure is the group chat all along", "Nobody here is actually snowed in"]
    ],
    song: [
      ["2004 Honda Civic", "a rusted-out tour van", "Grandma's Cadillac with one headlight", "a golf cart with racing stripes", "a shopping cart with a busted wheel"],
      ["Bakersfield Applebee's", "the Waffle House on Route 9", "a karaoke bar that banned me twice", "the laundromat with the good jukebox", "a gas station that sells fireworks"],
      ["half a bottle of ranch", "your hoodie and my favorite mug", "a mixtape labeled DO NOT PLAY", "one unmatched earring", "the good Tupperware"],
      ["texting my ex from the booth", "rewriting the same chorus since June", "ordering pie I never eat", "checking the tour dates of a band that broke up", "practicing my award speech in the mirror"],
      ["my vintage leather jacket", "the deposit on that apartment", "one honest phone call", "my grandfather's guitar", "the last slice of that birthday cake"]
    ],
    conference: [
      ["an over-caffeinated MFA grad on their 4th espresso", "a romance novelist live-posting the whole panel", "a poet who only speaks in haiku when nervous", "a thriller writer researching everyone's alibis", "a memoirist who has legally changed their name twice"],
      ["a crumpled query letter stained with hotel merlot", "a tote bag containing 400 branded bookmarks", "a USB drive labeled FINAL_DRAFT_ACTUALLY_FINAL", "a galley proof with someone else's headshot in it", "a name badge that just says AGENT???"],
      ["the continental breakfast waffle iron", "the hotel gym at 5 a.m.", "the elevator with the broken floor button", "the signing line for a much more famous author", "the last working outlet in the lobby"],
      ["Succession meets Paw Patrol in space", "The Great Gatsby but everyone is a competitive baker", "a locked-room mystery meets a cooking show finale", "Pride and Prejudice with dragons and a group chat", "a heist novel meets a church cookbook"],
      ["the literary agent is actually three raccoons in a trench coat", "the villain was the conference Wi-Fi all along", "everyone in the book club is the same person", "the murder weapon was a limited-edition tote bag", "the narrator is the hotel concierge"]
    ],
    "story-sitcom": [
      ["A retired game-show host who treats the apartment like a studio", "A roommate who alphabetizes the spice rack by emotional importance", "An ex-sous-chef who narrates breakfast like a nature documentary", "A method actor preparing to play a ficus", "A coupon strategist with a binder and a whistle"],
      ["a lava lamp signed by a minor celebrity", "the thermostat, which is booby-trapped", "a commemorative plate nobody may eat off", "the good chair", "a houseplant that has its own fan mail"],
      ["the upstairs tap dancer with insomnia", "a neighbor who only communicates through the vent", "the landlord's nephew, who is learning the tuba", "a door-to-door encyclopedia romantic", "the building's self-appointed hallway mayor"],
      ["I already mailed the rent check", "The casserole is a family recipe I invented this morning", "I was never asleep, I was meditating loudly", "The plant started it", "I have a guy for that"],
      ["the thermostat war", "the great remote-control custody battle", "a three-week standoff over a parking spot neither of them owns", "the lasagna incident", "the night the Wi-Fi went out for eleven minutes"]
    ],
    "story-dragon": [
      ["the shadow-wielding Wing Commander", "the exiled heir of the Ember Throne", "the dragon-riding duelist with a bounty on his smile", "the poison-master disguised as a librarian", "the rival cadet who has never lost a duel or an argument"],
      ["an obsidian dagger that hums when people lie", "a signet ring that burns traitors", "a dragon-scale locket that opens only at midnight", "a war horn carved from a fallen star", "a spellbook chained to its reader's wrist"],
      ["the storm-locked parapet tower", "the hatchery during a lightning siege", "the flooded archives beneath the arena", "the dragon stables during the mating-season ball", "a supply closet enchanted to be exactly one bed wide"],
      ["they stole my family's last dragon egg", "their dragon ate my parade banner in front of the whole court", "they corrected my sword form in front of the general", "they won the Trials by one point and framed the score", "their family betrothal-canceled mine in a public decree"],
      ["our dragons refuse to fly unless we hold hands", "a truth spell forces us to finish each other's sentences", "the bond makes us feel every injury the other takes", "we are magically tethered at exactly six feet apart", "our dreams keep swapping bodies at midnight"]
    ]
  };

  var DECKS = {
    thriller: {
      bar: "THRILLER", mode: "story", genre: "thriller",
      title: "The Last Room at the Motel",
      prompts: [
        "Someone terrible at their job",
        "A weird object in their pocket",
        "The worst place to get snowed in",
        "Something they desperately want",
        "A secret nobody should know"
      ],
      pools: POOLS.story,
      body: "The snow came sideways the night [[1l]] took the last room at [[3l]]. In their coat pocket: [[2l]] \u2014 which made no sense, until it did. All they wanted was [[4l]], and the night clerk swore the road out would open by morning.\n\nIt didn't.\n\nAt 2 a.m. the power died, a key slid under the door, and a voice in the hallway whispered the one thing nobody was ever supposed to say out loud: [[5l]]. Because here is the part the file never mentioned \u2014 the last guest who carried [[2l]] never checked out.\n\nThen, from inside the locked room, something knocked back."
    },
    romantasy: {
      bar: "ROMANTASY", mode: "story", genre: "dragon",
      title: "One Bed at the War College",
      prompts: [
        "A brooding rival with a dangerous job",
        "A dramatic magical heirloom",
        "The worst place at the war college to get trapped together",
        "A petty reason they hate each other",
        "The inconvenient magical bond"
      ],
      pools: POOLS["story-dragon"],
      body: "Rule number one at the Citadel: stay ten feet away from [[1l]]. Which was going great until a blizzard sealed us both inside [[3l]] with only [[2l]] between us.\n\nI still hadn't forgiven them because [[4l]].\n\n\u201cDon't look at me like that,\u201d they growled against the thunder. Because we both knew the humiliating truth the elders just revealed: [[5l]]."
    },
    country: {
      bar: "COUNTRY SONG", mode: "song", genre: "country",
      title: "The [[2]] Blues",
      stripArticleForTitle: 2,
      prompts: [
        "A beat-up vehicle or ride",
        "A specific local hangout spot",
        "Something petty left behind",
        "A 2 AM bad habit",
        "The one thing you want back"
      ],
      pools: POOLS.song,
      sections: [
        ["Verse", "Rolled into town in [[1l]], dust on the dash and the tank on E,\nparked outside [[2l]] with a heart that wouldn't leave.\nYou left [[3l]] on the table, said some things don't get saved \u2014\nand I just sat there holdin' the menu, watchin' goodbye walk away."],
        ["Chorus", "'Cause I'm still [[4l]], every night at half past two,\nstill wearin' out that same old booth where I first fell for you.\nI'd trade every mile on [[1l]] and every star up above \u2014\nif I could just get [[5l]] back, I'd finally be done with this love."]
      ]
    },
    sitcom: {
      bar: "SITCOM", mode: "story", genre: "sitcom",
      title: "A Very Special Episode",
      prompts: [
        "A roommate with one deeply specific obsession",
        "An object nobody is allowed to touch",
        "The neighbor who always picks this moment",
        "A lie told to avoid a minor errand",
        "The mundane thing treated like a season finale"
      ],
      pools: POOLS["story-sitcom"],
      body: "[Scene: a cramped apartment, 7:48 p.m. [[1c]] is guarding [[2l]] like it owes them money.]\n\n\u201cTouch [[2l]] and the friendship is over. There are rules. It has rules.\u201d\n\n[Enter [[3l]], at exactly the wrong moment, holding a casserole and a grudge.]\n\n\u201cBefore anyone asks \u2014 [[4]].\u201d A pause. \u201cThat is my whole statement.\u201d\n\nWhat followed was forty-five seconds of silence, one slow zoom, and the opening skirmish of [[5l]] \u2014 a conflict so small, so stupid, and so total that the studio audience was still arguing about it at the taping next door."
    }
  };
  var ORDER = ["thriller", "romantasy", "country", "sitcom"];

  /* ——— State ——— */
  var deckKey = "thriller";
  var step = 0;
  var answers = [];
  var dealt = null;
  var busy = false;

  var $ = function (id) { return document.getElementById(id); };
  var gameView = $("gameView"), revealView = $("revealView"), startView = $("startView");
  var promptEl = $("promptText"), stepEl = $("stepLabel");
  var gridEl = $("handGrid"), ownEl = $("ownInput");

  function shuffled(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function deal() {
    var pool = DECKS[deckKey].pools[step] || [];
    dealt = shuffled(pool).slice(0, 4);
  }
  function redeal() {
    var pool = DECKS[deckKey].pools[step] || [];
    if (pool.length <= 4) { deal(); return; }
    var prev = (dealt || []).join("|");
    for (var tries = 0; tries < 6; tries++) {
      deal();
      if (dealt.join("|") !== prev) break;
    }
  }
  function withPeriod(t) {
    t = String(t).replace(/\s+$/, "");
    return /[.!?"]$/.test(t) ? t : t + ".";
  }

  function render() {
    var deck = DECKS[deckKey];
    stepEl.textContent = "CARD " + (step + 1) + " OF 5";
    promptEl.innerHTML = "";
    var num = document.createElement("span");
    num.textContent = (step + 1) + ". " + deck.prompts[step] + ":";
    promptEl.appendChild(num);
    gridEl.innerHTML = "";
    dealt.forEach(function (opt) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "whitecard";
      b.textContent = withPeriod(opt);
      b.addEventListener("click", function () { pick(opt, b); });
      gridEl.appendChild(b);
    });
    ownEl.value = "";
    document.querySelectorAll("[data-deck]").forEach(function (tab) {
      tab.classList.toggle("active", tab.getAttribute("data-deck") === deckKey);
    });
  }

  function slideCards(els, swapFn, done) {
    document.body.classList.add("dealing");
    els.forEach(function (el) { el.classList.add("lift"); });
    setTimeout(function () {
      els.forEach(function (el) { el.classList.remove("lift"); el.classList.add("deal-out"); });
      setTimeout(function () {
        swapFn();
        els.forEach(function (el) { el.classList.remove("deal-out"); el.classList.add("deal-pre"); });
        void document.body.offsetWidth;
        els.forEach(function (el) { el.classList.remove("deal-pre"); el.classList.add("deal-in"); });
        setTimeout(function () {
          els.forEach(function (el) { el.classList.remove("deal-in"); });
          document.body.classList.remove("dealing");
          if (done) done();
        }, 450);
      }, 325);
    }, 195);
  }

  function pick(value, el) {
    if (busy) return;
    value = String(value || "").trim();
    if (!value) return;
    busy = true;
    dismissHint();
    if (el) el.classList.add("picked");
    answers[step] = value;
    var last = step >= 4;
    setTimeout(function () {
      slideCards([document.querySelector(".blackcard"), document.querySelector(".hand")],
        function () {
          step++;
          if (last) { showReveal(); }
          else { deal(); render(); }
        },
        function () { busy = false; });
    }, 120);
  }

  function showStart() {
    startView.style.display = "";
    gameView.style.display = "none";
    revealView.style.display = "none";
    document.querySelector(".steprow").style.display = "none";
    document.querySelector(".packbar").style.display = "";
    document.querySelector(".apphead").style.display = "";
    window.scrollTo(0, 0);
  }

  function startRound(key) {
    deckKey = key;
    step = 0;
    answers = [];
    startView.style.display = "none";
    revealView.style.display = "none";
    gameView.style.display = "";
    document.querySelector(".steprow").style.display = "";
    document.querySelector(".packbar").style.display = "";
    document.querySelector(".apphead").style.display = "";
    deal();
    render();
  }

  /* ——— Reveal ——— */
  function deckSegments() {
    var deck = DECKS[deckKey], out = [];
    if (deck.sections) {
      deck.sections.forEach(function (sec, i) {
        if (i > 0) out.push({ t: "\n\n", mark: false });
        out.push({ t: sec[0].toUpperCase(), mark: false, label: true });
        out.push({ t: "\n", mark: false });
        tokenize(sec[1], answers).forEach(function (s) { out.push(s); });
      });
    } else {
      tokenize(deck.body, answers).forEach(function (s) { out.push(s); });
    }
    return out;
  }
  /* Some decks build a title from an input that may carry its own article. */
  function titleAnswers() {
    var a = answers.slice();
    var idx = DECKS[deckKey].stripArticleForTitle;
    if (idx) a[idx - 1] = String(a[idx - 1] || "").replace(/^the\s+/i, "");
    return a;
  }
  function titleText() { return fill(DECKS[deckKey].title, titleAnswers()); }
  function plainText() {
    var deck = DECKS[deckKey];
    if (deck.sections) {
      return deck.sections.map(function (sec) { return sec[0] + "\n" + fill(sec[1], answers); }).join("\n\n");
    }
    return fill(deck.body, answers);
  }
  function feederUrl() {
    var q = "source=play&mode=novel" +
      "&prompt=" + encodeURIComponent(plainText()) +
      "&constraint=" + encodeURIComponent(answers.join(", "));
    return "https://roughdraftmaker.com/?" + q;
  }

  function showReveal() {
    /* The payoff screen gets the full display: drop any keyboard left up
       from the write-your-own box, or it eats the bottom of the story. */
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    var deck = DECKS[deckKey];
    gameView.style.display = "none";
    revealView.style.display = "";
    revealView.classList.remove("enter");
    void revealView.offsetWidth;
    revealView.classList.add("enter");
    document.querySelector(".steprow").style.display = "none";
    /* The story gets the whole stage in the reveal — chrome steps aside. */
    document.querySelector(".packbar").style.display = "none";
    document.querySelector(".apphead").style.display = "none";
    $("storyTitle").textContent = withPeriod(titleText());
    var body = $("storyBody");
    body.innerHTML = "";
    deckSegments().forEach(function (seg) {
      if (seg.label) {
        var lab = document.createElement("span");
        lab.className = "sec-label";
        lab.textContent = seg.t;
        body.appendChild(lab);
        return;
      }
      var parts = seg.t.split("\n");
      parts.forEach(function (part, i) {
        if (i > 0) body.appendChild(document.createElement("br"));
        if (!part) return;
        if (seg.mark) {
          var pill = document.createElement("span");
          pill.className = "pill";
          pill.textContent = part;
          body.appendChild(pill);
        } else {
          body.appendChild(document.createTextNode(part));
        }
      });
    });
    fitStory();
    $("stealBtn").setAttribute("href", feederUrl());
    var note = $("shareNote");
    if (note) note.textContent = "";
    window.scrollTo(0, 0);
  }

  function fitStory() {
    var card = document.querySelector(".storycard");
    var bodyEl = $("storyBody"), titleEl = $("storyTitle");
    if (!card || !bodyEl || !titleEl) return;
    /* Reset to the CSS sizes. */
    bodyEl.style.fontSize = "";
    bodyEl.style.lineHeight = "";
    titleEl.style.fontSize = "";
    card.style.padding = "";
    bodyEl.querySelectorAll(".sec-label").forEach(function (l) { l.style.marginTop = ""; });
    var stampEl = card.querySelector(".stamp");
    if (stampEl) {
      stampEl.style.padding = "";
      var sb = stampEl.querySelector("b"), ss = stampEl.querySelector("span");
      if (sb) sb.style.fontSize = "";
      if (ss) ss.style.fontSize = "";
    }
    var base = parseFloat(getComputedStyle(bodyEl).fontSize) || 18.5;
    var titleBase = parseFloat(getComputedStyle(titleEl).fontSize) || 28;
    function applyScale(sc) {
      bodyEl.style.fontSize = Math.min(26, base * sc) + "px";
      bodyEl.style.lineHeight = String(Math.min(1.62, 1.5 + (sc - 1) * 0.25));
      titleEl.style.fontSize = Math.min(40, titleBase * sc) + "px";
    }
    /* GROW first: the story is the main event — scale up until the card is filled. */
    var s = 1;
    for (var g = 1.05; g <= 1.5; g += 0.05) {
      applyScale(g);
      if (card.scrollHeight > card.clientHeight + 1) break;
      s = g;
    }
    applyScale(s);
    if (card.scrollHeight <= card.clientHeight + 1) return;
    /* SHRINK: long stories step compactness up until everything fits. */
    var curBase = parseFloat(bodyEl.style.fontSize) || base;
    var curTitle = parseFloat(titleEl.style.fontSize) || titleBase;
    for (var st = 1; st <= 20; st++) {
      if (card.scrollHeight <= card.clientHeight + 1) break;
      bodyEl.style.fontSize = Math.max(11.5, curBase - st * 0.55) + "px";
      bodyEl.style.lineHeight = String(Math.max(1.3, 1.5 - st * 0.012));
      titleEl.style.fontSize = Math.max(19, curTitle - st * 0.6) + "px";
      if (st >= 5) card.style.padding = "16px";
      if (st >= 8) bodyEl.querySelectorAll(".sec-label").forEach(function (l) { l.style.marginTop = "8px"; });
      if (st >= 12) card.style.padding = "12px 14px";
      if (st >= 14 && stampEl) {
        stampEl.style.padding = "4px 9px 5px";
        var sb2 = stampEl.querySelector("b"), ss2 = stampEl.querySelector("span");
        if (sb2) sb2.style.fontSize = "13px";
        if (ss2) ss2.style.fontSize = "10.5px";
      }
    }
  }

  /* ——— Share Card (canvas PNG) ——— */
  function wrapAtoms(ctx, segs, maxW) {
    var atoms = [];
    segs.forEach(function (seg) {
      if (seg.label) { atoms.push({ label: seg.t }); return; }
      var segAtoms = [];
      seg.t.split("\n").forEach(function (line, li) {
        if (li > 0) segAtoms.push({ br: true });
        line.split(/(\s+)/).forEach(function (w) {
          if (w) segAtoms.push({ t: w, mark: seg.mark });
        });
      });
      if (seg.mark) {
        var wordAtoms = segAtoms.filter(function (a) { return a.t; });
        if (wordAtoms.length) {
          wordAtoms[0].segStart = true;
          wordAtoms[wordAtoms.length - 1].segEnd = true;
        }
      }
      segAtoms.forEach(function (a) { atoms.push(a); });
    });
    var lines = [], cur = [], curW = 0;
    function flush() { if (cur.length) { lines.push(cur); cur = []; curW = 0; } }
    atoms.forEach(function (a) {
      if (a.label) { flush(); lines.push([{ label: a.label }]); return; }
      if (a.br) { flush(); lines.push([]); return; }
      var w = ctx.measureText(a.t).width + (a.segStart ? 4 : 0) + (a.segEnd ? 4 : 0);
      var isSpace = /^\s+$/.test(a.t);
      if (!isSpace && curW + w > maxW && cur.length) { flush(); if (a.t.trim() === "") return; }
      cur.push(a); curW += w;
    });
    flush();
    return lines;
  }
  function buildCard() {
    var deck = DECKS[deckKey];
    var W = 1080, H = 1350;
    var canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, W, H);
    var cardX = 56, cardY = 56, cardW = W - 112, cardH = H - 196;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cardX, cardY, cardW, cardH, 34); else ctx.rect(cardX, cardY, cardW, cardH);
    ctx.fill();
    var padX = cardX + 58, maxW = cardW - 116;
    var title = withPeriod(titleText());
    ctx.fillStyle = "#000000";
    ctx.font = "900 58px Inter, 'Helvetica Neue', Arial, sans-serif";
    var titleLines = [], tw = "", words = title.split(" ");
    words.forEach(function (w) {
      var test = tw ? tw + " " + w : w;
      if (ctx.measureText(test).width > maxW && tw) { titleLines.push(tw); tw = w; } else { tw = test; }
    });
    if (tw) titleLines.push(tw);
    var y = cardY + 92;
    titleLines.forEach(function (ln) { ctx.fillText(ln, padX, y); y += 66; });
    y += 18;
    var segs = deckSegments();
    var size = 41, lines = null, lineH = 60;
    while (size >= 28) {
      ctx.font = "600 " + size + "px Inter, 'Helvetica Neue', Arial, sans-serif";
      lines = wrapAtoms(ctx, segs, maxW);
      var need = lines.length * lineH + 150;
      if (y + need <= cardY + cardH - 40) break;
      size -= 3; lineH = Math.round(size * 1.46);
    }
    ctx.textBaseline = "alphabetic";
    lines.forEach(function (line) {
      if (line.length === 1 && line[0].label) {
        ctx.font = "900 " + Math.round(size * 0.52) + "px Inter, 'Helvetica Neue', Arial, sans-serif";
        ctx.fillStyle = "#000000";
        ctx.fillText(line[0].label, padX, y);
        y += lineH;
        ctx.font = "600 " + size + "px Inter, 'Helvetica Neue', Arial, sans-serif";
        return;
      }
      var x = padX, i = 0;
      while (i < line.length) {
        var a = line[i];
        if (a.mark) {
          if (a.segStart) x += 4;
          var runText = "", runW = 0, j = i;
          while (j < line.length && (line[j].mark || /^\s+$/.test(line[j].t))) {
            if (!line[j].mark && j + 1 < line.length && !line[j + 1].mark) break;
            runText += line[j].t; runW += ctx.measureText(line[j].t).width; j++;
          }
          runText = runText.replace(/\s+$/, "");
          runW = ctx.measureText(runText).width;
          ctx.fillStyle = "#000000";
          ctx.beginPath();
          var ph = size * 1.24, py = y - size * 0.98;
          if (ctx.roundRect) ctx.roundRect(x - 9, py, runW + 18, ph, 9); else ctx.rect(x - 9, py, runW + 18, ph);
          ctx.fill();
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "800 " + size + "px Inter, 'Helvetica Neue', Arial, sans-serif";
          ctx.fillText(runText, x, y);
          ctx.font = "600 " + size + "px Inter, 'Helvetica Neue', Arial, sans-serif";
          x += runW + (line[j - 1] && line[j - 1].segEnd ? 4 : 0); i = j;
        } else {
          ctx.fillStyle = "#000000";
          ctx.fillText(a.t, x, y);
          x += ctx.measureText(a.t).width;
          i++;
        }
      }
      y += lineH;
    });
    /* The stamp. */
    ctx.save();
    ctx.translate(cardX + cardW - 196, cardY + cardH - 96);
    ctx.rotate(-0.05);
    ctx.strokeStyle = "#000000"; ctx.lineWidth = 4;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-148, -52, 296, 104, 10); else ctx.rect(-148, -52, 296, 104);
    ctx.stroke();
    ctx.fillStyle = "#000000"; ctx.textAlign = "center";
    ctx.font = "900 37px Inter, 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText("\u2018Unhinged.\u2019", 0, -4);
    ctx.font = "700 25px Inter, 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText("\u2014 Narristotle", 0, 32);
    ctx.restore();
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 30px Inter, 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText("NARRISTOTLE.COM/PLAY", 56, H - 52);
    ctx.font = "700 24px Inter, 'Helvetica Neue', Arial, sans-serif";
    ctx.fillText(deck.bar + ".", W - 56 - ctx.measureText(deck.bar + ".").width, H - 52);
    return canvas;
  }
  function shareCard() {
    var note = $("shareNote");
    var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    ready.then(function () {
      var canvas = buildCard();
      canvas.toBlob(function (blob) {
        if (!blob) { if (note) note.textContent = "The card would not develop. Try again."; return; }
        var file = new File([blob], "narristotle-card.png", { type: "image/png" });
        var link = "https://narristotle.com/play";
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], text: "Dealt at Narristotle. " + link }).catch(function () {});
        } else {
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "narristotle-card.png";
          document.body.appendChild(a); a.click(); a.remove();
          if (navigator.clipboard) navigator.clipboard.writeText(link).catch(function () {});
          if (note) note.textContent = "Card saved as an image. Link copied \u2014 post it anywhere.";
        }
      }, "image/png");
    });
  }

  /* ——— Deck discovery now lives on the landing page; this just retires the old hint flag ——— */
  function dismissHint() {
    try { localStorage.setItem("narr decks seen", "1"); } catch (e) {}
  }
  function pulseBar() {
    var bar = document.querySelector(".packbar");
    bar.classList.remove("hinting");
    void bar.offsetWidth;
    bar.classList.add("hinting");
    setTimeout(function () { bar.classList.remove("hinting"); }, 1900);
  }

  /* ——— Wiring ——— */
  document.querySelectorAll("[data-deck]").forEach(function (tab) {
    tab.addEventListener("click", function () { dismissHint(); startRound(tab.getAttribute("data-deck")); });
  });
  function slideHand() {
    if (busy) return;
    busy = true;
    slideCards([document.querySelector(".hand")],
      function () { redeal(); render(); },
      function () { busy = false; });
  }
  $("shuffleBtn").addEventListener("click", function () {
    if (revealView.style.display !== "none") return;
    slideHand();
  });
  $("dealBtn").addEventListener("click", function () { slideHand(); });
  ownEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); pick(ownEl.value, null); }
  });
  $("shareBtn").addEventListener("click", shareCard);
  window.addEventListener("resize", function () {
    if (revealView.style.display !== "none") fitStory();
  });
  /* iOS shrinks only the VISUAL viewport when the keyboard opens/closes —
     refit then too, or text sized for the tall screen clips in the short one. */
  if (window.visualViewport) {
    var vvT = null;
    window.visualViewport.addEventListener("resize", function () {
      if (revealView.style.display === "none") return;
      clearTimeout(vvT);
      vvT = setTimeout(fitStory, 120);
    });
  }
  $("againBtn").addEventListener("click", function () { startRound(deckKey); });
  $("deckBtn").addEventListener("click", function () { showStart(); });

  /* ——— Landing + hamburger menu ——— */
  var menuSheet = $("menuSheet");
  function openMenu() { menuSheet.hidden = false; }
  function closeMenu() { menuSheet.hidden = true; }
  $("playBtn").addEventListener("click", function () { startRound(deckKey); });
  $("menuBtn").addEventListener("click", openMenu);
  $("menuClose").addEventListener("click", closeMenu);
  $("howBtn").addEventListener("click", function () { closeMenu(); showStart(); });
  menuSheet.querySelectorAll(".deckitem").forEach(function (b) {
    b.addEventListener("click", closeMenu);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !menuSheet.hidden) closeMenu();
  });

  showStart();
})();
