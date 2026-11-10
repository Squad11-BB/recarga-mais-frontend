// Servidor simulado: implementa a mesma interface da API real, em memória,
// com atrasos parecidos com os de rede. Usado quando VITE_API_URL não existe.

import type { Api } from '../api'
import type {
  Destino,
  Explicacao,
  ItemRecomendacao,
  Metricas,
  PeriodoMetricas,
  Recomendacao,
  RespostaLogin,
  SolicitacaoRecomendacao,
  Usuario,
} from '../contratos'
import { CODIGOS, FalhaApi } from '../http'
import { distanciaKm } from '../../lib/geo'
import { LUGARES, MODELOS, PONTOS_DO_ADMIN, USUARIOS, criarPontos } from './dados'
import { flagAtiva } from './flags'
import { ranquearPorAdequacao } from './adequacao'
import { avaliarPonto, esperaInformada, ranquear } from './motor'

const pontos = criarPontos()
const recomendacoes = new Map<string, Recomendacao>()
const CHAVE_RECENTES = 'recarga:destinos-recentes'

function esperar(ms: number, sinal?: AbortSignal): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    const relogio = setTimeout(resolver, ms)
    sinal?.addEventListener('abort', () => {
      clearTimeout(relogio)
      rejeitar(new FalhaApi(CODIGOS.CANCELADO, 'Pedido cancelado.'))
    })
  })
}

const sorteio = (min: number, max: number) => min + Math.random() * (max - min)
const novoId = () => Math.random().toString(36).slice(2, 10)

function tokenDe(usuario: Usuario): string {
  return `simulado.${btoa(JSON.stringify({ sub: usuario.id, papel: usuario.papel }))}`
}

function usuarioDoToken(token: string | null): Usuario {
  const dados = token?.startsWith('simulado.') ? JSON.parse(atob(token.slice(9))) : null
  const usuario = USUARIOS.find((u) => u.id === dados?.sub)
  if (!usuario) throw new FalhaApi('AUTH-401', 'Sessão expirada. Entre de novo.', 401)
  return usuario
}

function exigirPapel(token: string, papel: Usuario['papel']): Usuario {
  const usuario = usuarioDoToken(token)
  if (usuario.papel !== papel) throw new FalhaApi('AUTH-403', 'Você não tem acesso a esta área.', 403)
  return usuario
}

/** Rota estimada: linha reta × fator de sinuosidade, a uma velocidade média urbana. */
function rotaEstimada(origem: SolicitacaoRecomendacao['origem'], destino: SolicitacaoRecomendacao['origem'], velocidadeKmH: number) {
  const km = distanciaKm(origem, destino) * 1.35
  return { distanciaKm: km, duracaoMin: (km / velocidadeKmH) * 60 }
}

function textoPadrao(item: ItemRecomendacao, criterio: Recomendacao['criterio']): string {
  const motivo = criterio === 'IA' ? 'é o mais adequado ao seu carro' : 'tem o menor tempo total'
  return `Este posto ${motivo}: ${item.tempoDeslocamentoMin} min de viagem, ${item.tempoEsperaMin} min de espera e ${item.tempoRecargaMin} min de recarga.`
}

/** Simula o texto do LLM: usa só os números e fatores do cálculo. */
function textoDaIA(item: ItemRecomendacao): string {
  const positivos = (item.adequacao?.fatores ?? []).filter((f) => f.impacto === 'POSITIVO' && f.codigo !== 'DADO_RECENTE')
  const destaque = positivos[0]?.texto.toLowerCase()
  const partes = [
    destaque
      ? `O posto ${item.ponto.nome} é o mais adequado ao seu carro: ${destaque}.`
      : `O posto ${item.ponto.nome} é o mais adequado ao seu carro entre as opções de agora.`,
    `São ${item.tempoDeslocamentoMin} min de viagem, ${item.tempoEsperaMin} min de fila e ${item.tempoRecargaMin} min de recarga.`,
  ]
  if (item.desatualizado) partes.push('A fila pode ter mudado desde a última atualização.')
  return partes.join(' ')
}

