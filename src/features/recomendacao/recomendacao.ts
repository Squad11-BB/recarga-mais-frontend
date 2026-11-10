import { createContext, useContext } from 'react'
import type { Destino, ItemRecomendacao, Recomendacao } from '../../services/contratos'
import type { FalhaApi } from '../../services/http'

export type EstadoRecomendacao = 'ocioso' | 'carregando' | 'pronto' | 'erro'

export interface ContextoRecomendacaoValor {
  estado: EstadoRecomendacao
  recomendacao: Recomendacao | null
  erro: FalhaApi | null
  destino: Destino | null
  definirDestino(destino: Destino | null): void
  raioKm: number
  /** Dobra a área de busca (até RAIO_MAXIMO_KM) quando nenhum posto serve. */
  ampliarBusca(): void
  /** Pede uma nova recomendação. Nunca é repetida sozinha em caso de erro. */
  carregar(): Promise<void>
  cancelar(): void
  itemDoPonto(pontoId: string): ItemRecomendacao | null
}

export const ContextoRecomendacao = createContext<ContextoRecomendacaoValor | null>(null)

export function useRecomendacao(): ContextoRecomendacaoValor {
  const contexto = useContext(ContextoRecomendacao)
  if (!contexto) throw new Error('useRecomendacao precisa estar dentro de ProvedorRecomendacao')
  return contexto
}

/** Nível de bateria até onde o cálculo considera a recarga. */
export const NIVEL_ALVO_PCT = 80
export const RAIO_BUSCA_KM = 25
export const RAIO_MAXIMO_KM = 100
