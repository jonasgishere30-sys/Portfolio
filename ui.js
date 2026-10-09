// Game UI concepts: a working shop and a live HUD.
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = (n) => n.toLocaleString("en-US");

  /* =========================== SHOP =========================== */
  const ITEMS = [
    { id: "ruby", name: "Ruby Longsword", type: "weapon", rarity: "legendary", price: 1200, art: "sword",
      desc: "A longsword with rubies set in the guard and pommel.",
      stats: [["Damage", 92], ["Speed", 64], ["Range", 78]] },
    { id: "iron", name: "Iron Sword", type: "weapon", rarity: "common", state: "equipped", art: "i-sword",
      desc: "Reliable and well balanced. Every hero starts here.",
      stats: [["Damage", 38], ["Speed", 70], ["Range", 55]] },
    { id: "bow", name: "Hunter Bow", type: "weapon", rarity: "rare", price: 450, art: "i-bow",
      desc: "Hits from far away. Hold to charge a stronger shot.",
      stats: [["Damage", 54], ["Speed", 48], ["Range", 96]] },
    { id: "lantern", name: "Brass Lantern", type: "gear", rarity: "epic", price: 800, art: "lantern",
      desc: "Lights up dark caves and shows hidden paths.",
      stats: [["Light", 90], ["Duration", 72], ["Weight", 30]] },
    { id: "dagger", name: "Frost Dagger", type: "weapon", rarity: "rare", price: 300, art: "i-dagger",
      desc: "Quick strikes that slow enemies for a moment.",
      stats: [["Damage", 44], ["Speed", 96], ["Range", 28]] },
    { id: "mystery", name: "Mystery Blade", type: "weapon", rarity: "locked", level: 20, art: "mystery",
      desc: "Reach level 20 to find out what this is.",
      stats: [["Damage", 0], ["Speed", 0], ["Range", 0]] },
  ];
  const RARITY = { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary", locked: "Locked" };
  const STAGE = {
    common: ["#a3abbf", "#5f687f", "rgba(255,255,255,.55)"],
    rare: ["#57b6ff", "#1f5fd6", "rgba(190,235,255,.85)"],
    epic: ["#c27bff", "#6a2bd6", "rgba(240,205,255,.85)"],
    legendary: ["#ffd86a", "#ee8216", "rgba(255,250,215,.95)"],
    locked: ["#3d4360", "#23273d", "rgba(140,150,200,.25)"],
  };

  const grid = document.getElementById("shop-grid");
  if (!grid) return;
  const coinsEl = document.getElementById("coins");
  const d = {
    stage: document.querySelector(".detail__stage"),
    img: document.getElementById("d-img"),
    rarity: document.getElementById("d-rarity"),
    name: document.getElementById("d-name"),
    desc: document.getElementById("d-desc"),
    stats: document.getElementById("d-stats"),
    btn: document.getElementById("d-btn"),
    btnText: document.getElementById("d-btn-text"),
    msg: document.getElementById("d-msg"),
  };
  let coins = 2450;
  let selected = "ruby";

  const lockSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zm2 0h6V8a3 3 0 0 0-6 0z"/></svg>';

  function artHTML(item) {
    if (item.art === "sword") return '<img class="art-sword" src="images/sword.webp" alt="">';
    if (item.art === "lantern") return '<img class="art-lantern" src="images/lantern.webp" alt="">';
    if (item.art === "mystery") return '<img class="art-mystery" src="images/sword.webp" alt=""><span class="card__q t-stroke">?</span>';
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><use href="#${item.art}"/></svg>`;
  }
  function chipHTML(item) {
    if (item.state === "equipped") return '<span class="chip chip--equipped">Equipped</span>';
    if (item.state === "owned") return '<span class="chip chip--owned">Owned</span>';
    if (item.rarity === "locked") return `<span class="chip chip--locked">${lockSvg}Lv ${item.level}</span>`;
    return `<span class="chip${item.price > coins ? " chip--poor" : ""}"><span class="cur__ico cur__ico--sm"></span>${fmt(item.price)}</span>`;
  }
  function statusText(item) {
    if (item.state === "equipped") return "equipped";
    if (item.state === "owned") return "owned";
    if (item.rarity === "locked") return `locked until level ${item.level}`;
    return `${fmt(item.price)} coins`;
  }

  function renderGrid() {
    grid.replaceChildren(...ITEMS.map((item) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `card card--${item.rarity}` + (item.id === selected ? " is-selected" : "");
      b.dataset.id = item.id;
      b.dataset.type = item.type;
      b.setAttribute("role", "option");
      b.setAttribute("aria-selected", item.id === selected ? "true" : "false");
      b.setAttribute("aria-label", `${item.name}, ${RARITY[item.rarity]}, ${statusText(item)}`);
      b.innerHTML =
        (item.rarity === "legendary" ? '<span class="card__shine"></span>' : "") +
        `<span class="card__rar t-stroke">${RARITY[item.rarity]}</span>` +
        `<span class="card__art">${artHTML(item)}</span>` +
        `<span class="card__foot"><span class="card__name t-stroke">${item.name}</span>${chipHTML(item)}</span>`;
      b.addEventListener("click", () => select(item.id));
      return b;
    }));
    applyFilter();
  }

  function renderDetail(animate) {
    const item = ITEMS.find((i) => i.id === selected);
    const [c1, c2, glow] = STAGE[item.rarity];
    d.stage.style.setProperty("--c1", c1);
    d.stage.style.setProperty("--c2", c2);
    d.stage.style.setProperty("--glow", glow);

    d.img.className = "detail__img";
    if (item.art === "sword" || item.art === "mystery") {
      d.img.src = "images/sword.webp";
      if (item.art === "mystery") d.img.classList.add("is-mystery");
    } else if (item.art === "lantern") {
      d.img.src = "images/lantern.webp";
      d.img.classList.add("is-lantern");
    } else {
      // turn the SVG symbol into an image for the big preview
      const sym = document.getElementById(item.art);
      const defs = document.querySelector("#ui svg defs");
      const grads = [...defs.querySelectorAll("linearGradient")].map((g) => g.outerHTML).join("");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs>${grads}</defs>${sym.innerHTML}</svg>`;
      d.img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      d.img.classList.add("is-svg");
    }
    if (animate && !reduce) { void d.img.offsetWidth; d.img.classList.add("is-swap"); }

    d.rarity.textContent = RARITY[item.rarity];
    d.name.textContent = item.rarity === "locked" ? "???" : item.name;
    d.desc.textContent = item.desc;
    d.stats.innerHTML = item.stats.map(([k, v]) =>
      `<div class="stat"><span class="stat__k">${k}</span><span class="stat__bar"><span style="--v:${v}%"></span></span><span class="stat__v t-stroke">${item.rarity === "locked" ? "?" : v}</span></div>`
    ).join("");

    const b = d.btn;
    b.className = "gbtn";
    const coin = '<span class="cur__ico cur__ico--sm" aria-hidden="true"></span>';
    if (item.state === "equipped") { b.classList.add("gbtn--off"); b.innerHTML = '<span class="t-stroke">Equipped</span>'; }
    else if (item.state === "owned") { b.classList.add("gbtn--equip"); b.innerHTML = '<span class="t-stroke">Equip</span>'; }
    else if (item.rarity === "locked") { b.classList.add("gbtn--off"); b.innerHTML = `<span class="t-stroke">Unlocks at Lv ${item.level}</span>`; }
    else { b.innerHTML = `${coin}<span class="t-stroke">Buy ${fmt(item.price)}</span>`; }
  }

  function select(id) {
    if (id === selected) return;
    selected = id;
    grid.querySelectorAll(".card").forEach((c) => {
      const on = c.dataset.id === id;
      c.classList.toggle("is-selected", on);
      c.setAttribute("aria-selected", on ? "true" : "false");
    });
    renderDetail(true);
    // on small screens the preview sits under the grid, so bring it into view
    if (window.matchMedia("(max-width: 1080px)").matches) {
      const r = document.getElementById("detail").getBoundingClientRect();
      if (r.top > window.innerHeight * 0.75 || r.bottom < 0) {
        document.getElementById("detail").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
      }
    }
  }

  function say(text, kind) {
    d.msg.textContent = text;
    d.msg.className = `detail__msg t-stroke is-${kind}`;
    void d.msg.offsetWidth;
    d.msg.classList.add("is-show");
  }

  function setCoins(target) {
    const wallet = coinsEl.closest(".cur");
    wallet.classList.remove("is-bump"); void wallet.offsetWidth; wallet.classList.add("is-bump");
    if (reduce) { coins = target; coinsEl.textContent = fmt(coins); return; }
    const from = coins, start = performance.now(), dur = 600;
    coins = target;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      coinsEl.textContent = fmt(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function burst() {
    if (reduce) return;
    const shop = document.getElementById("shop");
    const sr = shop.getBoundingClientRect();
    const br = d.btn.getBoundingClientRect();
    const wr = coinsEl.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
      const c = document.createElement("span");
      c.className = "burst";
      const x = br.left - sr.left + br.width / 2 + (Math.random() - .5) * 80;
      const y = br.top - sr.top + br.height / 2;
      c.style.left = x + "px"; c.style.top = y + "px";
      c.style.setProperty("--tx", (wr.left - sr.left - x + (Math.random() - .5) * 30) + "px");
      c.style.setProperty("--ty", (wr.top - sr.top - y) + "px");
      c.style.animationDelay = (i * 0.035) + "s";
      shop.appendChild(c);
      setTimeout(() => c.remove(), 1200);
    }
  }

  d.btn.addEventListener("click", () => {
    const item = ITEMS.find((i) => i.id === selected);
    if (item.state === "equipped" || item.rarity === "locked") return;
    if (item.state === "owned") {
      ITEMS.forEach((i) => { if (i.state === "equipped" && i.type === item.type) i.state = "owned"; });
      item.state = "equipped";
      say("Equipped!", "good");
    } else if (coins >= item.price) {
      burst();
      setCoins(coins - item.price);
      item.state = "owned";
      say("Purchased!", "good");
    } else {
      d.btn.classList.remove("is-shake"); void d.btn.offsetWidth; d.btn.classList.add("is-shake");
      say("Not enough coins", "bad");
      return;
    }
    renderGrid();
    const card = grid.querySelector(`[data-id="${item.id}"]`);
    if (card && !reduce) card.classList.add("is-new");
    renderDetail(false);
  });

  // tabs
  let filter = "all";
  const tabs = document.querySelectorAll(".shop__tabs .tab");
  function applyFilter() {
    grid.querySelectorAll(".card").forEach((c) => c.classList.toggle("is-hidden", filter !== "all" && c.dataset.type !== filter));
  }
  tabs.forEach((t) => t.addEventListener("click", () => {
    filter = t.dataset.filter;
    tabs.forEach((x) => { const on = x === t; x.classList.toggle("is-active", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
    applyFilter();
    const first = grid.querySelector(".card:not(.is-hidden)");
    if (first && grid.querySelector(".card.is-selected.is-hidden")) select(first.dataset.id);
  }));

  // keyboard: arrows move between items
  grid.addEventListener("keydown", (e) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
    const cards = [...grid.querySelectorAll(".card:not(.is-hidden)")];
    const i = cards.indexOf(document.activeElement);
    if (i < 0) return;
    const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
    const next = cards[Math.max(0, Math.min(cards.length - 1, i + step))];
    next.focus(); select(next.dataset.id);
    e.preventDefault();
  });

  renderGrid();
  renderDetail(false);

  /* =========================== HUD =========================== */
  const hud = document.getElementById("hud");
  if (!hud || reduce) return;
  const el = (id) => document.getElementById(id);
  const hpFill = el("hp-fill"), hpTrail = el("hp-trail"), hpTxt = el("hp-txt"), stFill = el("st-fill");
  const waveTitle = el("wave-title"), waveFill = el("wave-fill"), waveTxt = el("wave-txt");
  const hudCoins = el("hud-coins"), feed = el("feed"), plus = el("plus");
  const slots = [...hud.querySelectorAll(".slot")];
  const ENEMIES = ["Zombie", "Brute", "Skeleton", "Goblin", "Wraith"];
  let hp = 100, wave = 12, left = 8, total = 20, gold = 1480, st = 80, sel = 0, t = 0, timer = 0;

  function setHp(v) {
    hp = Math.max(8, Math.min(100, v));
    hpFill.style.setProperty("--v", hp + "%");
    hpTrail.style.setProperty("--v", hp + "%");
    hpTxt.textContent = `${Math.round(hp)} / 100`;
  }
  function setWave() {
    waveFill.style.width = ((total - left) / total * 100) + "%";
    waveTxt.textContent = `Enemies left ${left}`;
  }
  function kill() {
    left -= 1;
    gold += 25;
    hudCoins.textContent = fmt(gold);
    plus.classList.remove("is-show"); void plus.offsetWidth; plus.classList.add("is-show");
    const li = document.createElement("li");
    li.innerHTML = `<b>You</b> defeated <i>${ENEMIES[Math.floor(Math.random() * ENEMIES.length)]}</i>`;
    feed.prepend(li);
    while (feed.children.length > 3) feed.lastElementChild.remove();
    if (left <= 0) {
      wave += 1; left = total;
      waveTitle.textContent = `Wave ${wave}`;
      waveTitle.classList.remove("is-new"); void waveTitle.offsetWidth; waveTitle.classList.add("is-new");
    }
    setWave();
  }
  function step() {
    t += 1;
    // stamina breathes, health takes hits and regenerates
    st = 45 + Math.abs(Math.sin(t / 3)) * 55;
    stFill.style.setProperty("--v", st + "%");
    if (t % 3 === 0) setHp(hp - (10 + Math.random() * 16));
    else setHp(hp + 7);
    if (t % 2 === 0) kill();
    if (t % 5 === 0) { sel = (sel + 1) % 4; slots.forEach((s, i) => s.classList.toggle("is-sel", i === sel)); }
  }

  setHp(100);
  setWave();
  const io = new IntersectionObserver(([entry]) => {
    clearInterval(timer);
    if (entry.isIntersecting) timer = setInterval(step, 1100);
  }, { threshold: 0.2 });
  io.observe(hud);
})();
