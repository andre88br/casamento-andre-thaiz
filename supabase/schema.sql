-- Banco do site André & Thaiz (Supabase / Postgres)
-- Tabelas com RLS ligada e SEM políticas: o navegador não lê nem grava nelas diretamente.
-- Todo acesso passa pelas funções abaixo (security definer), que validam login e dados.

create extension if not exists pgcrypto with schema extensions;

/* ---------------- Tabelas ---------------- */
create table if not exists public.usuarios (
  usuario    text primary key,
  senha_hash text not null,
  criado_em  timestamptz not null default now(),
  criado_por text not null default ''
);
create table if not exists public.sessoes (
  token   text primary key,
  usuario text not null references public.usuarios(usuario) on delete cascade,
  expira  timestamptz not null
);
create index if not exists sessoes_usuario_idx on public.sessoes(usuario);
-- Planejamento inteiro (todas as abas do admin) num único JSON, com versão para evitar sobrescrever
create table if not exists public.planilha (
  id     int primary key default 1 check (id = 1),
  versao bigint not null default 0,
  abas   jsonb not null default '[]'
);
create table if not exists public.rsvp (
  id           bigint generated always as identity primary key,
  enviado_em   timestamptz not null default now(),
  nome         text not null,
  email        text, telefone text, presenca text, filhos text, criancas text,
  crianca_meia text, time text, restricao text, mensagem text
);
create table if not exists public.recados (
  id         bigint generated always as identity primary key,
  enviado_em timestamptz not null default now(),
  nome       text not null,
  time       text,
  mensagem   text not null,
  aprovado   boolean not null default true -- troque o default para false se quiser moderar antes
);
create table if not exists public.presentes (
  id          bigint generated always as identity primary key,
  enviado_em  timestamptz not null default now(),
  nome        text, presente_id text, presente text, valor text, mensagem text
);
-- Batida diária (cron-job.org / GitHub) para o projeto grátis não pausar por inatividade
create table if not exists public.ping (
  dia      date primary key,
  chamadas int not null default 1,
  ultima   timestamptz not null default now()
);

alter table public.usuarios  enable row level security;
alter table public.sessoes   enable row level security;
alter table public.planilha  enable row level security;
alter table public.rsvp      enable row level security;
alter table public.recados   enable row level security;
alter table public.presentes enable row level security;
alter table public.ping      enable row level security;

/* ---------------- Funções públicas do site ---------------- */
-- Recebe RSVP, recado ou presente do site público
create or replace function public.enviar(d jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t text := d->>'tipo';
  lim int := 1000;
begin
  if t = 'rsvp' then
    if coalesce(trim(d->>'nome'), '') = '' then return jsonb_build_object('ok', false, 'erro', 'Nome obrigatório.'); end if;
    insert into rsvp(nome, email, telefone, presenca, filhos, criancas, crianca_meia, time, restricao, mensagem)
    values (left(d->>'nome', 200), left(d->>'email', 200), left(d->>'telefone', 50), left(d->>'presenca', 50), left(d->>'filhos', 50),
            left(d->>'criancas', lim), left(d->>'criancaMeia', 50), left(d->>'time', 50), left(d->>'restricao', lim), left(d->>'mensagem', lim));
  elsif t = 'recado' then
    if coalesce(trim(d->>'nome'), '') = '' or coalesce(trim(d->>'mensagem'), '') = '' then return jsonb_build_object('ok', false, 'erro', 'Preencha nome e recado.'); end if;
    insert into recados(nome, time, mensagem) values (left(d->>'nome', 200), left(d->>'time', 50), left(d->>'mensagem', lim));
  elsif t = 'presente' then
    insert into presentes(nome, presente_id, presente, valor, mensagem)
    values (left(d->>'nome', 200), left(d->>'presenteId', 100), left(d->>'presente', 200), left(d->>'valor', 50), left(d->>'mensagem', lim));
  else
    return jsonb_build_object('ok', false, 'erro', 'tipo inválido');
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- Recados aprovados para o mural
create or replace function public.recados_publicos() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('data', enviado_em, 'nome', nome, 'time', time, 'mensagem', mensagem) order by enviado_em desc), '[]')
  from (select * from recados where aprovado order by enviado_em desc limit 200) r
$$;

-- Batida diária: grava o dia de hoje (e quantas chamadas teve)
create or replace function public.ping() returns jsonb
language sql security definer set search_path = public as $$
  insert into ping(dia) values (current_date)
  on conflict (dia) do update set chamadas = ping.chamadas + 1, ultima = now()
  returning jsonb_build_object('ok', true, 'dia', dia, 'chamadas', chamadas)
$$;

/* ---------------- Área restrita (admin) ---------------- */
create or replace function public.admin(d jsonb) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  acao text := d->>'acao';
  u text; quem text; tok text; p planilha; nv bigint;
