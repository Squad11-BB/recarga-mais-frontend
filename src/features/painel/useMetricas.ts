import { useCallback, useEffect, useState } from 'react'
import { useSessao } from '../sessao/sessao'
import { api } from '../../services/api'
import type { Metricas as DadosMetricas, PeriodoMetricas } from '../../services/contratos'
import { FalhaApi } from '../../services/http'

export function useMetricas(periodo: PeriodoMetricas) {
  const { token } = useSessao()
  const [dados, setDados] = useState<DadosMetricas | null>(null)
  const [erro, setErro] = useState<FalhaApi | null>(null)

  const carregar = useCallback(async () => {
    if (!token) return
    setErro(null)
    setDados(null)
    try {
      setDados(await api.obterMetricas(periodo, token))
    } catch (e) {
      setErro(e instanceof FalhaApi ? e : new FalhaApi('PNL-003', 'Não foi possível carregar as métricas.'))
    }
  }, [token, periodo])

  useEffect(() => {
    queueMicrotask(() => void carregar())
  }, [carregar])

  return { dados, erro, carregar }
}
