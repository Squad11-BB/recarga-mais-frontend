// Motor de recomendação usado pelo servidor simulado.
// Segue as regras RN01 a RN07 do documento. O cálculo oficial vai morar no
// backend (application/MotorRecomendacao); este aqui existe para o frontend
// funcionar de ponta a ponta antes disso.

import type {
  Conector,
  FonteEspera,
  ItemRecomendacao,
  MotivoInvalidez,
  PontoRecarga,
  VeiculoInformado,
} from '../contratos'
import { LIMITE_DESATUALIZADO_MIN, minutosDesde } from '../../lib/tempo'

/** Margem mínima de bateria na chegada para o ponto contar como alcançável. */
export const MARGEM_CHEGADA_PCT = 5
/** Diferença de tempo total, em minutos, que conta como empate (RN07). */
export const LIMIAR_EMPATE_MIN = 2

export interface Rota {
  distanciaKm: number
  duracaoMin: number
}

export interface Espera {
  minutos: number
  fonte: FonteEspera
}

/** RN02: espera = veículos na fila × tempo médio de recarga. */
export function esperaInformada(ponto: PontoRecarga): Espera {
  if (ponto.veiculosNaFila === null) return { minutos: 0, fonte: 'SEM_INFORMACAO' }
  return { minutos: ponto.veiculosNaFila * ponto.tempoMedioRecargaMin, fonte: 'INFORMADA' }
}

export function potenciaEfetivaKW(conector: Conector, veiculo: VeiculoInformado): number {
  const limiteDoCarro = conector.correnteDC ? veiculo.potenciaMaxDCkW : veiculo.potenciaMaxACkW
  return Math.min(conector.potenciaKW, limiteDoCarro)
}

/**
 * Tempo para ir do nível de chegada até o nível alvo.
 * Modelo linear simples: não considera a queda de potência perto de 100%.
 */
export function tempoRecargaMin(
  conector: Conector,
  veiculo: VeiculoInformado,
  nivelChegadaPct: number,
  nivelAlvoPct: number,
): number {
  const faltaPct = Math.max(0, nivelAlvoPct - nivelChegadaPct)
  const potencia = potenciaEfetivaKW(conector, veiculo)
  if (potencia <= 0) return Number.POSITIVE_INFINITY
  return ((faltaPct / 100) * veiculo.capacidadeBateriaKWh * 60) / potencia
}

interface Avaliacao {
  item: ItemRecomendacao
  motivo: MotivoInvalidez | null
}

export function avaliarPonto(
  ponto: PontoRecarga,
  veiculo: VeiculoInformado,
  rota: Rota,
  espera: Espera,
  nivelAlvoPct: number,
  agora: Date,
): Avaliacao {
  const atualizadoHaMin = minutosDesde(ponto.atualizadoEm, agora)
  const nivelChegada =
    veiculo.nivelBateriaPct - ((rota.distanciaKm * veiculo.consumoKWhPorKm) / veiculo.capacidadeBateriaKWh) * 100

  const compativeis = ponto.conectores.filter((c) => veiculo.conectores.includes(c.tipo))

  let motivo: MotivoInvalidez | null = null
  if (compativeis.length === 0) motivo = 'INCOMPATIVEL' // RN03
  else if (ponto.situacao === 'MANUTENCAO') motivo = 'MANUTENCAO' // RN05
  else if (nivelChegada < MARGEM_CHEGADA_PCT) motivo = 'FORA_DE_ALCANCE' // RN04

  // Escolhe o conector compatível que carrega mais rápido.
  let melhor: Conector | null = null
  let recarga = Number.POSITIVE_INFINITY
  for (const c of compativeis) {
    const t = tempoRecargaMin(c, veiculo, nivelChegada, nivelAlvoPct)
    if (t < recarga) {
      recarga = t
      melhor = c
    }
  }

  const deslocamento = Math.round(rota.duracaoMin)
  const esperaMin = Math.round(espera.minutos)
  const recargaMin = Number.isFinite(recarga) ? Math.round(recarga) : 0

  return {
    motivo,
    item: {
      posicao: 0,
      ponto: { id: ponto.id, nome: ponto.nome, endereco: ponto.endereco, localizacao: ponto.localizacao },
      conector: melhor ? { tipo: melhor.tipo, potenciaKW: melhor.potenciaKW, correnteDC: melhor.correnteDC } : null,
      potenciaEfetivaKW: melhor ? potenciaEfetivaKW(melhor, veiculo) : null,
      distanciaKm: Math.round(rota.distanciaKm * 10) / 10,
      tempoDeslocamentoMin: deslocamento,
      tempoEsperaMin: esperaMin,
      tempoRecargaMin: recargaMin,
      // O total é a soma das partes já arredondadas, para a conta na tela fechar.
      tempoTotalMin: deslocamento + esperaMin + recargaMin,
      nivelChegadaPct: Math.max(0, Math.round(nivelChegada)),
      fonteEspera: espera.fonte,
      veiculosNaFila: ponto.veiculosNaFila,
      atualizadoHaMin,
      desatualizado: atualizadoHaMin === null || atualizadoHaMin > LIMITE_DESATUALIZADO_MIN,
      valido: motivo === null,
      motivoInvalidez: motivo,
      adequacao: null,
    },
  }
}

/**
 * Ordena pelo menor tempo total: é o critério quando a IA de adequação falha.
 * Em empate (diferença de até LIMIAR_EMPATE_MIN), vence o dado mais recente (RN07).
 */
export function ranquear(itens: ItemRecomendacao[]): ItemRecomendacao[] {
  const recencia = (i: ItemRecomendacao) => i.atualizadoHaMin ?? Number.POSITIVE_INFINITY
  const ordenados = [...itens].sort((a, b) => a.tempoTotalMin - b.tempoTotalMin)
  // Passada de desempate entre vizinhos: mantém a ordem por tempo e só troca
  // pares cuja diferença está dentro do limiar.
  for (let i = 0; i < ordenados.length - 1; i++) {
    const a = ordenados[i]
    const b = ordenados[i + 1]
    if (b.tempoTotalMin - a.tempoTotalMin <= LIMIAR_EMPATE_MIN && recencia(b) < recencia(a)) {
      ordenados[i] = b
      ordenados[i + 1] = a
    }
  }
  return ordenados.map((item, indice) => ({ ...item, posicao: indice + 1 }))
}
