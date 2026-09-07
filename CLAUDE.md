# Radar de Concorrentes

Projeto de referência da Aula 6 do Clube Divos da IA. App Next.js + Supabase
(padrão das aulas da Amanda: planner, sistema-financeiro). Coleta dados públicos
de concorrentes e guarda cada coleta como snapshot — histórico permanente.

## Stack

- Next.js 15 (App Router, TS) + Supabase (Postgres + Storage) + deploy Vercel
- Coleta server-side 100% via AnyAPI (getanyapi.com): Instagram, YouTube, Meta Ads Library e site —
  chave única `ANYAPI_KEY`; resposta padrão `{output:{data}, costUsd}`, custo somado em `dados.custo_usd`
- Análises de IA (posicionamento, hooks) via `ANTHROPIC_API_KEY` — **opcional**: sem ela
  as páginas degradam com instrução, nunca com erro
- Sem autenticação na v1 (demo de aula); chaves só em env vars server-side

## Estrutura

### Páginas

| Path | Papel |
|------|-------|
| `app/page.tsx` | Visão Geral: resumo, comparativo, grid de cards, seletor de período |
| `app/concorrentes/page.tsx` | Lista de competidores com sparkline, linka pro detalhe |
| `app/concorrente/[id]/page.tsx` | Detalhe: gráfico temporal SVG, "O que mudou", top posts com thumb/transcript, anúncios |
| `app/tendencias/page.tsx` | Ranking Δ seguidores/semana, acelerando/desacelerando |
| `app/ideias/page.tsx` | Outliers: vídeos YT com views/inscritos ≥ 5:1 + posts IG acima da média, com análise de hook sob demanda |
| `app/posicionamento/page.tsx` | Análise white-space via Claude — mapa de promessas, o que está saturado, o que ninguém ocupa |
| `app/metricas/page.tsx` | Tabela comparativa: seguidores, crescimento semanal, engajamento, formato mais forte, frequência, ads ativos |
| `app/anuncios/page.tsx` | Criativos ativos agregados de todos os concorrentes |
| `app/setup/page.tsx` | Configurações: chaves (status), CRUD concorrentes, coleta com log |
| `app/setup/wizard/page.tsx` | First setup guiado: 3 passos de chave com botão Testar, bloco `.env.local` pronto, 1º concorrente, coleta de teste |
| `app/layout.tsx` | Shell: TopBar + Sidebar fixos (tema claro soft-shadows) |
| `components/` | TopBar, Sidebar, ColetarAgora, ResumoStrip, CardConcorrente, Barra, Sparkline, Chips, GraficoLinha, OQueMudou, SeletorPeriodo, IdeiasLista, GerarAnalise, BotaoBuscarTranscricao |

### API

| Path | Papel |
|------|-------|
| `app/api/concorrentes` | GET/POST/DELETE na tabela `concorrentes` |
| `app/api/coletar` | POST {id} — coleta 1 concorrente (4 fontes em paralelo), grava snapshot |
| `app/api/cron/coletar` | GET — coleta todos (Vercel Cron semanal, exige `CRON_SECRET`) |
| `app/api/conteudo` | POST {concorrente_id, chave} — busca transcript/thumb sob demanda |
| `app/api/posicionamento` | GET última análise · POST gera nova (Claude) e grava em `analises` |
| `app/api/analise-hook` | POST — classifica hooks dos vídeos/reels selecionados em `/ideias` |
| `app/api/validar-chave` | POST {fonte, chave} — testa a chave contra o provedor; **não persiste, não loga** |
| `app/api/estado` | Presença das chaves (booleano) + última coleta |

### Lib, dados e verificação

