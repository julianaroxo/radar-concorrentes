---
name: arquivo-para-conteudo
description: Use quando a aluna quer gerar pauta nova a partir do que já publicou, está sem ideias, ou quer reaproveitar o arquivo de conteúdo sem começar do zero.
---

# arquivo-para-conteudo — Arquivo → Próximo Trimestre

Use quando quiser aproveitar tudo que já publicou para gerar conteúdo novo sem partir do zero. O LLM mapeia o que você já disse, escolhe o que ainda tem valor e reconstrói na sua voz, sem inventar nada.

## Como puxar o seu material

O radar já coleta posts, legendas e transcripts de quem está cadastrado como concorrente. Cadastre seu próprio perfil e o app faz a coleta automaticamente.

**Opção A — usar o radar:**
1. Abra `/setup` → adicione seu perfil (Instagram e/ou YouTube)
2. Clique em "Coletar agora"
3. Peça ao LLM: "liste meus conteúdos da tabela `conteudos` com `titulo_ou_legenda` e `transcript`, ordenados por data"

O radar já coleta o que é público — sem precisar de ferramenta externa. Se a coleta vier vazia, o LLM verifica `snapshots.erros` antes de prosseguir e avisa qual fonte falhou, em vez de seguir como se não houvesse material.

**Opção B — export manual:**
- Exporte seus posts/vídeos como arquivo de texto ou pasta
- Cole na conversa com o LLM

## Workflow (5 passos)

1. **Montar o índice** — cada peça com tema, formato e performance quando disponível (likes, views, saves)
2. **Mapear os temas recorrentes** — com que frequência você volta a cada tema, quais peças o carregaram melhor, o que você dizia antes que já não diz
3. **Escolher as 10 mais fortes** — as que a ideia central ainda vale hoje **e** ainda são distintas, não só as que mais performaram; o LLM explica por que cada uma entrou. Se as peças de melhor performance forem também as mais genéricas do nicho (formato replicável por qualquer conta de decoração), o LLM sinaliza antes de remontar — não amplifica automaticamente o que só funcionou por ser fórmula do algoritmo. Se houver menos de 10 peças que passem no critério, a lista sai menor — nunca completa a cota sacrificando o critério de força.
4. **Remontar como família de conteúdo** — cada uma vira: uma thread, uma seção de newsletter e 3 roteiros curtos, todos do mesmo núcleo para chegarem como irmãos, não como repetição
5. **Calendário** — qual família sai em qual semana e para onde cada peça aponta. Antes de colocar qualquer peça remontada no calendário, ela passa pelo teste de leitura de "5ª série" (ver `clarity-gate`) — fidelidade à voz original não é desculpa para manter jargão que já travava a peça na publicação original.

## Regras

- Sua voz, suas posições. Se uma peça antiga contradiz o que você diz hoje, o LLM sinaliza em vez de modernizar sem avisar.
- Nada inventado: cada peça nova precisa rastrear algo que você realmente fez.
- Leia o mapa de temas mesmo que não remonte nada — ele mostra do que sua marca é realmente feita.
- Antes de escolher uma peça pela força, cheque rapidamente se o ângulo virou padrão do nicho desde a publicação original — se sim, remonte com uma virada nova ou descarte, em vez de reciclar o que já é lugar-comum.

## Referência

Prompt original em inglês: `references/prompt-original.md`
