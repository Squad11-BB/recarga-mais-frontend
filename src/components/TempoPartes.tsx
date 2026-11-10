import { CarFront, Clock, Zap } from 'lucide-react'
import type { ItemRecomendacao } from '../services/contratos'
import { minutos } from '../lib/formato'
import estilos from './TempoPartes.module.css'

function rotuloFila(item: ItemRecomendacao) {
  return item.fonteEspera === 'SEM_INFORMACAO' ? 'Fila sem info' : 'Fila'
}

/** Deslocamento, espera e recarga lado a lado: a conta do tempo total. */
export function TempoPartes({ item, comIcones = true, compacto = false }: { item: ItemRecomendacao; comIcones?: boolean; compacto?: boolean }) {
  const partes = [
    { icone: <CarFront aria-hidden size={20} />, valor: item.tempoDeslocamentoMin, rotulo: 'Viagem' as const },
    { icone: <Clock aria-hidden size={20} />, valor: item.tempoEsperaMin, rotulo: rotuloFila(item) },
    { icone: <Zap aria-hidden size={20} />, valor: item.tempoRecargaMin, rotulo: 'Carga' as const },
  ]
  return (
    <dl className={`${estilos.partes} ${compacto ? estilos.compacto : ''}`}>
      {partes.map((p, i) => (
        <div key={i} className={estilos.parte}>
          {comIcones && <span className={estilos.icone}>{p.icone}</span>}
          <dd className={`${estilos.valor} numeros`}>{minutos(p.valor)}</dd>
          <dt className={estilos.rotulo}>{p.rotulo}</dt>
        </div>
      ))}
    </dl>
  )
}

/** Barra empilhada com a proporção de cada parte do tempo total. */
export function BarraTempo({ item }: { item: ItemRecomendacao }) {
  const total = Math.max(1, item.tempoTotalMin)
  const fatias = [
    { valor: item.tempoDeslocamentoMin, classe: estilos.viagem, rotulo: 'Viagem' },
    { valor: item.tempoEsperaMin, classe: estilos.fila, rotulo: 'Fila' },
    { valor: item.tempoRecargaMin, classe: estilos.carga, rotulo: 'Carga' },
  ]
  return (
    <div className={estilos.barraBloco}>
      <div
        className={estilos.barra}
        role="img"
        aria-label={`Viagem ${item.tempoDeslocamentoMin} min, fila ${item.tempoEsperaMin} min, carga ${item.tempoRecargaMin} min`}
      >
        {fatias.map((f) =>
          f.valor > 0 ? <span key={f.rotulo} className={f.classe} style={{ flexGrow: f.valor / total }} /> : null,
        )}
      </div>
      <dl className={estilos.legenda}>
        {fatias.map((f) => (
          <div key={f.rotulo}>
            <dt>
              <span className={`${estilos.quadrinho} ${f.classe}`} aria-hidden />
              {f.rotulo}
            </dt>
            <dd className="numeros">{minutos(f.valor)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
