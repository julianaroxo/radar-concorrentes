import { describe, expect, it, vi, afterEach } from "vitest";
import { filtrarPorPeriodo, normalizarPeriodo, tempoRelativo } from "../lib/ui";

const emDias = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

describe("normalizarPeriodo", () => {
  it("aceita apenas os períodos conhecidos", () => {
    expect(normalizarPeriodo("7")).toBe("7");
    expect(normalizarPeriodo("30")).toBe("30");
    expect(normalizarPeriodo("90")).toBe("90");
  });

  it("cai em 'tudo' para qualquer coisa fora da lista", () => {
    expect(normalizarPeriodo(undefined)).toBe("tudo");
    expect(normalizarPeriodo("")).toBe("tudo");
    expect(normalizarPeriodo("365")).toBe("tudo");
    // querystring hostil não vira Number(p) aleatório no filtro
    expect(normalizarPeriodo("<script>")).toBe("tudo");
  });
});

describe("filtrarPorPeriodo", () => {
  const snaps = [
    { coletado_em: emDias(1) },
    { coletado_em: emDias(10) },
    { coletado_em: emDias(45) },
    { coletado_em: emDias(200) },
  ];

  it("'tudo' devolve a lista inteira sem filtrar", () => {
    expect(filtrarPorPeriodo(snaps, "tudo")).toHaveLength(4);
  });

  it("corta pelo número de dias do período", () => {
    expect(filtrarPorPeriodo(snaps, "7")).toHaveLength(1);
    expect(filtrarPorPeriodo(snaps, "30")).toHaveLength(2);
    expect(filtrarPorPeriodo(snaps, "90")).toHaveLength(3);
  });

  it("não muta o array de entrada", () => {
    const original = [...snaps];
    filtrarPorPeriodo(snaps, "7");
    expect(snaps).toEqual(original);
  });
});

describe("tempoRelativo", () => {
  afterEach(() => vi.useRealTimers());

  it("descreve as três faixas em pt-BR", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-07T12:00:00Z"));
    expect(tempoRelativo("2026-09-07T11:40:00Z")).toBe("há menos de 1h");
    expect(tempoRelativo("2026-09-07T07:00:00Z")).toBe("há 5h");
    expect(tempoRelativo("2026-09-04T12:00:00Z")).toBe("há 3 dias");
  });
});
