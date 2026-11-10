import { type ReactNode, useEffect, useId, useRef } from 'react'
import estilos from './FolhaInferior.module.css'

interface Props {
  children: ReactNode
  /** Como janela: escurece o fundo, prende o foco e fecha com Esc. */
  modal?: boolean
  titulo?: string
  /** Ícone em círculo acima do título. */
  icone?: ReactNode
  aoFechar?: () => void
  className?: string
}

/**
 * Folha que sobe da parte de baixo da tela.
 * Ao abrir como janela, o foco vai para o título; ao fechar, volta ao botão de origem.
 */
export function FolhaInferior({ children, modal = false, titulo, icone, aoFechar, className }: Props) {
  const idTitulo = useId()
  const refFolha = useRef<HTMLDivElement>(null)
  const refTitulo = useRef<HTMLHeadingElement>(null)
  const refFechar = useRef(aoFechar)

  useEffect(() => {
    refFechar.current = aoFechar
  }, [aoFechar])

  useEffect(() => {
    if (!modal) return
    const origem = document.activeElement as HTMLElement | null
    refTitulo.current?.focus()

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        refFechar.current?.()
        return
      }
      if (e.key !== 'Tab' || !refFolha.current) return
      const focaveis = refFolha.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focaveis.length === 0) return
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primeiro.focus()
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      origem?.focus?.()
    }
  }, [modal])

  const folha = (
    <div
      ref={refFolha}
      className={`${estilos.folha} ${className ?? ''}`}
      role={modal ? 'dialog' : undefined}
      aria-modal={modal || undefined}
      aria-labelledby={modal && titulo ? idTitulo : undefined}
    >
      <div className={estilos.alca} aria-hidden />
      {icone && (
        <span className={estilos.icone} aria-hidden>
          {icone}
        </span>
      )}
      {titulo && (
        <h2 id={idTitulo} ref={refTitulo} tabIndex={-1} className={estilos.titulo}>
          {titulo}
        </h2>
      )}
      {children}
    </div>
  )

  if (!modal) return folha
  return (
    <div className={estilos.fundo} onClick={(e) => e.target === e.currentTarget && aoFechar?.()}>
      {folha}
    </div>
  )
}
