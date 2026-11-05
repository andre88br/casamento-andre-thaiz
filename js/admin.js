(() => {
  "use strict";
  const URL_API = (window.SITE_CONFIG || window.CONFIG || {}).googleScriptUrl || "";
  const DEMO = !URL_API;
  const $ = (id) => document.getElementById(id);
  const SK = "adm_token";
  let token = sessionStorage.getItem(SK) || "";
  let abas = [], versao = 0, atual = 0, sujo = false;
  const clone = (o) => JSON.parse(JSON.stringify(o));

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
      if (r.ok) return entrar(r);
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
      token = r.token; sessionStorage.setItem(SK, token);
      entrar(await api("planilha"), r.usuario);
    } catch { $("auth-erro").textContent = "Falha de conexão."; }
    finally { $("auth-btn").disabled = false; }
  });
  function migrar(a) { // formato antigo (grade) → seções
    if (a.secoes) return a;
    const l = a.linhas || [[""]];
    return { nome: a.nome, icone: "📄", secoes: [{ titulo: a.nome, tipo: "cards", colunas: l[0].map((n) => ({ nome: n || "Campo", tipo: "texto" })), linhas: l.slice(1) }] };
  }
  // Atualiza dados já salvos para a estrutura atual (colunas/seções novas), preservando o conteúdo.
  function sincronizar() {
    let mudou = false;
    const tot = abas.find((a) => a.nome === "Total");
    const cus = tot && tot.secoes.find((x) => x.titulo === "Custos");
    if (cus) { cus.titulo = "Outros custos"; mudou = true; }
    ["Noiva", "Noivo"].forEach((n) => { const sc = abas.find((a) => a.nome === n)?.secoes.find((x) => x.titulo === "Itens"); if (sc) { sc.titulo = "Valores"; sc.soma = true; sc.colunas[0].nome = "Descrição"; mudou = true; } });
    window.SEED.abas.forEach((seedAba) => {
      let aba = abas.find((a) => a.nome === seedAba.nome);
      if (!aba) { const nova = clone(seedAba); nova.secoes.forEach((x) => x.titulo === "Valores" && (x.linhas = [])); abas.push(nova); return (mudou = true); }
      if (tot && seedAba.nome === "Total") { // garante o resumo no topo
        if (!aba.secoes.some((x) => x.tipo === "resumo")) { aba.secoes.unshift(clone(seedAba.secoes[0])); mudou = true; }
      }
      seedAba.secoes.forEach((ss) => {
        const sec = aba.secoes.find((x) => x.titulo === ss.titulo);
        if (!sec) { const nova = clone(ss); if (nova.titulo === "Valores") nova.linhas = []; aba.secoes.push(nova); return (mudou = true); }
        ["porPessoa", "soma", "guests"].forEach((k) => { if (ss[k] && !sec[k]) { sec[k] = ss[k]; mudou = true; } });
        if (ss.colunas.every((c, i) => sec.colunas[i] && sec.colunas[i].nome === c.nome) && ss.colunas.length === sec.colunas.length) return;
        const antigos = sec.colunas.map((c) => c.nome);
        sec.linhas = sec.linhas.map((l) => ss.colunas.map((c) => { const j = antigos.indexOf(c.nome); return j >= 0 ? l[j] : c.tipo === "check" ? false : ""; }));
        sec.colunas = clone(ss.colunas); mudou = true;
      });
    });
    return mudou;
  }
  function entrar(p, usuario) {
    $("auth").hidden = true; $("app").hidden = false;
    if (usuario) $("eu").textContent = usuario;
    else api("usuarios").then((u) => u.ok && ($("eu").textContent = u.eu));
    versao = p.versao || 0; atual = 0; sujo = false;
    if (p.abas && p.abas.length) { abas = p.abas.map(migrar); if (sincronizar()) sujo = true; }
    else { abas = clone(window.SEED.abas); sujo = true; } // primeira vez: carrega o conteúdo da planilha
    marcar(sujo); montar();
  }
  $("logout").onclick = async () => { await api("logout"); sessionStorage.removeItem(SK); location.reload(); };
  $("burger").onclick = () => $("side").classList.toggle("open");

  /* ---------- Menu ---------- */
  function montar() {
    const nav = $("menu"); nav.innerHTML = "";
    abas.forEach((a, i) => {
      const b = document.createElement("button");
      b.className = "item" + (i === atual ? " on" : "");
      b.innerHTML = `<i>${a.icone || "📄"}</i>`; b.append(a.nome);
      b.onclick = () => { atual = i; montar(); };
      nav.appendChild(b);
    });
    $("m-usuarios").classList.toggle("on", atual === "usuarios");
    $("side").classList.remove("open");
    if (atual === "usuarios") { $("titulo").textContent = "Usuários"; return telaUsuarios(); }
    const a = abas[atual]; $("titulo").textContent = `${a.icone || ""} ${a.nome}`;
    const c = $("content"); c.innerHTML = "";
    a.secoes.forEach((s) => c.appendChild(secao(s, a.secoes.length > 1)));
  }
  $("m-usuarios").onclick = () => { atual = "usuarios"; montar(); };

  function marcar(s = true) { sujo = s; window.dispatchEvent(new Event("mudou")); $("salvar").disabled = !s; $("status").textContent = s ? "Alterações não salvas" : ""; }
  window.addEventListener("beforeunload", (e) => { if (sujo) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- Componentes ---------- */
  const el = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; };
  const num = (v) => (typeof v === "number" ? v : parseFloat(String(v).replace(/\./g, "").replace(",", ".")));
  const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const isUrl = (v) => /^https?:\/\//i.test(String(v).trim());

  function campo(col, linha, i, opts = {}) {
    let inp;
    const set = (v) => { linha[i] = v; marcar(); };
    if (col.tipo === "check") {
      inp = el("input", { type: "checkbox", checked: !!linha[i] }); inp.onchange = () => set(inp.checked);
      return opts.compacto ? inp : el("label", { className: "chk" }, inp, col.nome);
    }
    if (col.tipo === "opcoes") {
      inp = el("select"); const ops = ["", ...col.opcoes]; if (linha[i] && !ops.includes(linha[i])) ops.push(linha[i]);
      ops.forEach((o) => inp.append(el("option", { value: o, textContent: o || "—" }))); inp.value = linha[i] ?? "";
      inp.onchange = () => { set(inp.value); opts.onchange && opts.onchange(); };
    } else if (col.tipo === "longo") {
      inp = el("textarea", { value: linha[i] ?? "", rows: Math.min(8, Math.max(2, Math.ceil(String(linha[i] ?? "").length / 45))) });
      inp.oninput = () => set(inp.value);
    } else {
      inp = el("input", { value: linha[i] ?? "", placeholder: opts.placeholder || "" });
      if (col.tipo === "telefone") { inp.type = "tel"; inp.autocomplete = "off"; inp.placeholder = opts.placeholder || "(34) 99999-9999"; }
      if (col.tipo === "email") { inp.type = "email"; inp.autocomplete = "off"; inp.placeholder = opts.placeholder || "nome@email.com"; }
      if (col.tipo === "numero") { inp.inputMode = "decimal"; inp.oninput = () => { const n = num(inp.value); set(inp.value.trim() !== "" && !isNaN(n) && /^[\d.,\s]+$/.test(inp.value) ? n : inp.value); opts.onchange && opts.onchange(); }; }
      else inp.oninput = () => set(inp.value);
    }
    if (opts.compacto) return inp;
    const wrap = el("label", { className: "campo" }, col.nome, inp);
    if (isUrl(linha[i])) wrap.append(el("a", { className: "lk", href: String(linha[i]).trim(), target: "_blank", rel: "noopener", textContent: "abrir link ↗" }));
    return wrap;
  }
  const novaLinha = (s) => s.colunas.map((c) => (c.tipo === "check" ? false : c.tipo === "opcoes" ? c.opcoes[0] : ""));

  const convidados = () => {
    const g = abas.flatMap((a) => a.secoes).find((x) => x.guests);
    return g ? g.linhas.filter((l) => String(l[0]).trim()).length : 0;
  };
  function somaSecao(s) {
    const i = s.colunas.findIndex((c) => c.tipo === "numero");
    return s.linhas.reduce((t, l) => t + (num(l[i]) || 0), 0);
  }
  function resumo(s) {
    const box = el("section", { className: "sec" }, el("div", { className: "sec__head" }, el("h2", { textContent: s.titulo })));
    const corpo = el("div", { className: "tabela" }); box.append(corpo);
    const desenha = () => {
      if (!box.isConnected && box.dataset.ok) return window.removeEventListener("mudou", desenha);
      box.dataset.ok = 1;
      let total = 0; const t = el("table", { style: "min-width:0" });
      const add = (nome, v, ir) => { total += v; const r = t.insertRow(); r.insertCell().append(ir ? el("button", { className: "btn btn--ghost", textContent: nome, onclick: ir }) : nome); r.insertCell().append(el("b", { textContent: brl(v) })); r.cells[1].style.textAlign = "right"; };
      abas.forEach((a, idx) => {
        if (a.nome === "Total") return;
        const v = a.secoes.filter((x) => x.titulo === "Valores").reduce((t2, x) => t2 + somaSecao(x), 0);
        if (a.secoes.some((x) => x.titulo === "Valores")) add(`${a.icone || ""} ${a.nome}`, v, () => { atual = idx; montar(); });
      });
      const outros = abas.find((a) => a.nome === "Total")?.secoes.find((x) => x.titulo === "Outros custos");
      if (outros) add("Outros custos", somaSecao(outros));
      const r = t.insertRow(); r.insertCell().append(el("b", { textContent: "TOTAL" })); r.insertCell().append(el("b", { textContent: brl(total), style: "font-size:1.3rem" })); r.cells[1].style.textAlign = "right";
      corpo.innerHTML = ""; corpo.append(t);
    };
    window.addEventListener("mudou", desenha); desenha();
    return box;
  }

  function secao(s, comTitulo) {
    if (s.tipo === "resumo") return resumo(s);
    const box = el("section", { className: "sec" });
    const busca = el("input", { type: "search", placeholder: "Buscar…" });
    const lista = el("div");
    const soma = el("div", { className: "soma" });
    const stats = el("div", { className: "stats" });
    const filtros = el("div", { className: "filtros" });
    const sel = {};
    const add = el("button", { className: "btn", textContent: "+ Adicionar" });
    const head = el("div", { className: "sec__head" }, el("h2", { textContent: comTitulo || s.guests ? s.titulo : "" }));
    if (s.linhas.length > 5 || s.guests) head.append(busca);
    head.append(add); box.append(head);
    if (s.guests) {
      s.colunas.forEach((c, i) => { if (c.tipo === "opcoes") { const x = el("select", { onchange: desenha }); x.append(el("option", { value: "", textContent: c.nome })); c.opcoes.forEach((o) => x.append(el("option", { value: o, textContent: o }))); sel[i] = x; filtros.append(x); } });
      box.append(stats, filtros);
    }
    box.append(lista, soma);

    function atualizaSoma() {
      if (!s.soma) return;
      const i = s.colunas.findIndex((c) => c.tipo === "numero");
      soma.textContent = "Total: " + brl(s.linhas.reduce((t, l) => t + (num(l[i]) || 0), 0));
    }
    function atualizaStats() {
      if (!s.guests) return;
      const idx = (n) => s.colunas.findIndex((c) => c.nome === n);
      const R = s.linhas.filter((l) => String(l[0]).trim());
      const n = (nome, v) => R.filter((l) => l[idx(nome)] === v).length;
      stats.innerHTML = "";
      [["Total", R.length], ["Adultos", n("Tipo", "Adulto")], ["Crianças", n("Tipo", "Criança")], ["Noiva", n("De quem", "NOIVA")], ["Noivo", n("De quem", "NOIVO")], ["Confirmados", n("Confirmação", "Confirmado")], ["Pendentes", R.filter((l) => !l[idx("Confirmação")] || l[idx("Confirmação")] === "Pendente").length]]
        .forEach(([k, v]) => stats.append(el("div", { className: "stat", innerHTML: `<b>${v}</b><span>${k}</span>` })));
    }
    function visivel(l) {
      const q = busca.value.trim().toLowerCase();
      if (q && !l.some((v) => String(v).toLowerCase().includes(q))) return false;
      return Object.entries(sel).every(([i, x]) => !x.value || l[i] === x.value);
    }
    function desenha() {
      lista.innerHTML = ""; atualizaSoma(); atualizaStats();
      const itens = s.linhas.map((l, r) => [l, r]).filter(([l]) => visivel(l));
      if (!itens.length) { lista.append(el("div", { className: "vazio", textContent: s.linhas.length ? "Nada encontrado." : "Nada por aqui ainda. Use “+ Adicionar”." })); if (s.guests && !s.linhas.length) lista.append(importarConvidados(s, desenha)); return; }
      if (s.tipo === "tabela") {
        const t = el("table"); const tr = t.createTHead().insertRow();
        s.colunas.forEach((c) => tr.append(el("th", { textContent: c.nome }))); tr.append(el("th"));
        const tb = t.createTBody();
        itens.forEach(([l, r]) => {
          const row = tb.insertRow();
          s.colunas.forEach((c, i) => row.insertCell().append(campo(c, l, i, { compacto: true, placeholder: c.nome, onchange: atualizaStats })));
          row.insertCell().append(el("button", { className: "x", title: "Excluir", textContent: "🗑", onclick: () => { s.linhas.splice(r, 1); marcar(); desenha(); } }));
          row.querySelector("input[type=text],input:not([type])")?.addEventListener("input", atualizaStats);
        });
        lista.append(el("div", { className: "tabela" }, t));
      } else {
        const g = el("div", { className: "cards" });
        itens.forEach(([l, r]) => {
          const card = el("div", { className: "card rec" });
          const ti = campo({ ...s.colunas[0], tipo: "texto" }, l, 0, { compacto: true, placeholder: s.colunas[0].nome }); ti.className = "titulo"; card.append(ti);
          card.append(el("button", { className: "del", title: "Excluir", textContent: "🗑", onclick: () => { if (confirm("Excluir este item?")) { s.linhas.splice(r, 1); marcar(); desenha(); } } }));
          const cp = el("div", { className: "campos" });
          const est = el("p", { className: "hint" });
          const refaz = () => {
            const n = convidados(), v = num(l[s.colunas.findIndex((c) => c.nome === "Valor por pessoa")]);
            est.textContent = n && v ? `Estimativa para ${n} convidados: ${brl(v * n)}` : "";
          };
          s.colunas.forEach((c, i) => { if (i) cp.append(campo(c, l, i, { onchange: () => { atualizaSoma(); refaz(); } })); });
          if (s.porPessoa) { refaz(); cp.append(est); }
          card.append(cp); g.append(card);
        });
        lista.append(g);
      }
    }
    busca.oninput = desenha;
    add.onclick = () => { s.linhas.push(novaLinha(s)); marcar(); Object.values(sel).forEach((x) => (x.value = "")); busca.value = ""; desenha(); const alvo = s.tipo === "tabela" ? lista.querySelector("tbody tr:last-child input") : lista.querySelector(".card:last-child .titulo"); alvo && alvo.focus(); };
    desenha();
    return box;
  }

  // Importa só a lista de convidados do .xlsx (os nomes ficam apenas no seu navegador/planilha, nunca no repositório)
  function importarConvidados(s, desenha) {
    const inp = el("input", { type: "file", accept: ".xlsx,.xls", hidden: true });
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      const wb = XLSX.read(await f.arrayBuffer(), { type: "array" });
      const nome = wb.SheetNames.find((n) => /convidad/i.test(n)); if (!nome) return alert("Não encontrei a aba “Lista de convidados” no arquivo.");
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[nome], { header: 1, defval: "" });
      const h = rows[0].map((x) => String(x).trim().toLowerCase());
      const ix = (re) => h.findIndex((x) => re.test(x));
      const [iN, iT, iC, iQ, iF] = [ix(/convidad|nome/), ix(/tipo/), ix(/categoria/), ix(/de quem/), ix(/confirma/)];
      const cap = (v, ops) => ops.find((o) => o.toLowerCase() === String(v).trim().toLowerCase()) || "";
      const [iTel, iMail] = [ix(/telefone|celular|whats/), ix(/e-?mail/)];
      const col = (n) => s.colunas.findIndex((c) => c.nome === n);
      const opc = (n) => s.colunas[col(n)].opcoes;
      const out = rows.slice(1).filter((r) => String(r[iN] ?? "").trim()).map((r) => {
        const conf = String(iF >= 0 ? r[iF] : "").trim().toLowerCase();
        const l = s.colunas.map(() => "");
        l[col("Convidado")] = String(r[iN]).trim();
        l[col("Tipo")] = cap(iT >= 0 ? r[iT] : "", opc("Tipo"));
        l[col("Categoria")] = cap(iC >= 0 ? r[iC] : "", opc("Categoria"));
        l[col("De quem")] = cap(iQ >= 0 ? r[iQ] : "", opc("De quem"));
        l[col("Confirmação")] = /^(sim|confirm)/.test(conf) ? "Confirmado" : /^(n[aã]o|recus)/.test(conf) ? "Recusou" : "Pendente";
        if (iTel >= 0) l[col("Telefone")] = String(r[iTel]).trim();
        if (iMail >= 0) l[col("E-mail")] = String(r[iMail]).trim();
        return l;
      });
      s.linhas.push(...out); marcar(); montar();
    };
    return el("p", { style: "text-align:center" }, el("button", { className: "btn btn--ghost", textContent: "Importar convidados do .xlsx", onclick: () => inp.click() }), inp);
  }

  /* ---------- Salvar / exportar ---------- */
  $("salvar").onclick = async () => {
    $("salvar").disabled = true; $("status").textContent = "Salvando…";
    try {
      const r = await api("salvarPlanilha", { abas, versao });
      if (r.ok) { versao = r.versao; marcar(false); $("status").textContent = "Salvo ✓"; }
      else { $("status").textContent = r.erro || "Erro ao salvar."; $("salvar").disabled = false; if (r.expirou) location.reload(); }
    } catch { $("status").textContent = "Falha de conexão."; $("salvar").disabled = false; }
  };
  $("exp").onclick = () => {
    const wb = XLSX.utils.book_new();
    abas.forEach((a) => {
      const aoa = [];
      a.secoes.forEach((s) => { aoa.push([s.titulo], s.colunas.map((c) => c.nome), ...s.linhas.map((l) => l.map((v) => (v === "" ? null : v))), []); });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), a.nome.slice(0, 31));
    });
    XLSX.writeFile(wb, "Casamento.xlsx");
  };

  /* ---------- Usuários ---------- */
  async function telaUsuarios() {
    const c = $("content"); c.innerHTML = "";
    const ul = el("ul", { className: "users" });
    const erro = el("p", { className: "erro" });
    const u = el("input", { autocomplete: "off", required: true }), p = el("input", { type: "password", autocomplete: "new-password", required: true, minLength: 6 });
    const form = el("form", { className: "card novo-form" }, el("h3", { textContent: "Criar novo usuário" }), el("label", {}, "Usuário", u), el("label", {}, "Senha (mín. 6 caracteres)", p), erro, el("button", { className: "btn", textContent: "Criar usuário" }));
    form.onsubmit = async (e) => {
      e.preventDefault(); erro.textContent = "";
      const r = await api("criarUsuario", { novoUsuario: u.value, novaSenha: p.value });
      if (!r.ok) return (erro.textContent = r.erro || "Erro.");
      telaUsuarios();
    };
    c.append(el("div", {}, el("h2", { textContent: "Quem tem acesso" }), ul), form);
    const r = await api("usuarios"); if (!r.ok) return;
    r.usuarios.forEach((x) => {
      const li = el("li", {}, el("span", { textContent: x.usuario + (x.usuario === r.eu ? " (você)" : "") }));
      if (x.usuario !== r.eu) li.append(el("button", { className: "btn btn--ghost", textContent: "Excluir", onclick: async () => { if (confirm(`Remover o acesso de "${x.usuario}"?`)) { await api("excluirUsuario", { alvo: x.usuario }); telaUsuarios(); } } }));
      ul.append(li);
    });
  }

  iniciar();
})();
