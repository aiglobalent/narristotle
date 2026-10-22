/* Narristotle's Story & Song Arcade — 100% client-side. Zero API calls.
   Pre-built templates; the visitor's 5 inputs are woven in instantly and
   highlighted in gold badges. Share links encode the inputs in the URL.
   The gold feeder button passes the premise + inputs to RoughDraft Maker.
   v2 (2026-10-21): Conference Pitch Roulette, Mashup Packs, Shuffle Words
   pools, Hint Tiles, platform picker on the meme card, Save to My Vault
   (Firebase), and Scout templates served live from Firestore
   (narristotle_arcade_templates where status == "live").
   v2.2 design direction (2026-10-21): flat, tactile, editorial. No AI-cliché
   icons, no morphed avatars, no gradients — bookplate crest, serif type,
   marker highlights, word-game mechanics. */
(function () {
  "use strict";

  var STORY_GENRES = {
    thriller: {
      label: "🎭 Thriller",
      title: "The Last Room at the Motel",
      body: "The snow came sideways the night [[1l]] took the last room at [[3l]]. In their coat pocket: [[2l]] — which made no sense, until it did. All they wanted was [[4l]], and the night clerk swore the road out would open by morning.\n\nIt didn't.\n\nAt 2 a.m. the power died, a key slid under the door, and a voice in the hallway whispered the one thing nobody was ever supposed to say out loud: [[5l]]. Because here is the part the file never mentioned — the last guest who carried [[2l]] never checked out.\n\nThen, from inside the locked room, something knocked back."
    },
    cozy: {
      label: "🕵️ Cozy Mystery",
      title: "Trapped with the Book Club",
      body: "By the time the snow piled against the doors of [[3l]], the whole village book club was trapped inside with cocoa, gossip, and [[1l]] — who, to be fair, had never solved so much as a crossword.\n\nIn their pocket sat [[2l]], a clue everyone politely pretended not to notice. All they truly wanted was [[4l]], preferably before dessert.\n\nThen the lights flickered, the prize recipe vanished from the kitchen, and someone let slip the thing nobody should know: [[5l]]. In a cozy mystery, that is practically a confession.\n\nThe kettle is whistling. The suspect list is growing. And [[2l]] is about to matter more than anyone expects…"
    },
  };

  STORY_GENRES.sitcom = {
    label: "📺 Sitcom Scene",
    title: "A Very Special Episode",
    body: "[Scene: a cramped apartment, 7:48 p.m. [[1c]] is guarding [[2l]] like it owes them money.]\n\n“Touch [[2l]] and the friendship is over. There are rules. It has rules.”\n\n[Enter [[3l]], at exactly the wrong moment, holding a casserole and a grudge.]\n\n“Before anyone asks — [[4]].” A pause. “That is my whole statement.”\n\nWhat followed was forty-five seconds of silence, one slow zoom, and the opening skirmish of [[5l]] — a conflict so small, so stupid, and so total that the studio audience was still arguing about it at the taping next door."
  };
  STORY_GENRES.dragon = {
    label: "🐉🔥 Dragon Academy Romantasy",
    title: "One Bed at the War College",
    body: "Rule number one at the Citadel: stay ten feet away from [[1l]]. Which was going great until a blizzard sealed us both inside [[3l]] with only [[2l]] between us.\n\nI still hadn't forgiven them because [[4l]].\n\n“Don't look at me like that,” they growled against the thunder. Because we both knew the humiliating truth the elders just revealed: [[5l]]."
  };

  var SONG_GENRES = {
    country: {
      label: "🤠 Country Heartbreak",
      title: "The [[2]] Blues",
      sections: [
        ["Verse", "Rolled into town in [[1l]], dust on the dash and the tank on E,\nparked outside [[2l]] with a heart that wouldn't leave.\nYou left [[3l]] on the table, said some things don't get saved —\nand I just sat there holdin' the menu, watchin' goodbye walk away."],
        ["Chorus", "'Cause I'm still [[4l]], every night at half past two,\nstill wearin' out that same old booth where I first fell for you.\nI'd trade every mile on [[1l]] and every star up above —\nif I could just get [[5l]] back, I'd finally be done with this love."]
      ]
    },
    hiphop: {
      label: "🎤 Hip-Hop Roast",
      title: "Table for One (The Roast)",
      sections: [
        ["Verse", "Pulled up in [[1l]] — yeah, the paint's seen better days,\noutside [[2l]], got the whole block in a haze.\nYou left [[3l]] like a mic drop, cold —\npetty little treasure worth more than gold."],
        ["Chorus", "'Cause I'm [[4l]] — no shame, that's my cardio,\ncrowd goin' wild like a late-night talk show.\nHand me [[5l]] and watch the whole fit glow —\nthis ain't heartbreak, baby, this a one-man show."]
      ]
    },
    ballad: {
      label: "🎸 80s Power Ballad",
      title: "Midnight Booth Confession",
      sections: [
        ["Verse", "Midnight rain on [[1l]], neon hummin' through the pain,\none last booth at [[2l]], where our song still knows my name.\nYou left [[3l]] like a letter never sent,\nand every lyric in this heart is wonderin' where you went."],
        ["Chorus", "'Cause I'm [[4l]] in the electric blue,\nscreamin' at the stars like they're gonna answer you!\nGive me [[5l]] and one more night to prove —\nthis heart's still on fire, and it's burnin' for you!"]
      ]
    }
  };

  /* ——— Conference Pitch Roulette (Live Event Special) ——— */
  var CONF_TEMPLATES = {
    live: {
      label: "🍸 Live Event Special",
      title: "Panic at the Hotel Bar",
      body: "It was 11:42 p.m. at the conference hotel bar when [[1l]] accidentally dropped [[2l]] right next to [[3l]]. The room went dead silent.\n\n“Listen to me,” they whispered, grabbing the nearest VIP badge by the lapels. “My book is [[4]]—except in the final chapter, [[5l]].”\n\nFive seconds later, a bidding war broke out by the ice machine."
    }
  };

  /* Mashup Packs: genre keys that carry their own 5 blanks + poster art. */
  var PACK_GENRES = {
    dragon: { pack: 2, cls: "poster-dragon", name: "Enemies-to-Lovers Dragon Academy", emoji: "🐉🔥" }
  };

  var MODE_TEMPLATES = { story: STORY_GENRES, conference: CONF_TEMPLATES };
  var MODE_NAMES = {
    story: "Plot Roulette", song: "Song Draft Maker",
    conference: "Conference Pitch Roulette"
  };

  /* ——— Shuffle Words pools (one array per input slot) ——— */
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

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function lowerFirst(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function capFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* Fill [[n]] (raw), [[nl]] (lowercase first letter), [[nc]] (capitalized) with gold-highlighted inputs. */
  function fill(template, inputs, highlight) {
    return template.replace(/\[\[(\d)([lc]?)\]\]/g, function (m, d, mod) {
      var v = inputs[parseInt(d, 10) - 1] || "";
      if (mod === "l") v = lowerFirst(v);
      if (mod === "c") v = capFirst(v);
      var e = esc(v);
      return highlight ? "<mark>" + e + "</mark>" : e;
    });
  }
  function plain(template, inputs) { return fill(template, inputs, false).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"'); }
  function fillSeg(template, inputs) {
    var segs = [], last = 0, m;
    var re = /\[\[(\d)([lc]?)\]\]/g;
    while ((m = re.exec(template))) {
      if (m.index > last) segs.push({ t: template.slice(last, m.index), hot: false });
      var v = inputs[parseInt(m[1], 10) - 1] || "";
      if (m[2] === "l") v = lowerFirst(v);
      if (m[2] === "c") v = capFirst(v);
      segs.push({ t: v, hot: true });
      last = m.index + m[0].length;
    }
    if (last < template.length) segs.push({ t: template.slice(last), hot: false });
    return segs;
  }

  /* Shared Firebase handle (lazy; the Arcade works fully without it). */
  var _fb = null, _fbTried = false;
  function fb() {
    if (_fbTried) return _fb;
    _fbTried = true;
    try {
      var cfg = window.NARRISTOTLE_FIREBASE_CONFIG || {};
      if (window.firebase && cfg.apiKey && cfg.projectId) {
        if (!firebase.apps.length) firebase.initializeApp(cfg);
        _fb = { auth: firebase.auth(), db: firebase.firestore() };
      }
    } catch (e) { _fb = null; }
    return _fb;
  }

  function initArcade(root) {
    var DEFAULT_MODE = root.getAttribute("data-default-mode") || "story";
    var state = { mode: DEFAULT_MODE, genre: { story: "thriller", song: "country", conference: "live" } };
    var revealed = { story: false, song: false, conference: false };
    var snapshots = {};
    var CUSTOM = {}; /* Scout templates served live from Firestore */

    var TEASE = {
      story: {
        kicker: "Plot Roulette · Sealed & Waiting",
        title: "Something ridiculous is about to happen on this page.",
        body: "Right now, this card is blank, smug, and absolutely bursting with potential — rather like a writer before coffee.\n\nYour 5 words are the ingredients. The genre is the oven. Hit Reveal and I shall serve you a tiny story with a beginning, a middle, and a cliffhanger rude enough to make you glad you pressed Reveal.\n\nNo spoilers. But between us? The duck is ready for its close-up."
      },
      song: {
        kicker: "Song Draft Maker · Needle Up, Volume Down",
        title: "A future earworm is in here, warming up.",
        body: "Somewhere inside your 5 words is a chorus your friends will be humming against their will.\n\nGive me a beat-up ride, a beloved hangout, and one petty little heartbreak. Hit Reveal and I shall hand you a Verse and a Chorus with your words shining in gold.\n\nThe record is already spinning. It is simply waiting on your beautiful nonsense."
      },
      conference: {
        kicker: "Conference Pitch Roulette · Live Event Special",
        title: "Your elevator pitch, weaponized.",
        body: "Somewhere between the waffle iron and the hotel bar, every writer at this conference is one awkward hallway ambush away from a book deal.\n\nGive me an exhausted writer, a bizarre dropped object, and one truly unhinged comp title. Hit Reveal and I shall hand you the pitch scene nobody at the continental breakfast will ever forget.\n\nPractice it in the mirror. Then go find an agent by the ice machine."
      }    };

    var modeBtns = Array.prototype.slice.call(root.querySelectorAll("[data-mode-btn]"));
    var fieldSets = {}, genreRows = {};
    root.querySelectorAll("[data-fields]").forEach(function (el) { fieldSets[el.getAttribute("data-fields")] = el; });
    root.querySelectorAll("[data-genres]").forEach(function (el) { genreRows[el.getAttribute("data-genres")] = el; });
    function modes() { return Object.keys(fieldSets); }
    var teaseEl = root.querySelector("[data-tease]");
    var teaseKicker = root.querySelector("[data-tease-kicker]");
    var teaseTitle = root.querySelector("[data-tease-title]");
    var teaseBody = root.querySelector("[data-tease-body]");
    var resultWrap = root.querySelector("[data-result-wrap]");
    var titleEl = root.querySelector("[data-result-title]");
    var kickerEl = root.querySelector("[data-result-kicker]");
    var bodyEl = root.querySelector("[data-result-body]");
    var bubble = root.querySelector("[data-song-bubble]");
    var feedBtn = root.querySelector("[data-feed-btn]");
    var shareBtn = root.querySelector("[data-share-btn]");
    var vaultBtn = root.querySelector("[data-vault-btn]");
    var vaultOpen = root.querySelector("[data-vault-open]");
    var statusEl = root.querySelector("[data-status]");


    /* A genre may carry its own field set (Mashup Packs): key = mode-genre. */
    function fieldKey(mode) {
      var k = mode + "-" + state.genre[mode];
      return fieldSets[k] ? k : mode;
    }
    function syncFields() {
      var active = fieldKey(state.mode);
      Object.keys(fieldSets).forEach(function (k) { fieldSets[k].style.display = k === active ? "" : "none"; });
      Object.keys(genreRows).forEach(function (m) { if (genreRows[m]) genreRows[m].style.display = m === state.mode ? "" : "none"; });
    }

    function inputsFor(mode) {
      var out = [];
      fieldSets[fieldKey(mode)].querySelectorAll("input").forEach(function (inp) {
        out.push((inp.value || "").trim() || inp.getAttribute("data-default") || "");
      });
      return out;
    }

    function showTease(mode) {
      var tz = TEASE[mode] || TEASE.story;
      teaseKicker.textContent = tz.kicker;
      teaseTitle.textContent = tz.title;
      teaseBody.textContent = tz.body;
      teaseEl.style.display = "";
      resultWrap.style.display = "none";
    }

    function showSnapshot(mode) {
      var snap = snapshots[mode];
      if (!snap) { showTease(mode); return; }
      teaseEl.style.display = "none";
      resultWrap.style.display = "";
      titleEl.textContent = snap.title;
      kickerEl.textContent = snap.kicker;
      bodyEl.innerHTML = snap.html;
      bubble.style.display = mode === "song" ? "flex" : "none";
      var posterEl = root.querySelector("[data-poster]");
      if (posterEl) {
        var pk = snap.packKey ? PACK_GENRES[snap.packKey] : null;
        if (pk) {
          posterEl.className = "arcade-poster " + pk.cls;
          posterEl.style.display = "";
          var ptag = posterEl.querySelector("[data-poster-tag]");
          var pname = posterEl.querySelector("[data-poster-name]");
          if (ptag) ptag.textContent = pk.emoji + " MASHUP PACK #" + pk.pack + " · COLLECTIBLE EDITION";
          if (pname) pname.textContent = pk.name;
        } else { posterEl.style.display = "none"; }
      }
      feedBtn.textContent = snap.feedLabel;
      feedBtn.setAttribute("href", snap.feedHref);
      if (vaultOpen) { vaultOpen.style.display = "none"; }
      root._plainText = snap.plainText;
      root._inputs = snap.inputs;
    }

    function templateFor(mode) {
      if (CUSTOM[mode]) return CUSTOM[mode];
      if (mode === "song") return SONG_GENRES[state.genre.song];
      var map = MODE_TEMPLATES[mode];
      return map ? map[state.genre[mode]] : null;
    }

    function render() {
      var mode = state.mode;
      var inputs = inputsFor(mode);
      var g = templateFor(mode);
      if (!g) return;
      var titleText, kicker, html, plainText, feedLabel, segments = [];
      if (mode === "song") {
        titleText = plain(g.title, inputs);
        kicker = "Song Draft Maker · " + g.label;
        var parts = [];
        var plainParts = [titleText];
        g.sections.forEach(function (sec) {
          parts.push('<p class="r-verse-label">' + sec[0] + "</p>" + fill(sec[1], inputs, true));
          plainParts.push(sec[0].toUpperCase() + "\n" + plain(sec[1], inputs));
          segments.push({ label: sec[0], segs: fillSeg(sec[1], inputs) });
        });
        html = parts.join("\n");
        plainText = plainParts.join("\n\n");
        feedLabel = "Wait... This Is Actually Good. Turn This Song Into a Book on RoughDraft Maker →";
      } else {
        titleText = plain(g.title, inputs);
        kicker = (MODE_NAMES[mode] || "The Arcade") + " · " + g.label;
        html = fill(g.body, inputs, true); /* fill() escapes the inputs; template text is trusted */
        plainText = titleText + "\n\n" + plain(g.body, inputs);
        segments = [{ label: null, segs: fillSeg(g.body, inputs) }];
        feedLabel = "Wait... This Is Actually Good. Build Chapter 1 on RoughDraft Maker →";
      }
      var constraint = mode === "story" ? inputs[1] : inputs[0];
      var q = new URLSearchParams({
        source: "narristotle_arcade",
        mode: mode,
        genre: state.genre[mode],
        prompt: plainText,
        constraint: constraint || ""
      });
      inputs.forEach(function (v, i) { q.set("input" + (i + 1), v); });
      snapshots[mode] = {
        title: titleText, kicker: kicker, html: html, plainText: plainText,
        feedLabel: feedLabel, feedHref: "https://roughdraftmaker.com/?" + q.toString(),
        inputs: inputs, segments: segments, mode: mode, genre: state.genre[mode],
        packKey: PACK_GENRES[state.genre[mode]] ? state.genre[mode] : null,
      };
      revealed[mode] = true;
      showSnapshot(mode);
    }

    function setMode(mode) {
      if (!fieldSets[mode]) mode = "story";
      state.mode = mode;
      modeBtns.forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-mode-btn") === mode); });
      syncFields();
      buildHints();
      if (revealed[mode]) { showSnapshot(mode); } else { showTease(mode); }
    }

    function bindModeBtn(b) {
      b.addEventListener("click", function () { setMode(b.getAttribute("data-mode-btn")); });
    }
    modeBtns.forEach(bindModeBtn);
    function bindGenreRow(mode) {
      if (!genreRows[mode]) return;
      genreRows[mode].querySelectorAll("[data-genre]").forEach(function (b) {
        b.addEventListener("click", function () {
          state.genre[mode] = b.getAttribute("data-genre");
          genreRows[mode].querySelectorAll("[data-genre]").forEach(function (x) { x.classList.toggle("active", x === b); });
          if (state.mode === mode) { syncFields(); buildHints(); if (revealed[mode]) { render(); } }
        });
      });
    }
    modes().forEach(bindGenreRow);
    root.querySelector("[data-reveal]").addEventListener("click", render);
    function bindInputs(scope) {
      scope.querySelectorAll("input").forEach(function (inp) {
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); render(); } });
        inp.addEventListener("input", function () {
          if (revealed[state.mode] && statusEl) { statusEl.textContent = "New words detected — hit Reveal for the fresh version."; }
        });
      });
    }
    bindInputs(root);

    /* ——— Hint Tiles: tap a flat pill to fill its slot ——— */
    function buildHints() {
      var hintsEl = root.querySelector("[data-hints]");
      var wrap = root.querySelector("[data-hints-wrap]");
      if (!hintsEl || !wrap) return;
      var pool = POOLS[fieldKey(state.mode)] || POOLS[state.mode];
      if (!pool) { wrap.style.display = "none"; return; }
      wrap.style.display = "";
      hintsEl.innerHTML = "";
      pool.forEach(function (slotOpts, i) {
        if (!slotOpts || !slotOpts.length) return;
        var b = document.createElement("button");
        b.type = "button"; b.className = "arcade-hint";
        b.textContent = slotOpts[Math.floor(Math.random() * slotOpts.length)];
        b.addEventListener("click", function () {
          var inputs = fieldSets[fieldKey(state.mode)].querySelectorAll("input");
          var inp = inputs[i];
          if (inp) {
            inp.value = b.textContent;
            inp.dispatchEvent(new Event("input", { bubbles: true }));
            inp.focus();
          }
          var others = slotOpts.filter(function (o) { return o !== b.textContent; });
          if (others.length) b.textContent = others[Math.floor(Math.random() * others.length)];
        });
        hintsEl.appendChild(b);
      });
    }

    /* ——— 🎲 Shuffle Words: random inputs from the pools ——— */
    var surpriseBtn = root.querySelector("[data-surprise]");
    if (surpriseBtn) {
      surpriseBtn.addEventListener("click", function () {
        var mode = state.mode;
        var pool = POOLS[fieldKey(mode)] || POOLS[mode];
        if (!pool) return;
        var inputs = fieldSets[fieldKey(mode)].querySelectorAll("input");
        inputs.forEach(function (inp, i) {
          var options = pool[i] || [];
          if (!options.length) return;
          var pick = options[Math.floor(Math.random() * options.length)];
          if (options.length > 1) {
            var guard = 0;
            while (pick === inp.value && guard++ < 6) { pick = options[Math.floor(Math.random() * options.length)]; }
          }
          inp.value = pick;
        });
        render();
        buildHints();
        if (statusEl) statusEl.textContent = "Shuffled. The words are innocent — the combinations are on you.";
      });
    }

    /* ---------- Meme Card generator (native Canvas, zero API cost) ---------- */
    function buildShareUrl() {
      var inputs = inputsFor(state.mode);
      var q = new URLSearchParams({ arcade: "1", mode: state.mode, genre: state.genre[state.mode] });
      inputs.forEach(function (v, i) { q.set("i" + (i + 1), v); });
      return window.location.origin + window.location.pathname + "?" + q.toString() + "#arcade";
    }
    function rr(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    function segAtoms(segs) {
      var atoms = [];
      segs.forEach(function (s) {
        s.t.split(/(\n)/).forEach(function (part) {
          if (part === "\n") { atoms.push({ nl: true }); return; }
          part.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { atoms.push({ sp: true }); }
            else { atoms.push({ w: w, hot: !!s.hot }); }
          });
        });
      });
      return atoms;
    }
    function buildMemeCard(snap) {
      var W = 1200;
      var NAVY = "#102C4E", GOLD = "#E2B041", GOLDLT = "#F3D98B", CREAM = "#FAF7F2", INK = "#1D2733", GOLDDK = "#B8892A";
      return Promise.resolve(document.fonts ? document.fonts.ready : null).then(function () {
        var bust = null;
        var cx = 56, cy = 208, cw = W - 112, pad = 54, tx = cx + pad, tw = cw - pad * 2;
        function mw(ctx, a, fs) {
          ctx.font = (a.hot ? "600 " : "400 ") + fs + "px Inter, sans-serif";
          return ctx.measureText(a.w).width;
        }
        /* ---- Measure pass (offscreen) ---- */
        var mctx = document.createElement("canvas").getContext("2d");
        mctx.font = "700 48px 'Playfair Display', Georgia, serif";
        var tLine = "", titleLines = [];
        snap.title.split(/\s+/).forEach(function (w) {
          var test = tLine ? tLine + " " + w : w;
          if (mctx.measureText(test).width > tw && tLine) { titleLines.push(tLine); tLine = w; } else { tLine = test; }
        });
        if (tLine) titleLines.push(tLine);
        var bodyTop = cy + 66 + 60 + titleLines.length * 56 + 24;
        var sizes = [31, 29, 27, 25, 23], laid = null;
        for (var si = 0; si < sizes.length; si++) {
          var fs = sizes[si], lh = Math.round(fs * 1.52);
          mctx.font = "400 " + fs + "px Inter, sans-serif";
          var sw = mctx.measureText(" ").width;
          var lines = [], height = 0;
          snap.segments.forEach(function (block) {
            if (block.label) { lines.push({ label: block.label }); height += lh + 16; }
            var cur = [], curW = 0;
            function flush(gap) { if (cur.length) { lines.push({ atoms: cur }); height += lh + (gap || 0); } cur = []; curW = 0; }
            segAtoms(block.segs).forEach(function (a) {
              if (a.nl) { flush(12); return; }
              if (a.sp) { if (cur.length) { cur.push(a); curW += sw; } return; }
              var ww = mw(mctx, a, fs);
              if (curW + ww > tw && cur.length) {
                while (cur.length && cur[cur.length - 1].sp) { cur.pop(); }
                lines.push({ atoms: cur }); height += lh; cur = [a]; curW = ww;
              } else { cur.push(a); curW += ww; }
            });
            flush(0);
            lines.push({ spacer: true }); height += 16;
          });
          laid = { lines: lines, fs: fs, lh: lh, height: height, sw: sw };
          if (height <= 1080) break;
        }
        var cardH = (bodyTop + laid.height + 6) - cy + 42;
        var H = cy + cardH + 26 + 150;
        /* ---- Draw pass ---- */
        var canvas = document.createElement("canvas");
        canvas.width = W; canvas.height = H;
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = NAVY; ctx.fillRect(0, 0, W, 168);
        var pk2 = snap.packKey ? PACK_GENRES[snap.packKey] : null;
        if (pk2) { ctx.fillStyle = "#17452C"; ctx.fillRect(0, 0, W, 168); }
        /* Flat bookplate crest: cream disc, gold ring, serif N. No photos, no morphs. */
        ctx.save();
        ctx.beginPath(); ctx.arc(106, 84, 56, 0, Math.PI * 2);
        ctx.fillStyle = CREAM; ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = GOLD; ctx.stroke();
        ctx.fillStyle = NAVY; ctx.font = "700 62px 'Playfair Display', Georgia, serif"; ctx.textAlign = "center";
        ctx.fillText("N", 106, 108);
        ctx.restore();
        ctx.textAlign = "left";
        ctx.fillStyle = CREAM; ctx.font = "700 43px 'Playfair Display', Georgia, serif";
        ctx.fillText("Narristotle’s Story & Song Arcade", 192, 90);
        ctx.fillStyle = GOLD; ctx.font = "600 24px Inter, sans-serif";
        ctx.fillText(snap.kicker, 194, 130);
        if (pk2) {
          var badge = "MASHUP PACK #" + pk2.pack;
          ctx.font = "700 22px Inter, sans-serif";
          var bw = ctx.measureText(badge).width + 38;
          ctx.fillStyle = GOLD; rr(ctx, W - 56 - bw, 56, bw, 48, 24); ctx.fill();
          ctx.fillStyle = NAVY; ctx.textAlign = "center";
          ctx.fillText(badge, W - 56 - bw / 2, 89);
          ctx.textAlign = "left";
        }
        ctx.save();
        rr(ctx, cx, cy, cw, cardH, 18); ctx.fillStyle = "#FFFDF6"; ctx.fill();
        ctx.strokeStyle = "#E7D9AE"; ctx.lineWidth = 2; ctx.stroke();
        ctx.clip();
        ctx.beginPath(); ctx.arc(cx + cw - 26, cy - 26, 118, 0, Math.PI * 2); ctx.fillStyle = "#151515"; ctx.fill();
        ctx.beginPath(); ctx.arc(cx + cw - 26, cy - 26, 44, 0, Math.PI * 2); ctx.fillStyle = "#262626"; ctx.fill();
        var ty = cy + 66;
        ctx.fillStyle = GOLDDK; ctx.font = "700 21px Inter, sans-serif";
        try { ctx.letterSpacing = "3px"; } catch (e) {}
        ctx.fillText(snap.kicker.toUpperCase(), tx, ty); ty += 60;
        try { ctx.letterSpacing = "0px"; } catch (e) {}
        ctx.fillStyle = NAVY; ctx.font = "700 48px 'Playfair Display', Georgia, serif";
        titleLines.forEach(function (l) { ctx.fillText(l, tx, ty); ty += 56; });
        ty += 24;
        laid.lines.forEach(function (line) {
          if (line.label) {
            ty += 18; ctx.fillStyle = GOLDDK; ctx.font = "700 21px Inter, sans-serif";
            ctx.fillText(line.label.toUpperCase(), tx, ty); ty += laid.lh; return;
          }
          if (line.spacer) { ty += 16; return; }
          var x = tx;
          line.atoms.forEach(function (a) {
            if (a.sp) { x += laid.sw; return; }
            var w = mw(ctx, a, laid.fs);
            if (a.hot) {
              ctx.fillStyle = GOLDLT; rr(ctx, x - 5, ty - laid.fs - 3, w + 10, laid.fs + 11, 6); ctx.fill();
              ctx.fillStyle = NAVY; ctx.font = "600 " + laid.fs + "px Inter, sans-serif";
              ctx.fillText(a.w, x, ty);
            } else {
              ctx.fillStyle = INK; ctx.font = "400 " + laid.fs + "px Inter, sans-serif";
              ctx.fillText(a.w, x, ty);
            }
            x += w;
          });
          ty += laid.lh;
        });
        ctx.restore();
        ctx.fillStyle = NAVY; ctx.fillRect(0, H - 150, W, 150);
        ctx.textAlign = "center";
        ctx.fillStyle = CREAM; ctx.font = "600 29px Inter, sans-serif";
        ctx.fillText("Built in 30 seconds with 5 random words at Narristotle.com/play", W / 2, H - 88);
        ctx.fillStyle = GOLD; ctx.font = "500 24px Inter, sans-serif";
        ctx.fillText("Powered by RoughDraft Maker™", W / 2, H - 44);
        ctx.textAlign = "left";
        return new Promise(function (res) { canvas.toBlob(function (b) { res(b); }, "image/png"); });
      });
    }

    /* ---------- Smart share: image + link together ---------- */
    var modal = root.querySelector("[data-modal]");
    var modalImg = root.querySelector("[data-modal-img]");
    var modalStatus = root.querySelector("[data-modal-status]");
    var downloadBtn = root.querySelector("[data-download-btn]");
    var copyBtn = root.querySelector("[data-copy-btn]");
    var lastCardUrl = null, lastCardBlob = null;
    if (modal) {
      modal.querySelectorAll("[data-modal-close]").forEach(function (el) { el.addEventListener("click", function () { modal.style.display = "none"; }); });
    }
    function setPick(name, href) {
      var el = root.querySelector('[data-pick="' + name + '"]');
      if (el && href) { el.setAttribute("href", href); }
    }
    function openCardModal(url) {
      if (!(modal && modalImg && lastCardUrl)) return false;
      var snap = snapshots[state.mode];
      modalImg.src = lastCardUrl;
      if (modalStatus) modalStatus.textContent = "";
      modal.style.display = "flex";
      var shareText = (snap ? snap.title : "My Narristotle Arcade card") + " — made in Narristotle’s Story & Song Arcade";
      setPick("sms", "sms:?&body=" + encodeURIComponent(shareText + " " + url));
      setPick("x", "https://twitter.com/intent/tweet?text=" + encodeURIComponent(shareText) + "&url=" + encodeURIComponent(url));
      setPick("fb", "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url));
      downloadBtn.onclick = function () {
        var a = document.createElement("a");
        a.href = lastCardUrl; a.download = "narristotle-arcade-card.png";
        document.body.appendChild(a); a.click(); a.remove();
      };
      copyBtn.onclick = function () {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(function () {
            if (modalStatus) modalStatus.textContent = "Link copied — friends who open it see this exact card live.";
          });
        }
      };
      var storyBtn = root.querySelector('[data-pick="story"]');
      if (storyBtn) {
        storyBtn.onclick = function () {
          var file = null;
          try { if (lastCardBlob) file = new File([lastCardBlob], "narristotle-arcade-card.png", { type: "image/png" }); } catch (e) { file = null; }
          if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: "Narristotle’s Story & Song Arcade", text: shareText, url: url }).catch(function () {});
          } else {
            downloadBtn.onclick();
            if (modalStatus) modalStatus.textContent = "Card saved — open Instagram or TikTok and post it straight to your Story.";
          }
        };
      }
      return true;
    }
    shareBtn.addEventListener("click", function () {
      var snap = snapshots[state.mode];
      if (!snap) return;
      var url = buildShareUrl();
      statusEl.textContent = "Painting your meme card…";
      buildMemeCard(snap).then(function (blob) {
        statusEl.textContent = "";
        if (!blob) {
          if (navigator.clipboard) navigator.clipboard.writeText(url);
          statusEl.textContent = "This browser could not paint the card — share link copied instead.";
          return;
        }
        if (lastCardUrl) URL.revokeObjectURL(lastCardUrl);
        lastCardUrl = URL.createObjectURL(blob);
        lastCardBlob = blob;
        var file = null;
        try { file = new File([blob], "narristotle-arcade-card.png", { type: "image/png" }); } catch (e) { file = null; }
        var canShareFiles = false;
        try { canShareFiles = !!(file && navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) { canShareFiles = false; }
        if (canShareFiles) {
          navigator.share({ files: [file], title: "Narristotle’s Story & Song Arcade", text: snap.title + " — made in Narristotle’s Story & Song Arcade", url: url })
            .catch(function (err) {
              if (err && err.name === "AbortError") return; /* user closed the share sheet */
              if (!openCardModal(url) && navigator.clipboard) {
                navigator.clipboard.writeText(url);
                statusEl.textContent = "Share link copied — your friend will see this exact card.";
              }
            });
          return;
        }
        if (!openCardModal(url) && navigator.clipboard) {
          navigator.clipboard.writeText(url);
          statusEl.textContent = "Share link copied — your friend will see this exact card.";
        }
      }).catch(function (err) {
        if (window.console) console.error("Arcade meme card failed:", err);
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        statusEl.textContent = "Card painting hit a snag in this browser — share link copied instead.";
      });
    });

    /* ---------- 🔖 Save to My Vault (Firebase Auth + Firestore) ---------- */
    if (vaultBtn) {
      vaultBtn.addEventListener("click", function () {
        var snap = snapshots[state.mode];
        if (!snap) return;
        var F = fb();
        if (!F) { statusEl.textContent = "The Vault needs a connection — check back in a moment."; return; }
        function save(user) {
          statusEl.textContent = "Saving to your Vault…";
          F.db.collection("narristotle_vault").add({
            uid: user.uid, email: user.email || "",
            mode: snap.mode, genre: snap.genre, title: snap.title,
            plainText: snap.plainText, inputs: snap.inputs,
            feedHref: snap.feedHref, createdAt: Date.now()
          }).then(function () {
            statusEl.textContent = "Saved to your Vault ✓ — it will be waiting whenever you are.";
            if (vaultOpen) { vaultOpen.setAttribute("href", snap.feedHref); vaultOpen.style.display = ""; }
          }).catch(function (err) {
            statusEl.textContent = "The Vault hiccuped: " + (err && err.message ? err.message : "try again");
          });
        }
        var user = F.auth.currentUser;
        if (user) { save(user); return; }
        statusEl.textContent = "One tap to sign in, then it saves…";
        F.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
          .then(function (cred) { save(cred.user); })
          .catch(function (err) { statusEl.textContent = "Sign-in was closed — your card is still right here."; });
      });
    }

    /* ---------- Scout templates served live from Firestore ---------- */
    function registerCustomMode(docId, d) {
      var key = d.key || docId;
      if (!key || fieldSets[key] || !d.title || !d.body) return;
      CUSTOM[key] = { label: d.label || "Fresh from the Scout", title: d.title, body: d.body };
      MODE_NAMES[key] = d.modeName || d.title;
      state.genre[key] = d.genreKey || "live";
      revealed[key] = false;
      TEASE[key] = {
        kicker: (d.modeName || d.title) + " · Fresh Template",
        title: d.teaseTitle || "A brand-new template, straight from the 4 AM Scout.",
        body: d.teaseBody || "Five words in, one tiny story out. Hit Reveal."
      };
      /* mode button */
      var pill = root.querySelector(".pill");
      var btn = document.createElement("button");
      btn.type = "button"; btn.setAttribute("data-mode-btn", key);
      btn.textContent = d.modeName || d.title;
      if (pill) { pill.appendChild(btn); }
      modeBtns.push(btn); bindModeBtn(btn);
      /* genre row (single pill) */
      var panel = fieldSets.story.parentElement;
      var h3 = panel.querySelector("h3");
      var grow = document.createElement("div");
      grow.className = "arcade-genres"; grow.setAttribute("data-genres", key); grow.style.display = "none";
      grow.innerHTML = '<span class="g-label">Fresh template:</span> ';
      var gb = document.createElement("button");
      gb.type = "button"; gb.setAttribute("data-genre", state.genre[key]); gb.className = "active";
      gb.textContent = d.label || "Fresh from the Scout";
      grow.appendChild(gb);
      panel.insertBefore(grow, h3);
      genreRows[key] = grow;
      /* field set */
      var fs = document.createElement("div");
      fs.setAttribute("data-fields", key); fs.style.display = "none";
      (d.fields || []).forEach(function (lab, i) {
        var wrap = document.createElement("div");
        wrap.className = "arcade-field";
        var l = document.createElement("label"); l.textContent = lab;
        var inp = document.createElement("input");
        inp.type = "text"; inp.value = (d.defaults || [])[i] || "";
        inp.setAttribute("data-default", (d.defaults || [])[i] || "");
        wrap.appendChild(l); wrap.appendChild(inp); fs.appendChild(wrap);
      });
      var revealBtn = root.querySelector("[data-reveal]");
      panel.insertBefore(fs, revealBtn.parentElement === panel ? revealBtn : null);
      fieldSets[key] = fs;
      bindGenreRow(key); bindInputs(fs);
    }
    (function loadCustomModes() {
      var F = fb();
      if (!F) return;
      F.db.collection("narristotle_arcade_templates").where("status", "==", "live").get()
        .then(function (s) { s.docs.forEach(function (doc) { registerCustomMode(doc.id, doc.data()); }); })
        .catch(function () { /* the built-in modes carry on regardless */ });
    })();

    /* Load a shared card from the query string, if present — shared cards arrive revealed. */
    var params = new URLSearchParams(window.location.search);
    if (params.get("arcade") === "1" || params.get("mode")) {
      var m = params.get("mode") || DEFAULT_MODE;
      if (!fieldSets[m]) m = "story";
      var gname = params.get("genre");
      var validGenre = (m === "song" ? SONG_GENRES : (MODE_TEMPLATES[m] || {}));
      if (gname && validGenre[gname]) {
        state.genre[m] = gname;
        if (genreRows[m]) genreRows[m].querySelectorAll("[data-genre]").forEach(function (x) { x.classList.toggle("active", x.getAttribute("data-genre") === gname); });
      }
      for (var i = 1; i <= 5; i++) {
        var v = params.get("i" + i);
        if (v) { var inp = fieldSets[fieldKey(m)].querySelectorAll("input")[i - 1]; if (inp) inp.value = v; }
      }
      setMode(m);
      render();
    } else {
      setMode(DEFAULT_MODE);
    }
  }

  document.querySelectorAll("[data-arcade]").forEach(initArcade);
})();
