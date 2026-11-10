import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Minus, PartyPopper, Plus } from 'lucide-react'
import { Aviso } from '../components/Aviso'
import { Botao, BotaoLink } from '../components/Botao'
import { Cabecalho } from '../components/Cabecalho'
import { ChipPontos } from '../components/Chips'
import { useRecomendacao } from '../features/recomendacao/recomendacao'
import { useSessao } from '../features/sessao/sessao'
import { api } from '../services/api'
import { FalhaApi } from '../services/http'
import estilosTela from './Tela.module.css'
import estilos from './ReportarFila.module.css'

/** Relato colaborativo de fila (só com conta e com o carro parado). */
export function ReportarFila() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const { token } = useSessao()
  const { itemDoPonto } = useRecomendacao()
  const item = itemDoPonto(id)
  const [carros, setCarros] = useState(item?.veiculosNaFila ?? 0)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState<FalhaApi | null>(null)

  const enviar = async () => {
    if (!token) return
    setEnviando(true)
    setErro(null)
    try {
      await api.reportarFila(id, carros, token)
      setEnviado(true)
    } catch (e) {
      setErro(e instanceof FalhaApi ? e : new FalhaApi('APP-FILA-001', 'Não foi possível enviar o relato.'))
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className={estilosTela.tela}>
        <Cabecalho titulo="Reportar fila" voltarPara={`/posto/${id}`} />
        <div className={`${estilosTela.pilha} ${estilosTela.centro}`} role="status">
          <span className={estilosTela.iconeCirculo}>
            <PartyPopper aria-hidden size={26} />
          </span>
          <h2 className={estilosTela.titulo}>Obrigado!</h2>
          <p className={estilosTela.subtitulo}>Seu relato ajuda outros motoristas e vale pontos.</p>
        </div>
        <BotaoLink to="/mapa" className={estilosTela.empurrar}>
          Voltar para o mapa
        </BotaoLink>
      </div>
    )
  }

  return (
    <div className={estilosTela.tela}>
      <Cabecalho titulo="Reportar fila" direita={<ChipPontos />} />
      {item && <p className={estilosTela.subtitulo}>{item.ponto.nome}</p>}

      <section className={estilosTela.cartao} aria-labelledby="pergunta-fila">
        <h2 id="pergunta-fila" className={estilos.pergunta}>
          Quantos carros estão esperando?
        </h2>
        <div className={estilos.contador}>
          <button
            type="button"
            className={estilos.passo}
            aria-label="Menos um carro"
            onClick={() => setCarros((c) => Math.max(0, c - 1))}
            disabled={carros === 0}
          >
            <Minus aria-hidden size={28} />
          </button>
          <output className={`${estilos.valor} numeros`} aria-live="polite">
            {carros}
          </output>
          <button
            type="button"
            className={estilos.passo}
            aria-label="Mais um carro"
            onClick={() => setCarros((c) => Math.min(30, c + 1))}
          >
            <Plus aria-hidden size={28} />
          </button>
        </div>
        <p className={estilosTela.nota}>Conte só quem está esperando, não quem já está carregando.</p>
      </section>

      {erro && (
        <Aviso tipo="erro" titulo="Não foi possível enviar">
          {erro.mensagem} Código {erro.codigo}.
        </Aviso>
      )}

      <div className={`${estilosTela.pilha} ${estilosTela.empurrar}`}>
        <Botao onClick={enviar} carregando={enviando} textoCarregando="Enviando">
          Enviar relato
        </Botao>
        <Botao variante="texto" tamanho="parado" onClick={() => navegar(-1)}>
          Cancelar
        </Botao>
      </div>
    </div>
  )
}
