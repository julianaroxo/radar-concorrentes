---
name: clarity-gate
description: Use antes de a aluna publicar página de vendas, email, legenda, bio ou anúncio — quando o texto parece difícil, cheio de jargão, ou ela quer garantir que uma criança de ~10 anos entenderia.
---

# clarity-gate — Gate de Clareza do Funil

Use antes de publicar qualquer página, email, legenda ou anúncio. Palavras difíceis não convencem — confundem. Texto simples vende mais.

> **Régua PT-BR:** "5ª série" = texto que uma criança de ~10 anos consegue ler sem travar. Frases curtas, palavras do dia a dia, sem jargão. Simples não significa sem personalidade.

## O que passar pelo gate

- Páginas de vendas e landing pages
- Emails e sequências de nutrição
- Legendas de posts e anúncios
- Bio e descrição de perfis

## Workflow (4 passos + checklist reaplicável)

0. **Se nada foi colado ou apontado** — o LLM pergunta qual peça revisar. Nunca infere ou inventa o texto a partir do contexto da conversa.
1. **Ler e classificar** — o LLM lê cada peça e dá uma nota de nível de leitura. Monta a lista: cada peça, sua nota, piores primeiro.
2. **Reescrever o que passou da linha** — tudo acima da 5ª série vira texto simples. A oferta, as afirmações e a sua voz ficam; o jargão, as frases longas e as palavras "chiques" que só confundem saem. Palavra "chique" que sinaliza expertise ou justifica preço (vocabulário técnico que mostra autoridade) não é trocada por trocar — preserva-se com uma explicação simples ao lado, em vez de nivelar por baixo. Mostrar antes e depois de cada peça.
3. **Onde não dá para simplificar** — se uma frase precisa ser técnica, coloca a versão em palavras simples logo ao lado, em vez de "simplificar e perder o significado".
4. **Reconfirmar** — relê o funil reescrito e confirma que tudo passou. Simples não é a mesma coisa que original: mesmo que a nota de leitura esteja ok (inclusive um texto que já chegou simples, sem precisar de reescrita), o LLM sinaliza se a peça cai em bordão comum do nicho de decoração (ex: "lar cheio de alma", "cantinho especial", "comenta aqui embaixo") — clareza não é desculpa para clichê.

**Checklist reaplicável:** este é um checklist para rodar em cada peça nova antes de publicar — não um bloqueio automático. Ele só entra em ação quando esta skill for chamada de novo, ou quando outra skill que produz copy final (`content-strategist-decor`, `workflow-producao-conteudo`, `arquivo-para-conteudo`) incluir esse passo no próprio fluxo. Se você quiser um lembrete automático de verdade a cada nova peça, isso é configuração de automação (hooks) — peça à skill `update-config`.

## Regras

- Simples não é sem graça. A oferta continua afiada — as palavras ficam menores.
- Se uma reescrita perde significado, o LLM sinaliza em vez de publicar assim mesmo.
- Dica: passe primeiro sua peça de melhor performance pelo gate. Se até ela não passar, é prova de que o resto do funil precisa do tratamento.

## Sem dados do radar

Essa skill não usa dados do Supabase — ela age diretamente sobre textos que você cola ou aponta na conversa.

## Referência

Prompt original em inglês: `references/prompt-original.md`
