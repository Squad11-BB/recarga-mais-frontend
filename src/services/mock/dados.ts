// Dados de exemplo para o servidor simulado.
// Os postos são fictícios, espalhados por Recife e região.
// As especificações dos carros são aproximadas e servem só para demonstração.

import type { Destino, ModeloVeiculo, PontoRecarga, Usuario } from '../contratos'

export const CENTRO_RECIFE = { lat: -8.0631, lng: -34.8711 }

export const MODELOS: ModeloVeiculo[] = [
  { id: 'byd-dolphin', fabricante: 'BYD', nome: 'Dolphin', capacidadeBateriaKWh: 44.9, consumoKWhPorKm: 0.146, potenciaMaxACkW: 7, potenciaMaxDCkW: 60, conectores: ['CCS2', 'TIPO2'] },
  { id: 'byd-dolphin-mini', fabricante: 'BYD', nome: 'Dolphin Mini', capacidadeBateriaKWh: 38, consumoKWhPorKm: 0.12, potenciaMaxACkW: 6.6, potenciaMaxDCkW: 40, conectores: ['CCS2', 'TIPO2'] },
  { id: 'byd-seal', fabricante: 'BYD', nome: 'Seal', capacidadeBateriaKWh: 82.5, consumoKWhPorKm: 0.165, potenciaMaxACkW: 7, potenciaMaxDCkW: 150, conectores: ['CCS2', 'TIPO2'] },
  { id: 'byd-yuan-plus', fabricante: 'BYD', nome: 'Yuan Plus', capacidadeBateriaKWh: 60.5, consumoKWhPorKm: 0.165, potenciaMaxACkW: 7, potenciaMaxDCkW: 88, conectores: ['CCS2', 'TIPO2'] },
  { id: 'gwm-ora-03', fabricante: 'GWM', nome: 'Ora 03', capacidadeBateriaKWh: 48, consumoKWhPorKm: 0.15, potenciaMaxACkW: 6.6, potenciaMaxDCkW: 64, conectores: ['CCS2', 'TIPO2'] },
  { id: 'renault-kwid-etech', fabricante: 'Renault', nome: 'Kwid E-Tech', capacidadeBateriaKWh: 26.8, consumoKWhPorKm: 0.13, potenciaMaxACkW: 7, potenciaMaxDCkW: 30, conectores: ['CCS2', 'TIPO2'] },
  { id: 'volvo-ex30', fabricante: 'Volvo', nome: 'EX30', capacidadeBateriaKWh: 69, consumoKWhPorKm: 0.17, potenciaMaxACkW: 11, potenciaMaxDCkW: 153, conectores: ['CCS2', 'TIPO2'] },
  { id: 'chevrolet-bolt', fabricante: 'Chevrolet', nome: 'Bolt EV', capacidadeBateriaKWh: 66, consumoKWhPorKm: 0.16, potenciaMaxACkW: 7.2, potenciaMaxDCkW: 55, conectores: ['CCS2', 'TIPO2'] },
  { id: 'nissan-leaf', fabricante: 'Nissan', nome: 'Leaf', capacidadeBateriaKWh: 40, consumoKWhPorKm: 0.17, potenciaMaxACkW: 6.6, potenciaMaxDCkW: 50, conectores: ['CHADEMO', 'TIPO2'] },
]

const minutosAtras = (min: number) => new Date(Date.now() - min * 60_000).toISOString()

