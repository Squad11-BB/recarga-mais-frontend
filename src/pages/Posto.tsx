import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Check, ChevronRight, Minus } from 'lucide-react'
import { BotaoLink } from '../components/Botao'
import { Cabecalho } from '../components/Cabecalho'
import { ChipIA, ChipParado, ChipPontos } from '../components/Chips'
import { BarraTempo, TempoPartes } from '../components/TempoPartes'
import { MapaMini } from '../components/mapa/MapaMini'
import { useCenaMapa } from '../components/mapa/cena'
import { useEmMovimento } from '../features/conducao/useEmMovimento'
import { useLocalizacao } from '../features/localizacao/localizacao'
import { useRecomendacao } from '../features/recomendacao/recomendacao'
import { NOMES_CONECTOR } from '../features/veiculo/veiculo'
import { carrosNaFila, haQuantoTempo, km, minutos } from '../lib/formato'
import { api } from '../services/api'
import type { CriterioRecomendacao, Explicacao, FatorAdequacao, ItemRecomendacao } from '../services/contratos'
import estilosTela from './Tela.module.css'
import estilos from './Posto.module.css'

/** Texto de reserva, montado só com os números do cálculo. */
function textoPadrao(item: ItemRecomendacao, criterio: CriterioRecomendacao) {
  const motivo = criterio === 'IA' && item.adequacao ? 'é o mais adequado ao seu carro' : 'tem o menor tempo total'
  return `Este posto ${motivo}: ${item.tempoDeslocamentoMin} min de viagem, ${item.tempoEsperaMin} min de espera e ${item.tempoRecargaMin} min de recarga.`
}

function BlocoExplicacao({
  recomendacaoId,
  criterio,
  item,
}: {
  recomendacaoId: string
  criterio: CriterioRecomendacao
  item: ItemRecomendacao
}) {
  const [explicacao, setExplicacao] = useState<Explicacao | null>(null)

  useEffect(() => {
    const controle = new AbortController()
    api
      .explicar(recomendacaoId, item.ponto.id, controle.signal)
      .then(setExplicacao)
      // Se a IA falhar ou demorar mais de 3 s, aparece o texto padrão, sem mensagem de erro.
      .catch(() => !controle.signal.aborted && setExplicacao({ texto: textoPadrao(item, criterio), geradoPorIA: false }))
    return () => controle.abort()
  }, [recomendacaoId, criterio, item])

  return (
    <section className={estilosTela.cartao} aria-labelledby="titulo-explicacao" aria-busy={!explicacao}>
      <div className={estilos.explicacaoTopo}>
        <h2 id="titulo-explicacao" className={estilos.explicacaoTitulo}>
          Explicação
        </h2>
        {explicacao?.geradoPorIA && <ChipIA texto="Gerado por IA" titulo="Texto gerado por IA" />}
      </div>
      {explicacao ? (
        <p aria-live="polite">{explicacao.texto}</p>
      ) : (
        <div className={estilosTela.pilhaPequena} role="status" aria-label="Gerando explicação">
          <div className="esqueleto" style={{ height: 14 }} />
          <div className="esqueleto" style={{ height: 14, width: '80%' }} />
        </div>
      )}
    </section>
  )
}

function Fator({ ok, titulo, valor }: { ok: boolean; titulo: string; valor: string }) {
  return (
    <li className={estilos.fator}>
      {ok ? (
        <Check aria-hidden size={20} className={estilos.fatorOk} strokeWidth={3} />
      ) : (
        <AlertTriangle aria-hidden size={20} className={estilos.fatorAviso} />
      )}
      <span className={estilos.fatorTitulo}>
        {titulo}
        <span className="visualmente-oculto">{ok ? ': sim' : ': atenção'}</span>
      </span>
      <span className={estilos.fatorValor}>{valor}</span>
    </li>
  )
}

