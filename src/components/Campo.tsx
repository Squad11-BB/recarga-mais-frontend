import { type InputHTMLAttributes, type ReactNode, forwardRef, useId } from 'react'
import { AlertCircle } from 'lucide-react'
import estilos from './Campo.module.css'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string
  erro?: string | null
  icone?: ReactNode
  ajuda?: string
}

/** Campo de texto (usado só com o carro parado). O erro aparece junto, com ícone e texto. */
export const Campo = forwardRef<HTMLInputElement, Props>(function Campo(
  { rotulo, erro, icone, ajuda, id, className, ...resto },
  ref,
) {
  const automatico = useId()
  const idCampo = id ?? automatico
  const idErro = `${idCampo}-erro`
  const idAjuda = `${idCampo}-ajuda`
  const descricao = [erro ? idErro : null, ajuda ? idAjuda : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={`${estilos.campo} ${className ?? ''}`}>
      <label htmlFor={idCampo} className={estilos.rotulo}>
        {rotulo}
      </label>
      <div className={`${estilos.caixa} ${erro ? estilos.comErro : ''}`}>
        {icone && (
          <span className={estilos.icone} aria-hidden>
            {icone}
          </span>
        )}
        <input ref={ref} id={idCampo} aria-invalid={erro ? true : undefined} aria-describedby={descricao} {...resto} />
      </div>
      {ajuda && !erro && (
        <p id={idAjuda} className={estilos.ajuda}>
          {ajuda}
        </p>
      )}
      {erro && (
        <p id={idErro} className={estilos.erro}>
          <AlertCircle aria-hidden size={16} />
          {erro}
        </p>
      )}
    </div>
  )
})
