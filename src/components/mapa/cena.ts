import { createContext, useContext, useEffect } from 'react'
import type { Coordenada } from '../../services/contratos'

export interface Marcador {
  id: string
  posicao: Coordenada
  nome: string
  /** Rótulo da etiqueta sobre o pin, por exemplo "Posto A · 35 min". */
  etiqueta?: string
  destaque?: boolean
  aoTocar?: () => void
}

export interface CenaMapa {
  marcadores: Marcador[]
  usuario: Coordenada | null
  rota: { de: Coordenada; para: Coordenada } | null
  /** Etiqueta no canto superior esquerdo do mapa (painel do carro). */
  rotulo?: string
  /** Mapa acinzentado atrás de uma folha (consentimento, veículo). */
  esmaecido?: boolean
  /** Descrição em texto para leitores de tela. */
  descricao: string
}

export const CENA_VAZIA: CenaMapa = { marcadores: [], usuario: null, rota: null, descricao: 'Mapa da cidade' }

export interface ContextoCenaValor {
  definirCena(cena: CenaMapa): void
}

export const ContextoCena = createContext<ContextoCenaValor | null>(null)

/** Cada tela descreve o que o mapa deve mostrar. */
export function useCenaMapa(cena: CenaMapa) {
  const contexto = useContext(ContextoCena)
  // aoTocar fica fora da chave: funções mudam a cada renderização.
  const chave = JSON.stringify(cena, (campo, valor) => (campo === 'aoTocar' ? undefined : valor))
  useEffect(() => {
    contexto?.definirCena(cena)
    // A cena é comparada pelo conteúdo (chave), não pela referência.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contexto, chave])
}
