import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Loader2, Lock } from 'lucide-react'
import estilos from './Botao.module.css'

type Variante = 'primario' | 'secundario' | 'texto'
type Tamanho = 'dirigindo' | 'parado' | 'compacto'

interface Comum {
  variante?: Variante
  tamanho?: Tamanho
  icone?: ReactNode
  larguraTotal?: boolean
}

function classes({ variante = 'primario', tamanho = 'dirigindo', larguraTotal = true }: Comum, extra?: string) {
  return [estilos.botao, estilos[variante], estilos[tamanho], larguraTotal ? estilos.total : '', extra ?? '']
    .filter(Boolean)
    .join(' ')
}

interface PropsBotao extends Comum, ButtonHTMLAttributes<HTMLButtonElement> {
  carregando?: boolean
  textoCarregando?: string
  /** Bloqueado em movimento: mostra cadeado e o motivo, não só a cor. */
  bloqueado?: boolean
}

export function Botao({
  variante,
  tamanho,
  icone,
  larguraTotal,
  carregando = false,
  textoCarregando,
  bloqueado = false,
  children,
  className,
  disabled,
  type = 'button',
  ...resto
}: PropsBotao) {
  return (
    <button
      type={type}
      className={classes({ variante, tamanho, larguraTotal }, `${bloqueado ? estilos.bloqueado : ''} ${className ?? ''}`)}
      disabled={disabled || carregando || bloqueado}
      aria-busy={carregando || undefined}
      {...resto}
    >
      {carregando ? (
        <Loader2 className={estilos.girando} aria-hidden size={22} />
      ) : bloqueado ? (
        <Lock aria-hidden size={20} />
      ) : (
        icone
      )}
      <span>{carregando && textoCarregando ? textoCarregando : children}</span>
    </button>
  )
}

interface PropsLink extends Comum, LinkProps {}

export function BotaoLink({ variante, tamanho, icone, larguraTotal, children, className, ...resto }: PropsLink) {
  return (
    <Link className={classes({ variante, tamanho, larguraTotal }, className)} {...resto}>
      {icone}
      <span>{children}</span>
    </Link>
  )
}
