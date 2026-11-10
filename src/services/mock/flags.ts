// Chaves para simular falhas e situações durante o desenvolvimento.
// Ative pela URL, por exemplo: /mapa?falhaIA=1 ou /mapa?movimento=1
// O valor fica guardado na aba até ser desligado com =0.

export type FlagSimulacao = 'falhaIA' | 'falhaMaps' | 'falhaExplicacao' | 'movimento' | 'semPostos'

const CHAVES: FlagSimulacao[] = ['falhaIA', 'falhaMaps', 'falhaExplicacao', 'movimento', 'semPostos']
const PREFIXO = 'recarga:sim:'

export function lerFlagsDaUrl(busca: string = window.location.search): void {
  const params = new URLSearchParams(busca)
  for (const chave of CHAVES) {
    const valor = params.get(chave)
    if (valor === null) continue
    if (valor === '0') sessionStorage.removeItem(PREFIXO + chave)
    else sessionStorage.setItem(PREFIXO + chave, '1')
  }
}

export function flagAtiva(chave: FlagSimulacao): boolean {
  try {
    return sessionStorage.getItem(PREFIXO + chave) === '1'
  } catch {
    return false
  }
}
