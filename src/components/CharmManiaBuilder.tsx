import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Bead, Charm, Color, Produto, ProdutoCorDb, CharmManiaConfig } from "@/types";

const formatarMoeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Pequena bolinha mostrando a cor de verdade (quando a cor tem hex cadastrado) ao lado do
// nome — sem isso, a única forma de saber qual cor está selecionada era ler o texto.
function SwatchCor({ hex }: { hex: string | null | undefined }) {
  if (!hex) return null;
  return (
    <span
      aria-hidden="true"
      className="inline-block w-3 h-3 rounded-full border border-navy/10 shrink-0"
      style={{ backgroundColor: hex }}
    />
  );
}

interface CharmManiaBuilderProps {
  produto: Produto & { product_colors?: ProdutoCorDb[] };
  charms: Charm[];
  caixinha: (Produto & { product_colors?: ProdutoCorDb[] }) | null;
  coresLetraDisponiveis: Color[];
  onAdicionar: (config: CharmManiaConfig, precoTotal: number) => void;
}

export function CharmManiaBuilder({
  produto,
  charms,
  caixinha,
  coresLetraDisponiveis,
  onAdicionar,
}: CharmManiaBuilderProps) {
  const [sequencia, setSequencia] = useState<Bead[]>([]);
  const [caixinhaSelecionada, setCaixinhaSelecionada] = useState(false);
  const [caixinhaCor, setCaixinhaCor] = useState("");
  const [cordaoCor, setCordaoCor] = useState("");
  const [corAtiva, setCorAtiva] = useState("");
  const [corPorPingente, setCorPorPingente] = useState<Record<string, string>>({});
  const [letra, setLetra] = useState("");
  const letraInputRef = useRef<HTMLInputElement>(null);

  const valorLetra = produto.valor_letra ?? 0;
  const limiteContas = produto.limite_contas;
  const limiteAtingido = limiteContas != null && sequencia.length >= limiteContas;

  const coresCaixinha = useMemo(
    () =>
      (caixinha?.product_colors ?? [])
        .map((pc) => pc.colors)
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [caixinha]
  );

  const coresCordao = useMemo(
    () =>
      (produto.product_colors ?? [])
        .map((pc) => pc.colors)
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [produto]
  );

  const hexPorNomeLetra = useMemo(
    () => new Map(coresLetraDisponiveis.map((c) => [c.nome, c.hex])),
    [coresLetraDisponiveis]
  );

  const coresPorPingente = useMemo(() => {
    const mapa = new Map<string, Color[]>();
    for (const charm of charms) {
      const cores = (charm.charm_colors ?? [])
        .map((cc) => cc.colors)
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      mapa.set(charm.id, cores);
    }
    return mapa;
  }, [charms]);

  useEffect(() => {
    if (coresCaixinha.length > 0 && !coresCaixinha.some((c) => c.nome === caixinhaCor)) {
      setCaixinhaCor(coresCaixinha[0].nome);
    }
  }, [coresCaixinha, caixinhaCor]);

  useEffect(() => {
    if (coresCordao.length > 0 && !coresCordao.some((c) => c.nome === cordaoCor)) {
      setCordaoCor(coresCordao[0].nome);
    }
  }, [coresCordao, cordaoCor]);

  useEffect(() => {
    if (coresLetraDisponiveis.length > 0 && !coresLetraDisponiveis.some((c) => c.nome === corAtiva)) {
      setCorAtiva(coresLetraDisponiveis[0].nome);
    }
  }, [coresLetraDisponiveis, corAtiva]);

  useEffect(() => {
    setCorPorPingente((prev) => {
      const proximo = { ...prev };
      let mudou = false;
      for (const charm of charms) {
        const cores = coresPorPingente.get(charm.id) ?? [];
        if (cores.length > 0 && !cores.some((c) => c.nome === proximo[charm.id])) {
          proximo[charm.id] = cores[0].nome;
          mudou = true;
        }
      }
      return mudou ? proximo : prev;
    });
  }, [charms, coresPorPingente]);

  // No máximo 2 cores de letra distintas por peça — uma vez que 2 já foram usadas na
  // sequência, só se pode trocar a "cor ativa" entre essas 2 (não pra uma terceira).
  const coresLetraUsadas = useMemo(() => {
    const usadas = new Set<string>();
    for (const conta of sequencia) {
      if (conta.tipo === "letra" && conta.cor) usadas.add(conta.cor);
    }
    return usadas;
  }, [sequencia]);

  const contagemPorPingente = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const conta of sequencia) {
      if (conta.tipo === "pingente") {
        mapa.set(conta.charmId, (mapa.get(conta.charmId) ?? 0) + 1);
      }
    }
    return mapa;
  }, [sequencia]);

  const totalLetras = sequencia.filter((c) => c.tipo === "letra").length;

  const pingentesEscolhidos = useMemo(() => {
    return sequencia
      .filter((c): c is { tipo: "pingente"; charmId: string; cor?: string | null } => c.tipo === "pingente")
      .map((c) => {
        const charm = charms.find((charm) => charm.id === c.charmId);
        return charm ? { charm, cor: c.cor ?? null } : null;
      })
      .filter((c): c is { charm: Charm; cor: string | null } => Boolean(c));
  }, [sequencia, charms]);

  const totalPingentes = pingentesEscolhidos.reduce((soma, c) => soma + c.charm.preco, 0);
  const totalCaixinha = caixinhaSelecionada && caixinha ? caixinha.preco : 0;
  const total = produto.preco + totalLetras * valorLetra + totalPingentes + totalCaixinha;

  const adicionarLetra = (valor: string) => {
    if (!valor || limiteAtingido) return;
    setSequencia((prev) => [...prev, { tipo: "letra", valor, cor: corAtiva || null }]);
  };

  const handleLetraChange = (novoValor: string) => {
    if (novoValor.length > letra.length) {
      if (limiteAtingido) return;
      const novoCaractere = novoValor.slice(-1);
      adicionarLetra(novoCaractere);
      setLetra("");
    } else {
      setLetra(novoValor);
    }
  };

  const handleLetraKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && letra === "") {
      event.preventDefault();
      setSequencia((prev) => prev.slice(0, -1));
    }
  };

  const adicionarPingente = (charm: Charm) => {
    if (limiteAtingido) return;
    const cor = corPorPingente[charm.id] ?? null;
    setSequencia((prev) => [...prev, { tipo: "pingente", charmId: charm.id, cor }]);
    // Mantém o foco no campo de letra, pra dar pra continuar digitando a palavra sem
    // precisar clicar de novo — clicar num pingente-botão tira o foco do input.
    letraInputRef.current?.focus();
  };

  const removerConta = (index: number) => {
    setSequencia((prev) => prev.filter((_, i) => i !== index));
  };

  const nomeDoPingente = (charmId: string) => charms.find((c) => c.id === charmId)?.nome ?? "Pingente";

  return (
    <div>
      <p className="label-caps text-navy/70 mb-3">Monte sua peça</p>

      {coresCordao.length > 0 && (
        <div className="mb-4 max-w-[200px]">
          <Label htmlFor="charm-mania-cor-cordao">Cor do cordão</Label>
          <div className="flex items-center gap-2">
            <SwatchCor hex={coresCordao.find((c) => c.nome === cordaoCor)?.hex} />
            <Select
              id="charm-mania-cor-cordao"
              value={cordaoCor}
              onChange={(e) => setCordaoCor(e.target.value)}
              className="flex-1"
            >
              {coresCordao.map((cor) => (
                <option key={cor.nome} value={cor.nome}>
                  {cor.nome}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 min-h-[3rem] items-center border border-neutral-light rounded-xl px-4 py-3 mb-4">
        {sequencia.length === 0 ? (
          <span className="text-navy/40 text-sm">Digite uma palavra e escolha pingentes abaixo</span>
        ) : (
          sequencia.map((conta, index) => {
            const hexLetra = conta.tipo === "letra" && conta.cor ? hexPorNomeLetra.get(conta.cor) : null;
            const titulo = conta.cor ? `Remover (cor: ${conta.cor})` : "Remover";
            return (
              <button
                key={index}
                type="button"
                onClick={() => removerConta(index)}
                title={titulo}
                style={hexLetra ? { backgroundColor: hexLetra } : undefined}
                className={
                  conta.tipo === "letra"
                    ? `w-9 h-9 flex items-center justify-center rounded-full font-display text-sm uppercase border transition-opacity hover:opacity-80 ${
                        hexLetra ? "border-navy/15 text-navy" : "bg-navy text-cream-light border-transparent"
                      }`
                    : "px-3 h-9 flex items-center justify-center rounded-full bg-cream-light border border-magenta text-magenta text-xs hover:bg-magenta hover:text-cream-light transition-colors"
                }
              >
                {conta.tipo === "letra" ? conta.valor : nomeDoPingente(conta.charmId)}
              </button>
            );
          })
        )}
      </div>

      {coresLetraDisponiveis.length > 0 && (
        <div className="mb-4">
          <p className="label-caps text-navy/70 mb-2">Cor ativa da letra</p>
          <div className="flex flex-wrap gap-2">
            {coresLetraDisponiveis.map((cor) => {
              const bloqueada = coresLetraUsadas.size >= 2 && !coresLetraUsadas.has(cor.nome) && cor.nome !== corAtiva;
              return (
                <button
                  key={cor.nome}
                  type="button"
                  disabled={bloqueada}
                  onClick={() => setCorAtiva(cor.nome)}
                  className={`label-caps flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                    corAtiva === cor.nome
                      ? "border-magenta text-magenta"
                      : "border-neutral-light text-navy/70 hover:border-magenta hover:text-magenta"
                  }`}
                >
                  <SwatchCor hex={cor.hex} />
                  {cor.nome}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-navy/50 mt-2">
            Toda letra digitada sai nesta cor. Máximo de 2 cores por peça
            {coresLetraUsadas.size > 0 && ` (em uso: ${Array.from(coresLetraUsadas).join(", ")})`}.
          </p>
        </div>
      )}

      <div className="mb-6">
        <Label htmlFor="charm-mania-letra">Adicionar letra</Label>
        <input
          id="charm-mania-letra"
          ref={letraInputRef}
          value={letra}
          onChange={(e) => handleLetraChange(e.target.value)}
          onKeyDown={handleLetraKeyDown}
          disabled={limiteAtingido}
          placeholder="Digite uma letra por vez..."
          className="w-full bg-transparent border-b border-neutral-light py-2 text-navy focus:outline-none focus:border-magenta disabled:opacity-50"
        />
        {limiteAtingido && (
          <p className="text-xs text-navy/50 mt-2">
            Limite de {limiteContas} contas atingido — remova alguma para adicionar outra.
          </p>
        )}
      </div>

      {charms.length > 0 && (
        <div className="mb-6">
          <p className="label-caps text-navy/70 mb-3">Pingentes</p>
          <div className="flex flex-wrap gap-3">
            {charms.map((charm) => {
              const usados = contagemPorPingente.get(charm.id) ?? 0;
              const esgotado = usados >= charm.estoque;
              const coresCharm = coresPorPingente.get(charm.id) ?? [];
              const corSelecionada = corPorPingente[charm.id];
              return (
                <div key={charm.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={esgotado || limiteAtingido}
                    onClick={() => adicionarPingente(charm)}
                    className="label-caps rounded-full border border-neutral-light px-4 py-2 text-navy/70 hover:border-magenta hover:text-magenta transition-colors disabled:opacity-30 disabled:hover:border-neutral-light disabled:hover:text-navy/70 disabled:cursor-not-allowed"
                  >
                    {charm.nome} · {formatarMoeda(charm.preco)}
                  </button>
                  {coresCharm.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <SwatchCor hex={coresCharm.find((c) => c.nome === corSelecionada)?.hex} />
                      <Select
                        aria-label={`Cor de ${charm.nome}`}
                        value={corSelecionada ?? ""}
                        onChange={(e) =>
                          setCorPorPingente((prev) => ({ ...prev, [charm.id]: e.target.value }))
                        }
                        className="text-xs py-1.5"
                      >
                        {coresCharm.map((cor) => (
                          <option key={cor.nome} value={cor.nome}>
                            {cor.nome}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {caixinha && (
        <div className="mb-6">
          <label className="flex items-center gap-3 text-navy">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={caixinhaSelecionada}
              disabled={caixinha.stock <= 0}
              onChange={(e) => setCaixinhaSelecionada(e.target.checked)}
            />
            <span className="label-caps">
              Incluir caixinha (+{formatarMoeda(caixinha.preco)}){caixinha.stock <= 0 ? " — sem estoque" : ""}
            </span>
          </label>
          {caixinhaSelecionada && coresCaixinha.length > 0 && (
            <div className="mt-3 max-w-[200px]">
              <Label htmlFor="charm-mania-cor-caixinha">Cor da caixinha</Label>
              <div className="flex items-center gap-2">
                <SwatchCor hex={coresCaixinha.find((c) => c.nome === caixinhaCor)?.hex} />
                <Select
                  id="charm-mania-cor-caixinha"
                  value={caixinhaCor}
                  onChange={(e) => setCaixinhaCor(e.target.value)}
                  className="flex-1"
                >
                  {coresCaixinha.map((cor) => (
                    <option key={cor.nome} value={cor.nome}>
                      {cor.nome}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="border border-neutral-light rounded-xl px-5 py-4 mb-6 text-sm">
        <div className="flex items-center justify-between text-navy/70 py-1">
          <span>Base{coresCordao.length > 0 && cordaoCor ? ` (${cordaoCor})` : ""}</span>
          <span>{formatarMoeda(produto.preco)}</span>
        </div>
        {totalLetras > 0 && (
          <div className="flex items-center justify-between text-navy/70 py-1">
            <span>
              {totalLetras} letra{totalLetras > 1 ? "s" : ""} × {formatarMoeda(valorLetra)}
            </span>
            <span>{formatarMoeda(totalLetras * valorLetra)}</span>
          </div>
        )}
        {pingentesEscolhidos.map(({ charm, cor }, index) => (
          <div key={`${charm.id}-${index}`} className="flex items-center justify-between text-navy/70 py-1">
            <span>
              {charm.nome}
              {cor ? ` (${cor})` : ""}
            </span>
            <span>{formatarMoeda(charm.preco)}</span>
          </div>
        ))}
        {caixinhaSelecionada && caixinha && (
          <div className="flex items-center justify-between text-navy/70 py-1">
            <span>Caixinha{coresCaixinha.length > 0 && caixinhaCor ? ` (${caixinhaCor})` : ""}</span>
            <span>{formatarMoeda(caixinha.preco)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-navy font-display text-lg pt-2 mt-2 border-t border-neutral-light">
          <span>Total</span>
          <span>{formatarMoeda(total)}</span>
        </div>
      </div>

      <Button
        className="w-full"
        disabled={sequencia.length === 0}
        onClick={() => {
          onAdicionar(
            {
              configId: crypto.randomUUID(),
              sequencia,
              cordaoCor: coresCordao.length > 0 ? cordaoCor : null,
              caixinha: caixinhaSelecionada,
              caixinhaCor: caixinhaSelecionada && coresCaixinha.length > 0 ? caixinhaCor : null,
            },
            total
          );
          setSequencia([]);
          setCaixinhaSelecionada(false);
          setLetra("");
        }}
      >
        Adicionar ao carrinho
      </Button>
    </div>
  );
}
