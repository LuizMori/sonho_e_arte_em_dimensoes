interface PaginationProps {
  pagina: number;
  totalPaginas: number;
  mostrarTodos: boolean;
  onPaginaChange: (pagina: number) => void;
  onToggleMostrarTodos: () => void;
}

export function Pagination({ pagina, totalPaginas, mostrarTodos, onPaginaChange, onToggleMostrarTodos }: PaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
      {!mostrarTodos && totalPaginas > 1 && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => onPaginaChange(Math.max(1, pagina - 1))}
            disabled={pagina === 1}
            className="label-caps text-navy/70 hover:text-navy transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            Anterior
          </button>
          <span className="text-sm text-navy/60">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => onPaginaChange(Math.min(totalPaginas, pagina + 1))}
            disabled={pagina === totalPaginas}
            className="label-caps text-navy/70 hover:text-navy transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            Próxima
          </button>
        </div>
      )}
      <button
        onClick={onToggleMostrarTodos}
        className="label-caps text-navy/50 hover:text-navy transition-colors underline underline-offset-4"
      >
        {mostrarTodos ? "Paginar novamente" : "Mostrar todos"}
      </button>
    </div>
  );
}
