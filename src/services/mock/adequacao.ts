// "IA" de adequação do servidor simulado.
//
// Escolhe, entre os postos que já passaram nas regras (compatível, alcançável,
// disponível), o mais adequado às características do veículo. Aqui é uma
// combinação ponderada de fatores, para o frontend funcionar de ponta a ponta;
// no backend, ela dá lugar ao modelo treinado, devolvendo o mesmo formato.
//
// A IA só reordena: nunca coloca de volta um posto que as regras tiraram.

import type { Adequacao, FatorAdequacao, ItemRecomendacao, VeiculoInformado } from '../contratos'

export const PESOS = {
  TEMPO_TOTAL: 0.4,
  POTENCIA: 0.25,
  TIPO_RECARGA: 0.15,
  MARGEM_BATERIA: 0.12,
  DADO_RECENTE: 0.08,
} as const

/** Diferença de nota que conta como empate: vence o dado mais recente (RN07). */
export const LIMIAR_EMPATE_NOTA = 2

/** Acima disso (kWh), recarga em AC fica lenta demais para o que o carro precisa. */
const ENERGIA_GRANDE_KWH = 15
const ENERGIA_PEQUENA_KWH = 8

interface Avaliado {
  pontuacao: number
  fator: FatorAdequacao
}

function avaliarPotencia(item: ItemRecomendacao, veiculo: VeiculoInformado): Avaliado {
  const efetiva = item.potenciaEfetivaKW ?? 0
  const maximoDoCarro = item.conector?.correnteDC ? veiculo.potenciaMaxDCkW : veiculo.potenciaMaxACkW
  const aproveitamento = maximoDoCarro > 0 ? Math.min(1, efetiva / maximoDoCarro) : 0
  const kw = (v: number) => `${Math.round(v)} kW`
  if (aproveitamento >= 0.95) {
    return { pontuacao: 1, fator: { codigo: 'POTENCIA', impacto: 'POSITIVO', texto: `Usa os ${kw(maximoDoCarro)} que o seu carro aceita` } }
  }
  if (aproveitamento >= 0.6) {
    return {
      pontuacao: aproveitamento,
      fator: { codigo: 'POTENCIA', impacto: 'NEUTRO', texto: `Usa ${kw(efetiva)} dos ${kw(maximoDoCarro)} que o seu carro aceita` },
    }
  }
  return {
    pontuacao: aproveitamento,
    fator: { codigo: 'POTENCIA', impacto: 'NEGATIVO', texto: `Carregador abaixo do seu carro: ${kw(efetiva)} de ${kw(maximoDoCarro)}` },
  }
}

function avaliarTipo(item: ItemRecomendacao, veiculo: VeiculoInformado, nivelAlvoPct: number): Avaliado {
  const energiaKWh = (Math.max(0, nivelAlvoPct - item.nivelChegadaPct) / 100) * veiculo.capacidadeBateriaKWh
  if (item.conector?.correnteDC) {
    return { pontuacao: 1, fator: { codigo: 'TIPO_RECARGA', impacto: 'POSITIVO', texto: 'Recarga rápida (DC)' } }
  }
  if (energiaKWh <= ENERGIA_PEQUENA_KWH) {
    return { pontuacao: 0.8, fator: { codigo: 'TIPO_RECARGA', impacto: 'NEUTRO', texto: 'Recarga em AC, suficiente para pouca carga' } }
  }
  return {
    pontuacao: energiaKWh > ENERGIA_GRANDE_KWH ? 0.2 : 0.5,
    fator: { codigo: 'TIPO_RECARGA', impacto: 'NEGATIVO', texto: 'Recarga lenta (AC) para a carga que você precisa' },
  }
}

