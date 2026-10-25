# 💍 André & Thaiz — Site do casamento

Site estático (HTML + CSS + JS), sem build. Tema: viagem ✈ + futebol ⚽ (Inter x Galo) + Dublin 🍀.

## Estrutura
```
index.html          → página
css/style.css       → visual
js/config.js        → ⭐ TODO o conteúdo editável (datas, local, PIX, presentes, história…)
js/main.js          → interações
assets/img/         → imagens (troque pelas fotos reais mantendo ou ajustando os nomes no config)
apps-script/Code.gs → backend gratuito na planilha do Google
```

## Rodar localmente
```powershell
npx serve .
```
ou abra o `index.html` com a extensão Live Server.

## Ligar RSVP / recados / presentes à planilha do Google
1. Crie uma planilha nova no Google Sheets.
2. Menu **Extensões → Apps Script**, apague o conteúdo e cole o `apps-script/Code.gs`.
3. **Implantar → Nova implantação → Tipo: App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
4. Copie a URL gerada (`https://script.google.com/macros/s/.../exec`) e cole em `googleScriptUrl` no `js/config.js`.

As abas `rsvp`, `recado` e `presente` são criadas automaticamente.
Para moderar recados antes de aparecerem, troque `"SIM"` por `""` no `doPost` e marque `SIM` manualmente na coluna **aprovado**.

> Sem a URL configurada, o site funciona em **modo demonstração** (salva só no navegador).

## Publicar (grátis)
- **Netlify**: arraste a pasta em https://app.netlify.com/drop
- **GitHub Pages**: suba o repositório e ative Pages em *Settings → Pages*.
