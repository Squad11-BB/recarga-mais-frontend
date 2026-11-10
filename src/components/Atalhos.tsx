import { Briefcase, ChevronRight, Clock, House, Plus } from 'lucide-react'
import type { Destino } from '../services/contratos'
import type { Atalho } from '../features/destino/useDestinos'
import estilos from './Atalhos.module.css'

interface PropsAtalhos {
  aoEscolher(atalho: Atalho | 'outros'): void
}

/** Atalhos Casa, Trabalho e Outros: poucas escolhas e sempre no mesmo lugar. */
export function Atalhos({ aoEscolher }: PropsAtalhos) {
  return (
    <div className={estilos.atalhos} role="group" aria-label="Atalhos de destino">
      <button type="button" className={estilos.atalho} onClick={() => aoEscolher('casa')}>
        <House aria-hidden size={20} />
        Casa
      </button>
      <button type="button" className={estilos.atalho} onClick={() => aoEscolher('trabalho')}>
        <Briefcase aria-hidden size={20} />
        Trabalho
      </button>
      <button type="button" className={estilos.atalho} onClick={() => aoEscolher('outros')}>
        <Plus aria-hidden size={20} />
        Outros
      </button>
    </div>
  )
}

interface PropsLista {
  titulo: string
  destinos: Destino[]
  icone?: 'recente' | 'busca'
  aoEscolher(destino: Destino): void
}

export function ListaDestinos({ titulo, destinos, icone = 'recente', aoEscolher }: PropsLista) {
  if (destinos.length === 0) return null
  return (
    <section className={estilos.secao} aria-label={titulo}>
      <h2 className={estilos.titulo}>{titulo}</h2>
      <ul className={estilos.lista}>
        {destinos.map((d) => (
          <li key={d.id}>
            <button type="button" className={estilos.item} onClick={() => aoEscolher(d)}>
              {icone === 'recente' && <Clock aria-hidden size={20} className={estilos.icone} />}
              <span className={estilos.textos}>
                <strong>{d.nome}</strong>
                <small>{d.endereco}</small>
              </span>
              <ChevronRight aria-hidden size={20} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