function avaliarTempo(item: ItemRecomendacao, menorTempoMin: number): Avaliado {
  const pontuacao = item.tempoTotalMin > 0 ? Math.min(1, menorTempoMin / item.tempoTotalMin) : 1
  const diferenca = item.tempoTotalMin - menorTempoMin
  if (diferenca <= 0) {
    return { pontuacao, fator: { codigo: 'TEMPO_TOTAL', impacto: 'POSITIVO', texto: 'Menor tempo total entre as opções' } }
  }
  return {
    pontuacao,
    fator: {
      codigo: 'TEMPO_TOTAL',
      impacto: diferenca <= 10 ? 'NEUTRO' : 'NEGATIVO',
      texto: `${diferenca} min a mais que a opção mais rápida`,
    },
  }
}

function avaliarMargem(item: ItemRecomendacao): Avaliado {
  const pct = item.nivelChegadaPct
  if (pct >= 20) return { pontuacao: 1, fator: { codigo: 'MARGEM_BATERIA', impacto: 'POSITIVO', texto: `Chega com ${pct}% de bateria` } }
  if (pct >= 10) return { pontuacao: 0.6, fator: { codigo: 'MARGEM_BATERIA', impacto: 'NEUTRO', texto: `Chega com ${pct}% de bateria` } }
  return { pontuacao: 0.2, fator: { codigo: 'MARGEM_BATERIA', impacto: 'NEGATIVO', texto: `Chega com pouca bateria (${pct}%)` } }
}

function avaliarDado(item: ItemRecomendacao): Avaliado {
  if (item.fonteEspera === 'SEM_INFORMACAO') {
    return { pontuacao: 0.4, fator: { codigo: 'DADO_RECENTE', impacto: 'NEGATIVO', texto: 'Estação sem informação de fila' } }
  }
  if (item.desatualizado) {
    return { pontuacao: 0.5, fator: { codigo: 'DADO_RECENTE', impacto: 'NEGATIVO', texto: 'Fila sem atualização recente' } }
  }
  return { pontuacao: 1, fator: { codigo: 'DADO_RECENTE', impacto: 'POSITIVO', texto: `Fila atualizada há ${item.atualizadoHaMin} min` } }
}

/** Nota de 0 a 100 de o quanto o posto combina com o veículo, com os fatores que pesaram. */
export function avaliarAdequacao(
  item: ItemRecomendacao,
  veiculo: VeiculoInformado,
  nivelAlvoPct: number,
  menorTempoMin: number,
): Adequacao {
  const partes: [number, Avaliado][] = [
    [PESOS.TEMPO_TOTAL, avaliarTempo(item, menorTempoMin)],
    [PESOS.POTENCIA, avaliarPotencia(item, veiculo)],
    [PESOS.TIPO_RECARGA, avaliarTipo(item, veiculo, nivelAlvoPct)],
    [PESOS.MARGEM_BATERIA, avaliarMargem(item)],
    [PESOS.DADO_RECENTE, avaliarDado(item)],
  ]
  const nota = Math.round(100 * partes.reduce((soma, [peso, a]) => soma + peso * a.pontuacao, 0))
  return { nota, fatores: partes.map(([, a]) => a.fator) }
}

/**
 * Avalia e ordena os itens válidos pela adequação (maior nota primeiro).
 * Em empate de nota, vence o dado mais recente (RN07) e depois o menor tempo total.
 */
export function ranquearPorAdequacao(
  itens: ItemRecomendacao[],
  veiculo: VeiculoInformado,
  nivelAlvoPct: number,
): ItemRecomendacao[] {
  const validos = itens.filter((i) => i.valido)
  if (validos.length === 0) return []
  const menorTempo = Math.min(...validos.map((i) => i.tempoTotalMin))
  const avaliados = validos.map((item) => ({
    ...item,
    adequacao: avaliarAdequacao(item, veiculo, nivelAlvoPct, menorTempo),
  }))
  const recencia = (i: ItemRecomendacao) => i.atualizadoHaMin ?? Number.POSITIVE_INFINITY
  avaliados.sort((a, b) => {
    const diferenca = b.adequacao.nota - a.adequacao.nota
    if (Math.abs(diferenca) > LIMIAR_EMPATE_NOTA) return diferenca
    return recencia(a) - recencia(b) || a.tempoTotalMin - b.tempoTotalMin
  })
  return avaliados.map((item, indice) => ({ ...item, posicao: indice + 1 }))
}
