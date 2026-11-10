import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { CriterioRecomendacao, ItemRecomendacao } from '../services/contratos'
import { haQuantoTempo, minutos } from '../lib/formato'
import { BotaoLink } from './Botao'
import { ChipCompativel, ChipDestaque, ChipIA, SeloDesatualizado } from './Chips'
import { TempoPartes } from './TempoPartes'
import estilos from './CardRecomendacao.module.css'

/** Card compacto da tela inicial: "Melhor opção agora" com o botão Ir agora. */
export function CardMelhorAgora({ item, criterio }: { item: ItemRecomendacao; criterio: CriterioRecomendacao }) {
  return (
    <article className={`${estilos.card} ${estilos.melhor}`} aria-labelledby="melhor-agora-nome">
      <div className={estilos.topo}>
        <span className={estilos.selos}>
          <ChipDestaque>Melhor opção agora</ChipDestaque>
          {criterio === 'IA' && <ChipIA />}
        </span>
        {item.conector && <ChipCompativel conector={item.conector.tipo} />}
      </div>
      <Link to={`/posto/${item.ponto.id}`} className={estilos.linkNome}>
        <h2 id="melhor-agora-nome" className={estilos.nomePequeno}>
          {item.ponto.nome}
        </h2>
        <p className={estilos.resumo}>
          <strong className="numeros">{minutos(item.tempoTotalMin)}</strong> no total · chega com{' '}
          <span className="numeros">{item.nivelChegadaPct}%</span>
        </p>
      </Link>
      <BotaoLink to={`/navegacao/${item.ponto.id}`}>Ir agora</BotaoLink>
    </article>
  )
}

function rodapeFila(item: ItemRecomendacao): string {
  const quando = haQuantoTempo(item.atualizadoHaMin)
  if (item.fonteEspera === 'SEM_INFORMACAO') return 'Sem informação de fila'
  return `Fila informada pela estação · atualizada ${quando}`
}

/**
 * Card principal da tela "Melhor opção": o tempo total é o maior texto da tela.
 * Com a IA, o selo diz que o posto é o mais adequado ao carro; sem ela, o de menor tempo total.
 */
export function CardMelhorOpcao({
  item,
  criterio,
  comLinkPorQue = true,
}: {
  item: ItemRecomendacao
  criterio: CriterioRecomendacao
  comLinkPorQue?: boolean
}) {
  const adequacao = criterio === 'IA' ? item.adequacao : null
  return (
    <article className={`${estilos.card} ${estilos.melhor}`} aria-labelledby="melhor-opcao-nome">
      <div className={estilos.topo}>
        <span className={estilos.selos}>
          <ChipDestaque>{adequacao ? 'Mais adequado ao seu carro' : 'Menor tempo total'}</ChipDestaque>
          {adequacao && <ChipIA />}
        </span>
        {item.conector && <ChipCompativel conector={item.conector.tipo} />}
      </div>
      <h2 id="melhor-opcao-nome" className={estilos.nome}>
        {item.ponto.nome}
      </h2>
      <p className={estilos.total}>
        <span className={`${estilos.numeroGrande} numeros`}>{item.tempoTotalMin} min</span>
        <span className={estilos.noTotal}>no total</span>
      </p>
      <TempoPartes item={item} />
      {adequacao && (
        <p className={estilos.adequacao}>
          Adequação ao seu carro: <strong className="numeros">{adequacao.nota}/100</strong>
        </p>
      )}
      <div className={estilos.rodape}>
        <span>
          {rodapeFila(item)}
          {item.desatualizado && item.fonteEspera !== 'SEM_INFORMACAO' && (
            <>
              {' '}
              <SeloDesatualizado haMin={item.atualizadoHaMin} />
            </>
          )}
        </span>
        {comLinkPorQue && (
          <Link to={`/posto/${item.ponto.id}?ver=por-que`} className={estilos.porQue}>
            Por que este posto?
          </Link>
        )}
      </div>
    </article>
  )
}

/** Linha de "Outras opções". */
export function LinhaAlternativa({ item }: { item: ItemRecomendacao }) {
  return (
    <Link to={`/posto/${item.ponto.id}`} className={estilos.alternativa}>
      <span className={estilos.altTexto}>
        <strong>{item.ponto.nome}</strong>
        {item.fonteEspera === 'SEM_INFORMACAO' ? (
          <small>Sem informação de fila</small>
        ) : item.desatualizado ? (
          <SeloDesatualizado haMin={item.atualizadoHaMin} />
        ) : null}
        {item.adequacao && <small className="numeros">Adequação {item.adequacao.nota}/100</small>}
      </span>
      <strong className={`${estilos.altTempo} numeros`}>{minutos(item.tempoTotalMin)}</strong>
      <ChevronRight aria-hidden size={20} />
    </Link>
  )
}
