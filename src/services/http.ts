import type { ErroApi } from './contratos'

/** Erro com código, para achar o problema no app, no servidor e nos registros. */
export class FalhaApi extends Error {
  readonly codigo: string
  readonly status: number

  constructor(codigo: string, mensagem: string, status = 0) {
    super(mensagem)
    this.name = 'FalhaApi'
    this.codigo = codigo
    this.status = status
  }

  /** Mensagem pronta para mostrar na tela. */
  get mensagem(): string {
    return this.message
  }
}

export const CODIGOS = {
  SEM_CONEXAO: 'APP-REDE-001',
  TEMPO_ESGOTADO: 'APP-REDE-002',
  CANCELADO: 'APP-REDE-003',
  RESPOSTA_INVALIDA: 'APP-REDE-004',
} as const

export function foiCancelado(erro: unknown): boolean {
  return erro instanceof FalhaApi && erro.codigo === CODIGOS.CANCELADO
}

interface OpcoesPedido {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  corpo?: unknown
  token?: string | null
  /** Tempo limite do pedido. A recomendação inteira deve responder em até 2 s. */
  tempoLimiteMs?: number
  sinal?: AbortSignal
}

/**
 * Único ponto de contato com o servidor.
 * Cada pedido tem tempo limite, pode ser cancelado e nunca é repetido sozinho.
 */
export async function pedir<T>(baseUrl: string, caminho: string, opcoes: OpcoesPedido = {}): Promise<T> {
  const { metodo = 'GET', corpo, token, tempoLimiteMs = 8000, sinal } = opcoes
  const controle = new AbortController()
  let esgotou = false
  const relogio = setTimeout(() => {
    esgotou = true
    controle.abort()
  }, tempoLimiteMs)
  const repassarCancelamento = () => controle.abort()
  sinal?.addEventListener('abort', repassarCancelamento)

  try {
    const resposta = await fetch(`${baseUrl}/api/v1${caminho}`, {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: controle.signal,
    })

    if (!resposta.ok) {
      const erro = (await resposta.json().catch(() => null)) as ErroApi | null
      throw new FalhaApi(
        erro?.codigo ?? `API-HTTP-${resposta.status}`,
        erro?.mensagem ?? 'Não foi possível concluir o pedido.',
        resposta.status,
      )
    }
    if (resposta.status === 204) return undefined as T
    return (await resposta.json()) as T
  } catch (erro) {
    if (erro instanceof FalhaApi) throw erro
    if (controle.signal.aborted) {
      if (esgotou) throw new FalhaApi(CODIGOS.TEMPO_ESGOTADO, 'O servidor demorou para responder.')
      throw new FalhaApi(CODIGOS.CANCELADO, 'Pedido cancelado.')
    }
    if (!navigator.onLine) throw new FalhaApi(CODIGOS.SEM_CONEXAO, 'Sem conexão com a internet.')
    throw new FalhaApi(CODIGOS.RESPOSTA_INVALIDA, 'Não foi possível falar com o servidor.')
  } finally {
    clearTimeout(relogio)
    sinal?.removeEventListener('abort', repassarCancelamento)
  }
}
