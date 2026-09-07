import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- fake do Supabase (a camada de conteúdo grava em `conteudos` + Storage) ---
const sb = vi.hoisted(() => {
  const inseridos: any[] = [];
  let existentes: any[] = [];
  let erroInsert: { message: string } | null = null;
  const uploads: string[] = [];

  return {
    inseridos,
    uploads,
    setExistentes: (v: any[]) => (existentes = v),
    setErroInsert: (v: { message: string } | null) => (erroInsert = v),
    reset: () => {
      inseridos.length = 0;
      uploads.length = 0;
      existentes = [];
      erroInsert = null;
    },
    client: {
      from: () => ({
        select: () => ({ eq: async () => ({ data: existentes }) }),
        insert: async (row: any) => {
          if (erroInsert) return { error: erroInsert };
          inseridos.push(row);
          return { error: null };
        },
      }),
      storage: {
        createBucket: async () => ({}),
        from: () => ({
          upload: async (path: string) => {
            uploads.push(path);
            return { error: null };
          },
        }),
      },
    },
  };
});

vi.mock("../lib/supabase", () => ({ supabaseServer: () => sb.client }));

import { buscarTranscript, buscarTranscriptAd, garantirConteudo } from "../lib/conteudo";

const ok = (data: unknown, costUsd = 0.002) =>
  new Response(JSON.stringify({ output: { data }, costUsd }), { status: 200 });

let respostas: Record<string, () => Response> = {};

beforeEach(() => {
  sb.reset();
  respostas = {};
  process.env.ANYAPI_KEY = "chave-de-teste";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: any) => {
      const url = String(input);
      const slug = url.startsWith("https://api.getanyapi.com/v1/run/")
        ? url.split("/v1/run/")[1].split("?")[0]
        : url;
      const fn = respostas[slug];
      if (!fn) throw new Error(`sem fixture: ${slug}`);
      return fn();
    })
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("buscarTranscript — Instagram", () => {
  it("concatena transcripts[].text num texto só", async () => {
    respostas["instagram.media_transcript"] = () =>
      ok({ transcripts: [{ text: "bom dia" }, { text: "hoje eu trago" }] });

    const r = await buscarTranscript("instagram", "https://www.instagram.com/reel/X/");
    expect(r.transcript).toBe("bom dia hoje eu trago");
    expect(r.segmentos).toBeNull();
    expect(r.custoUsd).toBe(0.002);
  });

  it("devolve string vazia quando não há transcript, em vez de quebrar", async () => {
    respostas["instagram.media_transcript"] = () => ok({});
    const r = await buscarTranscript("instagram", "https://www.instagram.com/reel/X/");
    expect(r.transcript).toBe("");
  });
});

describe("buscarTranscript — YouTube", () => {
  // data.transcript vem como STRING JSON-encoded: precisa de parse duplo (PLANO-V3.md)
  it("faz o parse duplo e devolve segmentos + texto", async () => {
    const segmentos = [
      { text: "primeira parte", startMs: 0, endMs: 1200, startTimeText: "0:00" },
      { text: "segunda parte", startMs: 1200, endMs: 2400, startTimeText: "0:01" },
    ];
    respostas["youtube.video_transcript"] = () => ok({ transcript: JSON.stringify(segmentos) });

    const r = await buscarTranscript("youtube", "https://www.youtube.com/watch?v=abc");
    expect(r.transcript).toBe("primeira parte segunda parte");
    expect(r.segmentos).toHaveLength(2);
    expect(r.segmentos![0]).toMatchObject({ startTimeText: "0:00" });
  });

  it("aceita também o array já desserializado", async () => {
    respostas["youtube.video_transcript"] = () => ok({ transcript: [{ text: "já é array" }] });
    const r = await buscarTranscript("youtube", "https://www.youtube.com/watch?v=abc");
    expect(r.transcript).toBe("já é array");
  });

  it("JSON malformado não lança — devolve transcript vazio", async () => {
    respostas["youtube.video_transcript"] = () => ok({ transcript: "{isso não é json" });
    const r = await buscarTranscript("youtube", "https://www.youtube.com/watch?v=abc");
    expect(r.transcript).toBe("");
    expect(r.segmentos).toEqual([]);
  });
});

describe("buscarTranscriptAd — guarda contra transcript-lixo", () => {
  it("aceita transcript de verdade", async () => {
    const real = "assine hoje e receba o primeiro pacote de café em casa sem frete";
    respostas["facebook.ad_transcript"] = () => ok({ transcript: real, transcriptAvailable: true });
    expect((await buscarTranscriptAd("ad1")).transcript).toBe(real);
  });

  it.each([
    ["placeholder do provider", "Please provide the video you want transcribed."],
    ["recusa do modelo", "I cannot transcribe this video without the audio file."],
    ["curto demais", "ok"],
    ["vazio", ""],
  ])("descarta %s mesmo com transcriptAvailable=true", async (_caso, texto) => {
    respostas["facebook.ad_transcript"] = () => ok({ transcript: texto, transcriptAvailable: true });
    expect((await buscarTranscriptAd("ad1")).transcript).toBeNull();
  });
});

