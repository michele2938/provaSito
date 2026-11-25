
const PHOTOS = [
  { src: "img/sushi1.jpg", nome: "Nigiri salmone" },
  { src: "img/sushi2.jpg", nome: "Uramaki" },
  { src: "img/sushi3.jpg", nome: "Nigiri gambero" },
  { src: "img/sushi4.jpg", nome: "Hosomaki" },
  { src: "img/sushi5.jpg", nome: "Panedolce" },
];
PHOTOS.forEach(p => { const i = new Image(); i.src = p.src; });

const NORI = "#1b2420", RISO = "#f7f5ee";
const dots = (n, r, rad, fill, size) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  return `<circle cx="${100 + Math.cos(a) * r}" cy="${100 + Math.sin(a) * r}" r="${size}" fill="${fill}"/>`;
}).join("");
const maki = (inner) =>
  `<svg viewBox="0 0 200 200" role="img"><circle cx="100" cy="100" r="94" fill="${NORI}"/><circle cx="100" cy="100" r="78" fill="${RISO}"/>${inner}</svg>`;
const uramaki = (inner) =>
  `<svg viewBox="0 0 200 200" role="img"><circle cx="100" cy="100" r="94" fill="${RISO}"/>${dots(26, 84, 0, "#5a4a3a", 2.6)}${dots(18, 70, 0, "#e9e2d0", 2.4)}<circle cx="100" cy="100" r="62" fill="${NORI}"/><circle cx="100" cy="100" r="53" fill="${RISO}"/>${inner}</svg>`;
const FALLBACK = [
  () => maki(`<circle cx="100" cy="100" r="36" fill="#ff7a4d"/><path d="M78 100c8-14 36-14 44 0M84 112c8-8 24-8 32 0" stroke="#ffc2a3" stroke-width="5" fill="none" stroke-linecap="round"/>`),
  () => uramaki(`<circle cx="100" cy="100" r="28" fill="#ffb347"/><circle cx="100" cy="100" r="10" fill="#ff7a4d"/>`),
  () => uramaki(`<circle cx="100" cy="100" r="28" fill="#ff9a8a"/><path d="M80 90c14-8 26-8 40 0M78 104c16-8 28-8 44 0M82 118c14-6 22-6 36 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`),
  () => maki(`<circle cx="100" cy="100" r="36" fill="#5fae3d"/><circle cx="100" cy="100" r="25" fill="#d3ebae"/>${dots(8, 14, 0, "#8bc269", 2.4)}`),
  () => maki(`${dots(1, 0, 0, "#ff6a2b", 9)}${dots(8, 16, 0, "#ff6a2b", 9)}${dots(14, 31, 0, "#ff8a3d", 8)}${dots(1, 0, 0, "#ffb27a", 3)}`),
];


const TICKER_TEXT = "non valgono le alghe";
const TICKER_PAUSA = [8, 20];  

const state = {
  step: 10,
  players: [
    { name: "VALERIA", color: "#e8503f", count: 0 },
    { name: "MICHELE", color: "#2f7d5b", count: 0 },
  ],
};

const KEY = "sfida-roll";
const readSaved = () => {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) {}
  if (!raw) {
    const m = document.cookie.match(/(?:^|; )sfida-roll=([^;]*)/);
    if (m) { try { raw = decodeURIComponent(m[1]); } catch (e) {} }
  }
  if (!raw && window.name.indexOf(KEY + ":") === 0) raw = window.name.slice(KEY.length + 1);
  return raw;
};
const save = () => {
  const raw = JSON.stringify(state);
  try { localStorage.setItem(KEY, raw); } catch (e) {}
  try { document.cookie = KEY + "=" + encodeURIComponent(raw) + "; max-age=31536000; path=/; SameSite=Lax"; } catch (e) {}
  try { window.name = KEY + ":" + raw; } catch (e) {}
};
try {
  const s = JSON.parse(readSaved());
  if (s && s.players && s.players.length === 2) {
    state.step = Math.max(1, parseInt(s.step) || 10);
    s.players.forEach((p, i) => {
      state.players[i].name = p.name || state.players[i].name;
      state.players[i].color = p.color || state.players[i].color;
      state.players[i].count = Math.max(0, parseInt(p.count) || 0);
    });
  }
} catch (e) {}
window.addEventListener("pagehide", save);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255]
    .map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
  return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
};

