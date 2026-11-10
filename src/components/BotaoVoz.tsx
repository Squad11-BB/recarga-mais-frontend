import { forwardRef } from 'react'
import { Mic, Search } from 'lucide-react'
import estilos from './BotaoVoz.module.css'

interface Props {
  ouvindo?: boolean
  onFalar(): void
  /** Sem `campo`, a barra inteira é um botão que abre a tela "Para onde?". */
  onAbrir?: () => void
  campo?: {
    valor: string
    onMudar(valor: string): void
    bloqueado: boolean
    onEnviar?: () => void
  }
}

/** Barra escura "Para onde?" com o microfone: a voz é a entrada principal. */
export const BotaoVoz = forwardRef<HTMLInputElement, Props>(function BotaoVoz({ ouvindo, onFalar, onAbrir, campo }, ref) {
  return (
    <div className={estilos.barra}>
      <Search aria-hidden size={22} className={estilos.lupa} />
      {campo ? (
        <form
          className={estilos.form}
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            campo.onEnviar?.()
          }}
        >
          <label htmlFor="campo-destino" className="visualmente-oculto">
            Para onde?
          </label>
          <input
            ref={ref}
            id="campo-destino"
            className={estilos.entrada}
            placeholder="Para onde?"
            value={campo.valor}
            onChange={(e) => campo.onMudar(e.target.value)}
            readOnly={campo.bloqueado}
            aria-describedby={campo.bloqueado ? 'aviso-movimento' : undefined}
            autoComplete="off"
            enterKeyHint="search"
          />
        </form>
      ) : (
        <button type="button" className={estilos.abrir} onClick={onAbrir}>
          Para onde?
        </button>
      )}
      <button
        type="button"
        className={`${estilos.mic} ${ouvindo ? estilos.ouvindo : ''}`}
        onClick={onFalar}
        aria-label={ouvindo ? 'Ouvindo. Toque para parar' : 'Falar o destino'}
        aria-pressed={ouvindo}
      >
        <Mic aria-hidden size={24} />
      </button>
    </div>
  )
})
