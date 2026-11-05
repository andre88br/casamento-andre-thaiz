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

## Área restrita (`/admin.html`)
Planejamento do casamento com login e um menu lateral por aba da planilha (Total, Igreja, Cartório, Espaço, Assessorias, Buffets, Fornecedores, Noiva, Noivo, Lista de convidados, Quantidades), já preenchido (`js/seed.js`).
1. Cole o `apps-script/Code.gs` atualizado no Apps Script e **reimplante** (Nova versão) — a URL deve estar em `googleScriptUrl`.
2. Abra `admin.html`: no **primeiro acesso** crie o usuário/senha administrador.
3. Em cada menu com opções (Igreja, Espaço, Assessorias, Buffets, Fornecedores) clique **Escolher esta opção**: só a escolhida vai para o **Total** (em Fornecedores, uma por categoria; valor por pessoa × convidados, com a base escolhida no Total).
4. Menu **Quantidades**: calcula bebidas, comida, doces e descartáveis por pessoa (com base na Lista de convidados e na chance de comparecimento), com margem de segurança e quantas embalagens comprar. Itens editáveis e novos itens via *+ Adicionar item*.
5. Menu **Usuários**: crie outros acessos. Edite os itens em cada menu e clique **Salvar**. Em **Lista de convidados** use *Importar convidados do .xlsx* (uma vez; os nomes não ficam no repositório). **Exportar .xlsx** gera a planilha.

Os dados ficam só na sua planilha Google (não no repositório). Senhas são guardadas com hash + salt. Sem `googleScriptUrl` a página roda em modo demonstração (localStorage, sem segurança real), com um aviso vermelho no topo. Ao ligar a planilha, abra o admin no navegador onde você já tinha salvo: ele oferece levar esses dados para a planilha.
