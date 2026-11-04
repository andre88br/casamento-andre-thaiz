(() => {
  "use strict";
  const URL_API = (window.SITE_CONFIG || window.CONFIG || {}).googleScriptUrl || "";
  const DEMO = !URL_API;
  const $ = (id) => document.getElementById(id);
  const SK = "adm_token";
  let token = sessionStorage.getItem(SK) || "";
  let abas = [], versao = 0, atual = 0, sujo = false;

  /* ---------- API (com modo demonstração em localStorage) ---------- */
  async function api(acao, dados = {}) {
    if (DEMO) return demo(acao, dados);
    const res = await fetch(URL_API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ acao, token, ...dados }) });
    return res.json();
  }
  function demo(acao, d) {
    const L = (k, v) => (v === undefined ? JSON.parse(localStorage.getItem("demo_" + k) || "null") : localStorage.setItem("demo_" + k, JSON.stringify(v)));
    const us = L("users") || [];
    const ok = (o = {}) => ({ ok: true, ...o });
    if (acao === "status") return ok({ configurado: us.length > 0 });
    if (acao === "setup" || acao === "login") {
      const u = String(d.usuario).trim().toLowerCase();
      if (acao === "setup") { if (us.length) return { ok: false, erro: "Já configurado." }; us.push({ usuario: u, senha: d.senha }); L("users", us); }
      else if (!us.find((x) => x.usuario === u && x.senha === d.senha)) return { ok: false, erro: "Usuário ou senha inválidos." };
      L("sessao", u); return ok({ token: "demo", usuario: u });
    }
    if (acao === "logout") return ok();
    if (acao === "planilha") { const p = L("planilha") || { versao: 0, abas: [] }; return ok(p); }
    if (acao === "salvarPlanilha") { const v = Date.now(); L("planilha", { versao: v, abas: d.abas }); return ok({ versao: v }); }
    if (acao === "usuarios") return ok({ usuarios: us.map((x) => ({ usuario: x.usuario, criadoEm: "", criadoPor: "" })), eu: L("sessao") });
    if (acao === "criarUsuario") { us.push({ usuario: d.novoUsuario.toLowerCase(), senha: d.novaSenha }); L("users", us); return ok(); }
    if (acao === "excluirUsuario") { L("users", us.filter((x) => x.usuario !== d.alvo)); return ok(); }
    return { ok: false, erro: "ação inválida" };
  }

  /* ---------- Login / primeiro acesso ---------- */
  let primeiro = false;
  async function iniciar() {
    if (token) {
      const r = await api("planilha");
      if (r.ok) { return entrar(r); }
      token = ""; sessionStorage.removeItem(SK);
    }
    const st = await api("status");
    primeiro = !st.configurado;
    $("auth-titulo").textContent = primeiro ? "Primeiro acesso" : "Entrar";
    $("auth-hint").textContent = primeiro ? "Crie o usuário e a senha administrador. Depois você poderá criar outros usuários." : "Acesso restrito.";
    $("a-pass2-wrap").hidden = !primeiro;
    $("a-pass2").required = primeiro;
    $("auth-btn").textContent = primeiro ? "Criar e entrar" : "Entrar";
    $("a-pass").autocomplete = primeiro ? "new-password" : "current-password";
    $("auth").hidden = false;
  }
  $("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("auth-erro").textContent = "";
    if (primeiro && $("a-pass").value !== $("a-pass2").value) return ($("auth-erro").textContent = "As senhas não conferem.");
    $("auth-btn").disabled = true;
    try {
      const r = await api(primeiro ? "setup" : "login", { usuario: $("a-user").value, senha: $("a-pass").value });
      if (!r.ok) return ($("auth-erro").textContent = r.erro || "Erro.");
      token = r.token; sessionStorage.setItem(SK, token); $("eu").textContent = r.usuario;
      const p = await api("planilha");
      entrar(p, r.usuario);
    } catch { $("auth-erro").textContent = "Falha de conexão."; }
    finally { $("auth-btn").disabled = false; }
  });
  function entrar(p, usuario) {
    $("auth").hidden = true; $("app").hidden = false;
    if (usuario) $("eu").textContent = usuario;
    abas = p.abas || []; versao = p.versao || 0; atual = 0; sujo = false;
    render();
    if (!usuario) api("usuarios").then((u) => u.ok && ($("eu").textContent = u.eu));
  }
  $("logout").onclick = async () => { await api("logout"); sessionStorage.removeItem(SK); location.reload(); };

  /* ---------- Abas superiores ---------- */
  document.querySelectorAll(".top .tab").forEach((b) => (b.onclick = () => {
    document.querySelectorAll(".top .tab").forEach((x) => x.classList.toggle("on", x === b));
    $("tab-lista").hidden = b.dataset.tab !== "lista";
    $("tab-usuarios").hidden = b.dataset.tab !== "usuarios";
    if (b.dataset.tab === "usuarios") carregarUsuarios();
  }));

  /* ---------- Planilha ---------- */
  const isBool = (v) => typeof v === "boolean" || v === "TRUE" || v === "FALSE";
  const isLong = (v) => String(v).length > 70 || String(v).includes("\n");
  const isUrl = (v) => /^https?:\/\//i.test(String(v).trim());

  function valor(v) { // avalia =SUM(B2:B19)
    const m = /^=SUM\(([A-Z])(\d+):([A-Z])(\d+)\)$/i.exec(String(v));
    if (!m) return String(v);
    const col = m[1].toUpperCase().charCodeAt(0) - 65, a = +m[2], b = +m[4];
    const L = abas[atual].linhas; let t = 0;
    for (let i = a - 1; i < b && i < L.length; i++) t += parseFloat(String(L[i][col] ?? "").replace(",", ".")) || 0;
    return String(t);
  }
  function marcar(s = true) { sujo = s; $("salvar").disabled = !s; $("status").textContent = s ? "Alterações não salvas" : ""; }
  window.addEventListener("beforeunload", (e) => { if (sujo) { e.preventDefault(); e.returnValue = ""; } });

  function render() {
    if (atual >= abas.length) atual = Math.max(0, abas.length - 1);
    const bar = $("abas"); bar.innerHTML = "";
    abas.forEach((a, i) => {
      const b = document.createElement("button");
      b.className = "tab" + (i === atual ? " on" : ""); b.textContent = a.nome;
      b.onclick = () => { atual = i; $("f-busca").value = ""; render(); };
      bar.appendChild(b);
    });
    const n = document.createElement("button");
    n.className = "tab"; n.textContent = "+ Nova aba";
    n.onclick = () => { const nome = prompt("Nome da nova aba:"); if (nome) { abas.push({ nome: nome.trim(), linhas: [["Item", "Valor"]] }); atual = abas.length - 1; marcar(); render(); } };
    bar.appendChild(n);
    grade(); stats();
  }

  function grade() {
    const t = $("grade"); t.innerHTML = "";
    const a = abas[atual]; if (!a) return;
    if (!a.linhas.length) a.linhas.push([""]);
    const q = $("f-busca").value.trim().toLowerCase();
    const ncol = Math.max(...a.linhas.map((l) => l.length), 1);
    a.linhas.forEach((l) => { while (l.length < ncol) l.push(""); });
    const thead = t.createTHead().insertRow();
    a.linhas[0].forEach((h, c) => {
      const th = document.createElement("th");
      const w = document.createElement("div"); w.className = "cell";
      const inp = document.createElement("input"); inp.value = h;
      inp.oninput = () => { a.linhas[0][c] = inp.value; marcar(); };
      const x = document.createElement("button"); x.className = "x"; x.title = "Excluir coluna"; x.textContent = "×";
      x.onclick = () => { if (confirm("Excluir esta coluna?")) { a.linhas.forEach((l) => l.splice(c, 1)); marcar(); render(); } };
      w.append(inp, x); th.appendChild(w); thead.appendChild(th);
    });
    thead.appendChild(document.createElement("th"));
    const tb = t.createTBody();
    a.linhas.forEach((l, r) => {
      if (r === 0) return;
      if (q && !l.some((v) => String(v).toLowerCase().includes(q))) return;
      const tr = tb.insertRow();
      l.forEach((v, c) => {
        const td = tr.insertCell(); const w = document.createElement("div"); w.className = "cell";
        let el;
        if (isBool(v)) {
          el = document.createElement("input"); el.type = "checkbox"; el.checked = v === true || v === "TRUE";
          el.onchange = () => { l[c] = el.checked; marcar(); };
        } else {
          el = document.createElement(isLong(v) ? "textarea" : "input");
          el.value = String(v).startsWith("=") ? valor(v) : String(v);
          if (el.tagName === "TEXTAREA") el.rows = Math.min(8, Math.ceil(String(v).length / 40) + String(v).split("\n").length - 1);
          if (String(v).startsWith("=")) { el.onfocus = () => (el.value = l[c]); el.onblur = () => (el.value = valor(l[c])); }
          el.oninput = () => { l[c] = el.value; marcar(); };
        }
        w.appendChild(el);
        if (isUrl(v)) { const lk = document.createElement("a"); lk.className = "lk"; lk.href = String(v).trim(); lk.target = "_blank"; lk.rel = "noopener"; lk.textContent = "↗"; w.appendChild(lk); }
        td.appendChild(w);
      });
      const td = tr.insertCell(); const x = document.createElement("button"); x.className = "x"; x.title = "Excluir linha"; x.textContent = "🗑";
      x.onclick = () => { a.linhas.splice(r, 1); marcar(); render(); };
      td.appendChild(x);
    });
  }
  $("f-busca").oninput = grade;
  $("add-linha").onclick = () => { const a = abas[atual]; if (!a) return; a.linhas.push(new Array(a.linhas[0].length).fill("")); marcar(); $("f-busca").value = ""; grade(); const ins = $("grade").querySelectorAll("tbody tr:last-child input,tbody tr:last-child textarea")[0]; ins && ins.focus(); };
  $("add-col").onclick = () => { const a = abas[atual]; if (!a) return; const nome = prompt("Nome da nova coluna:"); if (nome === null) return; a.linhas.forEach((l, i) => l.push(i === 0 ? nome : "")); marcar(); render(); };
  $("ren-aba").onclick = () => { const a = abas[atual]; const n = a && prompt("Novo nome:", a.nome); if (n) { a.nome = n.trim(); marcar(); render(); } };
  $("del-aba").onclick = () => { const a = abas[atual]; if (a && confirm(`Excluir a aba "${a.nome}" e todo o conteúdo?`)) { abas.splice(atual, 1); marcar(); render(); } };

  function stats() {
    const box = $("stats"); box.innerHTML = "";
    const a = abas[atual]; if (!a || !/convidad/i.test(a.nome)) return;
    const h = a.linhas[0].map((x) => String(x).toLowerCase());
    const col = (re) => h.findIndex((x) => re.test(x));
    const iT = col(/tipo/), iQ = col(/de quem/), iN = col(/convidad|nome/), iC = col(/confirma/);
    const rows = a.linhas.slice(1).filter((l) => String(l[iN] ?? "").trim());
    const cnt = (f) => rows.filter(f).length;
    const eq = (i, v) => (l) => String(l[i] ?? "").trim().toLowerCase() === v;
    [["Total", rows.length], ["Adultos", cnt(eq(iT, "adulto"))], ["Crianças", cnt(eq(iT, "criança"))], ["Noiva", cnt(eq(iQ, "noiva"))], ["Noivo", cnt(eq(iQ, "noivo"))], ["Confirmados", cnt((l) => /^(sim|confirmad)/i.test(String(l[iC] ?? "").trim()))]]
      .forEach(([k, v]) => { const d = document.createElement("div"); d.className = "stat"; d.innerHTML = `<b>${v}</b><span>${k}</span>`; box.appendChild(d); });
  }

  $("salvar").onclick = async () => {
    $("salvar").disabled = true; $("status").textContent = "Salvando…";
    try {
      const r = await api("salvarPlanilha", { abas, versao });
      if (r.ok) { versao = r.versao; marcar(false); $("status").textContent = "Salvo ✓"; }
      else { $("status").textContent = r.erro || "Erro ao salvar."; $("salvar").disabled = false; if (r.expirou) location.reload(); }
    } catch { $("status").textContent = "Falha de conexão."; $("salvar").disabled = false; }
  };

  /* ---------- Importar / exportar .xlsx ---------- */
  $("imp").onchange = async (e) => {
    const f = e.target.files[0]; e.target.value = ""; if (!f) return;
    if (!confirm("Importar substitui TODAS as abas atuais pelo conteúdo do arquivo. Continuar?")) return;
    const wb = XLSX.read(await f.arrayBuffer(), { type: "array" });
    abas = wb.SheetNames.map((nome) => {
      const ws = wb.Sheets[nome]; if (!ws["!ref"]) return { nome: nome.trim(), linhas: [[""]] };
      const rg = XLSX.utils.decode_range(ws["!ref"]); const linhas = [];
      for (let r = rg.s.r; r <= rg.e.r; r++) {
        const l = [];
        for (let c = rg.s.c; c <= rg.e.c; c++) {
          const cell = ws[XLSX.utils.encode_cell({ r, c })]; let v = "";
          if (cell) {
            if (cell.f) v = /SUM/i.test(cell.f) ? `=SUM(${String.fromCharCode(65 + c)}2:${String.fromCharCode(65 + c)}${r})` : cell.v ?? "";
            else v = cell.t === "b" ? !!cell.v : cell.v ?? "";
            if (typeof v === "string") v = v.trim();
          }
          l.push(v);
        }
        linhas.push(l);
      }
      while (linhas.length > 1 && linhas[linhas.length - 1].every((v) => v === "")) linhas.pop();
      let nc = linhas.reduce((m, l) => { let k = l.length; while (k > 0 && l[k - 1] === "") k--; return Math.max(m, k); }, 0) || 1;
      linhas.forEach((l) => (l.length = nc));
      linhas.forEach((l) => { for (let i = 0; i < nc; i++) if (l[i] === undefined) l[i] = ""; });
      return { nome: nome.trim(), linhas: linhas.filter((l, i) => i === 0 || l.some((v) => v !== "")) };
    });
    atual = 0; marcar(); render();
  };
  $("exp").onclick = () => {
    const wb = XLSX.utils.book_new();
    abas.forEach((a) => {
      const dados = a.linhas.map((l) => l.map((v) => (typeof v === "string" && v.startsWith("=") ? Number(valor(v)) : typeof v === "string" && v !== "" && !isNaN(v) && !/^0\d/.test(v) ? Number(v) : v)));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dados), a.nome.slice(0, 31) || "Aba");
    });
    XLSX.writeFile(wb, "Casamento.xlsx");
  };

  /* ---------- Usuários ---------- */
  async function carregarUsuarios() {
    const r = await api("usuarios"); if (!r.ok) return;
    const ul = $("users"); ul.innerHTML = "";
    r.usuarios.forEach((u) => {
      const li = document.createElement("li");
      const s = document.createElement("span"); s.textContent = u.usuario + (u.usuario === r.eu ? " (você)" : "");
      li.appendChild(s);
      if (u.usuario !== r.eu) {
        const b = document.createElement("button"); b.className = "btn btn--ghost"; b.textContent = "Excluir";
        b.onclick = async () => { if (confirm(`Remover o acesso de "${u.usuario}"?`)) { await api("excluirUsuario", { alvo: u.usuario }); carregarUsuarios(); } };
        li.appendChild(b);
      }
      ul.appendChild(li);
    });
  }
  $("user-form").addEventListener("submit", async (e) => {
    e.preventDefault(); $("user-erro").textContent = "";
    const r = await api("criarUsuario", { novoUsuario: $("n-user").value, novaSenha: $("n-pass").value });
    if (!r.ok) return ($("user-erro").textContent = r.erro || "Erro.");
    $("n-user").value = $("n-pass").value = ""; carregarUsuarios();
  });

  iniciar();
})();
