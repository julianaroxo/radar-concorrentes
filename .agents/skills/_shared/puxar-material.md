# Como puxar seu material do Radar

> Requer o Supabase MCP conectado ao mesmo projeto do Radar (as credenciais
> configuradas em `radar-setup`) — sem isso o LLM não consegue consultar o
> banco e a Opção A não funciona.

**Opção A — cadastrar seu próprio perfil no radar:**
1. Abra `/setup` → clique em "Adicionar concorrente"
2. Coloque seu próprio usuário do Instagram e/ou canal do YouTube
3. Clique em "Coletar agora" — o radar vai buscar seus últimos posts e vídeos
4. Peça ao LLM: "puxe meus últimos 20 conteúdos da tabela `conteudos` onde o `concorrente_id` for o meu"

**Opção B — export manual:**
- Baixe seus posts/vídeos como arquivo de texto, pasta ou link
- Cole o caminho ou os textos direto na conversa com o LLM