| Path | Papel |
|------|-------|
| `lib/coleta.ts` | Coleta das 4 fontes via AnyAPI, fallback RSS do YouTube, `humanizarErro`, soma de custo |
| `lib/conteudo.ts` | Camada de conteúdo: transcript (IG/YT/ads), thumb → Storage, `garantirConteudo` com dedup |
| `lib/analise.ts` | Chamadas ao Claude: `gerarPosicionamento`, `gerarHooks`, cache em `analises` |
| `lib/supabase.ts` | Client service-role + tipos (`Concorrente`, `Snapshot`, `Post`, `Video`, `DadosColeta`, `Conteudo`) |
| `lib/ui.ts` | fmt pt-BR, CORES, `tempoRelativo`, filtro de período |
| `tests/` | Vitest — `fetch` mockado com fixtures dos schemas AnyAPI reais (nunca chama API de verdade) |
| `supabase/schema.sql` | Tabelas `concorrentes`, `snapshots`, `conteudos`, `analises` (RLS on, acesso via service role) + bucket `thumbs` |
| `vercel.json` | Agenda do cron (segunda 08:00 BRT) |
| `.github/workflows/ci.yml` | CI: typecheck + testes + build em push/PR |
| `SETUP.md` | Passo a passo da aluna (Supabase → chaves → local → Vercel → cron) |
| `docs/stitch-variantes/` | Design de referência (code.html + screen.png = fonte do tema claro) |
| `_v1-local/` | Versão 1 (scripts locais + HTML estático) — referência histórica |

## Comandos

```
npm run dev        # localhost:3000 (/setup/wizard no primeiro uso)
npm test           # vitest — sem rede, sem custo de API
npm run typecheck  # tsc --noEmit
npm run build      # verificação (NUNCA com o dev server aberto — corrompe .next)
```

## Skills

Skills da aluna em `.agents/skills/` — abra qualquer uma perguntando ao LLM "use a skill X":

| Skill | Path | Quando usar |
|-------|------|-------------|
| `radar-setup` | `.agents/skills/radar-setup/SKILL.md` | First setup: onde pegar as 3 chaves, rodar schema.sql, testar via wizard, troubleshooting dos chips |
| `radar-coleta` | `.agents/skills/radar-coleta/SKILL.md` | Operar coleta com segurança: custo real, quando disparar manual, chips de erro, CRON_SECRET |
| `radar-analise` | `.agents/skills/radar-analise/SKILL.md` | Ler o radar: outliers /ideias, tendências, "O que mudou", posicionamento, roteiro semanal |
| `content-coach` | `.agents/skills/content-coach/SKILL.md` | Coaching do seu próprio conteúdo: lê tudo, entrevista, diagnostica vícios com exemplos reais, uma mudança |
| `arquivo-para-conteudo` | `.agents/skills/arquivo-para-conteudo/SKILL.md` | Arquivo → próximo trimestre: mapeia temas recorrentes, escolhe 10 peças fortes, remonta cada uma como família (thread + newsletter + 3 shorts) |
| `clarity-gate` | `.agents/skills/clarity-gate/SKILL.md` | Gate de clareza: avalia nível de leitura, reescreve acima da 5ª série, instala verificação permanente antes de publicar |
| `algoritmo-do-nicho` | `.agents/skills/algoritmo-do-nicho/SKILL.md` | Deep research do algoritmo no seu nicho: separa regras de mitos, playbook de 5 regras com prova, protocolo de teste — rodar por trimestre |

## Regras

- Só dados públicos; coleta semanal máx (cotas)
- Chave nunca vai ao browser — API /estado retorna só booleanos; `/api/validar-chave` testa sem persistir
- Falha por fonte não derruba coleta: vai em `snapshots.erros` (ou `dados.avisos` quando houve fallback)
- **Conteúdo é imutável, métrica é mutável**: transcript/thumb vão pra `conteudos` (dedup por
  `concorrente_id + fonte + chave`, nunca re-paga); seguidores/views vão pro snapshot
- Posts do Instagram têm data real (`createdAt` do AnyAPI `instagram.user_posts`) — a antiga
  limitação do TikHub (`taken_at` null) morreu na migração; vídeos do YouTube têm data aproximada
  (convertida de "3 weeks ago")
- Testes nunca chamam a AnyAPI: `fetch` é mockado com os schemas documentados no PLANO-V3.
  Requests reais só na verificação manual de uma fase.
