import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/api'
import type { Destino } from '../../services/contratos'
import { gravar, ler } from '../../lib/armazenamento'
import { useSessao } from '../sessao/sessao'

export type Atalho = 'casa' | 'trabalho'
const CHAVE_ATALHOS = 'recarga:atalhos'

type Atalhos = Partial<Record<Atalho, Destino>>

/** Atalhos Casa e Trabalho e os 3 destinos recentes (RF24). */
export function useDestinos() {
  const { token } = useSessao()
  const [recentes, setRecentes] = useState<Destino[]>([])
  const [atalhos, setAtalhos] = useState<Atalhos>(() => ler<Atalhos>(CHAVE_ATALHOS, {}))

  useEffect(() => {
    let ativo = true
    api
      .listarDestinosRecentes(token)
      .then((lista) => ativo && setRecentes(lista.slice(0, 3)))
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [token])

  const salvarRecente = useCallback(
    async (destino: Destino) => {
      setRecentes((lista) => [destino, ...lista.filter((d) => d.id !== destino.id)].slice(0, 3))
      await api.salvarDestinoRecente(destino, token).catch(() => {})
    },
    [token],
  )

  const definirAtalho = useCallback((atalho: Atalho, destino: Destino) => {
    setAtalhos((atual) => {
      const novo = { ...atual, [atalho]: destino }
      gravar(CHAVE_ATALHOS, novo)
      return novo
    })
  }, [])

  return { recentes, atalhos, salvarRecente, definirAtalho }
}
