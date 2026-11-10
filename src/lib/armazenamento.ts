/** Leitura e escrita no localStorage sem quebrar quando ele não está disponível. */
export function ler<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(chave)
    return bruto === null ? padrao : (JSON.parse(bruto) as T)
  } catch {
    return padrao
  }
}

export function gravar(chave: string, valor: unknown): void {
  try {
    if (valor === null || valor === undefined) localStorage.removeItem(chave)
    else localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    // Sem armazenamento (modo privado, cota cheia): segue só em memória.
  }
}
