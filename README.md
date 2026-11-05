# 💍 André & Thaiz — Site do casamento

Site estático (HTML + CSS + JS), sem build. Tema: viagem ✈ + futebol ⚽ (Inter x Galo) + Dublin 🍀.

## Estrutura
```
index.html          → página
css/style.css       → visual
js/config.js        → ⭐ TODO o conteúdo editável (datas, local, PIX, presentes, história…)
js/main.js          → interações
assets/img/         → imagens (troque pelas fotos reais mantendo ou ajustando os nomes no config)
supabase/schema.sql → banco de dados (Supabase)
```

## Rodar localmente
```powershell
npx serve .
```
ou abra o `index.html` com a extensão Live Server.

## Banco de dados (Supabase)
RSVP, recados, presentes e a área restrita ficam no projeto Supabase **casamento-andre-thaiz** (`js/config.js` → `supabase`).
- Estrutura do banco: `supabase/schema.sql` (tabelas protegidas por RLS; o site só chama as funções `enviar`, `recados_publicos`, `ping` e `admin`).
- A chave em `js/config.js` é a **publicável** (feita para ficar no site).
- Recados aparecem no mural na hora; para moderar, desmarque “Mural” em **Respostas do site** no admin (ou mude o default de `recados.aprovado` para `false`).
- **Não deixar pausar** (plano grátis pausa após 7 dias sem uso): o workflow `.github/workflows/keepalive.yml` grava o dia na tabela `ping` todo dia; como reserva, configure no [cron-job.org](https://cron-job.org) uma tarefa diária `POST https://klnmsandpgpnjibdqpry.supabase.co/rest/v1/rpc/ping` com os cabeçalhos `apikey: <chave de js/config.js>` e `Content-Type: application/json`, corpo `{}`. Se pausar mesmo assim, clique **Restore** no painel do Supabase (nada se perde).

> Sem `supabase.url` no config, o site funciona em **modo demonstração** (salva só no navegador).

## Publicar (grátis)
- **Netlify**: arraste a pasta em https://app.netlify.com/drop
- **GitHub Pages**: suba o repositório e ative Pages em *Settings → Pages*.

## Área restrita (`/admin.html`)
Planejamento do casamento com login e um menu lateral (Total, Igreja, Cartório, Espaço, Assessorias, Buffets, Fornecedores, Noiva, Noivo, Lista de convidados, Quantidades), já preenchido (`js/seed.js`).
1. Abra `admin.html`: no **primeiro acesso** crie o usuário/senha administrador.
2. Se você usou o admin antes no modo demonstração, abra-o **no mesmo navegador e endereço**: ele oferece levar esses dados para o banco (depois clique **Salvar**).
3. Em cada menu com opções (Igreja, Espaço, Assessorias, Buffets, Fornecedores) clique **Escolher esta opção**: só a escolhida vai para o **Total** (em Fornecedores, uma por categoria; valor por pessoa × convidados: o maior entre chance ≥75% e confirmados).
4. **Quantidades**: bebidas, doces e descartáveis por pessoa, com margem de segurança e quantas embalagens comprar.
5. **Respostas do site**: confirmações de presença, recados (escolha quais aparecem no mural) e presentes.
6. **Usuários**: crie outros acessos. **Exportar .xlsx** gera a planilha.

Senhas ficam no banco com hash bcrypt; sessões expiram em 12 h.
