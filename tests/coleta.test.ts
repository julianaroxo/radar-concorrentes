import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { coletarConcorrente, engajamentoMedio, humanizarErro } from "../lib/coleta";
import type { Concorrente } from "../lib/supabase";

// Envelope real da AnyAPI: {output:{data}, costUsd} — ver PLANO-V3.md Fase 1.
const ok = (data: unknown, costUsd: number) =>
  new Response(JSON.stringify({ output: { data }, costUsd }), { status: 200 });

const erro = (status: number, texto = "erro") => new Response(texto, { status });

// 2026-01-01T00:00:00Z em epoch-segundos, como user_posts devolve (string).
const EPOCH_2026 = "1767225600";

const FIXTURES: Record<string, () => Response> = {
  "instagram.profile": () =>
    ok(
      {
        displayName: "Café Já",
        followers: 12500,
        posts: 340,
        bio: "torra própria em SP",
        avatarUrl: "https://cdn.instagram.com/avatar.jpg",
        verified: true,
      },
      0.002
    ),
  "instagram.user_posts": () =>
    ok(
      [
        {
          id: "1",
          url: "https://www.instagram.com/p/ABC123/",
          caption: "novo blend",
          likes: 900,
          comments: 100,
          createdAt: EPOCH_2026,
        },
        {
          id: "2",
          url: "https://www.instagram.com/reel/XYZ789/",
          caption: "bastidores da torra",
          likes: 300,
          comments: 20,
          createdAt: EPOCH_2026,
        },
      ],
      0.002
    ),
  "instagram.post": () => ok({ type: "GraphVideo", views: 40000, thumbnailUrl: "https://cdn/t.jpg" }, 0.0033),
  "youtube.channel": () => ok({ subscribers: 8000, videos: 120, views: 900000, channelId: "UC" + "x".repeat(22) }, 0.002),
  "youtube.channel_videos": () =>
    ok([{ id: "vid1", title: "Como torrar em casa", views: 15000, publishedTime: "3 weeks ago" }], 0.002),
  "web.scrape": () => ok({ title: "Café Já", markdown: "# Café Já\nassinatura de café", description: "d" }, 0.0009),
  "facebook.company_ads": () =>
    ok(
      {
        ads: [
          { id: "ad1", pageName: "Café Já Torrefação", bodyText: "assine e receba", startDate: 1767225600 },
          { id: "ad2", pageName: "Padaria Sol", bodyText: "anúncio de outra empresa", startDate: 1767225600 },
        ],
      },
      0.002
    ),
};

// Overrides por slug para os testes de falha; o resto cai no fixture feliz.
let overrides: Record<string, () => Response> = {};
let chamadas: string[] = [];

function instalarFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: any) => {
      const url = String(input);
      if (url.startsWith("https://api.getanyapi.com/v1/run/")) {
        const slug = url.split("/v1/run/")[1].split("?")[0];
        chamadas.push(slug);
        const fn = overrides[slug] ?? FIXTURES[slug];
        if (!fn) throw new Error(`slug sem fixture no teste: ${slug}`);
        return fn();
      }
      chamadas.push(url);
      const fn = overrides[url];
      if (fn) return fn();
      throw new Error(`fetch não mockado: ${url}`);
    })
  );
}

const CONCORRENTE: Concorrente = {
  id: "c1",
  nome: "Café Já",
  instagram: "cafeja",
  youtube: "https://www.youtube.com/@cafeja",
  site: "https://cafeja.com.br",
  ads_query: "Café Já",
} as Concorrente;

beforeEach(() => {
  overrides = {};
  chamadas = [];
  process.env.ANYAPI_KEY = "chave-de-teste";
  instalarFetch();
});

afterEach(() => vi.unstubAllGlobals());

describe("coletarConcorrente — caminho feliz", () => {
  it("normaliza perfil, posts, vídeos, site e ads sem erro", async () => {
    const { dados, erros } = await coletarConcorrente(CONCORRENTE);

    expect(erros).toEqual({});
    expect(dados.perfil).toMatchObject({ username: "cafeja", seguidores: 12500, totalPosts: 340 });
    expect(dados.canal).toMatchObject({ inscritos: 8000 });
    expect(dados.site).toMatchObject({ titulo: "Café Já" });
    expect(dados.videos?.[0]).toMatchObject({ titulo: "Como torrar em casa", views: 15000 });
  });

  it("extrai o code do post da URL, inclusive de /reel/", async () => {
    const { dados } = await coletarConcorrente(CONCORRENTE);
    expect(dados.posts?.map((p) => p.code)).toEqual(["ABC123", "XYZ789"]);
  });

  it("converte createdAt (epoch em segundos) para ISO — data real, não null", async () => {
    const { dados } = await coletarConcorrente(CONCORRENTE);
    expect(dados.posts?.[0].data).toBe("2026-01-01T00:00:00.000Z");
  });

  it("enriquece os top posts com tipo, views e thumb via instagram.post", async () => {
    const { dados } = await coletarConcorrente(CONCORRENTE);
    const post = dados.posts?.find((p) => p.code === "ABC123");
    expect(post).toMatchObject({ tipo: "video", views: 40000, thumb: "https://cdn/t.jpg" });
  });

  it("converte publishedTime relativo ('3 weeks ago') em data aproximada", async () => {
    const { dados } = await coletarConcorrente(CONCORRENTE);
    const dias = (Date.now() - Date.parse(dados.videos![0].data!)) / 86400000;
    expect(dias).toBeGreaterThan(20);
    expect(dias).toBeLessThan(22);
  });

  it("soma o costUsd de todas as chamadas em dados.custo_usd", async () => {
    const { dados } = await coletarConcorrente(CONCORRENTE);
    // profile .002 + user_posts .002 + 2×post .0033 + channel .002
    // + channel_videos .002 + scrape .0009 + ads .002
    expect(dados.custo_usd).toBeCloseTo(0.0175, 6);
  });
});

