import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../services/api'
import type { Coordenada } from '../../services/contratos'
import { distanciaKm } from '../../lib/geo'
import { gravar, ler } from '../../lib/armazenamento'
import { useSessao } from '../sessao/sessao'
import {
  type Consentimento,
  ContextoLocalizacao,
  type EstadoGps,
  type Localizacao,
  type OrigemManual,
} from './localizacao'

const CHAVE_CONSENTIMENTO = 'recarga:consentimento-localizacao'
const CHAVE_ORIGEM = 'recarga:origem-manual'

export function ProvedorLocalizacao({ children }: { children: ReactNode }) {
  const { token } = useSessao()
  const [consentimento, setConsentimento] = useState<Consentimento>(() =>
    ler<Consentimento>(CHAVE_CONSENTIMENTO, 'pendente'),
  )
  const [estadoGps, setEstadoGps] = useState<EstadoGps>('desligado')
  const [gps, setGps] = useState<Coordenada | null>(null)
  const [velocidade, setVelocidade] = useState<number | null>(null)
  const [origemManual, setOrigemManual] = useState<OrigemManual | null>(() =>
    ler<OrigemManual | null>(CHAVE_ORIGEM, null),
  )
  const anterior = useRef<{ pos: Coordenada; t: number } | null>(null)

  // O GPS só liga depois do consentimento (LGPD).
  useEffect(() => {
    if (consentimento !== 'concedido') return
    if (!('geolocation' in navigator)) {
      queueMicrotask(() => setEstadoGps('indisponivel'))
      return
    }
    queueMicrotask(() => setEstadoGps('buscando'))
    const id = navigator.geolocation.watchPosition(
      ({ coords, timestamp }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude }
        let v = coords.speed
        if ((v === null || Number.isNaN(v)) && anterior.current) {
          const segundos = (timestamp - anterior.current.t) / 1000
          if (segundos > 0) v = (distanciaKm(anterior.current.pos, pos) * 1000) / segundos
        }
        anterior.current = { pos, t: timestamp }
        setGps(pos)
        setVelocidade(v ?? null)
        setEstadoGps('ativo')
      },
      (erro) => setEstadoGps(erro.code === erro.PERMISSION_DENIED ? 'bloqueado' : 'indisponivel'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [consentimento])

  const decidir = useCallback(
    (valor: Consentimento) => {
      setConsentimento(valor)
      gravar(CHAVE_CONSENTIMENTO, valor)
      if (valor !== 'concedido') {
        setGps(null)
        setVelocidade(null)
        setEstadoGps('desligado')
      }
      if (valor !== 'pendente') api.registrarConsentimento(valor === 'concedido', token).catch(() => {})
    },
    [token],
  )

  const definirOrigemManual = useCallback((origem: OrigemManual | null) => {
    setOrigemManual(origem)
    gravar(CHAVE_ORIGEM, origem)
  }, [])

  const valor = useMemo<Localizacao>(
    () => ({
      consentimento,
      estadoGps,
      posicao: origemManual?.localizacao ?? gps,
      origemManual,
      velocidade,
      conceder: () => decidir('concedido'),
      recusar: () => decidir('negado'),
      revogar: () => decidir('negado'),
      definirOrigemManual,
    }),
    [consentimento, estadoGps, origemManual, gps, velocidade, decidir, definirOrigemManual],
  )

  return <ContextoLocalizacao.Provider value={valor}>{children}</ContextoLocalizacao.Provider>
}
