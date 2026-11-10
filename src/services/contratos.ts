// Contratos da API /api/v1 do Recarga+.
// O backend deve responder nesses formatos. Enquanto ele não existe,
// o servidor simulado em services/mock implementa os mesmos contratos.

export type TipoConector = 'CCS2' | 'TIPO2' | 'CHADEMO' | 'GBT'
export type SituacaoPonto = 'LIVRE' | 'OCUPADO' | 'EM_FILA' | 'MANUTENCAO'
export type Papel = 'MOTORISTA' | 'ADMINISTRADOR' | 'OPERADOR'

export interface Coordenada {
  lat: number
  lng: number
}

export interface Usuario {
  id: string
  nome: string
  email: string
  papel: Papel
}

export interface RespostaLogin {
  token: string
  usuario: Usuario
}

export interface ModeloVeiculo {
  id: string
  fabricante: string
  nome: string
  capacidadeBateriaKWh: number
  consumoKWhPorKm: number
  potenciaMaxACkW: number
  potenciaMaxDCkW: number
  conectores: TipoConector[]
}

export interface Conector {
  id: string
  tipo: TipoConector
  potenciaKW: number
  correnteDC: boolean
}

export interface PontoRecarga {
  id: string
  nome: string
  endereco: string
  localizacao: Coordenada
  conectores: Conector[]
  situacao: SituacaoPonto
  veiculosNaFila: number | null
  tempoMedioRecargaMin: number
  atualizadoEm: string | null
}

/** Veículo usado no cálculo: vem do modelo escolhido ou do cadastro manual. */
export interface VeiculoInformado {
  modeloId: string | null
  capacidadeBateriaKWh: number
  consumoKWhPorKm: number
  potenciaMaxACkW: number
  potenciaMaxDCkW: number
  conectores: TipoConector[]
  nivelBateriaPct: number
}

export interface SolicitacaoRecomendacao {
  origem: Coordenada
  veiculo: VeiculoInformado
  nivelAlvoPct: number
  raioBuscaKm: number
  destino?: { nome: string; localizacao: Coordenada }
}

/** A espera vem sempre da fila informada pela estação (RN02). */
export type FonteEspera = 'INFORMADA' | 'SEM_INFORMACAO'
export type FonteDeslocamento = 'GOOGLE' | 'ESTIMADO'

export type MotivoInvalidez = 'INCOMPATIVEL' | 'FORA_DE_ALCANCE' | 'MANUTENCAO'

/** Fator que pesou na avaliação de adequação feita pela IA. */
export interface FatorAdequacao {
  codigo: 'POTENCIA' | 'TEMPO_TOTAL' | 'MARGEM_BATERIA' | 'TIPO_RECARGA' | 'DADO_RECENTE'
  /** Frase curta para a tela, por exemplo "Usa os 60 kW que o seu carro aceita". */
  texto: string
  impacto: 'POSITIVO' | 'NEUTRO' | 'NEGATIVO'
}

/**
 * Avaliação da IA sobre o quanto o posto combina com o veículo
 * (potência aceita × potência do carregador, curva de carga, bateria e tempo total).
 */
export interface Adequacao {
  /** De 0 a 100. */
  nota: number
  fatores: FatorAdequacao[]
}

export interface ItemRecomendacao {
  posicao: number
  ponto: {
    id: string
    nome: string
    endereco: string
    localizacao: Coordenada
  }
  conector: { tipo: TipoConector; potenciaKW: number; correnteDC: boolean } | null
  /** Potência que o carro realmente usa nesse conector: o menor entre carregador e carro. */
  potenciaEfetivaKW: number | null
  distanciaKm: number
  tempoDeslocamentoMin: number
  tempoEsperaMin: number
  tempoRecargaMin: number
  tempoTotalMin: number
  nivelChegadaPct: number
  fonteEspera: FonteEspera
  veiculosNaFila: number | null
  atualizadoHaMin: number | null
  desatualizado: boolean
  valido: boolean
  motivoInvalidez: MotivoInvalidez | null
  /** Nulo quando a IA não avaliou (falha ou baixa confiança). */
  adequacao: Adequacao | null
}

export type AvisoRecomendacao = 'IA_INDISPONIVEL' | 'DESLOCAMENTO_ESTIMADO'

/**
 * Como os itens foram ordenados. IA: o posto mais adequado ao veículo, escolhido
 * entre os que passaram nas regras. TEMPO_TOTAL: alternativa quando a IA falha.
 */
export type CriterioRecomendacao = 'IA' | 'TEMPO_TOTAL'

export interface Recomendacao {
  id: string
  geradaEm: string
  fonteDeslocamento: FonteDeslocamento
  criterio: CriterioRecomendacao
  avisos: AvisoRecomendacao[]
  /** Itens válidos, já na ordem do critério (o primeiro é a melhor opção). */
  itens: ItemRecomendacao[]
  /** Preenchido quando nenhum ponto é alcançável. */
  motivoSemPontos: 'NENHUM_ALCANCAVEL' | 'NENHUM_COMPATIVEL' | 'NENHUM_PROXIMO' | null
}

export interface Explicacao {
  texto: string
  geradoPorIA: boolean
}

export interface Destino {
  id: string
  nome: string
  endereco: string
  localizacao: Coordenada
}

export interface SolicitacaoCadastroEstabelecimento {
  nomeEstabelecimento: string
  cnpj: string
  telefone: string
  endereco: string
  nomeResponsavel: string
  emailResponsavel: string
  quantidadePontos: number
  conectores: TipoConector[]
}

export interface AtualizacaoStatus {
  pontoId: string
  situacao: SituacaoPonto
  veiculosNaFila: number
}

export type PeriodoMetricas = 'HOJE' | '7_DIAS' | '30_DIAS'

export interface Metricas {
  sessoesDeCarga: number
  esperaMediaMin: number
  usoDosPontosPct: number
  relatosDeFila: number
  usoPorDia: { rotulo: string; sessoes: number }[]
  postosComMaiorFila: { nome: string; esperaMin: number }[]
}

/** Erro padronizado da API. `codigo` permite rastrear o problema nos registros. */
export interface ErroApi {
  codigo: string
  mensagem: string
}
