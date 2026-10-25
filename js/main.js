/* =========================================================
   André & Thaiz — interações
   ========================================================= */
(() => {
  "use strict";
  const C = window.CONFIG;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DEMO = !C.googleScriptUrl;

  /* ---------------- Toast & confete ---------------- */
  const toastEl = $("#toast");
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("is-on"), 3200);
  }
  function confetti(n = 80) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#c8102e", "#121212", "#f4f4f4", "#b8924a", "#3d5a3a"];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.className = "confetti";
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = 2.5 + Math.random() * 2.5 + "s";
      p.style.animationDelay = Math.random() * 0.6 + "s";
      p.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      document.body.appendChild(p);
      p.addEventListener("animationend", () => p.remove());
    }
  }

  /* ---------------- Backend (Google Apps Script) ---------------- */
  const store = {
    get: (k) => JSON.parse(localStorage.getItem("at_" + k) || "[]"),
    push: (k, v) => {
      const arr = store.get(k);
      arr.push(v);
      localStorage.setItem("at_" + k, JSON.stringify(arr));
    },
  };
  async function send(tipo, dados) {
    const payload = { tipo, ...dados, enviadoEm: new Date().toISOString() };
    store.push(tipo, payload); // cópia local sempre
    if (DEMO) {
      await new Promise((r) => setTimeout(r, 700));
      return { ok: true, demo: true };
    }
    // text/plain evita o preflight CORS do Apps Script
    const res = await fetch(C.googleScriptUrl, { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "text/plain;charset=utf-8" } });
    if (!res.ok) throw new Error("Falha no envio");
    return res.json().catch(() => ({ ok: true }));
  }

  /* ---------------- Nav ---------------- */
  const nav = $("#nav");
  const toggle = $("#nav-toggle");
  const onScroll = () => nav.classList.toggle("is-scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  $$("#nav-menu a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    })
  );
  const sectionObs = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        $$("#nav-menu a").forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
      }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("main section[id]").forEach((s) => sectionObs.observe(s));

  /* ---------------- Countdown ---------------- */
  const target = new Date(C.dataCasamento).getTime();
  const cdEls = { d: $("#cd-dias"), h: $("#cd-horas"), m: $("#cd-min"), s: $("#cd-seg") };
  function setCd(el, val) {
    if (el.textContent === val) return;
    el.textContent = val;
    el.classList.remove("tick");
    void el.offsetWidth;
    el.classList.add("tick");
  }
  function tick() {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4); diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    setCd(cdEls.d, String(d).padStart(3, "0"));
    setCd(cdEls.h, String(h).padStart(2, "0"));
    setCd(cdEls.m, String(m).padStart(2, "0"));
    setCd(cdEls.s, String(s).padStart(2, "0"));
    if (target - Date.now() <= 0) $(".scoreboard__live").textContent = "● É HOJE!";
  }
  tick();
  setInterval(tick, 1000);

  /* ---------------- Reveal on scroll ---------------- */
  const revealObs = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-visible");
        if (e.target.dataset.count) countUp(e.target);
        revealObs.unobserve(e.target);
      }),
    { threshold: 0.15 }
  );
  const observe = (els) => els.forEach((el) => revealObs.observe(el));

  /* ---------------- Estatísticas ---------------- */
  $("#stats").innerHTML = C.estatisticas
    .map((s, i) => `<div class="stat reveal" style="transition-delay:${i * 0.1}s" data-count="${s.valor}" data-suf="${esc(s.sufixo)}"><strong>0</strong><span>${esc(s.label)}</span></div>`)
    .join("");
  function countUp(el) {
    const end = +el.dataset.count, suf = el.dataset.suf || "", out = $("strong", el);
    const t0 = performance.now(), dur = 1600;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      out.textContent = Math.round(end * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------------- Timeline ---------------- */
  const icons = ["✈", "♥", "⚽", "🧭", "💍", "⛪"];
  $("#timeline").innerHTML = C.historia
    .map(
      (h, i) => `
    <li class="tl reveal">
      <span class="tl__dot" aria-hidden="true">${icons[i % icons.length]}</span>
      <article class="tl__card">
        <div class="stamp" aria-hidden="true"><div><b>${esc(h.carimbo)}</b>${esc(h.cidade).toUpperCase()}<br>${esc(h.ano)}</div></div>
        <span class="tl__year">${esc(h.ano)}</span>
        <h3>${esc(h.titulo)}</h3>
        <p>${esc(h.texto)}</p>
      </article>
      ${h.imagem ? `<div class="tl__media"><img src="${esc(h.imagem)}" alt="${esc(h.titulo)}" loading="lazy"></div>` : `<div class="tl__spacer"></div>`}
    </li>`
    )
    .join("");

  /* ---------------- Galeria + lightbox ---------------- */
  const gal = C.galeria;
  $("#gallery").innerHTML = gal
    .map(
      (g, i) => `<button class="gallery__item reveal ${g.classe || ""}" data-i="${i}" data-caption="${esc(g.alt)}" id="gal-${i}" aria-label="Ampliar: ${esc(g.alt)}">
        <img src="${esc(g.src)}" alt="${esc(g.alt)}" loading="lazy"></button>`
    )
    .join("");
  const lb = $("#lightbox"), lbImg = $("#lightbox-img"), lbCap = $("#lightbox-cap");
  let lbI = 0;
  const showLb = (i) => {
    lbI = (i + gal.length) % gal.length;
    lbImg.src = gal[lbI].src;
    lbImg.alt = gal[lbI].alt;
    lbCap.textContent = gal[lbI].alt;
  };
  $("#gallery").addEventListener("click", (e) => {
    const b = e.target.closest(".gallery__item");
    if (!b) return;
    showLb(+b.dataset.i);
    lb.showModal();
  });
  $("#lb-prev").onclick = () => showLb(lbI - 1);
  $("#lb-next").onclick = () => showLb(lbI + 1);
  lb.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") showLb(lbI - 1);
    if (e.key === "ArrowRight") showLb(lbI + 1);
  });
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });

  /* ---------------- Cartões de embarque ---------------- */
  const pass = (ev, cls, n) => `
    <article class="pass ${cls} reveal">
      <div class="pass__main">
        <div class="pass__top"><span>CARTÃO DE EMBARQUE · BOARDING PASS</span><b>AT2027</b></div>
        <div class="pass__route">
          <div><span class="code">DUB</span><span class="city">Dublin</span></div>
          <div class="line"></div>
          <div style="text-align:right"><span class="code">UDI</span><span class="city">Uberlândia</span></div>
        </div>
        <h3 class="pass__title">${esc(ev.titulo)}</h3>
        <div class="pass__grid">
          <div><span>Passageiro</span><strong>Você ♥</strong></div>
          <div><span>Data</span><strong>01 MAI 2027</strong></div>
          <div><span>Embarque</span><strong>${esc(ev.horario)}</strong></div>
          <div><span>Portão</span><strong>${esc(ev.local)}</strong></div>
          <div><span>Destino</span><strong>${esc(ev.endereco)}</strong></div>
          <div><span>Assento</span><strong>${n === 1 ? "Livre" : "Pista de dança"}</strong></div>
        </div>
      </div>
      <div class="pass__stub">
        <small>EMBARQUE</small>
        <span class="time">${esc(ev.horario)}</span>
        <div class="barcode" aria-hidden="true"></div>
      </div>
    </article>`;
  $("#passes").innerHTML = pass(C.cerimonia, "pass--cerimonia", 1) + pass(C.festa, "pass--festa", 2);
  $("#map-frame").src = `https://maps.google.com/maps?q=${encodeURIComponent(C.cerimonia.mapsQuery)}&z=12&output=embed`;

  // Calendário
  const toUTC = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(C.dataCasamento), end = new Date(start.getTime() + 9 * 36e5);
  const evTitle = `Casamento ${C.noivos.ele} & ${C.noivos.ela}`;
  const evDesc = "A grande final! Mais informações no site dos noivos.";
  const evLoc = `${C.cerimonia.local}, ${C.cerimonia.endereco}`;
  $("#btn-gcal").href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evTitle)}&dates=${toUTC(start)}/${toUTC(end)}&details=${encodeURIComponent(evDesc)}&location=${encodeURIComponent(evLoc)}`;
  $("#btn-ics").addEventListener("click", () => {
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AndreThaiz//PT", "BEGIN:VEVENT", `UID:at2027@andreethaiz`, `DTSTAMP:${toUTC(new Date())}`, `DTSTART:${toUTC(start)}`, `DTEND:${toUTC(end)}`, `SUMMARY:${evTitle}`, `DESCRIPTION:${evDesc}`, `LOCATION:${evLoc}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "casamento-andre-thaiz.ics";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  /* ---------------- RSVP ---------------- */
  const rsvp = $("#rsvp-form");
  const filhos = $("#rsvp-filhos");
  filhos.addEventListener("change", () => ($("#idades-wrap").hidden = filhos.value === "0"));
  const prazo = new Date(C.prazoRSVP + "T23:59:59-03:00");
  rsvp.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = $("#rsvp-status"), btn = $("#rsvp-submit");
    status.className = "form__status";
    if (!rsvp.checkValidity()) {
      rsvp.reportValidity();
      return;
    }
    if (!$("#rsvp-email").value && !$("#rsvp-tel").value) {
      status.textContent = "Informe um e-mail ou WhatsApp para contato.";
      status.classList.add("err");
      return;
    }
    if (Date.now() > prazo) {
      status.textContent = "O prazo de confirmação encerrou. Fale diretamente com os noivos 💛";
      status.classList.add("err");
      return;
    }
    const data = Object.fromEntries(new FormData(rsvp));
    if (data.presenca === "nao") { data.filhos = "0"; data.criancas = ""; }
    btn.disabled = true;
    btn.textContent = "Processando check-in…";
    try {
      await send("rsvp", data);
      if (data.presenca === "sim") {
        status.textContent = `Check-in confirmado, ${data.nome.split(" ")[0]}! Nos vemos no dia 01/05 ✈`;
        confetti();
      } else {
        status.textContent = "Que pena! Obrigado por avisar — sentiremos sua falta 💛";
      }
      status.classList.add("ok");
      if (data.mensagem) {
        await send("recado", { nome: data.nome, time: data.time || "neutro", mensagem: data.mensagem });
        loadMessages();
      }
      rsvp.reset();
      $("#idades-wrap").hidden = true;
    } catch {
      status.textContent = "Ops, algo deu errado. Tente novamente em instantes.";
      status.classList.add("err");
    } finally {
      btn.disabled = false;
      btn.textContent = "Fazer check-in ✈";
    }
  });

  /* ---------------- PIX (BR Code) ---------------- */
  const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const tlv = (id, v) => id + String(v.length).padStart(2, "0") + v;
  function crc16(str) {
    let crc = 0xffff;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }
  function pixPayload(valor) {
    const p = C.pix;
    let s =
      tlv("00", "01") +
      tlv("26", tlv("00", "br.gov.bcb.pix") + tlv("01", p.chave)) +
      tlv("52", "0000") +
      tlv("53", "986") +
      (valor > 0 ? tlv("54", Number(valor).toFixed(2)) : "") +
      tlv("58", "BR") +
      tlv("59", norm(p.nome).slice(0, 25)) +
      tlv("60", norm(p.cidade).slice(0, 15)) +
      tlv("62", tlv("05", "***")) +
      "6304";
    return s + crc16(s);
  }

  /* ---------------- Presentes ---------------- */
  const catLabel = { lua: "Lua de mel", casa: "Casa", resenha: "Resenha" };
  const given = () => store.get("presente").reduce((acc, g) => ((acc[g.presenteId] = (acc[g.presenteId] || 0) + 1), acc), {});
  function renderGifts(cat = "todos") {
    const extra = DEMO ? given() : {};
    const list = C.presentes.filter((g) => cat === "todos" || g.cat === cat);
    $("#gifts").innerHTML = list
      .map((g, i) => {
        const vend = Math.min(g.cotas, g.vendidas + (extra[g.id] || 0));
        const pct = Math.round((vend / g.cotas) * 100);
        const done = vend >= g.cotas;
        return `<article class="gift ${done ? "is-done" : ""}" data-cat="${g.cat}" style="animation-delay:${i * 0.04}s">
          <span class="gift__tag">${catLabel[g.cat]}</span>
          <div class="gift__icon" aria-hidden="true">${g.icone}</div>
          <h3>${esc(g.nome)}</h3>
          <p>${esc(g.desc)}</p>
          <div class="gift__price">${brl(g.valor)}${g.cotas > 1 ? '<small style="font-size:.5em;color:var(--muted);font-weight:400"> /cota</small>' : ""}</div>
          ${g.cotas > 1 ? `<div class="gift__bar"><i style="--p:${pct}%"></i></div><div class="gift__meta"><span>${vend} de ${g.cotas} cotas</span><span>${pct}%</span></div>` : ""}
          <button class="btn btn--dark btn--block" data-gift="${g.id}" id="gift-btn-${g.id}">${done ? "Presenteado ✓" : "Presentear"}</button>
        </article>`;
      })
      .join("");
    observe($$("#gifts .gift"));
  }
  renderGifts();
  $$(".tab").forEach((t) =>
    t.addEventListener("click", () => {
      $$(".tab").forEach((x) => { x.classList.toggle("is-active", x === t); x.setAttribute("aria-selected", x === t); });
      renderGifts(t.dataset.cat);
    })
  );

  const modal = $("#gift-modal");
  let current = null;
  function updatePix() {
    const valor = current ? current.valor : +$("#gift-valor").value || 0;
    const code = pixPayload(valor);
    $("#pix-code").value = code;
    $("#pix-qr").src = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=0&color=1f1b18&data=${encodeURIComponent(code)}`;
  }
  function openGift(g) {
    current = g;
    $("#gift-icon").textContent = g ? g.icone : "💛";
    $("#gift-title").textContent = g ? g.nome : "PIX livre";
    $("#gift-price").textContent = g ? brl(g.valor) : "Você escolhe o valor";
    $("#gift-valor-wrap").hidden = !!g;
    $("#pix-key").textContent = C.pix.chave;
    $("#pay-link-btn").href = C.linkPagamento;
    $("#gift-status").textContent = "";
    $("#gift-status").className = "form__status";
    setPay("pix");
    updatePix();
    modal.showModal();
  }
  function setPay(kind) {
    $$(".paytab").forEach((b) => { b.classList.toggle("is-active", b.dataset.pay === kind); b.setAttribute("aria-selected", b.dataset.pay === kind); });
    $("#pay-pix").hidden = kind !== "pix";
    $("#pay-link").hidden = kind !== "link";
  }
  $$(".paytab").forEach((b) => b.addEventListener("click", () => setPay(b.dataset.pay)));
  $("#gift-valor").addEventListener("input", updatePix);
  $("#gifts").addEventListener("click", (e) => {
    const b = e.target.closest("[data-gift]");
    if (b) openGift(C.presentes.find((g) => g.id === b.dataset.gift));
  });
  $("#btn-pix-livre").addEventListener("click", () => openGift(null));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
  $("#pix-copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText($("#pix-code").value);
    } catch {
      $("#pix-code").select();
      document.execCommand("copy");
    }
    toast("Código PIX copiado! Cole no app do seu banco 💸");
  });
  $("#gift-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = $("#gift-nome").value.trim();
    const status = $("#gift-status"), btn = $("#gift-confirm-btn");
    if (!nome) { $("#gift-nome").reportValidity(); return; }
    btn.disabled = true;
    try {
      await send("presente", {
        nome,
        mensagem: $("#gift-msg").value.trim(),
        presenteId: current ? current.id : "pix-livre",
        presente: current ? current.nome : "PIX livre",
        valor: current ? current.valor : +$("#gift-valor").value || 0,
      });
      status.textContent = "Muito obrigado! Vocês são campeões 🏆";
      status.className = "form__status ok";
      confetti(60);
      e.target.reset();
      renderGifts($(".tab.is-active").dataset.cat);
      setTimeout(() => modal.close(), 1800);
    } catch {
      status.textContent = "Não conseguimos registrar agora. Tente de novo.";
      status.className = "form__status err";
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------------- Mural de recados ---------------- */
  const badge = { inter: '<span class="badge badge--inter">🔴 Inter</span>', galo: '<span class="badge badge--galo">⚫ Galo</span>', neutro: '<span class="badge">🤍 Dos noivos</span>' };
  const fmtDate = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  async function loadMessages() {
    let msgs = [];
    try {
      if (DEMO) {
        msgs = [...C.recadosExemplo, ...store.get("recado").map((r) => ({ ...r, data: r.enviadoEm }))];
      } else {
        const res = await fetch(`${C.googleScriptUrl}?tipo=recados`);
        msgs = await res.json();
      }
    } catch {
      msgs = C.recadosExemplo;
    }
    msgs.sort((a, b) => new Date(b.data) - new Date(a.data));
    $("#messages").innerHTML = msgs.length
      ? msgs.map((m, i) => `<article class="msg" data-time="${esc(m.time)}" style="animation-delay:${i * 0.05}s"><p>“${esc(m.mensagem)}”</p><footer><strong>${esc(m.nome)}</strong>${badge[m.time] || badge.neutro}<span>${fmtDate(m.data)}</span></footer></article>`).join("")
      : `<p class="muted">Seja o primeiro a deixar um recado!</p>`;
  }
  loadMessages();
  $("#mural-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, status = $("#mural-status"), btn = $("#mural-submit");
    if (!f.checkValidity()) { f.reportValidity(); return; }
    btn.disabled = true;
    try {
      await send("recado", Object.fromEntries(new FormData(f)));
      status.textContent = "Recado publicado! Obrigado 💛";
      status.className = "form__status ok";
      f.reset();
      loadMessages();
    } catch {
      status.textContent = "Erro ao publicar. Tente novamente.";
      status.className = "form__status err";
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------------- Inicia reveals ---------------- */
  observe($$(".reveal"));

  if (DEMO) console.info("%cModo demonstração: configure googleScriptUrl em js/config.js", "color:#b8924a");
})();
