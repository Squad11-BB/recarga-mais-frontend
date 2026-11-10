import { type ComponentType, lazy } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { Carregando } from './components/Carregando'
import { SoParado } from './features/conducao/SoParado'
import { ComContaParado } from './features/sessao/ComContaParado'
import { RequerPapel } from './features/sessao/RequerPapel'
import { LayoutApp, type ModoTela } from './layouts/LayoutApp'
import { Cadastro } from './pages/Cadastro'
import { Garagem, Historico, Perfil, Privacidade } from './pages/Conta'
import { Localizacao } from './pages/Localizacao'
import { Login } from './pages/Login'
import { Mapa } from './pages/Mapa'
import { Navegacao } from './pages/Navegacao'
import { NaoEncontrada } from './pages/NaoEncontrada'
import { ParaOnde } from './pages/ParaOnde'
import { Posto } from './pages/Posto'
import { Recomendacoes } from './pages/Recomendacoes'
import { ReportarFila } from './pages/ReportarFila'
import { Veiculo } from './pages/Veiculo'

// O painel web é carregado à parte: quem usa o app no carro não baixa esse código.
function carregar<T extends Record<string, unknown>>(importar: () => Promise<T>, nome: keyof T) {
  return lazy(async () => ({ default: (await importar())[nome] as ComponentType }))
}
const LayoutPainel = carregar(() => import('./layouts/LayoutPainel'), 'LayoutPainel')
const PainelLogin = carregar(() => import('./pages/painel/PainelLogin'), 'PainelLogin')
const SolicitarCadastro = carregar(() => import('./pages/painel/SolicitarCadastro'), 'SolicitarCadastro')
const FilaStatus = carregar(() => import('./pages/painel/FilaStatus'), 'FilaStatus')
const Metricas = carregar(() => import('./pages/painel/Metricas'), 'Metricas')
const PontosRecarga = carregar(() => import('./pages/painel/OutrasPainel'), 'PontosRecarga')
const PostosRede = carregar(() => import('./pages/painel/OutrasPainel'), 'PostosRede')
const PerfilPainel = carregar(() => import('./pages/painel/OutrasPainel'), 'PerfilPainel')

const sobreMapa = { modo: 'sobreMapa' satisfies ModoTela }
const tela = { modo: 'tela' satisfies ModoTela }

/** Rotas conforme a tabela da seção 3 do documento. */
export const roteador = createBrowserRouter([
  { path: '/', element: <Navigate to="/mapa" replace /> },
  {
    element: <LayoutApp />,
    children: [
      { path: '/mapa', element: <Mapa />, handle: sobreMapa },
      { path: '/localizacao', element: <Localizacao />, handle: sobreMapa },
      { path: '/veiculo', element: <Veiculo />, handle: sobreMapa },
      { path: '/destino', element: <ParaOnde />, handle: tela },
      { path: '/recomendacoes', element: <Recomendacoes />, handle: tela },
      {
        path: '/posto/:id',
        element: (
          <SoParado>
            <Posto />
          </SoParado>
        ),
        handle: tela,
      },
      { path: '/navegacao/:id', element: <Navegacao />, handle: sobreMapa },
      { path: '/login', element: <Login />, handle: tela },
      { path: '/cadastro', element: <Cadastro />, handle: tela },
      { path: '/privacidade', element: <Privacidade />, handle: tela },
      {
        element: <ComContaParado />,
        children: [
          { path: '/posto/:id/fila', element: <ReportarFila />, handle: tela },
          { path: '/garagem', element: <Garagem />, handle: tela },
          { path: '/historico', element: <Historico />, handle: tela },
          { path: '/perfil', element: <Perfil />, handle: tela },
        ],
      },
    ],
  },
  { path: '/painel', element: <Navigate to="/painel/login" replace /> },
  { path: '/painel/login', element: <Carregando><PainelLogin /></Carregando> },
  { path: '/painel/solicitar-cadastro', element: <Carregando><SolicitarCadastro /></Carregando> },
  {
    element: <Carregando><LayoutPainel /></Carregando>,
    children: [
      { path: '/painel/fila', element: <RequerPapel papel="ADMINISTRADOR"><FilaStatus /></RequerPapel> },
      { path: '/painel/pontos', element: <RequerPapel papel="ADMINISTRADOR"><PontosRecarga /></RequerPapel> },
      { path: '/painel/metricas', element: <RequerPapel papel="OPERADOR"><Metricas /></RequerPapel> },
      { path: '/painel/postos', element: <RequerPapel papel="OPERADOR"><PostosRede /></RequerPapel> },
      {
        path: '/painel/perfil',
        element: (
          <RequerPapel>
            <PerfilPainel />
          </RequerPapel>
        ),
      },
    ],
  },
  { path: '*', element: <NaoEncontrada /> },
])
