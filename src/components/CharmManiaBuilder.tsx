import { useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Bead, Charm, Produto, CharmManiaConfig } from "@/types";

const formatarMoeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface CharmManiaBuilderProps {
  produto: Produto;
  charms: Charm[];
  caixinha: Produto | null;
  onAdicionar: (config: CharmManiaConfig, precoTotal: number) => void;
}

export function CharmManiaBuilder({ produto, charms, caixinha, onAdicionar }: CharmManiaBuilderProps) {
  const [sequencia, setSequencia] = useState<Bead[]>([]);
  const [caixinhaSelecionada, setCaixinhaSelecionada] = useState(false);
  const [letra, setLetra] = useState("");
  const letraInputRef = useRef<HTMLInputElement>(null);

  const valorLetra = produto.valor_letra ?? 0;
  const limiteContas = produto.limite_contas;
  const limiteAtingido = limiteContas != null && sequencia.length >= limiteContas;

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
      .filter((c): c is { tipo: "pingente"; charmId: string } => c.tipo === "pingente")
      .map((c) => charms.find((charm) => charm.id === c.charmId))
      .filter((c): c is Charm => Boolean(c));
  }, [sequencia, charms]);

  const totalPingentes = pingentesEscolhidos.reduce((soma, c) => soma + c.preco, 0);
  const totalCaixinha = caixinhaSelecionada && caixinha ? caixinha.preco : 0;
  const total = produto.preco + totalLetras * valorLetra + totalPingentes + totalCaixinha;

  const adicionarLetra = (valor: string) => {
    if (!valor || limiteAtingido) return;
    setSequencia((prev) => [...prev, { tipo: "letra", valor }]);
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
    setSequencia((prev) => [...prev, { tipo: "pingente", charmId: charm.id }]);
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

      <div className="flex flex-wrap gap-2 min-h-[3rem] items-center border border-neutral-light rounded-xl px-4 py-3 mb-4">
        {sequencia.length === 0 ? (
          <span className="text-navy/40 text-sm">Digite uma palavra e escolha pingentes abaixo</span>
        ) : (
          sequencia.map((conta, index) => (
            <button
              key={index}
              type="button"
              onClick={() => removerConta(index)}
              title="Remover"
              className={
                conta.tipo === "letra"
                  ? "w-9 h-9 flex items-center justify-center rounded-full bg-navy text-cream-light font-display text-sm uppercase hover:bg-magenta transition-colors"
                  : "px-3 h-9 flex items-center justify-center rounded-full bg-cream-light border border-magenta text-magenta text-xs hover:bg-magenta hover:text-cream-light transition-colors"
              }
            >
              {conta.tipo === "letra" ? conta.valor : nomeDoPingente(conta.charmId)}
            </button>
          ))
        )}
      </div>

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
              return (
                <button
                  key={charm.id}
                  type="button"
                  disabled={esgotado || limiteAtingido}
                  onClick={() => adicionarPingente(charm)}
                  className="label-caps rounded-full border border-neutral-light px-4 py-2 text-navy/70 hover:border-magenta hover:text-magenta transition-colors disabled:opacity-30 disabled:hover:border-neutral-light disabled:hover:text-navy/70 disabled:cursor-not-allowed"
                >
                  {charm.nome} · {formatarMoeda(charm.preco)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {caixinha && (
        <label className="flex items-center gap-3 text-navy mb-6">
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
      )}

      <div className="border border-neutral-light rounded-xl px-5 py-4 mb-6 text-sm">
        <div className="flex items-center justify-between text-navy/70 py-1">
          <span>Base (cordão + ponteira)</span>
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
        {pingentesEscolhidos.map((charm, index) => (
          <div key={`${charm.id}-${index}`} className="flex items-center justify-between text-navy/70 py-1">
            <span>{charm.nome}</span>
            <span>{formatarMoeda(charm.preco)}</span>
          </div>
        ))}
        {caixinhaSelecionada && caixinha && (
          <div className="flex items-center justify-between text-navy/70 py-1">
            <span>Caixinha</span>
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
            { configId: crypto.randomUUID(), sequencia, caixinha: caixinhaSelecionada },
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
