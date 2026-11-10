import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Lock } from 'lucide-react'
import { Atalhos, ListaDestinos } from '../components/Atalhos'
import { Aviso } from '../components/Aviso'
import { BotaoVoz } from '../components/BotaoVoz'
import { useCenaMapa } from '../components/mapa/cena'
import { useEmMovimento } from '../features/conducao/useEmMovimento'
import { type Atalho, useDestinos } from '../features/destino/useDestinos'
import { useLocalizacao } from '../features/localizacao/localizacao'
import { useRecomendacao } from '../features/recomendacao/recomendacao'
import { useReconhecimentoVoz } from '../features/voz/useReconhecimentoVoz'
import { api } from '../services/api'
import type { Destino } from '../services/contratos'
import estilosTela from './Tela.module.css'
import estilos from './ParaOnde.module.css'

const NOMES_ATALHO: Record<Atalho, string> = { casa: 'Casa', trabalho: 'Trabalho' }

/**
 * Passo 3: destino por voz, atalhos ou recentes. Digitar só com o carro parado.
 * ?modo=origem: informar onde a pessoa está (sem GPS).
 * ?definir=casa|trabalho: escolher o endereço do atalho.
 * ?falar=1: já abre ouvindo.
 */
export function ParaOnde() {
  const navegar = useNavigate()
  const [params, setParams] = useSearchParams()
  const modoOrigem = params.get('modo') === 'origem'
  const definir = params.get('definir') as Atalho | null
  const emMovimento = useEmMovimento()
  const { posicao, definirOrigemManual } = useLocalizacao()
  const { definirDestino } = useRecomendacao()
  const { recentes, atalhos, salvarRecente, definirAtalho } = useDestinos()

  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState<Destino[]>([])
  const [buscando, setBuscando] = useState(false)
  const refCampo = useRef<HTMLInputElement>(null)

  useCenaMapa({
    usuario: posicao,
    rota: null,
    rotulo: 'Destinos recentes',
    marcadores: [],
    descricao: 'Mapa com a sua localização',
  })

  const escolher = useCallback(
    (destino: Destino) => {
      if (definir) {
        definirAtalho(definir, destino)
        setParams({}, { replace: true })
      }
      if (modoOrigem) {
        definirOrigemManual({ nome: destino.nome, localizacao: destino.localizacao })
        navegar('/mapa', { replace: true })
        return
      }
      void salvarRecente(destino)
      definirDestino(destino)
      navegar('/recomendacoes')
    },
    [definir, modoOrigem, definirAtalho, setParams, definirOrigemManual, salvarRecente, definirDestino, navegar],
  )

  const voz = useReconhecimentoVoz(
    useCallback(
      async (falado: string) => {
        setTexto(falado)
        const achados = await api.buscarDestinos(falado, posicao).catch(() => [])
        if (achados.length > 0) escolher(achados[0])
        else voz.definirEstado('nao-entendi')
      },
      // voz.definirEstado é estável (setState).
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [posicao, escolher],
    ),
  )

  // ?falar=1 abre já ouvindo (vindo do microfone do mapa).
  const ouvirAoAbrir = params.get('falar') === '1'
  useEffect(() => {
    if (ouvirAoAbrir) voz.ouvir()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ouvirAoAbrir])

  // Busca digitada (carro parado), com uma pequena espera entre as teclas.
  useEffect(() => {
    if (emMovimento || texto.trim().length < 2) {
      queueMicrotask(() => setResultados([]))
      return
    }
    let ativo = true
    const relogio = setTimeout(() => {
      setBuscando(true)
      api
        .buscarDestinos(texto, posicao)
        .then((lista) => ativo && setResultados(lista))
        .catch(() => ativo && setResultados([]))
        .finally(() => ativo && setBuscando(false))
    }, 250)
    return () => {
      ativo = false
      clearTimeout(relogio)
    }
  }, [texto, emMovimento, posicao])

  useEffect(() => {
    if (!emMovimento) refCampo.current?.focus({ preventScroll: true })
  }, [emMovimento])

  const escolherAtalho = (atalho: Atalho | 'outros') => {
    if (atalho === 'outros') {
      if (emMovimento) voz.ouvir()
      else refCampo.current?.focus()
      return
    }
    const destino = atalhos[atalho]
    if (destino) escolher(destino)
    else setParams({ definir: atalho })
  }

  const titulo = modoOrigem ? 'Onde você está?' : definir ? `Endereço de ${NOMES_ATALHO[definir]}` : 'Para onde?'

  return (
    <div className={estilosTela.tela}>
      <h1 className="visualmente-oculto">{titulo}</h1>
      <div className={estilos.topo}>
        <button type="button" className={estilos.voltar} aria-label="Voltar" onClick={() => navegar(-1)}>
          <ChevronLeft aria-hidden size={24} />
        </button>
        <div className={estilos.barra}>
          <BotaoVoz
            ref={refCampo}
            ouvindo={voz.estado === 'ouvindo'}
            onFalar={() => (voz.estado === 'ouvindo' ? voz.parar() : voz.ouvir())}
            campo={{
              valor: texto,
              onMudar: setTexto,
              bloqueado: emMovimento,
              onEnviar: () => resultados[0] && escolher(resultados[0]),
            }}
          />
        </div>
      </div>

      {emMovimento && (
        <p id="aviso-movimento" className={estilos.avisoMovimento}>
          <Lock aria-hidden size={16} />
          Em movimento, use o microfone para falar o destino.
        </p>
      )}

      {(modoOrigem || definir) && (
        <Aviso tipo="info" titulo={titulo} anunciar={false}>
          {modoOrigem
            ? 'Fale ou digite um endereço perto de você. Usamos esse ponto no lugar do GPS.'
            : `Fale ou digite o endereço de ${NOMES_ATALHO[definir!]} para salvar o atalho.`}
        </Aviso>
      )}

      {voz.estado === 'ouvindo' && (
        <p className={estilos.ouvindo} role="status">
          Ouvindo… diga o destino
        </p>
      )}
      {voz.estado === 'nao-entendi' && (
        <Aviso tipo="erro" titulo="Não entendi o destino">
          Toque no microfone para tentar de novo ou escolha um atalho.
        </Aviso>
      )}
      {voz.estado === 'sem-permissao' && (
        <Aviso tipo="erro" titulo="Sem acesso ao microfone">
          Libere o microfone nas configurações do navegador ou escolha um atalho.
        </Aviso>
      )}
      {voz.estado === 'nao-suportado' && (
        <Aviso titulo="Este navegador não reconhece voz">
          Use os atalhos e os recentes{emMovimento ? '' : ' ou digite o destino'}.
        </Aviso>
      )}

      {!modoOrigem && <Atalhos aoEscolher={escolherAtalho} />}

      {resultados.length > 0 ? (
        <ListaDestinos titulo="Resultados" destinos={resultados} icone="busca" aoEscolher={escolher} />
      ) : texto.trim().length >= 2 && !buscando && !emMovimento && voz.estado !== 'ouvindo' ? (
        <p className={estilosTela.nota} role="status">
          Nenhum lugar encontrado para “{texto}”.
        </p>
      ) : (
        <ListaDestinos titulo="Recentes" destinos={recentes} aoEscolher={escolher} />
      )}
    </div>
  )
}