export function criarApiSimulada(): Api {
  return {
    async entrar(email, senha) {
      await esperar(sorteio(300, 600))
      const usuario = USUARIOS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
      if (!usuario || usuario.senha !== senha) {
        throw new FalhaApi('AUTH-001', 'E-mail ou senha incorretos.', 401)
      }
      const { senha: _omitida, ...publico } = usuario
      void _omitida
      return { token: tokenDe(publico), usuario: publico } satisfies RespostaLogin
    },

    async cadastrar(nome, email, senha) {
      await esperar(sorteio(400, 700))
      if (USUARIOS.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
        throw new FalhaApi('AUTH-002', 'Já existe uma conta com este e-mail.', 409)
      }
      const usuario: Usuario = { id: `u-${novoId()}`, nome, email: email.trim(), papel: 'MOTORISTA' }
      USUARIOS.push({ ...usuario, senha })
      return { token: tokenDe(usuario), usuario }
    },

    async registrarConsentimento() {
      await esperar(150)
    },

    async listarModelos() {
      await esperar(sorteio(150, 300))
      return MODELOS
    },

    async recomendar(pedido, sinal) {
      const agora = new Date()
      const falhaMaps = flagAtiva('falhaMaps')
      const falhaIA = flagAtiva('falhaIA')
      // Rotas: no máximo 1,2 s. Simulando a falha, o tempo estoura e vale a estimativa.
      await esperar(falhaMaps ? 1200 : sorteio(350, 550), sinal)
      // Escolha do posto mais adequado (IA).
      await esperar(sorteio(300, 500), sinal)

      const candidatos = flagAtiva('semPostos')
        ? []
        : pontos.filter((p) => distanciaKm(pedido.origem, p.localizacao) <= pedido.raioBuscaKm)

      const avaliacoes = candidatos.map((ponto) => {
        const rota = rotaEstimada(pedido.origem, ponto.localizacao, falhaMaps ? 25 : 28)
        return avaliarPonto(ponto, pedido.veiculo, rota, esperaInformada(ponto), pedido.nivelAlvoPct, agora)
      })

      // Regras primeiro: só os postos aprovados chegam à IA, que apenas reordena.
      const aprovados = avaliacoes.filter((a) => a.motivo === null).map((a) => a.item)
      const validos = falhaIA
        ? ranquear(aprovados)
        : ranquearPorAdequacao(aprovados, pedido.veiculo, pedido.nivelAlvoPct)
      let motivoSemPontos: Recomendacao['motivoSemPontos'] = null
      if (validos.length === 0) {
        if (candidatos.length === 0) motivoSemPontos = 'NENHUM_PROXIMO'
        else if (avaliacoes.some((a) => a.motivo === 'FORA_DE_ALCANCE')) motivoSemPontos = 'NENHUM_ALCANCAVEL'
        else motivoSemPontos = 'NENHUM_COMPATIVEL'
      }

      const recomendacao: Recomendacao = {
        id: `r-${novoId()}`,
        geradaEm: agora.toISOString(),
        fonteDeslocamento: falhaMaps ? 'ESTIMADO' : 'GOOGLE',
        criterio: falhaIA ? 'TEMPO_TOTAL' : 'IA',
        avisos: [
          ...(falhaIA && aprovados.length > 0 ? (['IA_INDISPONIVEL'] as const) : []),
          ...(falhaMaps ? (['DESLOCAMENTO_ESTIMADO'] as const) : []),
        ],
        itens: validos,
        motivoSemPontos,
      }
      recomendacoes.set(recomendacao.id, recomendacao)
      return recomendacao
    },

    async explicar(recomendacaoId, pontoId, sinal): Promise<Explicacao> {
      const recomendacao = recomendacoes.get(recomendacaoId)
      const indice = recomendacao?.itens.findIndex((i) => i.ponto.id === pontoId) ?? -1
      if (!recomendacao || indice < 0) throw new FalhaApi('REC-404', 'Recomendação não encontrada.', 404)
      const item = recomendacao.itens[indice]

      await esperar(sorteio(600, 1100), sinal)
      // Se a IA falhar ou citar um número que não existe no cálculo, vale o texto padrão.
      if (flagAtiva('falhaExplicacao') || indice > 0 || recomendacao.criterio !== 'IA') {
        return { texto: textoPadrao(item, recomendacao.criterio), geradoPorIA: false }
      }
      return { texto: textoDaIA(item), geradoPorIA: true }
    },

    async buscarDestinos(texto, perto) {
      await esperar(sorteio(150, 300))
      const termo = normalizar(texto)
      if (!termo) return []
      const achados = LUGARES.filter((l) => normalizar(`${l.nome} ${l.endereco}`).includes(termo))
      if (perto) achados.sort((a, b) => distanciaKm(perto, a.localizacao) - distanciaKm(perto, b.localizacao))
      return achados.slice(0, 6)
    },

    async listarDestinosRecentes() {
      return lerRecentes()
    },

    async salvarDestinoRecente(destino) {
      const lista = [destino, ...lerRecentes().filter((d) => d.id !== destino.id)].slice(0, 3)
      localStorage.setItem(CHAVE_RECENTES, JSON.stringify(lista))
    },

    async reportarFila(pontoId, veiculosNaFila, token) {
      usuarioDoToken(token)
      await esperar(sorteio(300, 500))
      const ponto = pontos.find((p) => p.id === pontoId)
      if (!ponto) throw new FalhaApi('PNT-404', 'Posto não encontrado.', 404)
      ponto.veiculosNaFila = veiculosNaFila
      ponto.situacao = veiculosNaFila > 0 ? 'EM_FILA' : ponto.situacao === 'EM_FILA' ? 'LIVRE' : ponto.situacao
      ponto.atualizadoEm = new Date().toISOString()
    },

    async solicitarCadastro() {
      await esperar(sorteio(500, 800))
    },

    async listarMeusPontos(token) {
      exigirPapel(token, 'ADMINISTRADOR')
      await esperar(sorteio(200, 400))
      return structuredClone(pontos.filter((p) => PONTOS_DO_ADMIN.includes(p.id)))
    },

    async atualizarStatus(atualizacoes, token) {
      exigirPapel(token, 'ADMINISTRADOR')
      await esperar(sorteio(300, 500))
      const agora = new Date().toISOString()
      for (const a of atualizacoes) {
        if (!PONTOS_DO_ADMIN.includes(a.pontoId)) {
          throw new FalhaApi('AUTH-403', 'Você só pode alterar os seus pontos.', 403)
        }
        const ponto = pontos.find((p) => p.id === a.pontoId)
        if (!ponto) continue
        ponto.situacao = a.situacao
        ponto.veiculosNaFila = a.veiculosNaFila
        ponto.atualizadoEm = agora
      }
      return structuredClone(pontos.filter((p) => PONTOS_DO_ADMIN.includes(p.id)))
    },

    async obterMetricas(periodo: PeriodoMetricas, token): Promise<Metricas> {
      exigirPapel(token, 'OPERADOR')
      await esperar(sorteio(300, 500))
      return metricasDeExemplo(periodo)
    },
  }
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function lerRecentes(): Destino[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_RECENTES) ?? '[]') as Destino[]
  } catch {
    return []
  }
}

