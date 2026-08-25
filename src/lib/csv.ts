// Parser CSV simples (RFC4180): lida com campos entre aspas, vírgulas e quebras de
// linha dentro de aspas, e aspas escapadas (""). Suficiente para planilhas exportadas
// do Excel/Google Sheets sem precisar de uma dependência externa.
export function parseCsv(texto: string): string[][] {
  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let dentroDeAspas = false;
  const normalizado = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalizado.length; i++) {
    const char = normalizado[i];

    if (dentroDeAspas) {
      if (char === '"') {
        if (normalizado[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          dentroDeAspas = false;
        }
      } else {
        campo += char;
      }
      continue;
    }

    if (char === '"') {
      dentroDeAspas = true;
    } else if (char === ",") {
      linha.push(campo);
      campo = "";
    } else if (char === "\n") {
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
    } else {
      campo += char;
    }
  }

  if (campo.length > 0 || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }

  return linhas.filter((l) => !(l.length === 1 && l[0].trim() === ""));
}

export function linhasParaObjetos(linhas: string[][]): Record<string, string>[] {
  if (linhas.length === 0) return [];
  const [cabecalho, ...resto] = linhas;
  const chaves = cabecalho.map((c) => c.trim());
  return resto.map((linha) => {
    const obj: Record<string, string> = {};
    chaves.forEach((chave, index) => {
      obj[chave] = (linha[index] ?? "").trim();
    });
    return obj;
  });
}

export function paraLinhaCsv(campos: string[]): string {
  return campos
    .map((campo) => {
      if (/[",\n]/.test(campo)) {
        return `"${campo.replace(/"/g, '""')}"`;
      }
      return campo;
    })
    .join(",");
}
