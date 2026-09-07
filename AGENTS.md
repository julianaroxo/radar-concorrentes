# Radar de Concorrentes — AGENTS.md

App Next.js + Supabase que coleta dados públicos de concorrentes (Instagram, YouTube, Meta Ads, site) via AnyAPI e guarda cada coleta como snapshot para acompanhar a evolução ao longo do tempo. Projeto de referência da Aula 6 do Clube Divos da IA.

## Comandos

```
npm run dev        # localhost:3000 (/setup/wizard no primeiro uso)
npm test           # vitest — sem rede, sem custo de API
npm run typecheck  # tsc --noEmit
npm run build      # NUNCA com o dev server aberto — corrompe .next
```

## Onde está o quê

| Path | Papel |
|------|-------|
| `app/` | Páginas: `/` visão geral, `/concorrentes`, `/concorrente/[id]`, `/tendencias`, `/ideias`, `/posicionamento`, `/metricas`, `/anuncios`, `/setup` + `/setup/wizard` |
| `app/api/` | `concorrentes`, `coletar`, `cron/coletar`, `conteudo`, `posicionamento`, `analise-hook`, `validar-chave`, `estado` |
| `lib/coleta.ts` | Coleta das 4 fontes via AnyAPI + fallback RSS do YouTube + soma de custo |
| `lib/conteudo.ts` | Transcript e thumb (`conteudos` + Storage), dedup por `concorrente_id + fonte + chave` |
| `lib/analise.ts` | Chamadas ao Claude (posicionamento, hooks), cache em `analises` |
| `tests/` | Vitest com `fetch` mockado — **nunca** chama a AnyAPI de verdade |
| `supabase/schema.sql` | `concorrentes`, `snapshots`, `conteudos`, `analises` + bucket `thumbs` |
| `PLANO-V3.md` | Contratos AnyAPI validados, custos por endpoint, decisões de arquitetura |

## Regras

- Só dados públicos; chave nunca vai ao browser (`/api/estado` retorna só booleanos)
- Falha de uma fonte não derruba a coleta: vai em `snapshots.erros` / `dados.avisos`
- Conteúdo é imutável (`conteudos`, nunca re-paga); métrica é mutável (`snapshots`)
- `ANTHROPIC_API_KEY` é opcional — páginas de IA degradam com instrução, não com erro
- Requests AnyAPI reais só em verificação manual, nunca em loop de desenvolvimento

## Skills da aluna

| Skill | Path | Quando usar |
|-------|------|-------------|
| `radar-setup` | `.agents/skills/radar-setup/SKILL.md` | First setup: onde pegar as 3 chaves, rodar schema.sql, testar via wizard, troubleshooting dos chips |
| `radar-coleta` | `.agents/skills/radar-coleta/SKILL.md` | Operar coleta com segurança: custo real, quando disparar manual, chips de erro, CRON_SECRET |
| `radar-analise` | `.agents/skills/radar-analise/SKILL.md` | Ler o radar: outliers /ideias, tendências, "O que mudou", posicionamento, roteiro semanal |
| `content-coach` | `.agents/skills/content-coach/SKILL.md` | Coaching do seu próprio conteúdo: lê tudo, entrevista, diagnostica vícios com exemplos reais, uma mudança |
| `arquivo-para-conteudo` | `.agents/skills/arquivo-para-conteudo/SKILL.md` | Arquivo → próximo trimestre: mapeia temas recorrentes, escolhe 10 peças fortes, remonta cada uma como família (thread + newsletter + 3 shorts) |
| `clarity-gate` | `.agents/skills/clarity-gate/SKILL.md` | Gate de clareza: avalia nível de leitura, reescreve acima da 5ª série, instala verificação permanente antes de publicar |
| `algoritmo-do-nicho` | `.agents/skills/algoritmo-do-nicho/SKILL.md` | Deep research do algoritmo no seu nicho: separa regras de mitos, playbook de 5 regras com prova, protocolo de teste — rodar por trimestre |