describe("coletarConcorrente — filtro de ads por nome da página", () => {
  it("mantém a página que casa ignorando acento e caixa, descarta a de terceiro", async () => {
    const { dados } = await coletarConcorrente(CONCORRENTE);
    expect(dados.ads?.map((a) => a.id)).toEqual(["ad1"]);
  });

  it("converte startDate epoch em data ISO curta e monta link da Ad Library", async () => {
    const { dados } = await coletarConcorrente(CONCORRENTE);
    expect(dados.ads?.[0]).toMatchObject({
      ativoDesde: "2026-01-01",
      link: "https://www.facebook.com/ads/library/?id=ad1",
    });
  });
});

describe("coletarConcorrente — isolamento de falhas", () => {
  it("falha de uma fonte não derruba as outras: vai para `erros`", async () => {
    overrides["web.scrape"] = () => erro(400, "url inválida (no charge)");
    const { dados, erros } = await coletarConcorrente(CONCORRENTE);

    expect(erros.site).toMatch(/HTTP 400/);
    expect(erros.instagram).toBeUndefined();
    expect(dados.perfil).toBeDefined();
    expect(dados.ads).toBeDefined();
  });

  it("não re-tenta HTTP 400 (input inválido é 'no charge', retry só queima tempo)", async () => {
    overrides["web.scrape"] = () => erro(400);
    await coletarConcorrente(CONCORRENTE);
    expect(chamadas.filter((c) => c === "web.scrape")).toHaveLength(1);
  });

  it("coleta apenas as fontes preenchidas no cadastro", async () => {
    const soIg = { ...CONCORRENTE, youtube: null, site: null, ads_query: null } as Concorrente;
    const { dados } = await coletarConcorrente(soIg);

    expect(dados.perfil).toBeDefined();
    expect(dados.videos).toBeUndefined();
    expect(dados.site).toBeUndefined();
    expect(chamadas).not.toContain("web.scrape");
  });

  it("cai no RSS oficial do YouTube quando a AnyAPI recusa, e avisa no snapshot", async () => {
    overrides["youtube.channel"] = () => erro(401, "chave inválida");
    overrides["https://www.youtube.com/feeds/videos.xml?channel_id=UC" + "y".repeat(22)] = () =>
      new Response(
        `<feed><entry><title>Vídeo via RSS</title><yt:videoId>abc</yt:videoId>
         <published>2026-01-01T00:00:00+00:00</published>
         <media:statistics views="4242"/></entry></feed>`,
        { status: 200 }
      );

    const comId = { ...CONCORRENTE, youtube: "https://www.youtube.com/channel/UC" + "y".repeat(22) } as Concorrente;
    const { dados, erros } = await coletarConcorrente(comId);

    expect(erros.youtube).toBeUndefined();
    expect(dados.avisos?.youtube).toMatch(/fallback RSS/);
    expect(dados.videos?.[0]).toMatchObject({ titulo: "Vídeo via RSS", views: 4242 });
  });
});

describe("humanizarErro", () => {
  it("traduz os erros que a aluna vê nos chips", () => {
    expect(humanizarErro("HTTP 401: unauthorized")).toMatch(/chave de API inválida/);
    expect(humanizarErro("HTTP 429: slow down")).toMatch(/limite de requisições/);
    expect(humanizarErro("insufficient credits")).toMatch(/créditos da AnyAPI/);
    expect(humanizarErro("TimeoutError: signal timed out")).toMatch(/demorou demais/);
    expect(humanizarErro("HTTP 400: bad handle")).toMatch(/confira handle\/URL/);
  });

  it("trunca mensagens desconhecidas em vez de vazar stack no dashboard", () => {
    expect(humanizarErro("x".repeat(500))).toHaveLength(120);
  });
});

describe("engajamentoMedio", () => {
  it("soma likes + comentários e divide pelo número de posts", () => {
    expect(engajamentoMedio([{ likes: 10, comentarios: 5 }, { likes: 20, comentarios: 5 }] as any)).toBe(20);
  });

  it("devolve null sem posts — não divide por zero", () => {
    expect(engajamentoMedio([])).toBeNull();
    expect(engajamentoMedio(undefined)).toBeNull();
  });
});
