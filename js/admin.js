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
  const QTD_PADRAO_V1 = ["Cerveja", "Refrigerante", "Água", "Suco", "Espumante (brinde)", "Vinho", "Destilados (drinks)", "Gelo", "Salgados", "Salgados (crianças)", "Carne (prato principal)", "Arroz", "Docinhos", "Bem-casados", "Bolo", "Copos", "Guardanapos"];
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
        ["porPessoa", "soma", "guests", "escolha", "escolhaPor", "incluir"].forEach((k) => { if (ss[k] && !sec[k]) { sec[k] = ss[k]; mudou = true; } });
        // Quantidades: lista padrão revisada (ex.: almoço já servido pelo buffet) — troca os itens padrão antigos e mantém os que vocês criaram
        if (ss.tipo === "quantidades" && (sec.versao || 1) < ss.versao) {
          const padrao = new Set([...QTD_PADRAO_V1, ...ss.linhas.map((l) => l[1])]);
          sec.linhas = [...clone(ss.linhas), ...sec.linhas.filter((l) => !padrao.has(String(l[1]).trim()))];
          sec.versao = ss.versao; sec.nota = ss.nota; mudou = true;
        }
        if (ss.colunas.every((c, i) => sec.colunas[i] && sec.colunas[i].nome === c.nome && sec.colunas[i].tipo === c.tipo) && ss.colunas.length === sec.colunas.length) return;
        const antigos = sec.colunas.map((c) => c.nome);
        const iv = ss.colunas.findIndex((c) => c.nome === "Valor" && c.tipo === "numero"), io = ss.colunas.findIndex((c) => c.nome === "Obs. do valor");
        sec.linhas = sec.linhas.map((l) => {
          const n = ss.colunas.map((c) => { const j = antigos.indexOf(c.nome); return j >= 0 ? l[j] : ["check", "escolha"].includes(c.tipo) ? false : ""; });
          // "Valor" virou número: textos como "1 salário mínimo" vão para "Obs. do valor"
          if (iv >= 0 && io >= 0 && typeof n[iv] === "string" && n[iv].trim() && !/^[\d.,\s]+$/.test(n[iv])) { n[io] = n[io] || n[iv]; n[iv] = ""; }
          return n;
        });
        sec.colunas = clone(ss.colunas); mudou = true;
      });
      // Menus com opções não têm mais a seção "Valores": cada valor vai para a opção que ele cita (se estiver sem valor)
      // ou, se não achar, para "Outros custos" (nada se perde)
      if (!seedAba.secoes.some((x) => x.titulo === "Valores")) {
        const v = aba.secoes.find((x) => x.titulo === "Valores");
        if (v) {
          const outros = tot && tot.secoes.find((x) => x.titulo === "Outros custos");
          const op = aba.secoes.find((x) => x.escolha), iv = op ? col(op, "Valor") : -1;
          v.linhas.filter((l) => String(l[0]).trim() || num(l[1])).forEach((l) => {
            const d = String(l[0]).toLowerCase();
            const alvo = iv >= 0 && op.linhas.find((r) => !String(r[iv]).trim() && r.some((c, k) => k !== iv && typeof c === "string" && c.trim().length >= 4 && !isUrl(c) && d.includes(c.trim().toLowerCase())));
            if (alvo && !isNaN(num(l[1]))) alvo[iv] = num(l[1]);
            else if (outros) outros.linhas.push([`${aba.nome}: ${l[0]}`, l[1]]);
          });
          aba.secoes = aba.secoes.filter((x) => x !== v); mudou = true;
        }
      }
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
  // Recolher o menu lateral (lembra a escolha neste navegador)
  const app = $("app");
  const recolhe = (v) => { app.classList.toggle("recolhido", v); $("recolher").textContent = v ? "»" : "«"; $("recolher").title = v ? "Expandir menu" : "Recolher menu"; try { localStorage.setItem("adm_recolhido", v ? "1" : ""); } catch {} };
  try { recolhe(localStorage.getItem("adm_recolhido") === "1"); } catch {}
  $("recolher").onclick = () => recolhe(!app.classList.contains("recolhido"));
  $("burger").onclick = () => $("side").classList.toggle("open");

  /* ---------- Menu ---------- */
  function montar() {
    const nav = $("menu"); nav.innerHTML = "";
    abas.forEach((a, i) => {
      const b = document.createElement("button");
      b.className = "item" + (i === atual ? " on" : "");
      b.title = a.nome; b.innerHTML = `<i>${a.icone || "📄"}</i>`; b.append(el("span", { textContent: a.nome }));
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
      inp = el("input", { type: "checkbox", checked: !!linha[i] }); inp.onchange = () => { set(inp.checked); opts.onchange && opts.onchange(); };
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
      inp = el("input", { value: col.tipo === "numero" && typeof linha[i] === "number" ? String(linha[i]).replace(".", ",") : linha[i] ?? "", placeholder: opts.placeholder || "" });
      if (col.tipo === "telefone") { inp.type = "tel"; inp.autocomplete = "off"; inp.placeholder = opts.placeholder || "(34) 99999-9999"; }
      if (col.tipo === "email") { inp.type = "email"; inp.autocomplete = "off"; inp.placeholder = opts.placeholder || "nome@email.com"; }
      if (col.tipo === "percentual") {
        inp.type = "number"; inp.min = 0; inp.max = 100; inp.step = 5; inp.placeholder = opts.compacto ? "%" : "0 a 100 (%)";
        inp.oninput = () => { const n = parseFloat(inp.value); set(inp.value === "" || isNaN(n) ? "" : Math.min(100, Math.max(0, n))); opts.onchange && opts.onchange(); };
      } else if (col.tipo === "numero") { inp.inputMode = "decimal"; inp.oninput = () => { const n = num(inp.value); set(inp.value.trim() !== "" && !isNaN(n) && /^[\d.,\s]+$/.test(inp.value) ? n : inp.value); opts.onchange && opts.onchange(); }; }
      else inp.oninput = () => { set(inp.value); opts.onchange && opts.onchange(); };
    }
    if (opts.compacto) return inp;
    const wrap = el("label", { className: "campo" }, col.nome, inp);
    if (isUrl(linha[i])) wrap.append(el("a", { className: "lk", href: String(linha[i]).trim(), target: "_blank", rel: "noopener", textContent: "abrir link ↗" }));
    return wrap;
  }
  const novaLinha = (s) => s.colunas.map((c) => (["check", "escolha"].includes(c.tipo) ? false : c.tipo === "opcoes" ? c.opcoes[0] : ""));

  // Convidados: todos, com 100% de chance e com 75% ou mais
  const convidados = (soBebem = false) => {
    const g = abas.flatMap((a) => a.secoes).find((x) => x.guests);
    if (!g) return { todos: 0, c100: 0, c75: 0, p75: 0, conf: 0, conta: 0 };
    const ic = g.colunas.findIndex((c) => c.nome === "Chance de comparecimento");
    const ib = g.colunas.findIndex((c) => c.nome === "Bebe?");
    const ia = g.colunas.findIndex((c) => c.nome === "Confirmação");
    const R = g.linhas.filter((l) => String(l[0]).trim() && (!soBebem || l[ib] === "Sim"));
    const ch = (l) => { const n = num(l[ic]); return isNaN(n) ? -1 : n; };
    const p75 = R.filter((l) => ch(l) >= 75 && l[ia] !== "Recusou").length, conf = R.filter((l) => l[ia] === "Confirmado").length;
    // Para valores por pessoa: chance ≥75% (sem quem recusou) até os confirmados passarem disso; daí, cada confirmado a mais soma
    return { todos: R.length, c100: R.filter((l) => ch(l) >= 100).length, c75: R.filter((l) => ch(l) >= 75).length, p75, conf, conta: Math.max(p75, conf) };
  };
  function somaSecao(s) {
    const i = s.colunas.findIndex((c) => c.tipo === "numero");
    return s.linhas.reduce((t, l) => t + (num(l[i]) || 0), 0);
  }
  // Base de convidados usada no "valor por pessoa" que vai para o total (fica salva no resumo da aba Total)
  const BASES = [["todos", "Todos os convidados"], ["c100", "Chance 100%"], ["c75", "Chance 75% ou mais"]];
  const col = (s, nome) => s.colunas.findIndex((c) => c.nome === nome);
  // Valor de uma opção: valor fixo + valor por pessoa × convidados (só os que bebem, se marcado)
  function valorLinha(s, l) {
    const ib = col(s, "Só quem bebe?"), vpp = num(l[col(s, "Valor por pessoa")]);
    if (vpp && !isNaN(vpp)) return vpp * convidados(ib >= 0 && l[ib] === true).conta;
    return num(l[col(s, "Valor")]) || 0;
  }
  const escolhidas = (s) => s.linhas.filter((l) => l[col(s, "Escolhido")] === true);
  // Total de um menu: opções escolhidas + extras marcados + listas de valores
  function valorAba(a) {
    let v = 0; const det = [];
    a.secoes.forEach((s) => {
      if (s.escolha) escolhidas(s).forEach((l) => { v += valorLinha(s, l); det.push(String(l[s.colunas.findIndex((c) => c.tipo === "texto" && c.nome !== "Local")] ?? l[0]).trim() || "(sem nome)"); });
      else if (s.incluir) s.linhas.filter((l) => l[col(s, "Incluir no total")] === true).forEach((l) => { v += num(l[col(s, "Valor")]) || 0; det.push(String(l[0]).trim()); });
      else if (s.soma && s.titulo === "Valores") v += somaSecao(s);
    });
    const temOpcoes = a.secoes.some((s) => s.escolha);
    return { v, det, conta: temOpcoes || a.secoes.some((s) => s.soma && s.titulo === "Valores"), aviso: temOpcoes && !a.secoes.some((s) => s.escolha && escolhidas(s).length) };
  }
  function resumo(s) {
    const regra = el("p", { className: "hint" });
    const box = el("section", { className: "sec" }, el("div", { className: "sec__head" }, el("h2", { textContent: s.titulo })), regra);
    const corpo = el("div", { className: "tabela" }); box.append(corpo);
    const desenha = () => {
      if (!box.isConnected && box.dataset.ok) return window.removeEventListener("mudou", desenha);
      box.dataset.ok = 1;
      const n = convidados();
      regra.textContent = `Valores por pessoa calculados com ${n.conta} convidados — o maior entre chance ≥75% (${n.p75}) e confirmados (${n.conf}).`;
      let total = 0; const t = el("table", { style: "min-width:0" });
      const add = (nome, v, ir, det) => { total += v; const r = t.insertRow(); r.insertCell().append(ir ? el("button", { className: "btn btn--ghost", textContent: nome, onclick: ir }) : nome); if (det) r.cells[0].append(el("small", { className: "det" + (det.aviso ? " aviso" : ""), textContent: det.txt })); r.insertCell().append(el("b", { textContent: brl(v) })); r.cells[1].style.textAlign = "right"; };
      abas.forEach((a, idx) => {
        if (a.nome === "Total") return;
        const r = valorAba(a);
        if (r.conta) add(`${a.icone || ""} ${a.nome}`, r.v, () => { atual = idx; montar(); }, r.aviso ? { txt: "nenhuma opção escolhida", aviso: true } : r.det.length ? { txt: r.det.join(" · ") } : null);
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
    if (s.tipo === "quantidades") return quantidades(s);
    const box = el("section", { className: "sec" });
    const busca = el("input", { type: "search", placeholder: "Buscar…" });
    const lista = el("div");
    const soma = el("div", { className: "soma" });
    const stats = el("div", { className: "stats" });
    const filtros = el("div", { className: "filtros" });
    const sel = {};
    let ord = { i: -1, dir: 1 };
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
      if (s.escolha) {
        const e = escolhidas(s);
        soma.textContent = e.length ? `Vai para o total: ${brl(e.reduce((t, l) => t + valorLinha(s, l), 0))}` : "Escolha uma opção para somar no total";
        soma.classList.toggle("aviso", !e.length); return;
      }
      if (s.incluir) { soma.textContent = "Extras no total: " + brl(s.linhas.filter((l) => l[col(s, "Incluir no total")] === true).reduce((t, l) => t + (num(l[col(s, "Valor")]) || 0), 0)); return; }
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
      [["Total", R.length], ["Adultos", n("Tipo", "Adulto")], ["Crianças", n("Tipo", "Criança")], ["Noiva", n("De quem", "NOIVA")], ["Noivo", n("De quem", "NOIVO")], ["Confirmados", n("Confirmação", "Confirmado")], ["Chance 100%", convidados().c100], ["Chance ≥75%", convidados().c75], ["Bebem", n("Bebe?", "Sim")], ["Pendentes", R.filter((l) => !l[idx("Confirmação")] || l[idx("Confirmação")] === "Pendente").length]]
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
      if (ord.i >= 0) {
        const numerico = ["numero", "percentual"].includes(s.colunas[ord.i].tipo);
        const vazio = (v) => v === "" || v === undefined || v === null || (numerico && isNaN(num(v)));
        itens.sort(([a], [b]) => {
          if (vazio(a[ord.i]) || vazio(b[ord.i])) return vazio(a[ord.i]) - vazio(b[ord.i]); // vazios sempre no fim
          const c = numerico ? num(a[ord.i]) - num(b[ord.i]) : String(a[ord.i]).localeCompare(String(b[ord.i]), "pt-BR", { sensitivity: "base", numeric: true });
          return c * ord.dir;
        });
      }
      if (!itens.length) { lista.append(el("div", { className: "vazio", textContent: s.linhas.length ? "Nada encontrado." : "Nada por aqui ainda. Use “+ Adicionar”." })); if (s.guests && !s.linhas.length) lista.append(importarConvidados(s, desenha)); return; }
      if (s.tipo === "tabela") {
        const t = el("table"); const tr = t.createTHead().insertRow();
        const W = { Tipo: 8, Categoria: 10, "De quem": 8, "Confirmação": 12, "Chance de comparecimento": 11, "Bebe?": 7 };
        const larg = (c) => (W[c.nome] ? W[c.nome] + "%" : c.tipo === "opcoes" ? "9%" : c.tipo === "percentual" ? "10%" : c.tipo === "telefone" ? "11%" : c.tipo === "email" ? "16%" : c.tipo === "numero" ? "10%" : "");
        s.colunas.forEach((c, i) => tr.append(el("th", { className: "ord" + (ord.i === i ? " on" : ""), style: larg(c) ? `width:${larg(c)}` : "", title: "Clique para ordenar", textContent: c.nome + (ord.i === i ? (ord.dir > 0 ? " ▲" : " ▼") : ""), onclick: () => { ord = ord.i === i ? (ord.dir > 0 ? { i, dir: -1 } : { i: -1, dir: 1 }) : { i, dir: 1 }; desenha(); } })));
        tr.append(el("th", { style: "width:44px" }));
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
          const est = el("div", { className: "est" });
          const refaz = () => {
            const ib = s.colunas.findIndex((c) => c.nome === "Só quem bebe?");
            const bebe = ib >= 0 && l[ib] === true, n = convidados(bebe), v = num(l[s.colunas.findIndex((c) => c.nome === "Valor por pessoa")]);
            est.innerHTML = ""; est.hidden = !v || isNaN(v);
            if (est.hidden) return;
            est.append(el("div", { innerHTML: `<span>${n.conta} convidados × ${brl(v)}</span><b>${brl(v * n.conta)}</b>` }),
              el("small", { textContent: `Maior entre chance ≥75% (${n.p75}) e confirmados (${n.conf})${bebe ? " · só quem bebe" : ""}. O valor fixo não soma quando há valor por pessoa.` }));
          };
          const ie = s.escolha ? col(s, "Escolhido") : -1;
          if (ie >= 0) {
            const on = l[ie] === true; if (on) card.classList.add("escolhido");
            const grupo = (x) => (s.escolhaPor ? String(x[col(s, s.escolhaPor)] ?? "").trim().toLowerCase() : "");
            card.append(el("button", { className: "escolher" + (on ? " on" : ""), textContent: on ? "✓ Escolhida — vai para o total" : "Escolher esta opção", title: s.escolhaPor ? `Uma opção por ${s.escolhaPor.toLowerCase()}` : "Só uma opção vai para o total", onclick: () => {
              if (!on) s.linhas.forEach((x) => { if (grupo(x) === grupo(l)) x[ie] = false; });
              l[ie] = !on; marcar(); desenha();
            } }));
          }
          s.colunas.forEach((c, i) => { if (i && i !== ie) cp.append(campo(c, l, i, { onchange: () => { atualizaSoma(); refaz(); } })); });
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

  // Convidados por tipo, filtrando pela chance de comparecimento (base: todos / c100 / c75)
  function publico(base) {
    const g = abas.flatMap((a) => a.secoes).find((x) => x.guests);
    const z = { Todos: 0, Adultos: 0, "Crianças": 0, "Quem bebe": 0 };
    if (!g) return z;
    const i = (n) => col(g, n), min = base === "c100" ? 100 : base === "c75" ? 75 : -Infinity;
    g.linhas.filter((l) => String(l[0]).trim()).forEach((l) => {
      const ch = num(l[i("Chance de comparecimento")]);
      if ((isNaN(ch) ? -1 : ch) < min) return;
      z.Todos++;
      if (l[i("Tipo")] === "Criança") z["Crianças"]++; else z.Adultos++;
      if (l[i("Bebe?")] === "Sim") z["Quem bebe"]++;
    });
    return z;
  }
  // Tela de quantidades: por pessoa × público (+ margem), agrupado por "Grupo"; itens editáveis
  function quantidades(s) {
    const box = el("section", { className: "sec quant" });
    const I = (n) => col(s, n);
    const fmt = (n, d = 2) => n.toLocaleString("pt-BR", { maximumFractionDigits: d });
    const plural = (u, n) => (u === "garrafa" && n > 1 ? "garrafas" : u);
    const base = el("select", { onchange: () => { s.base = base.value; marcar(); desenha(); } });
    BASES.forEach(([k, t]) => base.append(el("option", { value: k, textContent: t }))); base.value = s.base || "todos";
    const margem = el("input", { type: "number", min: 0, max: 100, step: 5, value: s.margem ?? 10, oninput: () => { const n = parseFloat(margem.value); s.margem = isNaN(n) ? 0 : Math.max(0, n); marcar(); calcula(); } });
    const stats = el("div", { className: "stats" });
    const lista = el("div");
    const novoGrupo = (g) => { const l = novaLinha(s); l[I("Grupo")] = g; l[I("Para quem")] = "Todos"; s.linhas.push(l); marcar(); desenha(); lista.querySelector(`tr[data-r="${s.linhas.length - 1}"] input`)?.focus(); };
    box.append(
      el("div", { className: "ctrl" }, el("label", {}, "Convidados considerados", base), el("label", { className: "curto" }, "Margem de segurança (%)", margem)),
      stats,
      s.nota ? el("p", { className: "nota", textContent: "🍽️ " + s.nota }) : "",
      el("p", { className: "hint" }, "Números vindos da Lista de convidados (com a chance escolhida). A quantidade por pessoa segue referências de cerimonialistas e buffets — todos os campos são editáveis."),
      el("div", { className: "sec__head" }, el("h2", { textContent: s.titulo }), el("button", { className: "btn", textContent: "+ Adicionar item", onclick: () => { const g = prompt("Grupo do novo item (ex.: 🍺 Bebidas):", "Outros"); if (g !== null) novoGrupo(g.trim() || "Outros"); } })),
      lista,
      el("p", { className: "ref", textContent: "Referências: casamentos.com.br, receiteria.com.br, valorfinal.com.br, Sescon (cálculo de comida e bebida em eventos). Base: almoço de ~5 h com comida e sobremesa pelo buffet." })
    );
    const linhasCalc = []; // [linha, célula total, célula comprar]
    function calcula() {
      const P = publico(s.base || "todos"), fator = 1 + (num(s.margem) || 0) / 100;
      stats.innerHTML = "";
      [["Todos", "Convidados"], ["Adultos", "Adultos"], ["Crianças", "Crianças"], ["Quem bebe", "Bebem"]].forEach(([k, t]) => stats.append(el("div", { className: "stat", innerHTML: `<b>${P[k]}</b><span>${t}</span>` })));
      const th = box.querySelector("th.tt"); if (th) th.textContent = `Total (+${fmt(num(s.margem) || 0, 1)}%)`;
      linhasCalc.forEach(([l, ct, cc]) => {
        const pp = num(l[I("Por pessoa")]), u = String(l[I("Unidade")] ?? "").trim(), tam = num(l[I("Qtd. por embalagem")]);
        ct.innerHTML = cc.innerHTML = "";
        if (!pp || isNaN(pp)) return;
        const t = pp * (P[l[I("Para quem")]] ?? P.Todos) * fator;
        ct.append(el("b", { textContent: `${fmt(Math.round(t * 10) / 10, 1)} ${plural(u, t)}` }));
        if (tam > 0) { const q = Math.ceil(t / tam); cc.append(el("b", { textContent: q }), el("small", { textContent: "× " + (String(l[I("Embalagem")]).trim() || `${fmt(tam)} ${u}`) })); }
        else cc.append(el("b", { textContent: `${fmt(Math.ceil(t))} ${plural(u, Math.ceil(t))}` }));
      });
    }
    function desenha() {
      lista.innerHTML = ""; linhasCalc.length = 0;
      const t = el("table", { className: "q" }); const h = t.createTHead().insertRow();
      [["Item", 21], ["Por pessoa", 9], ["Unidade", 8], ["Para quem", 12], ["Embalagem", 13], ["Qtd. por emb.", 9], ["Total", 11, "tt"], ["Comprar", 13]].forEach(([n, w, c]) => h.append(el("th", { textContent: n, className: c || "", style: `width:${w}%` })));
      h.append(el("th", { style: "width:44px" }));
      const tb = t.createTBody();
      const grupos = [...new Set(s.linhas.map((l) => String(l[I("Grupo")] ?? "").trim() || "Outros"))];
      grupos.forEach((g) => {
        const gr = tb.insertRow(); gr.className = "grp";
        const gc = gr.insertCell(); gc.colSpan = 9;
        gc.append(el("span", { textContent: g }), el("button", { className: "btn btn--ghost mini", textContent: "+ item", onclick: () => novoGrupo(g) }));
        s.linhas.forEach((l, r) => {
          if ((String(l[I("Grupo")] ?? "").trim() || "Outros") !== g) return;
          const row = tb.insertRow(); row.dataset.r = r;
          ["Item", "Por pessoa", "Unidade", "Para quem", "Embalagem", "Qtd. por embalagem"].forEach((n) => {
            const c = s.colunas[I(n)];
            row.insertCell().append(campo(c, l, I(n), { compacto: true, placeholder: n === "Embalagem" ? "—" : n === "Qtd. por embalagem" ? "—" : c.nome, onchange: calcula }));
          });
          const ct = row.insertCell(), cc = row.insertCell(); ct.className = "tot"; cc.className = "buy";
          row.insertCell().append(el("button", { className: "x", title: "Excluir", textContent: "🗑", onclick: () => { if (confirm(`Excluir "${l[I("Item")]}"?`)) { s.linhas.splice(r, 1); marcar(); desenha(); } } }));
          linhasCalc.push([l, ct, cc]);
        });
      });
      if (!s.linhas.length) lista.append(el("div", { className: "vazio", textContent: "Nenhum item. Use “+ Adicionar item”." }));
      else lista.append(el("div", { className: "tabela" }, t));
      calcula();
    }
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
