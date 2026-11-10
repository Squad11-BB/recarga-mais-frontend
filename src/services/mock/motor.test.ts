import { describe, expect, it } from 'vitest'
import type { ItemRecomendacao, PontoRecarga, VeiculoInformado } from '../contratos'
import { avaliarPonto, esperaInformada, ranquear, tempoRecargaMin } from './motor'

const agora = new Date('2026-11-10T12:00:00Z')

const veiculo: VeiculoInformado = {
  modeloId: 'teste',
  capacidadeBateriaKWh: 50,
  consumoKWhPorKm: 0.15,
  potenciaMaxACkW: 7,
  potenciaMaxDCkW: 50,
  conectores: ['CCS2', 'TIPO2'],
  nivelBateriaPct: 60,
}

function ponto(parcial: Partial<PontoRecarga> = {}): PontoRecarga {
  return {
    id: 'p1',
    nome: 'Posto A',
    endereco: 'Rua X',
    localizacao: { lat: 0, lng: 0 },
    conectores: [{ id: 'c1', tipo: 'CCS2', potenciaKW: 50, correnteDC: true }],
    situacao: 'LIVRE',
    veiculosNaFila: 0,
    tempoMedioRecargaMin: 30,
    atualizadoEm: '2026-11-10T11:55:00Z',
    ...parcial,
  }
}

function item(nome: string, desloc: number, espera: number, recarga: number, atualizadoHaMin: number | null = 5): ItemRecomendacao {
  return {
    posicao: 0,
    ponto: { id: nome, nome, endereco: '', localizacao: { lat: 0, lng: 0 } },
    conector: { tipo: 'CCS2', potenciaKW: 50, correnteDC: true },
    potenciaEfetivaKW: 50,
    distanciaKm: 1,
    tempoDeslocamentoMin: desloc,
    tempoEsperaMin: espera,
    tempoRecargaMin: recarga,
    tempoTotalMin: desloc + espera + recarga,
    nivelChegadaPct: 50,
    fonteEspera: 'INFORMADA',
    veiculosNaFila: 0,
    atualizadoHaMin,
    desatualizado: false,
    valido: true,
    motivoInvalidez: null,
    adequacao: null,
  }
}

describe('ranquear (critério sem IA: menor tempo total)', () => {
  it('US11: o mais perto com fila perde para o mais longe sem fila', () => {
    const a = item('Posto A', 8, 32, 20)
    const b = item('Posto B', 15, 0, 20)
    const [primeiro, segundo] = ranquear([a, b])
    expect(primeiro.ponto.nome).toBe('Posto B')
    expect(primeiro.tempoTotalMin).toBe(35)
    expect(segundo.tempoTotalMin).toBe(60)
    expect(primeiro.posicao).toBe(1)
  })

  it('RN07: em empate, vence o dado mais recente', () => {
    const antigo = item('Antigo', 10, 0, 20, 40)
    const recente = item('Recente', 11, 0, 20, 2)
    expect(ranquear([antigo, recente])[0].ponto.nome).toBe('Recente')
  })

  it('fora do limiar de empate, vale o menor tempo', () => {
    const rapido = item('Rápido', 10, 0, 20, 40)
    const lento = item('Lento', 15, 0, 20, 2)
    expect(ranquear([lento, rapido])[0].ponto.nome).toBe('Rápido')
  })
})

describe('avaliarPonto', () => {
  const rota = { distanciaKm: 10, duracaoMin: 12 }

  it('soma deslocamento, espera e recarga (RN02)', () => {
    const { item: resultado, motivo } = avaliarPonto(ponto(), veiculo, rota, { minutos: 6, fonte: 'INFORMADA' }, 80, agora)
    expect(motivo).toBeNull()
    // 10 km × 0,15 kWh/km = 1,5 kWh = 3% de 50 kWh → chega com 57%.
    expect(resultado.nivelChegadaPct).toBe(57)
    // De 57% a 80% = 11,5 kWh a 50 kW = 13,8 min → 14.
    expect(resultado.tempoRecargaMin).toBe(14)
    expect(resultado.tempoTotalMin).toBe(12 + 6 + 14)
  })

  it('RN03: conector incompatível sai da recomendação', () => {
    const p = ponto({ conectores: [{ id: 'c1', tipo: 'GBT', potenciaKW: 60, correnteDC: true }] })
    expect(avaliarPonto(p, veiculo, rota, { minutos: 0, fonte: 'INFORMADA' }, 80, agora).motivo).toBe('INCOMPATIVEL')
  })

  it('RN05: ponto em manutenção sai da recomendação', () => {
    const p = ponto({ situacao: 'MANUTENCAO' })
    expect(avaliarPonto(p, veiculo, rota, { minutos: 0, fonte: 'INFORMADA' }, 80, agora).motivo).toBe('MANUTENCAO')
  })

  it('RN04: ponto fora do alcance não é recomendado', () => {
    const longe = { distanciaKm: 250, duracaoMin: 200 }
    expect(avaliarPonto(ponto(), veiculo, longe, { minutos: 0, fonte: 'INFORMADA' }, 80, agora).motivo).toBe('FORA_DE_ALCANCE')
  })

  it('RN06: marca dado desatualizado depois de 30 minutos', () => {
    const p = ponto({ atualizadoEm: '2026-11-10T11:00:00Z' })
    const { item: resultado } = avaliarPonto(p, veiculo, rota, { minutos: 0, fonte: 'INFORMADA' }, 80, agora)
    expect(resultado.atualizadoHaMin).toBe(60)
    expect(resultado.desatualizado).toBe(true)
  })

  it('usa o conector compatível mais rápido, limitado pelo carro', () => {
    const p = ponto({
      conectores: [
        { id: 'ac', tipo: 'TIPO2', potenciaKW: 22, correnteDC: false },
        { id: 'dc', tipo: 'CCS2', potenciaKW: 150, correnteDC: true },
      ],
    })
    const { item: resultado } = avaliarPonto(p, veiculo, rota, { minutos: 0, fonte: 'INFORMADA' }, 80, agora)
    expect(resultado.conector?.tipo).toBe('CCS2')
  })
})

describe('esperaInformada', () => {
  it('é a fila vezes o tempo médio de recarga', () => {
    expect(esperaInformada(ponto({ veiculosNaFila: 2, tempoMedioRecargaMin: 30 }))).toEqual({ minutos: 60, fonte: 'INFORMADA' })
  })

  it('sem informação de fila, avisa a fonte', () => {
    expect(esperaInformada(ponto({ veiculosNaFila: null })).fonte).toBe('SEM_INFORMACAO')
  })
})

describe('tempoRecargaMin', () => {
  it('não recarrega quando já chega acima do alvo', () => {
    const conector = { id: 'c', tipo: 'CCS2' as const, potenciaKW: 50, correnteDC: true }
    expect(tempoRecargaMin(conector, veiculo, 85, 80)).toBe(0)
  })
})
