import type {
  AtualizacaoStatus,
  Coordenada,
  Destino,
  Explicacao,
  Metricas,
  ModeloVeiculo,
  PeriodoMetricas,
  PontoRecarga,
  Recomendacao,
  RespostaLogin,
  SolicitacaoCadastroEstabelecimento,
  SolicitacaoRecomendacao,
} from './contratos'
import { pedir } from './http'
import { criarApiSimulada } from './mock/servidor'

export interface Api {
  entrar(email: string, senha: string): Promise<RespostaLogin>
  cadastrar(nome: string, email: string, senha: string): Promise<RespostaLogin>
  registrarConsentimento(concedido: boolean, token: string | null): Promise<void>
  listarModelos(): Promise<ModeloVeiculo[]>
  recomendar(pedido: SolicitacaoRecomendacao, sinal?: AbortSignal): Promise<Recomendacao>
  explicar(recomendacaoId: string, pontoId: string, sinal?: AbortSignal): Promise<Explicacao>
  buscarDestinos(texto: string, perto: Coordenada | null): Promise<Destino[]>
  listarDestinosRecentes(token: string | null): Promise<Destino[]>
  salvarDestinoRecente(destino: Destino, token: string | null): Promise<void>
  reportarFila(pontoId: string, veiculosNaFila: number, token: string): Promise<void>
  solicitarCadastro(dados: SolicitacaoCadastroEstabelecimento): Promise<void>
  listarMeusPontos(token: string): Promise<PontoRecarga[]>
  atualizarStatus(atualizacoes: AtualizacaoStatus[], token: string): Promise<PontoRecarga[]>
  obterMetricas(periodo: PeriodoMetricas, token: string): Promise<Metricas>
}

/** Limites de tempo definidos no documento (seção 4). */
export const TEMPO_LIMITE = {
  RECOMENDACAO_MS: 2500,
  EXPLICACAO_MS: 3000,
  PADRAO_MS: 8000,
}

function criarApiHttp(baseUrl: string): Api {
  return {
    entrar: (email, senha) => pedir(baseUrl, '/auth/login', { metodo: 'POST', corpo: { email, senha } }),
    cadastrar: (nome, email, senha) =>
      pedir(baseUrl, '/auth/cadastro', { metodo: 'POST', corpo: { nome, email, senha } }),
    registrarConsentimento: (concedido, token) =>
      pedir(baseUrl, '/consentimentos/localizacao', { metodo: 'POST', corpo: { concedido }, token }),
    listarModelos: () => pedir(baseUrl, '/modelos-veiculo'),
    recomendar: (pedido, sinal) =>
      pedir(baseUrl, '/recomendacoes', {
        metodo: 'POST',
        corpo: pedido,
        sinal,
        tempoLimiteMs: TEMPO_LIMITE.RECOMENDACAO_MS,
      }),
    explicar: (recomendacaoId, pontoId, sinal) =>
      pedir(baseUrl, `/recomendacoes/${recomendacaoId}/explicacao`, {
        metodo: 'POST',
        corpo: { pontoId },
        sinal,
        tempoLimiteMs: TEMPO_LIMITE.EXPLICACAO_MS,
      }),
    buscarDestinos: (texto, perto) => {
      const busca = new URLSearchParams({ q: texto })
      if (perto) {
        busca.set('lat', String(perto.lat))
        busca.set('lng', String(perto.lng))
      }
      return pedir(baseUrl, `/destinos?${busca}`)
    },
    listarDestinosRecentes: (token) => pedir(baseUrl, '/destinos-recentes', { token }),
    salvarDestinoRecente: (destino, token) =>
      pedir(baseUrl, '/destinos-recentes', { metodo: 'POST', corpo: destino, token }),
    reportarFila: (pontoId, veiculosNaFila, token) =>
      pedir(baseUrl, `/pontos/${pontoId}/relatos-fila`, { metodo: 'POST', corpo: { veiculosNaFila }, token }),
    solicitarCadastro: (dados) => pedir(baseUrl, '/solicitacoes-cadastro', { metodo: 'POST', corpo: dados }),
    listarMeusPontos: (token) => pedir(baseUrl, '/painel/pontos', { token }),
    atualizarStatus: (atualizacoes, token) =>
      pedir(baseUrl, '/painel/pontos/status', { metodo: 'PATCH', corpo: { atualizacoes }, token }),
    obterMetricas: (periodo, token) => pedir(baseUrl, `/painel/metricas?periodo=${periodo}`, { token }),
  }
}

const baseUrl = import.meta.env.VITE_API_URL as string | undefined

/** Sem VITE_API_URL, o app usa o servidor simulado (dados de exemplo em Recife). */
export const api: Api = baseUrl ? criarApiHttp(baseUrl.replace(/\/$/, '')) : criarApiSimulada()
export const usandoServidorSimulado = !baseUrl
