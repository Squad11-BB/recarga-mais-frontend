import { useEffect, useState } from 'react'
import { useLocalizacao } from '../localizacao/localizacao'
import { flagAtiva } from '../../services/mock/flags'

/** Acima de ~10 km/h o carro conta como em movimento; abaixo de ~3,6 km/h, parado. */
const LIMITE_MOVIMENTO_MS = 2.8
const LIMITE_PARADO_MS = 1

/**
 * Diz se o carro está em movimento, pela velocidade do GPS.
 * Com o carro em movimento, digitar, reportar fila e editar o veículo ficam bloqueados.
 * Para testar sem dirigir: ?movimento=1 na URL.
 */
export function useEmMovimento(): boolean {
  const { velocidade } = useLocalizacao()
  const [emMovimento, setEmMovimento] = useState(false)

  useEffect(() => {
    if (velocidade === null) return
    // Histerese: só muda de estado ao cruzar o limite correspondente.
    if (velocidade >= LIMITE_MOVIMENTO_MS) queueMicrotask(() => setEmMovimento(true))
    else if (velocidade <= LIMITE_PARADO_MS) queueMicrotask(() => setEmMovimento(false))
  }, [velocidade])

  return flagAtiva('movimento') || emMovimento
}
