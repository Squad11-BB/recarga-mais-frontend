import { type ReactNode, useCallback, useMemo, useState } from 'react'
import { api } from '../../services/api'
import type { RespostaLogin } from '../../services/contratos'
import { gravar, ler } from '../../lib/armazenamento'
import { ContextoSessao, type Sessao } from './sessao'

const CHAVE = 'recarga:sessao'

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [dados, setDados] = useState<RespostaLogin | null>(() => ler<RespostaLogin | null>(CHAVE, null))

  const guardar = useCallback((resposta: RespostaLogin) => {
    setDados(resposta)
    gravar(CHAVE, resposta)
    return resposta.usuario
  }, [])

  const valor = useMemo<Sessao>(
    () => ({
      usuario: dados?.usuario ?? null,
      token: dados?.token ?? null,
      entrar: async (email, senha) => guardar(await api.entrar(email, senha)),
      cadastrar: async (nome, email, senha) => guardar(await api.cadastrar(nome, email, senha)),
      sair: () => {
        setDados(null)
        gravar(CHAVE, null)
      },
    }),
    [dados, guardar],
  )

  return <ContextoSessao.Provider value={valor}>{children}</ContextoSessao.Provider>
}
