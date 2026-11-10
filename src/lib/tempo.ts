/** Depois de quantos minutos sem atualização o dado é marcado como desatualizado (RN06). */
export const LIMITE_DESATUALIZADO_MIN = 30

export function minutosDesde(iso: string | null, agora: Date): number | null {
  if (!iso) return null
  return Math.max(0, Math.round((agora.getTime() - new Date(iso).getTime()) / 60_000))
}
