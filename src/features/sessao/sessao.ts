import { createContext, useContext } from 'react'
import type { Usuario } from '../../services/contratos'

export interface Sessao {
  usuario: Usuario | null
  token: string | null
  /** Entra e devolve o usuário. Não decide para onde ir: cada tela confere o papel. */
  entrar(email: string, senha: string): Promise<Usuario>
  cadastrar(nome: string, email: string, senha: string): Promise<Usuario>
  sair(): void
}

export const ContextoSessao = createContext<Sessao | null>(null)

export function useSessao(): Sessao {
  const sessao = useContext(ContextoSessao)
  if (!sessao) throw new Error('useSessao precisa estar dentro de ProvedorSessao')
  return sessao
}
