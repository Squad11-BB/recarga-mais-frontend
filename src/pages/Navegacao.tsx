import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CornerUpRight, MapPinCheck } from 'lucide-react'
import { Botao, BotaoLink } from '../components/Botao'
import { useCenaMapa } from '../components/mapa/cena'
import { useEmMovimento } from '../features/conducao/useEmMovimento'
import { useLocalizacao } from '../features/localizacao/localizacao'
import { useRecomendacao } from '../features/recomendacao/recomendacao'
import { distanciaKm } from '../lib/geo'
import { horaDaqui, km, minutos } from '../lib/formato'
import estilos from './Navegacao.module.css'

/** Distância que conta como "chegou". */
const CHEGADA_KM = 0.08

/**
 * Passo 5: rota, chegada e fila no posto.
 * Sem serviço de rotas, mostramos a distância restante até o posto,
 * recalculada a cada atualização do GPS.
 */
export function Navegacao() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const emMovimento = useEmMovimento()
  const { posicao } = useLocalizacao()
  const { itemDoPonto } = useRecomendacao()
  const item = itemDoPonto(id)

  const restanteKm = item && posicao ? distanciaKm(posicao, item.ponto.localizacao) * 1.35 : (item?.distanciaKm ?? 0)
  const proporcao = item && item.distanciaKm > 0 ? Math.min(1, restanteKm / item.distanciaKm) : 1
  const restanteMin = item ? Math.max(1, Math.round(item.tempoDeslocamentoMin * proporcao)) : 0
  const chegou = restanteKm <= CHEGADA_KM

  useCenaMapa({
    usuario: posicao,
    rota: item && posicao ? { de: posicao, para: item.ponto.localizacao } : null,
    marcadores: item
      ? [{ id: item.ponto.id, posicao: item.ponto.localizacao, nome: item.ponto.nome, destaque: true, etiqueta: item.ponto.nome }]
      : [],
    descricao: item ? `Navegando até ${item.ponto.nome}. Faltam ${km(restanteKm)}.` : 'Mapa',
  })

  if (!item) return <Navigate to="/mapa" replace />

  return (
    <div className={estilos.tela}>
      <h1 className="visualmente-oculto">Navegação até {item.ponto.nome}</h1>
      <div className={estilos.instrucao} role="status" aria-live="polite">
        {chegou ? <MapPinCheck aria-hidden size={44} /> : <CornerUpRight aria-hidden size={44} />}
        <div>
          <p className={`${estilos.distancia} numeros`}>{chegou ? 'Você chegou' : km(restanteKm)}</p>
          <p className={estilos.rua}>{chegou ? item.ponto.nome : `até ${item.ponto.nome}`}</p>
        </div>
      </div>

      <div className={estilos.base}>
        <div className={estilos.resumo}>
          <div className={estilos.resumoLinha}>
            <p className={`${estilos.tempo} numeros`}>{chegou ? '0 min' : minutos(restanteMin)}</p>
            <p className={`${estilos.km} numeros`}>{km(restanteKm)}</p>
          </div>
          <p className={estilos.chegada}>Chegada às {horaDaqui(chegou ? 0 : restanteMin)}</p>
          <p className={estilos.fila}>
            Fila no posto: <strong className="numeros">{minutos(item.tempoEsperaMin)}</strong>
          </p>
        </div>

        {emMovimento ? (
          <Botao variante="secundario" tamanho="parado" bloqueado>
            Reportar fila ao estacionar
          </Botao>
        ) : (
          <BotaoLink to={`/posto/${item.ponto.id}/fila`} variante="secundario" tamanho="parado">
            Reportar fila
          </BotaoLink>
        )}
        <Botao variante="secundario" onClick={() => navegar('/mapa', { replace: true })}>
          Encerrar rota
        </Botao>
      </div>
    </div>
  )
}
