import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Aviso } from '../../components/Aviso'
import { Botao } from '../../components/Botao'
import { useMetricas } from '../../features/painel/useMetricas'
import type { PeriodoMetricas } from '../../services/contratos'
import estilosPainel from './Painel.module.css'
import estilos from './Metricas.module.css'

const PERIODOS: { valor: PeriodoMetricas; rotulo: string }[] = [
  { valor: 'HOJE', rotulo: 'Hoje' },
  { valor: '7_DIAS', rotulo: '7 dias' },
  { valor: '30_DIAS', rotulo: '30 dias' },
]

/** Operador: sessões, espera, uso dos pontos e relatos de fila por período. */
export function Metricas() {
  const [periodo, setPeriodo] = useState<PeriodoMetricas>('7_DIAS')
  const { dados, erro, carregar } = useMetricas(periodo)
  const maximo = Math.max(1, ...(dados?.usoPorDia.map((d) => d.sessoes) ?? [1]))
  const indiceMaior = dados ? dados.usoPorDia.findIndex((d) => d.sessoes === maximo) : -1

  return (
    <>
      <div className={estilosPainel.cabecalho}>
        <div>
          <p className={estilosPainel.sobretitulo}>Rede de estações · Recife</p>
          <h1 className={estilosPainel.titulo}>Métricas e utilização</h1>
        </div>
        <div className={estilos.segmentos} role="radiogroup" aria-label="Período">
          {PERIODOS.map((p) => (
            <button
              key={p.valor}
              type="button"
              role="radio"
              aria-checked={periodo === p.valor}
              className={`${estilos.segmento} ${periodo === p.valor ? estilos.segmentoAtivo : ''}`}
              onClick={() => setPeriodo(p.valor)}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </div>

      {erro ? (
        <Aviso
          tipo="erro"
          titulo={erro.mensagem}
          acoes={
            <Botao tamanho="compacto" variante="secundario" larguraTotal={false} icone={<RefreshCw aria-hidden size={16} />} onClick={() => void carregar()}>
              Tentar novamente
            </Botao>
          }
        >
          Código {erro.codigo}
        </Aviso>
      ) : (
        <>
          <div className={estilosPainel.estatisticas} aria-busy={!dados}>
            <div className={estilosPainel.estatistica}>
              <span>Sessões de carga</span>
              <strong className="numeros">{dados?.sessoesDeCarga ?? '–'}</strong>
            </div>
            <div className={estilosPainel.estatistica}>
              <span>Espera média</span>
              <strong className="numeros">{dados ? `${dados.esperaMediaMin} min` : '–'}</strong>
            </div>
            <div className={estilosPainel.estatistica}>
              <span>Uso dos pontos</span>
              <strong className="numeros">{dados ? `${dados.usoDosPontosPct}%` : '–'}</strong>
            </div>
            <div className={estilosPainel.estatistica}>
              <span>Relatos de fila</span>
              <strong className="numeros">{dados?.relatosDeFila ?? '–'}</strong>
            </div>
          </div>

          <div className={estilos.grade}>
            <section className={estilosPainel.cartao} aria-labelledby="titulo-uso">
              <h2 id="titulo-uso" className={estilos.tituloCartao}>
                Uso dos pontos {periodo === 'HOJE' ? 'por horário' : 'por dia'}
              </h2>
              {dados ? (
                <>
                  <div
                    className={estilos.grafico}
                    role="img"
                    aria-label={`Sessões de carga: ${dados.usoPorDia.map((d) => `${d.rotulo} ${d.sessoes}`).join(', ')}. Maior uso: ${dados.usoPorDia[indiceMaior]?.rotulo}.`}
                  >
                    {dados.usoPorDia.map((d, i) => (
                      <div key={d.rotulo} className={estilos.coluna}>
                        <span className={`${estilos.valorBarra} numeros`}>{d.sessoes}</span>
                        <span
                          className={`${estilos.barra} ${i === indiceMaior ? estilos.barraMaior : ''}`}
                          style={{ height: `${(d.sessoes / maximo) * 100}%` }}
                        />
                        <span className={estilos.rotuloBarra}>{d.rotulo}</span>
                      </div>
                    ))}
                  </div>
                  <p className={estilosPainel.subtitulo}>A barra amarela marca o {periodo === 'HOJE' ? 'horário' : 'dia'} de maior uso.</p>
                </>
              ) : (
                <div className="esqueleto" style={{ height: 220 }} role="status" aria-label="Carregando gráfico" />
              )}
            </section>

            <section className={estilosPainel.cartao} aria-labelledby="titulo-maior-fila">
              <h2 id="titulo-maior-fila" className={estilos.tituloCartao}>
                Postos com maior fila
              </h2>
              <ul className={estilos.lista}>
                {(dados?.postosComMaiorFila ?? []).map((p) => (
                  <li key={p.nome}>
                    <span>{p.nome}</span>
                    <strong className="numeros">{p.esperaMin} min</strong>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          {dados && <p className={estilosPainel.nota} style={{ textAlign: 'left', marginTop: 16 }}>Valores de exemplo do servidor simulado.</p>}
        </>
      )}
    </>
  )
}
