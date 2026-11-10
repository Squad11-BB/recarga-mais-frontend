/** Destino seguro para depois do login: só caminhos internos do app (evita redirecionamento aberto). */
export function destinoSeguro(valor: string | null, padrao = '/mapa'): string {
  if (!valor || !valor.startsWith('/') || valor.startsWith('//') || valor.startsWith('/painel')) return padrao
  return valor
}
