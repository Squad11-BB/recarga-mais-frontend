import { type ReactNode, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleUserRound, MapPinOff, RefreshCw } from 'lucide-react'
import { Atalhos } from '../components/Atalhos'
import { Aviso } from '../components/Aviso'
import { Botao } from '../components/Botao'
import { BotaoVoz } from '../components/BotaoVoz'
import { CardMelhorAgora } from '../components/CardRecomendacao'
import { ChipBateria } from '../components/ChipBateria'
import { useCenaMapa } from '../components/mapa/cena'
import { useDestinos } from '../features/destino/useDestinos'
import { useLocalizacao } from '../features/localizacao/localizacao'
import { RAIO_MAXIMO_KM, useRecomendacao } from '../features/recomendacao/recomendacao'
import { MENSAGENS_SEM_PONTOS } from '../features/recomendacao/mensagens'
import { useSessao } from '../features/sessao/sessao'
import { useVeiculo } from '../features/veiculo/veiculo'
import { minutos } from '../lib/formato'
import { usePainelDoCarro } from '../lib/useMediaQuery'
import estilos from './Mapa.module.css'

/** Passo 1: o app abre direto no mapa e já mostra a melhor opção. */
export function Mapa() {
  const navegar = useNavigate()
  const painelDoCarro = usePainelDoCarro()
  const { usuario } = useSessao()
  const { consentimento, posicao, estadoGps, conceder } = useLocalizacao()
  const { veiculo } = useVeiculo()
  const { estado, recomendacao, erro, carregar, definirDestino, raioKm, ampliarBusca } = useRecomendacao()
  const { atalhos } = useDestinos()

  // Primeira vez: consentimento de localização e depois o veículo.
  useEffect(() => {
    if (consentimento === 'pendente') navegar('/localizacao', { replace: true })
    else if (!veiculo) navegar('/veiculo', { replace: true })
  }, [consentimento, veiculo, navegar])

  // Assim que houver posição e veículo, calcula a melhor opção.
  const chavePosicao = posicao ? `${posicao.lat.toFixed(3)},${posicao.lng.toFixed(3)}` : null
  useEffect(() => {
    if (!chavePosicao || !veiculo) return
    definirDestino(null)
    void carregar()
    // Recalcula quando a posição muda uns 100 m, o veículo muda ou a área de busca aumenta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chavePosicao, veiculo?.modeloId, veiculo?.nivelBateriaPct, raioKm])

  const melhor = recomendacao?.itens[0] ?? null

  useCenaMapa({
    usuario: posicao,
    rota: null,
    rotulo: 'Postos próximos',
    marcadores: (recomendacao?.itens ?? []).slice(0, 6).map((item, i) => ({
      id: item.ponto.id,
      posicao: item.ponto.localizacao,
      nome: item.ponto.nome,
      destaque: i === 0,
      etiqueta: i === 0 && painelDoCarro ? `${item.ponto.nome} · ${minutos(item.tempoTotalMin)}` : undefined,
      aoTocar: () => navegar(`/posto/${item.ponto.id}`),
    })),
    descricao: melhor
      ? `Mapa com ${recomendacao?.itens.length} postos próximos. Melhor opção: ${melhor.ponto.nome}, ${melhor.tempoTotalMin} minutos no total.`
      : 'Mapa da cidade',
  })

  const escolherAtalho = (atalho: 'casa' | 'trabalho' | 'outros') => {
    if (atalho === 'outros') return navegar('/destino')
    const destino = atalhos[atalho]
    if (!destino) return navegar(`/destino?definir=${atalho}`)
    definirDestino(destino)
    navegar('/recomendacoes')
  }

  let conteudoCard: ReactNode = null
  if (!posicao) {
    const bloqueadoNoNavegador = estadoGps === 'bloqueado'
    conteudoCard = (
      <Aviso
        titulo="Sem acesso à localização"
        icone={<MapPinOff aria-hidden size={22} />}
        acoes={
          <>
            <Botao
              tamanho="parado"
              variante="secundario"
              onClick={conceder}
              disabled={bloqueadoNoNavegador || estadoGps === 'buscando'}
              carregando={estadoGps === 'buscando'}
              textoCarregando="Buscando sua localização"
            >
              Ativar localização
            </Botao>
            <Botao tamanho="parado" variante="secundario" onClick={() => navegar('/destino?modo=origem')}>
              Informar minha localização
            </Botao>
          </>
        }
      >
        {bloqueadoNoNavegador
          ? 'A localização está bloqueada no navegador. Libere nas configurações do site ou informe onde você está.'
          : 'Mostrando a cidade. Diga o destino ou ative a localização.'}
      </Aviso>
    )
  } else if (estado === 'erro') {
    conteudoCard = (
      <Aviso
        tipo="erro"
        titulo="Não foi possível calcular agora"
        acoes={
          <Botao tamanho="parado" variante="secundario" icone={<RefreshCw aria-hidden size={18} />} onClick={() => void carregar()}>
            Tentar novamente
          </Botao>
        }
      >
        {erro?.mensagem} <span className={estilos.codigo}>Código {erro?.codigo}</span>
      </Aviso>
    )
  } else if (melhor) {
    conteudoCard = <CardMelhorAgora item={melhor} criterio={recomendacao!.criterio} />
  } else if (recomendacao?.motivoSemPontos && estado === 'pronto') {
    const mensagem = MENSAGENS_SEM_PONTOS[recomendacao.motivoSemPontos]
    conteudoCard = (
      <Aviso
        titulo={mensagem.titulo}
        acoes={
          raioKm < RAIO_MAXIMO_KM ? (
            <Botao tamanho="parado" variante="secundario" onClick={ampliarBusca}>
              Aumentar a busca para {Math.min(RAIO_MAXIMO_KM, raioKm * 2)} km
            </Botao>
          ) : undefined
        }
      >
        {mensagem.texto}
      </Aviso>
    )
  } else if (veiculo) {
    conteudoCard = (
      <div className={estilos.cardCarregando} role="status" aria-label="Calculando a melhor opção">
        <div className="esqueleto" style={{ height: 22, width: 150 }} />
        <div className="esqueleto" style={{ height: 26, width: '70%' }} />
        <div className="esqueleto" style={{ height: 18, width: '55%' }} />
        <div className="esqueleto" style={{ height: 'var(--alvo-dirigindo)', borderRadius: 18 }} />
      </div>
    )
  }

  return (
    <div className={estilos.tela}>
      <h1 className="visualmente-oculto">Recarga+ · Mapa</h1>
      <div className={estilos.topo}>
        <div className={estilos.linhaTopo}>
          <ChipBateria expandido={painelDoCarro} />
          <Link
            to={usuario ? '/perfil' : '/login'}
            className={estilos.avatar}
            aria-label={usuario ? `Perfil de ${usuario.nome}` : 'Entrar ou criar conta'}
          >
            <CircleUserRound aria-hidden size={24} />
          </Link>
        </div>
        <div aria-live="polite">{conteudoCard}</div>
      </div>

      <div className={estilos.base}>
        <BotaoVoz onAbrir={() => navegar('/destino')} onFalar={() => navegar('/destino?falar=1')} />
        <Atalhos aoEscolher={escolherAtalho} />
      </div>
    </div>
  )
}
