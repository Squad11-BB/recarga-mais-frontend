import { describe, expect, it } from 'vitest'
import { cnpjValido, emailValido, mascaraCnpj, mascaraTelefone } from './validacao'
import { nivelBateriaValido } from '../features/veiculo/veiculo'

describe('validações', () => {
  it('e-mail', () => {
    expect(emailValido('nome@dominio.com')).toBe(true)
    expect(emailValido('nome@')).toBe(false)
  })

  it('CNPJ pelos dígitos verificadores', () => {
    expect(cnpjValido('11.222.333/0001-81')).toBe(true)
    expect(cnpjValido('11.222.333/0001-82')).toBe(false)
    expect(cnpjValido('00.000.000/0000-00')).toBe(false)
  })

  it('máscaras', () => {
    expect(mascaraCnpj('11222333000181')).toBe('11.222.333/0001-81')
    expect(mascaraTelefone('81999990000')).toBe('(81) 99999-0000')
  })

  it('bateria em 0, 100 e 101 (US-E02)', () => {
    expect(nivelBateriaValido(0)).toBe(true)
    expect(nivelBateriaValido(100)).toBe(true)
    expect(nivelBateriaValido(101)).toBe(false)
  })
})
