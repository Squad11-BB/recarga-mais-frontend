import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, ListOrdered, LogOut, MapPin, Menu, User, X, Zap } from 'lucide-react'
import { Marca } from '../components/Marca'
import { FaixaSemConexao } from '../components/FaixaSemConexao'
import { useSessao } from '../features/sessao/sessao'
import estilos from './LayoutPainel.module.css'

const ITENS = {
  ADMINISTRADOR: [
    { para: '/painel/fila', rotulo: 'Fila e status', Icone: ListOrdered },
    { para: '/painel/pontos', rotulo: 'Pontos de recarga', Icone: Zap },
    { para: '/painel/perfil', rotulo: 'Perfil', Icone: User },
  ],
  OPERADOR: [
    { para: '/painel/metricas', rotulo: 'Métricas', Icone: BarChart3 },
    { para: '/painel/postos', rotulo: 'Postos', Icone: MapPin },
    { para: '/painel/perfil', rotulo: 'Perfil', Icone: User },
  ],
} as const

const NOME_PAPEL = { ADMINISTRADOR: 'Administrador', OPERADOR: 'Operador' } as const

/** Painel web de gestão: barra lateral de 240 px; em tablet e celular, vira menu. */
export function LayoutPainel() {
  const { usuario, sair } = useSessao()
  const navegar = useNavigate()
  const { pathname } = useLocation()
  const [menuAberto, setMenuAberto] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.contexto = 'painel'
  }, [])

  // Fecha o menu ao trocar de página.
  useEffect(() => {
    queueMicrotask(() => setMenuAberto(false))
  }, [pathname])

  if (!usuario || usuario.papel === 'MOTORISTA') return <Outlet />

  const itens = ITENS[usuario.papel]

  return (
    <div className={estilos.painel}>
      <FaixaSemConexao />
      <header className={estilos.barraTopo}>
        <Marca tamanho={32} />
        <button
          type="button"
          className={estilos.botaoMenu}
          aria-expanded={menuAberto}
          aria-controls="menu-painel"
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuAberto((a) => !a)}
        >
          {menuAberto ? <X aria-hidden size={24} /> : <Menu aria-hidden size={24} />}
        </button>
      </header>

      <aside id="menu-painel" className={`${estilos.lateral} ${menuAberto ? estilos.aberto : ''}`}>
        <div className={estilos.marca}>
          <Marca tamanho={34} />
          <span className={estilos.papel}>{NOME_PAPEL[usuario.papel]}</span>
        </div>
        <nav aria-label="Painel de gestão">
          <ul className={estilos.menu}>
            {itens.map(({ para, rotulo, Icone }) => (
              <li key={para}>
                <NavLink to={para} className={({ isActive }) => `${estilos.item} ${isActive ? estilos.ativo : ''}`}>
                  <Icone aria-hidden size={20} />
                  {rotulo}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          className={estilos.sair}
          onClick={() => {
            sair()
            navegar('/painel/login', { replace: true })
          }}
        >
          <LogOut aria-hidden size={20} />
          Sair
        </button>
      </aside>

      <main className={estilos.conteudo}>
        <Outlet />
      </main>
    </div>
  )
}
