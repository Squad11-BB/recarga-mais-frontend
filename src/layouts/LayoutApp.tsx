import { useEffect, useMemo, useState } from 'react'
import { Outlet, useMatches } from 'react-router-dom'
import { MapaBase } from '../components/mapa/MapaBase'
import { CENA_VAZIA, type CenaMapa, ContextoCena } from '../components/mapa/cena'
import { ControlesDeSom } from '../components/ControlesDeSom'
import { FaixaSemConexao } from '../components/FaixaSemConexao'
import { usePainelDoCarro } from '../lib/useMediaQuery'
import estilos from './LayoutApp.module.css'

export type ModoTela = 'sobreMapa' | 'tela'

/** Folga embaixo do mapa no celular, para a folha "Para onde?" não cobrir os postos. */
const FOLGA_CELULAR: Record<ModoTela, number> = { sobreMapa: 250, tela: 40 }

/**
 * Layout do app. No celular, o mapa ocupa a tela e as telas ficam por cima.
 * No painel do carro, a coluna de ações de 440 px fica do lado do motorista
 * e o mapa ocupa o restante.
 */
export function LayoutApp() {
  const [cena, setCena] = useState<CenaMapa>(CENA_VAZIA)
  const painelDoCarro = usePainelDoCarro()
  const matches = useMatches()
  const modo = ((matches.at(-1)?.handle as { modo?: ModoTela } | undefined)?.modo ?? 'tela') satisfies ModoTela

  useEffect(() => {
    document.documentElement.dataset.contexto = 'app'
  }, [])

  const contexto = useMemo(() => ({ definirCena: setCena }), [])

  return (
    <ContextoCena.Provider value={contexto}>
      <div className={estilos.app}>
        <FaixaSemConexao />
        <main className={estilos.painel} data-modo={modo}>
          <Outlet />
        </main>
        <div className={estilos.areaMapa} aria-hidden={!painelDoCarro && modo === 'tela' ? true : undefined}>
          <MapaBase
            cena={cena}
            folgaInferior={painelDoCarro ? 40 : FOLGA_CELULAR[modo]}
            mostrarCentralizar={painelDoCarro || modo === 'sobreMapa'}
          />
          {painelDoCarro && (
            <div className={estilos.som}>
              <ControlesDeSom />
            </div>
          )}
        </div>
      </div>
    </ContextoCena.Provider>
  )
}