function metricasDeExemplo(periodo: PeriodoMetricas): Metricas {
  const fator = periodo === 'HOJE' ? 1 : periodo === '7_DIAS' ? 7 : 30
  const dias =
    periodo === 'HOJE'
      ? [
          { rotulo: '6h', sessoes: 3 },
          { rotulo: '9h', sessoes: 9 },
          { rotulo: '12h', sessoes: 7 },
          { rotulo: '15h', sessoes: 8 },
          { rotulo: '18h', sessoes: 14 },
          { rotulo: '21h', sessoes: 5 },
        ]
      : [
          { rotulo: 'Seg', sessoes: 38 },
          { rotulo: 'Ter', sessoes: 52 },
          { rotulo: 'Qua', sessoes: 46 },
          { rotulo: 'Qui', sessoes: 64 },
          { rotulo: 'Sex', sessoes: 58 },
          { rotulo: 'Sáb', sessoes: 81 },
          { rotulo: 'Dom', sessoes: 29 },
        ].map((d) => ({ ...d, sessoes: Math.round((d.sessoes * fator) / 7) }))
  return {
    sessoesDeCarga: dias.reduce((s, d) => s + d.sessoes, 0),
    esperaMediaMin: periodo === 'HOJE' ? 14 : periodo === '7_DIAS' ? 17 : 16,
    usoDosPontosPct: periodo === 'HOJE' ? 58 : periodo === '7_DIAS' ? 63 : 61,
    relatosDeFila: Math.round(23 * (fator / 7) + 4),
    usoPorDia: dias,
    postosComMaiorFila: [
      { nome: 'Recarga Olinda Alta', esperaMin: 42 },
      { nome: 'Eletroposto Beira-Mar', esperaMin: 35 },
      { nome: 'Recarga Cais do Apolo', esperaMin: 21 },
    ],
  }
}