const els = [];
["p1", "p2"].forEach((id, i) => {
  const root = document.getElementById(id);
  root.innerHTML = `
    <div class="name"></div>
    ${i === 0 ? '<div class="ticker"><span></span></div>' : ''}
    <div class="photo"><div class="frame"></div></div>
    <div class="info">
      <div class="pips">${PHOTOS.map(() => "<span></span>").join("")}</div>
      <div class="next"></div>
    </div>
    <div class="progress"><div></div></div>
    <div class="controls">
      <button class="minus" aria-label="Meno uno">−</button>
      <div class="count" aria-live="polite">0</div>
      <button class="plus" aria-label="Più uno">+</button>
    </div>`;
  const e = {
    root, lastIdx: -1,
    name: root.querySelector(".name"),
    photo: root.querySelector(".photo"), frame: root.querySelector(".frame"),
    pips: [...root.querySelectorAll(".pips span")],
    count: root.querySelector(".count"), bar: root.querySelector(".progress > div"),
    next: root.querySelector(".next"),
  };
  els.push(e);
  root.querySelector(".plus").addEventListener("click", () => change(i, 1));
  root.querySelector(".minus").addEventListener("click", () => change(i, -1));
});

function change(i, d) {
  const p = state.players[i];
  if (d < 0 && p.count === 0) return;
  p.count += d;
  render(i, true);
  save();
}

function showPhoto(e, idx) {
  const ph = PHOTOS[idx];
  e.frame.innerHTML = "";
  const img = new Image();
  img.alt = ph.nome; img.draggable = false;
  img.onerror = () => { e.frame.innerHTML = FALLBACK[idx % FALLBACK.length](); };
  img.src = ph.src;
  e.frame.appendChild(img);
}

function render(i, animate) {
  const p = state.players[i], e = els[i], step = Math.max(1, state.step);
  e.root.style.setProperty("--bg", p.color);
  e.root.style.setProperty("--fg", lum(p.color) > .4 ? "#1a1a1a" : "#ffffff");
  e.name.textContent = p.name;
  e.count.textContent = p.count;
  const into = p.count % step;
  e.bar.style.width = (into / step * 100) + "%";
  e.next.textContent = "Prossima foto tra " + (step - into);
//RICONTROLLARE QEUSTO PEZZO
  const idx = Math.floor(p.count / step) % PHOTOS.length;
  if (idx !== e.lastIdx) {
    showPhoto(e, idx);
    if (animate && e.lastIdx !== -1) {
      e.photo.classList.remove("pop"); void e.photo.offsetWidth; e.photo.classList.add("pop");
    }
    e.lastIdx = idx;
  }
  e.pips.forEach((s, k) => s.classList.toggle("on", k <= idx));

  if (animate) { e.count.classList.remove("bump"); void e.count.offsetWidth; e.count.classList.add("bump"); }
}
const renderAll = (a) => [0, 1].forEach(i => render(i, a));

const dlg = document.getElementById("settings");
const $ = (id) => document.getElementById(id);
const f = { n1: $("name1"), c1: $("color1"), n2: $("name2"), c2: $("color2"), s: $("step") };
$("open").addEventListener("click", () => {
  f.n1.value = state.players[0].name; f.c1.value = state.players[0].color;
  f.n2.value = state.players[1].name; f.c2.value = state.players[1].color;
  f.s.value = state.step;
  dlg.showModal();
});
const apply = () => {
  state.players[0].name = f.n1.value.trim() || "Giocatore 1";
  state.players[1].name = f.n2.value.trim() || "Giocatore 2";
  state.players[0].color = f.c1.value; state.players[1].color = f.c2.value;
  state.step = Math.max(1, parseInt(f.s.value) || 10);
  renderAll(false); save();
};
[f.n1, f.c1, f.n2, f.c2, f.s].forEach(el => el.addEventListener("input", apply));
$("close").addEventListener("click", () => dlg.close());
$("reset").addEventListener("click", () => {
  if (confirm("Azzerare i conteggi di entrambi?")) {
    state.players.forEach(p => p.count = 0);
    els.forEach(e => e.lastIdx = -1);
    renderAll(false); save();
  }
});

renderAll(false);

function startTicker(root) {
  const box = root.querySelector(".ticker");
  if (!box) return;
  const sp = box.firstElementChild;
  sp.textContent = TICKER_TEXT;

  const pausa = () => (TICKER_PAUSA[0] + Math.random() * (TICKER_PAUSA[1] - TICKER_PAUSA[0])) * 1000;
  const run = () => {
    sp.classList.remove("run");
    sp.style.display = "block";
    const w = box.clientWidth, sw = sp.offsetWidth;
    sp.style.setProperty("--from", w + "px");
    sp.style.setProperty("--to", -sw + "px");
    sp.style.animationDuration = ((w + sw) / 55) + "s";  
    void sp.offsetWidth;
    sp.classList.add("run");
  };
  sp.addEventListener("animationend", () => {
    sp.classList.remove("run");
    sp.style.display = "none";
    setTimeout(run, pausa());
  });
  setTimeout(run, 3000);
}
startTicker(els[0].root);   