export function criarPontos(): PontoRecarga[] {
  return [
    {
      id: 'p-beira-mar', nome: 'Eletroposto Beira-Mar', endereco: 'Av. Boa Viagem, 3200 · Boa Viagem',
      localizacao: { lat: -8.1196, lng: -34.8963 },
      conectores: [
        { id: 'c1', tipo: 'CCS2', potenciaKW: 60, correnteDC: true },
        { id: 'c2', tipo: 'TIPO2', potenciaKW: 22, correnteDC: false },
      ],
      situacao: 'EM_FILA', veiculosNaFila: 2, tempoMedioRecargaMin: 30, atualizadoEm: minutosAtras(6),
    },
    {
      id: 'p-cais', nome: 'Recarga Cais do Apolo', endereco: 'Cais do Apolo, 222 · Bairro do Recife',
      localizacao: { lat: -8.0612, lng: -34.8722 },
      conectores: [
        { id: 'c1', tipo: 'TIPO2', potenciaKW: 22, correnteDC: false },
        { id: 'c2', tipo: 'TIPO2', potenciaKW: 22, correnteDC: false },
      ],
      situacao: 'EM_FILA', veiculosNaFila: 1, tempoMedioRecargaMin: 32, atualizadoEm: minutosAtras(4),
    },
    {
      id: 'p-casa-forte', nome: 'Ponto Verde Casa Forte', endereco: 'Praça de Casa Forte, 50 · Casa Forte',
      localizacao: { lat: -8.0365, lng: -34.9196 },
      conectores: [{ id: 'c1', tipo: 'CCS2', potenciaKW: 100, correnteDC: true }],
      situacao: 'LIVRE', veiculosNaFila: 0, tempoMedioRecargaMin: 25, atualizadoEm: minutosAtras(12),
    },
    {
      id: 'p-gracas', nome: 'Estação Graças', endereco: 'Rua das Graças, 410 · Graças',
      localizacao: { lat: -8.048, lng: -34.897 },
      conectores: [
        { id: 'c1', tipo: 'CCS2', potenciaKW: 50, correnteDC: true },
        { id: 'c2', tipo: 'CHADEMO', potenciaKW: 50, correnteDC: true },
      ],
      situacao: 'OCUPADO', veiculosNaFila: 0, tempoMedioRecargaMin: 28, atualizadoEm: minutosAtras(48),
    },
    {
      id: 'p-pina', nome: 'Garagem Pina Energia', endereco: 'Av. Herculano Bandeira, 900 · Pina',
      localizacao: { lat: -8.0905, lng: -34.884 },
      conectores: [{ id: 'c1', tipo: 'CCS2', potenciaKW: 120, correnteDC: true }],
      situacao: 'LIVRE', veiculosNaFila: null, tempoMedioRecargaMin: 22, atualizadoEm: null,
    },
    {
      id: 'p-madalena', nome: 'Eletroposto Madalena', endereco: 'Rua Real da Torre, 1200 · Madalena',
      localizacao: { lat: -8.0545, lng: -34.909 },
      conectores: [{ id: 'c1', tipo: 'GBT', potenciaKW: 60, correnteDC: true }],
      situacao: 'LIVRE', veiculosNaFila: 0, tempoMedioRecargaMin: 30, atualizadoEm: minutosAtras(3),
    },
    {
      id: 'p-imbiribeira', nome: 'Hub Imbiribeira', endereco: 'Av. Mal. Mascarenhas de Morais, 4500 · Imbiribeira',
      localizacao: { lat: -8.111, lng: -34.913 },
      conectores: [
        { id: 'c1', tipo: 'CCS2', potenciaKW: 150, correnteDC: true },
        { id: 'c2', tipo: 'CCS2', potenciaKW: 150, correnteDC: true },
      ],
      situacao: 'MANUTENCAO', veiculosNaFila: 0, tempoMedioRecargaMin: 20, atualizadoEm: minutosAtras(20),
    },
    {
      id: 'p-boa-vista', nome: 'Estação Boa Vista', endereco: 'Rua da Aurora, 700 · Boa Vista',
      localizacao: { lat: -8.059, lng: -34.882 },
      conectores: [{ id: 'c1', tipo: 'TIPO2', potenciaKW: 11, correnteDC: false }],
      situacao: 'LIVRE', veiculosNaFila: 0, tempoMedioRecargaMin: 60, atualizadoEm: minutosAtras(9),
    },
    {
      id: 'p-olinda', nome: 'Recarga Olinda Alta', endereco: 'Av. Sigismundo Gonçalves, 300 · Olinda',
      localizacao: { lat: -8.013, lng: -34.853 },
      conectores: [{ id: 'c1', tipo: 'CCS2', potenciaKW: 60, correnteDC: true }],
      situacao: 'EM_FILA', veiculosNaFila: 3, tempoMedioRecargaMin: 30, atualizadoEm: minutosAtras(15),
    },
    {
      id: 'p-piedade', nome: 'Eletroposto Piedade', endereco: 'Av. Bernardo Vieira de Melo, 2100 · Piedade',
      localizacao: { lat: -8.172, lng: -34.916 },
      conectores: [{ id: 'c1', tipo: 'CCS2', potenciaKW: 60, correnteDC: true }],
      situacao: 'LIVRE', veiculosNaFila: 0, tempoMedioRecargaMin: 30, atualizadoEm: minutosAtras(7),
    },
  ]
}

/** Pontos que o administrador de exemplo gerencia. */
export const PONTOS_DO_ADMIN = ['p-beira-mar', 'p-pina', 'p-imbiribeira']

export interface UsuarioSimulado extends Usuario {
  senha: string
}

export const USUARIOS: UsuarioSimulado[] = [
  { id: 'u-motorista', nome: 'Carla Souza', email: 'motorista@recarga.app', senha: 'recarga123', papel: 'MOTORISTA' },
  { id: 'u-admin', nome: 'Helena Lima', email: 'admin@estabelecimento.com', senha: 'recarga123', papel: 'ADMINISTRADOR' },
  { id: 'u-operador', nome: 'Paulo Rocha', email: 'operador@rede.com', senha: 'recarga123', papel: 'OPERADOR' },
]

export const LUGARES: Destino[] = [
  { id: 'd-marco-zero', nome: 'Marco Zero', endereco: 'Praça Rio Branco · Bairro do Recife', localizacao: { lat: -8.0631, lng: -34.8711 } },
  { id: 'd-jaqueira', nome: 'Parque da Jaqueira', endereco: 'Av. Rui Barbosa · Jaqueira', localizacao: { lat: -8.0379, lng: -34.9035 } },
  { id: 'd-boa-viagem', nome: 'Praia de Boa Viagem', endereco: 'Av. Boa Viagem · Boa Viagem', localizacao: { lat: -8.1258, lng: -34.8998 } },
  { id: 'd-aeroporto', nome: 'Aeroporto do Recife', endereco: 'Praça Min. Salgado Filho · Imbiribeira', localizacao: { lat: -8.1265, lng: -34.9236 } },
  { id: 'd-olinda', nome: 'Alto da Sé', endereco: 'Largo da Sé · Olinda', localizacao: { lat: -8.0153, lng: -34.8389 } },
  { id: 'd-ufpe', nome: 'UFPE', endereco: 'Av. Prof. Moraes Rego · Cidade Universitária', localizacao: { lat: -8.0522, lng: -34.9513 } },
  { id: 'd-porto-digital', nome: 'Porto Digital', endereco: 'Rua do Apolo · Bairro do Recife', localizacao: { lat: -8.0619, lng: -34.8727 } },
  { id: 'd-derby', nome: 'Praça do Derby', endereco: 'Derby', localizacao: { lat: -8.0571, lng: -34.8995 } },
  { id: 'd-casa-amarela', nome: 'Mercado de Casa Amarela', endereco: 'Casa Amarela', localizacao: { lat: -8.0287, lng: -34.9164 } },
  { id: 'd-piedade', nome: 'Praia de Piedade', endereco: 'Jaboatão dos Guararapes', localizacao: { lat: -8.1727, lng: -34.9142 } },
]
