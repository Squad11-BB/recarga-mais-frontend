import { useCallback, useSyncExternalStore } from 'react'

export function useMediaQuery(consulta: string): boolean {
  const assinar = useCallback(
    (aviso: () => void) => {
      const lista = window.matchMedia(consulta)
      lista.addEventListener('change', aviso)
      return () => lista.removeEventListener('change', aviso)
    },
    [consulta],
  )
  return useSyncExternalStore(
    assinar,
    () => window.matchMedia(consulta).matches,
    () => false,
  )
}

/** Painel do carro: paisagem a partir de 1000 px. */
export const CONSULTA_PAINEL_CARRO = '(min-width: 1000px) and (orientation: landscape)'

export function usePainelDoCarro(): boolean {
  return useMediaQuery(CONSULTA_PAINEL_CARRO)
}
