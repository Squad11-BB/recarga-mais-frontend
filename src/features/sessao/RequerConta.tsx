import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { Botao } from '../../components/Botao'
import { FolhaInferior } from '../../components/FolhaInferior'
import estilosTela from '../../pages/Tela.module.css'
import { useSessao } from './sessao'
import estilos from './RequerConta.module.css'

/**
 * Como convidado, a pessoa segue planejando e vendo recomendações.
 * Reportar fila, salvar veículos e ver o histórico pedem uma conta.
 */
export function RequerConta({ children }: { children: ReactNode }) {
  const { usuario } = useSessao()
  const navegar = useNavigate()
  const { pathname } = useLocation()

  if (usuario?.papel === 'MOTORISTA') return <>{children}</>

  const voltar = encodeURIComponent(pathname)
  const fechar = () => (window.history.length > 1 ? navegar(-1) : navegar('/mapa'))

  return (
    <div className={estilos.fundo}>
      <div className={estilosTela.esqueletoTela} aria-hidden>
        <div className="esqueleto" style={{ height: 40, width: 160 }} />
        <div className="esqueleto" style={{ height: 96 }} />
        <div className="esqueleto" style={{ height: 96 }} />
      </div>
      <FolhaInferior
        modal
        titulo="Crie uma conta para continuar"
        icone={<UserPlus size={26} />}
        aoFechar={fechar}
      >
        <p className={`${estilosTela.subtitulo} ${estilosTela.centro}`}>
          Para reportar fila, salvar veículos e ver o histórico, você precisa de uma conta. Como convidado, você segue
          planejando e vendo recomendações.
        </p>
        <div className={estilosTela.pilha}>
          <Botao tamanho="parado" onClick={() => navegar(`/cadastro?voltar=${voltar}`)}>
            Criar conta
          </Botao>
          <Botao tamanho="parado" variante="secundario" onClick={() => navegar(`/login?voltar=${voltar}`)}>
            Já tenho conta · Entrar
          </Botao>
          <Botao tamanho="parado" variante="texto" onClick={fechar}>
            Agora não
          </Botao>
        </div>
      </FolhaInferior>
    </div>
  )
}
