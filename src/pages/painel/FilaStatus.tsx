import { useCallback, useEffect, useMemo, useState } from 'react'
import { Minus, Plus, RefreshCw } from 'lucide-react'
import { Aviso } from '../../components/Aviso'
import { Botao } from '../../components/Botao'
import { SeloDesatualizado } from '../../components/Chips'
import { useSessao } from '../../features/sessao/sessao'
import { hora, haQuantoTempo } from '../../lib/formato'
import { api } from '../../services/api'
import type { PontoRecarga, SituacaoPonto } from '../../services/contratos'
import { FalhaApi } from '../../services/http'
import { LIMITE_DESATUALIZADO_MIN, minutosDesde } from '../../lib/tempo'
import estilosPainel from './Painel.module.css'
import estilos from './FilaStatus.module.css'

const SITUACOES: { valor: SituacaoPonto; rotulo: string }[] = [
  { valor: 'LIVRE', rotulo: 'Livre' },
  { valor: 'OCUPADO', rotulo: 'Ocupado' },
  { valor: 'EM_FILA', rotulo: 'Em fila' },
  { valor: 'MANUTENCAO', rotulo: 'Manutenção' },
]

interface Edicao {
  situacao: SituacaoPonto
  fila: number
}

/** Administrador: status, fila e data da atualização (precisa levar menos de 30 s). */
export function FilaStatus() {
  const { token, usuario } = useSessao()
  const [pontos, setPontos] = useState<PontoRecarga[] | null>(null)
  const [edicoes, setEdicoes] = useState<Record<string, Edicao>>({})
  const [erro, setErro] = useState<FalhaApi | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [salvoAs, setSalvoAs] = useState<string | null>(null)
  const [agora, setAgora] = useState(() => new Date())

  const carregar = useCallback(async () => {
    if (!token) return
    setErro(null)
    try {
      const lista = await api.listarMeusPontos(token)
      setPontos(lista)
      setEdicoes(Object.fromEntries(lista.map((p) => [p.id, { situacao: p.situacao, fila: p.veiculosNaFila ?? 0 }])))
    } catch (e) {
      setErro(e instanceof FalhaApi ? e : new FalhaApi('PNL-001', 'Não foi possível carregar os pontos.'))
    }
  }, [token])

  useEffect(() => {
    queueMicrotask(() => void carregar())
  }, [carregar])

  // Atualiza o "há XX min" a cada 30 s.
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const alterados = useMemo(
    () =>
      (pontos ?? []).filter((p) => {
        const e = edicoes[p.id]
        return e && (e.situacao !== p.situacao || e.fila !== (p.veiculosNaFila ?? 0))
      }),
    [pontos, edicoes],
  )

  const salvar = async () => {
    if (!token || !pontos) return
    setSalvando(true)
    setErro(null)
    try {
      // Salva todos: confirmar sem mudança também conta como atualização.
      const lista = await api.atualizarStatus(
        pontos.map((p) => ({ pontoId: p.id, situacao: edicoes[p.id].situacao, veiculosNaFila: edicoes[p.id].fila })),
        token,
      )
      setPontos(lista)
      setSalvoAs(new Date().toISOString())
      setAgora(new Date())
    } catch (e) {
      setErro(e instanceof FalhaApi ? e : new FalhaApi('PNL-002', 'Não foi possível salvar.'))
    } finally {
      setSalvando(false)
    }
  }

  const editar = (id: string, parcial: Partial<Edicao>) =>
    setEdicoes((atual) => ({ ...atual, [id]: { ...atual[id], ...parcial } }))

  const totalFila = Object.values(edicoes).reduce((s, e) => s + e.fila, 0)
  const livres = Object.values(edicoes).filter((e) => e.situacao === 'LIVRE').length
  const ultima = (pontos ?? []).map((p) => p.atualizadoEm).filter(Boolean).sort().at(-1) ?? null

  return (
    <>
      <div className={estilosPainel.cabecalho}>
        <div>
          <p className={estilosPainel.sobretitulo}>Estabelecimento de {usuario?.nome}</p>
          <h1 className={estilosPainel.titulo}>Controle de fila e status</h1>
        </div>
      </div>

      <div className={estilosPainel.estatisticas}>
        <div className={estilosPainel.estatistica}>
          <span>Veículos na fila</span>
          <strong className="numeros">{pontos ? totalFila : '–'}</strong>
        </div>
        <div className={estilosPainel.estatistica}>
          <span>Pontos livres</span>
          <strong className="numeros">{pontos ? livres : '–'}</strong>
        </div>
        <div className={estilosPainel.estatistica}>
          <span>Última atualização</span>
          <strong className="numeros">{hora(ultima)}</strong>
        </div>
      </div>

      {erro && (
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
      )}

      <section className={`${estilosPainel.cartao} ${estilos.tabelaCartao}`} aria-label="Pontos de recarga">
        {!pontos && !erro ? (
          <div className={estilos.carregando} role="status" aria-label="Carregando pontos">
            {[0, 1, 2].map((i) => (
              <div key={i} className="esqueleto" style={{ height: 52 }} />
            ))}
          </div>
        ) : (
          <table className={estilos.tabela}>
            <thead>
              <tr>
                <th scope="col">Ponto</th>
                <th scope="col">Status</th>
                <th scope="col">Veículos na fila</th>
                <th scope="col">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {(pontos ?? []).map((p) => {
                const e = edicoes[p.id]
                const haMin = minutosDesde(p.atualizadoEm, agora)
                const desatualizado = haMin === null || haMin > LIMITE_DESATUALIZADO_MIN
                return (
                  <tr key={p.id}>
                    <th scope="row" className={estilos.nome}>
                      {p.nome}
                    </th>
                    <td>
                      <label className="visualmente-oculto" htmlFor={`status-${p.id}`}>
                        Status de {p.nome}
                      </label>
                      <select
                        id={`status-${p.id}`}
                        className={estilos.select}
                        value={e?.situacao}
                        onChange={(ev) => editar(p.id, { situacao: ev.target.value as SituacaoPonto })}
                      >
                        {SITUACOES.map((s) => (
                          <option key={s.valor} value={s.valor}>
                            {s.rotulo}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className={estilos.contador} role="group" aria-label={`Veículos na fila em ${p.nome}`}>
                        <button
                          type="button"
                          aria-label={`Diminuir fila de ${p.nome}`}
                          onClick={() => editar(p.id, { fila: Math.max(0, e.fila - 1) })}
                          disabled={e?.fila === 0}
                        >
                          <Minus aria-hidden size={18} />
                        </button>
                        <output className="numeros" aria-live="polite">
                          {e?.fila}
                        </output>
                        <button
                          type="button"
                          aria-label={`Aumentar fila de ${p.nome}`}
                          onClick={() => editar(p.id, { fila: Math.min(50, e.fila + 1) })}
                        >
                          <Plus aria-hidden size={18} />
                        </button>
                      </div>
                    </td>
                    <td>{desatualizado ? <SeloDesatualizado haMin={haMin} /> : <span className={estilos.ha}>{haQuantoTempo(haMin)}</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <div className={estilos.rodape}>
          <Botao tamanho="compacto" larguraTotal={false} onClick={salvar} carregando={salvando} textoCarregando="Salvando" disabled={!pontos}>
            Salvar alterações{alterados.length > 0 ? ` (${alterados.length})` : ''}
          </Botao>
          <span className={estilosPainel.subtitulo} role="status">
            {salvoAs ? `Salvo às ${hora(salvoAs)}.` : 'A data e a hora da atualização são registradas ao salvar.'}
          </span>
        </div>
      </section>
    </>
  )
}
