/**
 * Google Apps Script — backend gratuito do site André & Thaiz
 * Salva RSVP, recados e presentes numa planilha do Google.
 * Instruções de instalação: veja README.md
 */
const ABAS = {
  rsvp: ["enviadoEm", "nome", "email", "telefone", "presenca", "filhos", "criancas", "time", "restricao", "mensagem"],
  recado: ["enviadoEm", "nome", "time", "mensagem", "aprovado"],
  presente: ["enviadoEm", "nome", "presenteId", "presente", "valor", "mensagem"],
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const dados = JSON.parse(e.postData.contents);
    if (dados.acao) return json(admin(dados));
    const cols = ABAS[dados.tipo];
    if (!cols) return json({ ok: false, erro: "tipo inválido" });
    if (dados.tipo === "recado") dados.aprovado = "SIM"; // troque para "" se quiser moderar antes
    const aba = getAba(dados.tipo, cols);
    aba.appendRow(cols.map((c) => String(dados[c] ?? "").slice(0, 1000)));
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  if (e.parameter.tipo === "recados") {
    const aba = getAba("recado", ABAS.recado);
    const linhas = aba.getDataRange().getValues().slice(1);
    const recados = linhas
      .filter((l) => l[4] === "SIM")
      .map((l) => ({ data: l[0], nome: l[1], time: l[2], mensagem: l[3] }));
    return json(recados);
  }
  return json({ ok: true });
}

function getAba(nome, cols) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let aba = ss.getSheetByName(nome);
  if (!aba) {
    aba = ss.insertSheet(nome);
    aba.appendRow(cols);
    aba.setFrozenRows(1);
  }
  return aba;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ================= ÁREA ADMIN (lista de convidados) ================= */
const COLS_USUARIOS = ["usuario", "salt", "hash", "criadoEm", "criadoPor"];
const COLS_PLANILHA = ["json"];
const SESSAO_SEG = 21600; // 6h (máximo do CacheService)

function admin(d) {
  const usuarios = getAba("usuarios", COLS_USUARIOS);
  const lista = usuarios.getDataRange().getValues().slice(1);

  // Ações públicas
  if (d.acao === "status") return { ok: true, configurado: lista.length > 0 };
  if (d.acao === "setup") {
    if (lista.length > 0) return { ok: false, erro: "Já configurado." };
    const erro = validaCred(d.usuario, d.senha);
    if (erro) return { ok: false, erro };
    addUsuario(usuarios, d.usuario, d.senha, "(primeiro acesso)");
    return { ok: true, token: novaSessao(norm(d.usuario)), usuario: norm(d.usuario) };
  }
  if (d.acao === "login") {
    const u = lista.find((l) => l[0] === norm(d.usuario));
    if (!u || hash(u[1], String(d.senha || "")) !== u[2]) return { ok: false, erro: "Usuário ou senha inválidos." };
    return { ok: true, token: novaSessao(u[0]), usuario: u[0] };
  }

  // Ações autenticadas
  const user = CacheService.getScriptCache().get("s_" + d.token);
  if (!user) return { ok: false, erro: "Sessão expirada.", expirou: true };

  switch (d.acao) {
    case "logout":
      CacheService.getScriptCache().remove("s_" + d.token);
      return { ok: true };
    case "planilha": {
      const dados = lerPlanilha();
      return { ok: true, versao: dados.versao, abas: dados.abas };
    }
    case "salvarPlanilha": {
      // Salva todas as abas de uma vez; rejeita se outra pessoa salvou antes (evita sobrescrever)
      const atual = lerPlanilha();
      if (String(d.versao) !== String(atual.versao)) return { ok: false, conflito: true, erro: "Outra pessoa alterou a planilha. Recarregue a página." };
      const versao = Date.now();
      gravarPlanilha({ versao, abas: d.abas || [] });
      return { ok: true, versao };
    }
    case "usuarios":
      return { ok: true, usuarios: lista.map((l) => ({ usuario: l[0], criadoEm: l[3], criadoPor: l[4] })), eu: user };
    case "criarUsuario": {
      const erro = validaCred(d.novoUsuario, d.novaSenha);
      if (erro) return { ok: false, erro };
      if (lista.some((l) => l[0] === norm(d.novoUsuario))) return { ok: false, erro: "Usuário já existe." };
      addUsuario(usuarios, d.novoUsuario, d.novaSenha, user);
      return { ok: true };
    }
    case "excluirUsuario": {
      const alvo = norm(d.alvo);
      if (alvo === user) return { ok: false, erro: "Você não pode excluir seu próprio usuário." };
      const i = lista.findIndex((l) => l[0] === alvo);
      if (i >= 0) usuarios.deleteRow(i + 2);
      return { ok: true };
    }
  }
  return { ok: false, erro: "ação inválida" };
}

// A planilha toda (todas as abas) fica em JSON, dividido em pedaços na aba "planilha".
function lerPlanilha() {
  const aba = getAba("planilha", COLS_PLANILHA);
  const txt = aba.getDataRange().getValues().slice(1).map((l) => l[0]).join("");
  return txt ? JSON.parse(txt) : { versao: 0, abas: [] };
}
function gravarPlanilha(obj) {
  const aba = getAba("planilha", COLS_PLANILHA);
  const txt = JSON.stringify(obj);
  const partes = [];
  for (let i = 0; i < txt.length; i += 40000) partes.push([txt.slice(i, i + 40000)]);
  if (aba.getLastRow() > 1) aba.getRange(2, 1, aba.getLastRow() - 1, 1).clearContent();
  aba.getRange(2, 1, partes.length, 1).setValues(partes);
}

function norm(u) { return String(u || "").trim().toLowerCase(); }
function validaCred(u, s) {
  if (!/^[a-z0-9._-]{3,30}$/.test(norm(u))) return "Usuário: 3 a 30 caracteres (letras, números, . _ -).";
  if (String(s || "").length < 6) return "A senha precisa ter ao menos 6 caracteres.";
  return "";
}
function hash(salt, senha) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + senha);
  return bytes.map((b) => ((b < 0 ? b + 256 : b).toString(16).padStart(2, "0"))).join("");
}
function addUsuario(aba, usuario, senha, por) {
  const salt = Utilities.getUuid();
  aba.appendRow([norm(usuario), salt, hash(salt, String(senha)), new Date().toISOString(), por]);
}
function novaSessao(usuario) {
  const token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put("s_" + token, usuario, SESSAO_SEG);
  return token;
}
