export function minutos(valor: number): string {
  return `${Math.round(valor)} min`
}

export function km(valor: number): string {
  return valor < 10 ? `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km` : `${Math.round(valor)} km`
}

export function haQuantoTempo(minutosAtras: number | null): string {
  if (minutosAtras === null) return 'sem data'
  if (minutosAtras < 1) return 'agora'
  if (minutosAtras < 60) return `há ${minutosAtras} min`
  const horas = Math.floor(minutosAtras / 60)
  return horas < 24 ? `há ${horas} h` : `há ${Math.floor(horas / 24)} d`
}

export function horaDaqui(minutosAFrente: number, agora = new Date()): string {
  const chegada = new Date(agora.getTime() + minutosAFrente * 60_000)
  return chegada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function hora(iso: string | null): string {
  if (!iso) return '--:--'
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** Número no formato brasileiro (vírgula decimal). */
export function numero(valor: number, casas = 1): string {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: casas })
}

export function carrosNaFila(quantidade: number): string {
  if (quantidade === 0) return 'Nenhum carro esperando'
  return quantidade === 1 ? '1 carro esperando' : `${quantidade} carros esperando`
}
