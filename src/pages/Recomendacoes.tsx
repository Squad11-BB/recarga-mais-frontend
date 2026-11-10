import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, Loader2, RefreshCw, RotateCw } from 'lucide-react'
import { Aviso } from '../components/Aviso'
import { Botao, BotaoLink } from '../components/Botao'
import { Cabecalho } from '../components/Cabecalho'
import { CardMelhorOpcao, LinhaAlternativa } from '../components/CardRecomendacao'
import { useCenaMapa } from '../components/mapa/cena'
import { useLocalizacao } from '../features/localizacao/localizacao'
import { RAIO_MAXIMO_KM, useRecomendacao } from '../features/recomendacao/recomendacao'
import { useVeiculo } from '../features/veiculo/veiculo'
import { km, minutos } from '../lib/formato'
import { usePainelDoCarro } from '../lib/useMediaQuery'
import { MENSAGENS_SEM_PONTOS } from '../features/recomendacao/mensagens'
import estilosTela from './Tela.module.css'
import estilos from './Recomendacoes.module.css'

const ETAPAS = ['Trajeto até os postos', 'Compatibilidade e alcance', 'Posto mais adequado (IA)']

/** Etapas do cálculo, para a espera não parecer travada. Avançam com o tempo. */
function Carregando({ aoCancelar }: { aoCancelar(): void }) {
  const [etapa, setEtapa] = useState(0)
  useEffect(() => {
    const a = setTimeout(() => setEtapa(1), 500)
    const b = setTimeout(() => setEtapa(2), 1000)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [])

  return (
    <div className={estilosTela.tela}>
      <Cabecalho titulo="Recomendações" aoVoltar={aoCancelar} />
      <div className={estilos.calculando} role="status" aria-live="polite">
        <Loader2 aria-hidden size={48} className={estilos.giro} />
        <h2 className={estilos.calculandoTitulo}>Calculando o melhor carregador</h2>
        <p className={estilosTela.subtitulo}>Aguarde um instante.</p>
      </div>
      <ol className={estilos.etapas} aria-label="Etapas do cálculo">
        {ETAPAS.map((e, i) => {
          const situacao = i < etapa ? 'pronto' : i === etapa ? 'calculando' : 'na fila'
          return (
            <li key={e} className={estilos.etapa} data-situacao={situacao}>
              {situacao === 'pronto' ? (
                <CheckCircle2 aria-hidden size={22} className={estilos.ok} />
              ) : situacao === 'calculando' ? (
                <Loader2 aria-hidden size={22} className={`${estilos.giro} ${estilos.azul}`} />
              ) : (
                <Circle aria-hidden size={22} className={estilos.cinza} />
              )}
              <span className={estilos.etapaRotulo}>{e}</span>
              <span className={estilos.etapaSituacao}>{situacao}</span>
            </li>
          )
        })}
      </ol>
      <div className={estilos.esqueleto} aria-hidden>
        <div className="esqueleto" style={{ height: 14, width: '40%' }} />
        <div className="esqueleto" style={{ height: 30, width: '60%' }} />
      </div>
      <Botao variante="secundario" className={estilosTela.empurrar} onClick={aoCancelar}>
        Cancelar
      </Botao>
    </div>
  )
}

/** Passo 4 (IA): uma recomendação e o botão Ir agora. */
export function Recomendacoes() {
  const navegar = useNavigate()
  const painelDoCarro = usePainelDoCarro()
  const { posicao, consentimento, estadoGps } = useLocalizacao()
  const { veiculo } = useVeiculo()
  const { estado, recomendacao, erro, destino, carregar, cancelar, raioKm, ampliarBusca } = useRecomendacao()
  const [mostrarOutras, setMostrarOutras] = useState(false)

  // Toda vez que a tela abre, recalcula (destino ou dados podem ter mudado).
  // Também recalcula quando a primeira posição do GPS chega (tela aberta direto pelo endereço).
  const temOrigem = Boolean(posicao ?? destino)
  useEffect(() => {
    if (temOrigem) void carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raioKm, temOrigem])

  const melhor = estado === 'pronto' ? (recomendacao?.itens[0] ?? null) : null
  const outras = recomendacao?.itens.slice(1, 3) ?? []

  useCenaMapa({
    usuario: posicao,
    rota: melhor && posicao ? { de: posicao, para: melhor.ponto.localizacao } : null,
    rotulo: melhor ? `${km(melhor.distanciaKm)} até o posto` : undefined,
    marcadores: melhor
      ? [
          {
            id: melhor.ponto.id,
            posicao: melhor.ponto.localizacao,
            nome: melhor.ponto.nome,
            destaque: true,
            etiqueta: melhor.ponto.nome,
          },
        ]
      : [],
    descricao: melhor ? `Rota até ${melhor.ponto.nome}` : 'Mapa',
  })

  const aguardandoGps = consentimento === 'concedido' && (estadoGps === 'buscando' || estadoGps === 'desligado')
  if (!veiculo || (!posicao && !destino && !aguardandoGps)) return <Navigate to="/mapa" replace />

  const voltar = () => {
    cancelar()
    navegar(-1)
  }

  if (estado === 'carregando' || estado === 'ocioso') return <Carregando aoCancelar={voltar} />

  if (estado === 'erro') {
    return (
      <div className={estilosTela.tela}>
        <Cabecalho titulo="Recomendações" voltarPara="/mapa" />
        <Aviso
          tipo="erro"
          titulo="Não foi possível calcular agora"
          acoes={
            <Botao tamanho="parado" variante="secundario" icone={<RefreshCw aria-hidden size={18} />} onClick={() => void carregar()}>
              Tentar novamente
            </Botao>
          }
        >
          {erro?.mensagem}
          <span className={estilos.codigo}>Código {erro?.codigo}</span>
        </Aviso>
      </div>
    )
  }

  if (!melhor) {
    const mensagem = MENSAGENS_SEM_PONTOS[recomendacao?.motivoSemPontos ?? 'NENHUM_PROXIMO']
    return (
      <div className={estilosTela.tela}>
        <Cabecalho titulo="Recomendações" voltarPara="/mapa" />
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
      </div>
    )
  }

  const iaFalhou = recomendacao?.avisos.includes('IA_INDISPONIVEL')
  const deslocamentoEstimado = recomendacao?.avisos.includes('DESLOCAMENTO_ESTIMADO')
  const criterio = recomendacao?.criterio ?? 'TEMPO_TOTAL'

  return (
    <div className={estilosTela.tela}>
      <Cabecalho titulo="Melhor opção" voltarPara="/mapa" />
      {destino && <p className={estilos.destino}>A caminho de {destino.nome}</p>}

      {iaFalhou && (
        <Aviso
          titulo="Escolha por IA indisponível"
          acoes={
            <Botao tamanho="parado" variante="secundario" icone={<RotateCw aria-hidden size={18} />} onClick={() => void carregar()}>
              Tentar a IA de novo
            </Botao>
          }
        >
          Mostrando o posto com menor tempo total. Compatibilidade, alcance e fila continuam valendo.
        </Aviso>
      )}
      {deslocamentoEstimado && (
        <Aviso tipo="info" titulo="Tempo de viagem estimado">
          O serviço de rotas demorou para responder. Usamos uma distância aproximada.
        </Aviso>
      )}

      <CardMelhorOpcao item={melhor} criterio={criterio} />
      <BotaoLink to={`/navegacao/${melhor.ponto.id}`}>Ir agora</BotaoLink>

      {outras.length > 0 &&
        (painelDoCarro && !mostrarOutras ? (
          <Botao variante="secundario" tamanho="parado" onClick={() => setMostrarOutras(true)}>
            Outras opções ({outras.length})
          </Botao>
        ) : (
          <section className={estilosTela.pilhaPequena} aria-label="Outras opções">
            <h2 className={estilosTela.secaoTitulo}>Outras opções</h2>
            {outras.map((item) => (
              <LinhaAlternativa key={item.ponto.id} item={item} />
            ))}
          </section>
        ))}

      {criterio === 'IA' && (
        <p className={estilosTela.nota}>
          A IA escolhe, entre os postos compatíveis e alcançáveis, o que combina melhor com o seu carro. Sem a IA, vale o
          menor tempo total.
        </p>
      )}
      <p className="visualmente-oculto" role="status">
        Melhor opção: {melhor.ponto.nome}, {minutos(melhor.tempoTotalMin)} no total.
      </p>
    </div>
  )
}
