import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import { api } from '../../services/api'
import type { Destino, Recomendacao } from '../../services/contratos'
import { FalhaApi, foiCancelado } from '../../services/http'
import { useLocalizacao } from '../localizacao/localizacao'
import { useVeiculo } from '../veiculo/veiculo'
import {
  ContextoRecomendacao,
  type ContextoRecomendacaoValor,
  type EstadoRecomendacao,
  NIVEL_ALVO_PCT,
  RAIO_BUSCA_KM,
  RAIO_MAXIMO_KM,
} from './recomendacao'

export function ProvedorRecomendacao({ children }: { children: ReactNode }) {
  const { posicao } = useLocalizacao()
  const { veiculo } = useVeiculo()
  const [estado, setEstado] = useState<EstadoRecomendacao>('ocioso')
  const [recomendacao, setRecomendacao] = useState<Recomendacao | null>(null)
  const [erro, setErro] = useState<FalhaApi | null>(null)
  const [destino, setDestino] = useState<Destino | null>(null)
  const [raioKm, setRaioKm] = useState(RAIO_BUSCA_KM)
  const controle = useRef<AbortController | null>(null)

  const cancelar = useCallback(() => {
    controle.current?.abort()
    controle.current = null
    setEstado((atual) => (atual === 'carregando' ? (recomendacao ? 'pronto' : 'ocioso') : atual))
  }, [recomendacao])

  const carregar = useCallback(async () => {
    // Sem localização, o cálculo parte do destino informado.
    const origem = posicao ?? destino?.localizacao ?? null
    if (!origem || !veiculo) return
    controle.current?.abort()
    const atual = new AbortController()
    controle.current = atual
    setEstado('carregando')
    setErro(null)
    try {
      const resposta = await api.recomendar(
        {
          origem,
          veiculo,
          nivelAlvoPct: NIVEL_ALVO_PCT,
          raioBuscaKm: raioKm,
          ...(destino ? { destino: { nome: destino.nome, localizacao: destino.localizacao } } : {}),
        },
        atual.signal,
      )
      if (controle.current !== atual) return
      setRecomendacao(resposta)
      setEstado('pronto')
    } catch (e) {
      if (foiCancelado(e) || controle.current !== atual) return
      setErro(e instanceof FalhaApi ? e : new FalhaApi('APP-REC-001', 'Não foi possível calcular a recomendação.'))
      setEstado('erro')
    } finally {
      if (controle.current === atual) controle.current = null
    }
  }, [posicao, veiculo, destino, raioKm])

  const valor = useMemo<ContextoRecomendacaoValor>(
    () => ({
      estado,
      recomendacao,
      erro,
      destino,
      definirDestino: setDestino,
      raioKm,
      ampliarBusca: () => setRaioKm((r) => Math.min(RAIO_MAXIMO_KM, r * 2)),
      carregar,
      cancelar,
      itemDoPonto: (pontoId) => recomendacao?.itens.find((i) => i.ponto.id === pontoId) ?? null,
    }),
    [estado, recomendacao, erro, destino, raioKm, carregar, cancelar],
  )

  return <ContextoRecomendacao.Provider value={valor}>{children}</ContextoRecomendacao.Provider>
}
