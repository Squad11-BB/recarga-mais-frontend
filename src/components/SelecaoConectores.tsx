import type { TipoConector } from '../services/contratos'
import { NOMES_CONECTOR } from '../features/veiculo/veiculo'
import estilos from './SelecaoConectores.module.css'

interface Props {
  rotulo: string
  opcoes?: TipoConector[]
  valor: TipoConector[]
  aoMudar(valor: TipoConector[]): void
  erro?: string | null
  idErro?: string
}

/** Botões de alternância para escolher um ou mais tipos de conector. */
export function SelecaoConectores({ rotulo, opcoes = ['TIPO2', 'CCS2', 'CHADEMO'], valor, aoMudar, erro, idErro }: Props) {
  return (
    <fieldset className={estilos.grupo} aria-describedby={erro ? idErro : undefined}>
      <legend className={estilos.rotulo}>{rotulo}</legend>
      <div className={estilos.opcoes}>
        {opcoes.map((tipo) => {
          const marcado = valor.includes(tipo)
          return (
            <button
              key={tipo}
              type="button"
              aria-pressed={marcado}
              className={`${estilos.opcao} ${marcado ? estilos.marcado : ''}`}
              onClick={() => aoMudar(marcado ? valor.filter((v) => v !== tipo) : [...valor, tipo])}
            >
              {NOMES_CONECTOR[tipo]}
            </button>
          )
        })}
      </div>
      {erro && (
        <p id={idErro} className={estilos.erro}>
          {erro}
        </p>
      )}
    </fieldset>
  )
}
