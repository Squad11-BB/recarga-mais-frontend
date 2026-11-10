import { type ReactNode, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import estilos from './Cabecalho.module.css'

interface Props {
  titulo: ReactNode
  /** Para onde o botão voltar leva. Sem valor, volta uma tela no histórico. */
  voltarPara?: string
  aoVoltar?: () => void
  direita?: ReactNode
  /** Leva o foco para o título ao abrir a tela (leitores de tela anunciam a tela nova). */
  focarAoAbrir?: boolean
}

export function Cabecalho({ titulo, voltarPara, aoVoltar, direita, focarAoAbrir = true }: Props) {
  const navegar = useNavigate()
  const refTitulo = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (focarAoAbrir) refTitulo.current?.focus({ preventScroll: true })
  }, [focarAoAbrir])

  return (
    <header className={estilos.cabecalho}>
      <button
        type="button"
        className={estilos.voltar}
        aria-label="Voltar"
        onClick={() => {
          if (aoVoltar) aoVoltar()
          else if (voltarPara) navegar(voltarPara)
          else navegar(-1)
        }}
      >
        <ChevronLeft aria-hidden size={24} />
      </button>
      <h1 ref={refTitulo} tabIndex={-1} className={estilos.titulo}>
        {titulo}
      </h1>
      {direita && <div className={estilos.direita}>{direita}</div>}
    </header>
  )
}
