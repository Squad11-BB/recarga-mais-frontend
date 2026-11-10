import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Botao } from '../../components/Botao'
import { ChipSituacao } from '../../components/Chips'
import { useSessao } from '../../features/sessao/sessao'
import { NOMES_CONECTOR } from '../../features/veiculo/veiculo'
import { api } from '../../services/api'
import type { PontoRecarga } from '../../services/contratos'
import { useMetricas } from '../../features/painel/useMetricas'
import estilosPainel from './Painel.module.css'
import estilos from './OutrasPainel.module.css'

/** Administrador: pontos e conectores do estabelecimento. */
export function PontosRecarga() {
  const { token } = useSessao()
  const [pontos, setPontos] = useState<PontoRecarga[] | null>(null)
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    if (!token) return
    api.listarMeusPontos(token).then(setPontos).catch(() => setFalhou(true))
  }, [token])

  return (
    <>
      <div className={estilosPainel.cabecalho}>
        <h1 className={estilosPainel.titulo}>Pontos de recarga</h1>
      </div>
      {falhou && <p role="alert">Não foi possível carregar os pontos.</p>}
      <ul className={estilos.grade}>
        {(pontos ?? []).map((p) => (
          <li key={p.id} className={estilosPainel.cartao}>
            <div className={estilos.topo}>
              <h2 className={estilos.nome}>{p.nome}</h2>
              <ChipSituacao situacao={p.situacao} />
            </div>
            <p className={estilosPainel.subtitulo}>{p.endereco}</p>
            <ul className={estilos.conectores} aria-label="Conectores">
              {p.conectores.map((c) => (
                <li key={c.id}>
                  {NOMES_CONECTOR[c.tipo]} · {c.potenciaKW} kW {c.correnteDC ? 'DC' : 'AC'}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className={estilosPainel.nota} style={{ textAlign: 'left', marginTop: 16 }}>
        Para incluir pontos ou conectores, fale com a equipe do Recarga+.
      </p>
    </>
  )
}

/** Operador: postos da rede, por espera. */
export function PostosRede() {
  const { dados } = useMetricas('7_DIAS')
  return (
    <>
      <div className={estilosPainel.cabecalho}>
        <h1 className={estilosPainel.titulo}>Postos</h1>
      </div>
      <section className={estilosPainel.cartao} aria-label="Postos por espera nos últimos 7 dias">
        <table className={estilos.tabela}>
          <thead>
            <tr>
              <th scope="col">Posto</th>
              <th scope="col">Espera média (7 dias)</th>
            </tr>
          </thead>
          <tbody>
            {(dados?.postosComMaiorFila ?? []).map((p) => (
              <tr key={p.nome}>
                <th scope="row">{p.nome}</th>
                <td className="numeros">{p.esperaMin} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}

export function PerfilPainel() {
  const { usuario, sair } = useSessao()
  const navegar = useNavigate()
  return (
    <>
      <div className={estilosPainel.cabecalho}>
        <h1 className={estilosPainel.titulo}>Perfil</h1>
      </div>
      <section className={`${estilosPainel.cartao} ${estilosPainel.pilha}`} style={{ maxWidth: 480 }}>
        <strong className={estilos.nome}>{usuario?.nome}</strong>
        <span className={estilosPainel.subtitulo}>{usuario?.email}</span>
        <span className={estilosPainel.subtitulo}>
          Acesso: {usuario?.papel === 'ADMINISTRADOR' ? 'Administrador' : 'Operador'}
        </span>
        <Botao
          variante="secundario"
          tamanho="compacto"
          larguraTotal={false}
          icone={<LogOut aria-hidden size={18} />}
          onClick={() => {
            sair()
            navegar('/painel/login', { replace: true })
          }}
        >
          Sair
        </Botao>
      </section>
    </>
  )
}
