import { type ReactNode, useMemo, useState } from 'react'
import { gravar, ler } from '../../lib/armazenamento'
import { ContextoVeiculo, type ContextoVeiculoValor, type VeiculoAtivo, calcularAutonomiaKm } from './veiculo'

const CHAVE = 'recarga:veiculo'

export function ProvedorVeiculo({ children }: { children: ReactNode }) {
  const [veiculo, setVeiculo] = useState<VeiculoAtivo | null>(() => ler<VeiculoAtivo | null>(CHAVE, null))

  const valor = useMemo<ContextoVeiculoValor>(
    () => ({
      veiculo,
      definir: (novo) => {
        setVeiculo(novo)
        gravar(CHAVE, novo)
      },
      atualizarBateria: (nivelPct) => {
        if (!veiculo) return
        const novo = { ...veiculo, nivelBateriaPct: nivelPct }
        setVeiculo(novo)
        gravar(CHAVE, novo)
      },
      autonomiaKm: veiculo ? calcularAutonomiaKm(veiculo) : null,
    }),
    [veiculo],
  )

  return <ContextoVeiculo.Provider value={valor}>{children}</ContextoVeiculo.Provider>
}
