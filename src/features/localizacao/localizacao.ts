import { createContext, useContext } from 'react'
import type { Coordenada } from '../../services/contratos'

export type Consentimento = 'pendente' | 'concedido' | 'negado'
export type EstadoGps = 'desligado' | 'buscando' | 'ativo' | 'bloqueado' | 'indisponivel'

export interface OrigemManual {
  nome: string
  localizacao: Coordenada
}

export interface Localizacao {
  consentimento: Consentimento
  estadoGps: EstadoGps
  /** Posição usada no cálculo: a informada à mão tem prioridade sobre o GPS. */
  posicao: Coordenada | null
  origemManual: OrigemManual | null
  /** Velocidade em m/s, quando o aparelho informa. */
  velocidade: number | null
  conceder(): void
  recusar(): void
  revogar(): void
  definirOrigemManual(origem: OrigemManual | null): void
}

export const ContextoLocalizacao = createContext<Localizacao | null>(null)

export function useLocalizacao(): Localizacao {
  const contexto = useContext(ContextoLocalizacao)
  if (!contexto) throw new Error('useLocalizacao precisa estar dentro de ProvedorLocalizacao')
  return contexto
}
