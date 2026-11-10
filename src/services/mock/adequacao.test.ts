import { describe, expect, it } from 'vitest'
import type { ItemRecomendacao, VeiculoInformado } from '../contratos'
import { avaliarAdequacao, ranquearPorAdequacao } from './adequacao'

// Carro com DC de até 60 kW e AC de 7 kW.
const veiculo: VeiculoInformado = {
  modeloId: 'teste',
  capacidadeBateriaKWh: 50,
  consumoKWhPorKm: 0.15,
  potenciaMaxACkW: 7,
  potenciaMaxDCkW: 60,
  conectores: ['CCS2', 'TIPO2'],
  nivelBateriaPct: 40,
}

function item(nome: string, parcial: Partial<ItemRecomendacao> = {}): ItemRecomendacao {
  return {
    posicao: 0,
    ponto: { id: nome, nome, endereco: '', localizacao: { lat: 0, lng: 0 } },
    conector: { tipo: 'CCS2', potenciaKW: 60, correnteDC: true },
    potenciaEfetivaKW: 60,
    distanciaKm: 3,
    tempoDeslocamentoMin: 8,
    tempoEsperaMin: 0,
    tempoRecargaMin: 20,
    tempoTotalMin: 28,
    nivelChegadaPct: 38,
    fonteEspera: 'INFORMADA',
    veiculosNaFila: 0,
    atualizadoHaMin: 5,
    desatualizado: false,
    valido: true,
    motivoInvalidez: null,
    adequacao: null,
    ...parcial,
  }
}

describe('avaliarAdequacao', () => {
  it('posto ideal (mais rápido, usa toda a potência, DC, boa margem, dado recente) tira 100', () => {
    const a = avaliarAdequacao(item('A'), veiculo, 80, 28)
    expect(a.nota).toBe(100)
    expect(a.fatores.find((f) => f.codigo === 'POTENCIA')?.texto).toBe('Usa os 60 kW que o seu carro aceita')
  })

  it('carregador abaixo do que o carro aceita perde nota e aparece como fator negativo', () => {
    const fraco = item('Fraco', { conector: { tipo: 'CCS2', potenciaKW: 25, correnteDC: true }, potenciaEfetivaKW: 25 })
    const a = avaliarAdequacao(fraco, veiculo, 80, 28)
    expect(a.nota).toBeLessThan(100)
    expect(a.fatores.find((f) => f.codigo === 'POTENCIA')?.impacto).toBe('NEGATIVO')
  })

  it('AC para muita carga é marcado como recarga lenta', () => {
    const ac = item('AC', { conector: { tipo: 'TIPO2', potenciaKW: 22, correnteDC: false }, potenciaEfetivaKW: 7, nivelChegadaPct: 20 })
    const fator = avaliarAdequacao(ac, veiculo, 80, 28).fatores.find((f) => f.codigo === 'TIPO_RECARGA')
    expect(fator?.impacto).toBe('NEGATIVO')
  })
})

describe('ranquearPorAdequacao', () => {
  it('nunca devolve um posto que as regras tiraram', () => {
    const incompativel = item('Incompatível', { valido: false, motivoInvalidez: 'INCOMPATIVEL', tempoTotalMin: 5 })
    const resultado = ranquearPorAdequacao([incompativel, item('Válido')], veiculo, 80)
    expect(resultado.map((i) => i.ponto.nome)).toEqual(['Válido'])
  })

  it('pode escolher um posto um pouco mais lento que combina melhor com o carro', () => {
    // Rápido por pouco, mas com carregador fraco, dado velho e chegando com pouca bateria.
    const rapido = item('Rápido', {
      tempoTotalMin: 26,
      conector: { tipo: 'CCS2', potenciaKW: 20, correnteDC: true },
      potenciaEfetivaKW: 20,
      nivelChegadaPct: 8,
      desatualizado: true,
      atualizadoHaMin: 90,
    })
    const adequado = item('Adequado', { tempoTotalMin: 28 })
    const [primeiro] = ranquearPorAdequacao([rapido, adequado], veiculo, 80)
    expect(primeiro.ponto.nome).toBe('Adequado')
    expect(primeiro.adequacao?.nota).toBeGreaterThan(0)
    expect(primeiro.posicao).toBe(1)
  })

  it('em empate de nota, vence o dado mais recente (RN07)', () => {
    const antigo = item('Antigo', { atualizadoHaMin: 25 })
    const recente = item('Recente', { atualizadoHaMin: 2 })
    expect(ranquearPorAdequacao([antigo, recente], veiculo, 80)[0].ponto.nome).toBe('Recente')
  })
})
