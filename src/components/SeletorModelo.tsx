import { useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import type { ModeloVeiculo } from '../services/contratos'
import { numero } from '../lib/formato'
import estilos from './SeletorModelo.module.css'

interface Props {
  modelos: ModeloVeiculo[]
  selecionado: ModeloVeiculo | null
  aoEscolher(modelo: ModeloVeiculo): void
  desabilitado?: boolean
  carregando?: boolean
}

const nomeCompleto = (m: ModeloVeiculo) => `${m.fabricante} ${m.nome}`

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/** Seletor de modelo com busca (combobox acessível por teclado). */
export function SeletorModelo({ modelos, selecionado, aoEscolher, desabilitado, carregando }: Props) {
  const id = useId()
  const idLista = `${id}-lista`
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [ativo, setAtivo] = useState(0)
  const refEntrada = useRef<HTMLInputElement>(null)

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim())
    return termo ? modelos.filter((m) => normalizar(nomeCompleto(m)).includes(termo)) : modelos
  }, [busca, modelos])

  const escolher = (m: ModeloVeiculo) => {
    aoEscolher(m)
    setBusca('')
    setAberto(false)
  }

  return (
    <div className={estilos.seletor}>
      <label htmlFor={id} className={estilos.rotulo}>
        Modelo
      </label>
      <div className={estilos.caixa}>
        <Search aria-hidden size={20} className={estilos.icone} />
        <input
          ref={refEntrada}
          id={id}
          role="combobox"
          aria-expanded={aberto}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={aberto && filtrados[ativo] ? `${id}-${filtrados[ativo].id}` : undefined}
          className={estilos.entrada}
          placeholder={carregando ? 'Carregando modelos…' : selecionado ? nomeCompleto(selecionado) : 'Busque o modelo do veículo'}
          value={aberto ? busca : selecionado ? nomeCompleto(selecionado) : busca}
          disabled={desabilitado || carregando}
          autoComplete="off"
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 120)}
          onChange={(e) => {
            setBusca(e.target.value)
            setAtivo(0)
            setAberto(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setAberto(true)
              setAtivo((a) => Math.min(filtrados.length - 1, a + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setAtivo((a) => Math.max(0, a - 1))
            } else if (e.key === 'Enter' && aberto && filtrados[ativo]) {
              e.preventDefault()
              escolher(filtrados[ativo])
            } else if (e.key === 'Escape') {
              setAberto(false)
            }
          }}
        />
        <ChevronDown aria-hidden size={20} className={estilos.icone} />
      </div>
      {aberto && (
        <ul id={idLista} role="listbox" className={estilos.lista} aria-label="Modelos">
          {filtrados.length === 0 ? (
            <li className={estilos.vazio} role="presentation">
              Nenhum modelo encontrado
            </li>
          ) : (
            filtrados.map((m, i) => (
              <li
                key={m.id}
                id={`${id}-${m.id}`}
                role="option"
                aria-selected={selecionado?.id === m.id}
                className={`${estilos.opcao} ${i === ativo ? estilos.ativa : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => escolher(m)}
              >
                <strong>{nomeCompleto(m)}</strong>
                <small>{numero(m.capacidadeBateriaKWh)} kWh</small>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