begin
  delete from sessoes where expira < now();

  -- Ações sem login
  if acao = 'status' then
    return jsonb_build_object('ok', true, 'configurado', exists(select 1 from usuarios));
  elsif acao in ('setup', 'login') then
    u := lower(trim(coalesce(d->>'usuario', '')));
    if acao = 'setup' then
      if exists(select 1 from usuarios) then return jsonb_build_object('ok', false, 'erro', 'Já configurado.'); end if;
      if u !~ '^[a-z0-9._-]{3,30}$' then return jsonb_build_object('ok', false, 'erro', 'Usuário: 3 a 30 caracteres (letras, números, . _ -).'); end if;
      if length(coalesce(d->>'senha', '')) < 6 then return jsonb_build_object('ok', false, 'erro', 'A senha precisa ter ao menos 6 caracteres.'); end if;
      insert into usuarios(usuario, senha_hash, criado_por) values (u, crypt(d->>'senha', gen_salt('bf')), '(primeiro acesso)');
    elsif not exists(select 1 from usuarios where usuario = u and senha_hash = crypt(coalesce(d->>'senha', ''), senha_hash)) then
      perform pg_sleep(0.5); -- atrasa tentativas de adivinhar senha
      return jsonb_build_object('ok', false, 'erro', 'Usuário ou senha inválidos.');
    end if;
    tok := encode(gen_random_bytes(32), 'hex');
    insert into sessoes(token, usuario, expira) values (tok, u, now() + interval '12 hours');
    return jsonb_build_object('ok', true, 'token', tok, 'usuario', u);
  end if;

  -- Ações com login
  select usuario into quem from sessoes where token = coalesce(d->>'token', '') and expira > now();
  if quem is null then return jsonb_build_object('ok', false, 'erro', 'Sessão expirada.', 'expirou', true); end if;

  if acao = 'logout' then
    delete from sessoes where token = d->>'token';
    return jsonb_build_object('ok', true);
  elsif acao = 'planilha' then
    select * into p from planilha where id = 1;
    return jsonb_build_object('ok', true, 'versao', coalesce(p.versao, 0), 'abas', coalesce(p.abas, '[]'));
  elsif acao = 'salvarPlanilha' then
    select * into p from planilha where id = 1 for update;
    if coalesce(p.versao, 0)::text <> coalesce(d->>'versao', '0') then
      return jsonb_build_object('ok', false, 'conflito', true, 'erro', 'Outra pessoa alterou a planilha. Recarregue a página.');
    end if;
    nv := (extract(epoch from clock_timestamp()) * 1000)::bigint;
    insert into planilha(id, versao, abas) values (1, nv, coalesce(d->'abas', '[]'))
    on conflict (id) do update set versao = excluded.versao, abas = excluded.abas;
    return jsonb_build_object('ok', true, 'versao', nv);
  elsif acao = 'usuarios' then
    return jsonb_build_object('ok', true, 'eu', quem, 'usuarios',
      (select coalesce(jsonb_agg(jsonb_build_object('usuario', usuario, 'criadoEm', criado_em, 'criadoPor', criado_por) order by criado_em), '[]') from usuarios));
  elsif acao = 'criarUsuario' then
    u := lower(trim(coalesce(d->>'novoUsuario', '')));
    if u !~ '^[a-z0-9._-]{3,30}$' then return jsonb_build_object('ok', false, 'erro', 'Usuário: 3 a 30 caracteres (letras, números, . _ -).'); end if;
    if length(coalesce(d->>'novaSenha', '')) < 6 then return jsonb_build_object('ok', false, 'erro', 'A senha precisa ter ao menos 6 caracteres.'); end if;
    if exists(select 1 from usuarios where usuario = u) then return jsonb_build_object('ok', false, 'erro', 'Usuário já existe.'); end if;
    insert into usuarios(usuario, senha_hash, criado_por) values (u, crypt(d->>'novaSenha', gen_salt('bf')), quem);
    return jsonb_build_object('ok', true);
  elsif acao = 'excluirUsuario' then
    u := lower(trim(coalesce(d->>'alvo', '')));
    if u = quem then return jsonb_build_object('ok', false, 'erro', 'Você não pode excluir seu próprio usuário.'); end if;
    delete from usuarios where usuario = u;
    return jsonb_build_object('ok', true);
  elsif acao = 'respostas' then
    return jsonb_build_object('ok', true,
      'rsvp',      (select coalesce(jsonb_agg(to_jsonb(r) order by r.enviado_em desc), '[]') from rsvp r),
      'recados',   (select coalesce(jsonb_agg(to_jsonb(r) order by r.enviado_em desc), '[]') from recados r),
      'presentes', (select coalesce(jsonb_agg(to_jsonb(r) order by r.enviado_em desc), '[]') from presentes r));
  elsif acao = 'aprovarRecado' then
    update recados set aprovado = coalesce((d->>'aprovado')::boolean, true) where id = (d->>'id')::bigint;
    return jsonb_build_object('ok', true);
  elsif acao = 'excluirResposta' then
    if d->>'tabela' = 'rsvp' then delete from rsvp where id = (d->>'id')::bigint;
    elsif d->>'tabela' = 'recados' then delete from recados where id = (d->>'id')::bigint;
    elsif d->>'tabela' = 'presentes' then delete from presentes where id = (d->>'id')::bigint;
    else return jsonb_build_object('ok', false, 'erro', 'tabela inválida'); end if;
    return jsonb_build_object('ok', true);
  end if;
  return jsonb_build_object('ok', false, 'erro', 'ação inválida');
end $$;

-- Só as funções ficam expostas ao site (chave pública "anon")
revoke all on function public.enviar(jsonb), public.recados_publicos(), public.ping(), public.admin(jsonb) from public;
grant execute on function public.enviar(jsonb), public.recados_publicos(), public.ping(), public.admin(jsonb) to anon, authenticated;
