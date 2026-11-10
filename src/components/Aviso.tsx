import type { ReactNode } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import estilos from './Aviso.module.css'

type Tipo = 'aviso' | 'erro' | 'info'

interface Props {
  tipo?: Tipo
  titulo: string
  children?: ReactNode
  icone?: ReactNode
  acoes?: ReactNode
  /** Erros e avisos são anunciados para quem usa leitor de tela. */
  anunciar?: boolean
  className?: string
}

const ICONES: Record<Tipo, ReactNode> = {
  aviso: <AlertTriangle aria-hidden size={22} />,
  erro: <AlertTriangle aria-hidden size={22} />,
  info: <Info aria-hidden size={22} />,
}

/** Todo aviso tem ícone e texto, não só cor. */
export function Aviso({ tipo = 'aviso', titulo, children, icone, acoes, anunciar = true, className }: Props) {
  return (
    <div className={`${estilos.aviso} ${estilos[tipo]} ${className ?? ''}`} role={anunciar ? 'alert' : undefined}>
      <div className={estilos.topo}>
        <span className={estilos.icone}>{icone ?? ICONES[tipo]}</span>
        <div className={estilos.texto}>
          <p className={estilos.titulo}>{titulo}</p>
          {children && <div className={estilos.corpo}>{children}</div>}
        </div>
      </div>
      {acoes && <div className={estilos.acoes}>{acoes}</div>}
    </div>
  )
}
