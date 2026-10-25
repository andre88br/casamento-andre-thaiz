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