const ICONE_IMPACTO: Record<FatorAdequacao['impacto'], { Icone: typeof Check; classe: string; leitura: string }> = {
  POSITIVO: { Icone: Check, classe: estilos.fatorOk, leitura: 'a favor' },
  NEUTRO: { Icone: Minus, classe: estilos.fatorNeutro, leitura: 'neutro' },
  NEGATIVO: { Icone: AlertTriangle, classe: estilos.fatorAviso, leitura: 'contra' },
}

/** O que a IA avaliou sobre o posto e o veículo. */
function AvaliacaoIA({ item }: { item: ItemRecomendacao }) {
  if (!item.adequacao) return null
  return (
    <section className={estilosTela.pilhaPequena} aria-labelledby="titulo-avaliacao-ia">
      <div className={estilos.avaliacaoTopo}>
        <h2 id="titulo-avaliacao-ia" className={estilosTela.secaoTitulo}>
          Adequação ao seu carro
        </h2>
        <span className={estilos.nota}>
          <strong className="numeros">{item.adequacao.nota}</strong>/100 <ChipIA />
        </span>
      </div>
      <ul className={estilos.fatores}>
        {item.adequacao.fatores.map((f) => {
          const { Icone, classe, leitura } = ICONE_IMPACTO[f.impacto]
          return (
            <li key={f.codigo} className={estilos.fator}>
              <Icone aria-hidden size={20} className={classe} strokeWidth={f.impacto === 'POSITIVO' ? 3 : 2} />
              <span className={estilos.fatorTitulo}>
                {f.texto}
                <span className="visualmente-oculto">: {leitura}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function PorQue({
  item,
  recomendacaoId,
  criterio,
  emMovimento,
}: {
  item: ItemRecomendacao
  recomendacaoId: string
  criterio: CriterioRecomendacao
  emMovimento: boolean
}) {
  const fila =
    item.fonteEspera === 'SEM_INFORMACAO' ? 'sem info de fila' : `${item.veiculosNaFila ?? 0} na fila`
  return (
    <div className={estilosTela.tela}>
      <Cabecalho titulo="Por que este posto?" direita={<ChipParado emMovimento={emMovimento} />} />
      <div className={estilos.resumo}>
        <strong>{item.ponto.nome}</strong>
        <span>
          <strong className={`${estilos.resumoTempo} numeros`}>{minutos(item.tempoTotalMin)}</strong>
          <small> no total</small>
        </span>
      </div>
      <BlocoExplicacao recomendacaoId={recomendacaoId} criterio={criterio} item={item} />
      {criterio === 'IA' ? (
        <AvaliacaoIA item={item} />
      ) : (
        <p className={estilosTela.nota}>A IA não respondeu: este posto foi escolhido pelo menor tempo total.</p>
      )}
      <section className={estilosTela.pilhaPequena} aria-labelledby="titulo-fatores">
        <h2 id="titulo-fatores" className={estilosTela.secaoTitulo}>
          Regras conferidas
        </h2>
        <ul className={estilos.fatores}>
          <Fator ok titulo="Compatível com o seu carro" valor={item.conector ? NOMES_CONECTOR[item.conector.tipo] : '-'} />
          <Fator ok titulo="Dá para chegar com a bateria" valor={`chega com ${item.nivelChegadaPct}%`} />
          <Fator ok titulo="Ponto disponível" valor={fila} />
          <Fator ok={!item.desatualizado} titulo="Informação recente" valor={haQuantoTempo(item.atualizadoHaMin)} />
        </ul>
      </section>
      <TempoPartes item={item} comIcones={false} compacto />
      <BotaoLink to={`/navegacao/${item.ponto.id}`} className={estilosTela.empurrar}>
        Ir agora
      </BotaoLink>
    </div>
  )
}

/** Detalhe do ponto e "Por que este posto?" (com o carro parado). */
export function Posto() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const emMovimento = useEmMovimento()
  const { posicao } = useLocalizacao()
  const { recomendacao, itemDoPonto } = useRecomendacao()
  const item = itemDoPonto(id)

  useCenaMapa({
    usuario: posicao,
    rota: item && posicao ? { de: posicao, para: item.ponto.localizacao } : null,
    marcadores: item
      ? [{ id: item.ponto.id, posicao: item.ponto.localizacao, nome: item.ponto.nome, destaque: true, etiqueta: item.ponto.nome }]
      : [],
    descricao: item ? `Rota até ${item.ponto.nome}` : 'Mapa',
  })

  if (!item || !recomendacao) {
    return (
      <div className={estilosTela.tela}>
        <Cabecalho titulo="Posto" voltarPara="/mapa" />
        <p>Esta recomendação expirou. Volte ao mapa para calcular de novo.</p>
        <BotaoLink to="/mapa">Voltar para o mapa</BotaoLink>
      </div>
    )
  }

  if (params.get('ver') === 'por-que') {
    return <PorQue item={item} recomendacaoId={recomendacao.id} criterio={recomendacao.criterio} emMovimento={emMovimento} />
  }

  return (
    <div className={estilosTela.tela}>
      <Cabecalho titulo={item.ponto.nome} direita={<ChipParado emMovimento={emMovimento} />} />
      <p className={estilos.endereco}>{item.ponto.endereco}</p>
      <MapaMini de={posicao} para={item.ponto.localizacao} descricao={`Trajeto de ${item.distanciaKm} km até ${item.ponto.nome}`} />

      <section className={estilosTela.cartao} aria-labelledby="titulo-tempo">
        <h2 id="titulo-tempo" className={estilos.rotuloPequeno}>
          Tempo total estimado
        </h2>
        <p className={`${estilos.tempoGrande} numeros`}>{item.tempoTotalMin} min</p>
        <BarraTempo item={item} />
      </section>

      <Link to={`/posto/${item.ponto.id}?ver=por-que`} className={estilos.linhaLink}>
        Por que este posto?
        <ChevronRight aria-hidden size={20} />
      </Link>

      <dl className={estilos.dados}>
        <div className={estilosTela.linhaInfo}>
          <dt>Conector</dt>
          <dd>{item.conector ? NOMES_CONECTOR[item.conector.tipo] : '-'}</dd>
        </div>
        <div className={estilosTela.linhaInfo}>
          <dt>Potência do carregador</dt>
          <dd className="numeros">{item.conector ? `${item.conector.potenciaKW} kW` : '-'}</dd>
        </div>
        <div className={estilosTela.linhaInfo}>
          <dt>Potência que o seu carro usa</dt>
          <dd className="numeros">{item.potenciaEfetivaKW ? `${Math.round(item.potenciaEfetivaKW)} kW` : '-'}</dd>
        </div>
        {recomendacao.criterio === 'IA' && item.adequacao && (
          <div className={estilosTela.linhaInfo}>
            <dt>Adequação ao seu carro</dt>
            <dd className={estilos.notaLinha}>
              <span className="numeros">{item.adequacao.nota}/100</span> <ChipIA />
            </dd>
          </div>
        )}
        <div className={estilosTela.linhaInfo}>
          <dt>Distância</dt>
          <dd className="numeros">{km(item.distanciaKm)}</dd>
        </div>
      </dl>

      <section className={estilosTela.cartao} aria-labelledby="titulo-fila">
        <div className={estilos.filaTopo}>
          <h2 id="titulo-fila" className={estilos.filaTitulo}>
            Fila agora
          </h2>
          <span className={estilos.filaFonte}>
            {item.fonteEspera === 'SEM_INFORMACAO'
              ? 'Sem informação da estação'
              : `Informada pela estação · ${haQuantoTempo(item.atualizadoHaMin)}`}
          </span>
        </div>
        {item.fonteEspera !== 'SEM_INFORMACAO' && (
          <p>
            <strong>{carrosNaFila(item.veiculosNaFila ?? 0)}</strong> · espera de {minutos(item.tempoEsperaMin)}
          </p>
        )}
        <BotaoLink to={`/posto/${item.ponto.id}/fila`} variante="secundario" tamanho="parado" icone={null}>
          Reportar fila <ChipPontos />
        </BotaoLink>
      </section>

      <BotaoLink to={`/navegacao/${item.ponto.id}`}>Ir agora</BotaoLink>
    </div>
  )
}
