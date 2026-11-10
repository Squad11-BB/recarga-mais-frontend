export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

export function somenteDigitos(texto: string): string {
  return texto.replace(/\D/g, '')
}

/** Valida CNPJ pelos dígitos verificadores. */
export function cnpjValido(cnpj: string): boolean {
  const d = somenteDigitos(cnpj)
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false
  const calcular = (base: string, pesos: number[]) => {
    const soma = base.split('').reduce((s, n, i) => s + Number(n) * pesos[i], 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const p2 = [6, ...p1]
  const dv1 = calcular(d.slice(0, 12), p1)
  const dv2 = calcular(d.slice(0, 12) + dv1, p2)
  return d.endsWith(`${dv1}${dv2}`)
}

export function mascaraCnpj(texto: string): string {
  const d = somenteDigitos(texto).slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function mascaraTelefone(texto: string): string {
  const d = somenteDigitos(texto).slice(0, 11)
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}