describe("garantirConteudo — dedup e resiliência", () => {
  it("pula o que já existe e só paga pelo item novo", async () => {
    sb.setExistentes([{ fonte: "instagram", chave: "ABC123" }]);
    respostas["instagram.media_transcript"] = () => ok({ transcripts: [{ text: "novo" }] });

    const r = await garantirConteudo("c1", [
      { fonte: "instagram", chave: "ABC123", url: "https://www.instagram.com/reel/ABC123/" },
      { fonte: "instagram", chave: "NOVO99", url: "https://www.instagram.com/reel/NOVO99/" },
    ]);

    expect(r.inseridos).toBe(1);
    expect(sb.inseridos.map((i) => i.chave)).toEqual(["NOVO99"]);
    expect((globalThis.fetch as any).mock.calls).toHaveLength(1);
  });

  it("dedup é por (fonte, chave) — mesma chave em fontes diferentes não colide", async () => {
    sb.setExistentes([{ fonte: "youtube", chave: "xyz" }]);
    respostas["instagram.media_transcript"] = () => ok({ transcripts: [{ text: "t" }] });

    const r = await garantirConteudo("c1", [{ fonte: "instagram", chave: "xyz", url: "https://ig/reel/xyz/" }]);
    expect(r.inseridos).toBe(1);
  });

  it("falha de transcript não derruba o item — a linha é gravada sem transcript", async () => {
    respostas["youtube.video_transcript"] = () => new Response("boom", { status: 400 });

    const r = await garantirConteudo("c1", [
      { fonte: "youtube", chave: "vid1", url: "https://www.youtube.com/watch?v=vid1", tituloOuLegenda: "T" },
    ]);

    expect(r.inseridos).toBe(1);
    expect(r.erros).toEqual([]);
    expect(sb.inseridos[0]).toMatchObject({ chave: "vid1", transcript: null, titulo_ou_legenda: "T" });
  });

  it("grava a linha do ad mesmo com transcript nulo, para nunca re-pagar o mesmo ad", async () => {
    respostas["facebook.ad_transcript"] = () => ok({ transcript: "please provide the video" });

    const r = await garantirConteudo("c1", [{ fonte: "ads", chave: "ad1" }]);
    expect(r.inseridos).toBe(1);
    expect(sb.inseridos[0]).toMatchObject({ fonte: "ads", chave: "ad1", transcript: null });
  });

  it("falha de thumb não derruba o item — grava com thumb_path null", async () => {
    respostas["instagram.media_transcript"] = () => ok({ transcripts: [{ text: "t" }] });
    respostas["https://cdn.instagram.com/expirada.jpg"] = () => new Response("gone", { status: 403 });

    const r = await garantirConteudo("c1", [
      {
        fonte: "instagram",
        chave: "ABC",
        url: "https://ig/reel/ABC/",
        thumbUrl: "https://cdn.instagram.com/expirada.jpg",
      },
    ]);

    expect(r.inseridos).toBe(1);
    expect(sb.inseridos[0].thumb_path).toBeNull();
  });

  it("salva a thumb no Storage como <chave>.jpg quando o download funciona", async () => {
    respostas["instagram.media_transcript"] = () => ok({ transcripts: [{ text: "t" }] });
    respostas["https://cdn.instagram.com/ok.jpg"] = () => new Response("bytes", { status: 200 });

    await garantirConteudo("c1", [
      { fonte: "instagram", chave: "ABC", url: "https://ig/reel/ABC/", thumbUrl: "https://cdn.instagram.com/ok.jpg" },
    ]);

    expect(sb.uploads).toEqual(["ABC.jpg"]);
    expect(sb.inseridos[0].thumb_path).toBe("ABC.jpg");
  });

  it("erro do banco vira item em `erros`, sem contar como inserido", async () => {
    sb.setErroInsert({ message: "duplicate key" });
    respostas["instagram.media_transcript"] = () => ok({ transcripts: [{ text: "t" }] });

    const r = await garantirConteudo("c1", [{ fonte: "instagram", chave: "ABC", url: "https://ig/reel/ABC/" }]);
    expect(r.inseridos).toBe(0);
    expect(r.erros).toEqual([{ chave: "ABC", motivo: "duplicate key" }]);
  });
});
