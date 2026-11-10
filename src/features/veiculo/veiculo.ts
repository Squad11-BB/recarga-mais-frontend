import { createContext, useContext } from 'react'
import type { TipoConector, VeiculoInformado } from '../../services/contratos'

export interface VeiculoAtivo extends VeiculoInformado {
  /** Nome mostrado na tela, por exemplo "BYD Dolphin" ou "Informado manualmente". */
  nome: string
}

export interface ContextoVeiculoValor {
  veiculo: VeiculoAtivo | null
  definir(veiculo: VeiculoAtivo): void
  atualizarBateria(nivelPct: number): void
  /** Autonomia aproximada em km com a bateria atual (RF06). */
  autonomiaKm: number | null
}

export const ContextoVeiculo = createContext<ContextoVeiculoValor | null>(null)

export function useVeiculo(): ContextoVeiculoValor {
  const contexto = useContext(ContextoVeiculo)
  if (!contexto) throw new Error('useVeiculo precisa estar dentro de ProvedorVeiculo')
  return contexto
}

export const NOMES_CONECTOR: Record<TipoConector, string> = {
  CCS2: 'CCS2',
  TIPO2: 'Tipo 2',
  CHADEMO: 'CHAdeMO',
  GBT: 'GB/T',
}

export function calcularAutonomiaKm(v: VeiculoInformado): number {
  return Math.round(((v.nivelBateriaPct / 100) * v.capacidadeBateriaKWh) / v.consumoKWhPorKm)
}

/** Nível de bateria válido: inteiro de 0 a 100. */
export function nivelBateriaValido(valor: number): boolean {
  return Number.isInteger(valor) && valor >= 0 && valor <= 100
}
