// Gallery images. Add, remove or rename entries here.
// size: "wide" spans two columns, "tall" spans two rows (optional).
// Only images that load are shown; the section stays hidden until one does.
const BUILDS = [
  { src: "build-1.jpg", title: "Cottage exterior", alt: "A white cottage with a front porch, flower boxes, lanterns and round trees under a blue sky." },
  { src: "build-7.jpg", title: "Fighter plane", size: "wide", alt: "A polished silver propeller fighter plane with a red nose, red tail stripe and a black four-blade propeller." },
  { src: "build-2.jpg", title: "Living room", alt: "A warm living room with a stone fireplace, red armchairs, a green sofa and large windows." },
  { src: "build-8.jpg", title: "Tactical rifle", pos: "45% 50%", alt: "Close-up of a black rifle with a tan stock and grip, a top rail, a rear sight and a long magazine." },
  { src: "build-5.jpg", title: "Kitchen and dining", size: "wide", alt: "A kitchen with green cabinets, a marble island, bar stools and a wooden dining table." },
  { src: "build-6.jpg", title: "Fireplace wall", size: "wide", alt: "A stone fireplace with a lit fire, a wooden mantel with a clock and a sword, between two windows." },
];

const DISCORD = "friedice_";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------- Copy Discord name ---------- */
const toast = document.getElementById("toast");
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const ok = await copyText(btn.dataset.copy || DISCORD);
    showToast(ok ? "Copied" : `Discord: ${DISCORD}`);
  });
});

/* ---------- Giant word: fit it to the width ---------- */
const word = document.getElementById("word");
function fitWord() {
  if (!word) return;
  const avail = word.parentElement.clientWidth -
    parseFloat(getComputedStyle(word.parentElement).paddingLeft) -
    parseFloat(getComputedStyle(word.parentElement).paddingRight);
  word.style.fontSize = "100px";
  const w = word.getBoundingClientRect().width;
  if (w > 0) word.style.fontSize = Math.floor((avail / w) * 100 * 0.995) + "px";
}
fitWord();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWord);
window.addEventListener("resize", fitWord);

/* ---------- Sparkles around the sword ---------- */
const sparks = document.getElementById("sparks");
if (sparks && !reduceMotion) {
  const kinds = ["", "", "spark--warm", "spark--warm", "spark--ruby"];
  for (let i = 0; i < 18; i++) {
    const s = document.createElement("span");
    s.className = "spark " + kinds[i % kinds.length];
    // keep sparks near the diagonal of the blade
    const t = Math.random();
    const x = 30 + t * 40 + (Math.random() - 0.5) * 30;
    const y = 88 - t * 78 + (Math.random() - 0.5) * 18;
    s.style.left = x + "%";
    s.style.top = y + "%";
    s.style.setProperty("--s", (6 + Math.random() * 14).toFixed(0) + "px");
    s.style.setProperty("--d", (2.6 + Math.random() * 3).toFixed(2) + "s");
    s.style.setProperty("--delay", (Math.random() * 4).toFixed(2) + "s");
    sparks.appendChild(s);
  }
}

/* ---------- Sword: glare on open, glare on hover, parallax ---------- */
const sword = document.getElementById("sword");
const hero = document.querySelector(".hero");
let lastGlare = 0;

function glare() {
  if (reduceMotion || !sword) return;
  const now = performance.now();
  if (now - lastGlare < 1600) return;
  lastGlare = now;
  sword.classList.remove("is-glare");
  void sword.offsetWidth; // restart the animation
  sword.classList.add("is-glare");
}

if (sword) {
  const img = sword.querySelector(".sword__img");
  const start = () => setTimeout(glare, 1350); // right after the sword flies in
  if (img.complete) start();
  else img.addEventListener("load", start, { once: true });
}

if (hero && sword && finePointer && !reduceMotion) {
  let raf = 0, mx = 0, my = 0;
  hero.addEventListener("mousemove", (e) => {
    const r = hero.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5;
    my = (e.clientY - r.top) / r.height - 0.5;
    if (!raf) raf = requestAnimationFrame(() => {
      sword.style.setProperty("--px", (mx * 34).toFixed(1) + "px");
      sword.style.setProperty("--py", (my * 22).toFixed(1) + "px");
      word.style.setProperty("--wx", (mx * -14).toFixed(1) + "px");
      raf = 0;
    });
    // glare again when the pointer comes close to the blade
    const sr = sword.getBoundingClientRect();
    const near = e.clientX > sr.left - 40 && e.clientX < sr.right + 40 && e.clientY > sr.top && e.clientY < sr.bottom;
    if (near && !hero.dataset.near) { hero.dataset.near = "1"; glare(); }
    if (!near) delete hero.dataset.near;
  });
  hero.addEventListener("mouseleave", () => {
    sword.style.setProperty("--px", "0px");
    sword.style.setProperty("--py", "0px");
    word.style.setProperty("--wx", "0px");
  });
}

/* ---------- Gallery ---------- */
const section = document.getElementById("builds");
const grid = document.getElementById("grid");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lightbox-img");
const lbCap = document.getElementById("lightbox-cap");
let lastFocus = null;

function openLightbox(build) {
  lastFocus = document.activeElement;
  lbImg.src = build.src;
  lbImg.alt = build.alt;
  lbCap.textContent = build.title;
  if (typeof lightbox.showModal === "function") lightbox.showModal();
  else lightbox.setAttribute("open", "");
}
function closeLightbox() { if (lightbox.open) lightbox.close(); }

lightbox.addEventListener("click", closeLightbox);
lightbox.addEventListener("close", () => { if (lastFocus) lastFocus.focus(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

const slots = BUILDS.map((build) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "tile" + (build.size ? " tile--" + build.size : "");
  btn.setAttribute("aria-label", `Open full-size image: ${build.title}`);
  return { build, btn, ok: false };
});

function render() {
  const loaded = slots.filter((s) => s.ok);
  if (!loaded.length) return;
  grid.replaceChildren(...loaded.map((s) => s.btn));
  grid.classList.toggle("has-feature", loaded.length >= 3);
  section.hidden = false;
  requestAnimationFrame(() => loaded.forEach((s) => s.btn.classList.add("is-in")));
}

slots.forEach((slot) => {
  const img = new Image();
  img.decoding = "async";
  img.alt = slot.build.alt;
  if (slot.build.pos) img.style.objectPosition = slot.build.pos;
  img.onload = () => {
    slot.ok = true;
    const cap = document.createElement("span");
    cap.className = "tile__cap";
    cap.textContent = slot.build.title;
    slot.btn.append(img, cap);
    slot.btn.addEventListener("click", () => openLightbox(slot.build));
    render();
  };
  img.src = slot.build.src;
});

document.getElementById("year").textContent = new Date().getFullYear();
