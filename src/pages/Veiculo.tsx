import { type CSSProperties, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Botao } from '../components/Botao'
import { Campo } from '../components/Campo'
import { Aviso } from '../components/Aviso'
import { FolhaInferior } from '../components/FolhaInferior'
import { SelecaoConectores } from '../components/SelecaoConectores'
import { SeletorModelo } from '../components/SeletorModelo'
import { CENA_VAZIA, useCenaMapa } from '../components/mapa/cena'
import { useEmMovimento } from '../features/conducao/useEmMovimento'
import { useLocalizacao } from '../features/localizacao/localizacao'
import { NOMES_CONECTOR, nivelBateriaValido, useVeiculo } from '../features/veiculo/veiculo'
import { numero } from '../lib/formato'
import { api } from '../services/api'
import type { ModeloVeiculo, TipoConector } from '../services/contratos'
import estilosTela from './Tela.module.css'
import estilos from './Veiculo.module.css'

/** Valores usados quando o carro é informado manualmente. */
const PADRAO_MANUAL = { consumoKWhPorKm: 0.16, potenciaMaxACkW: 7, potenciaMaxDCkW: 50 }

/** Passo 2 (1ª vez): modelo e bateria atual. Conector e capacidade vêm do modelo. */
export function Veiculo() {
  const navegar = useNavigate()
  const emMovimento = useEmMovimento()
  const { posicao } = useLocalizacao()
  const { veiculo, definir } = useVeiculo()

  const [modelos, setModelos] = useState<ModeloVeiculo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [falhou, setFalhou] = useState(false)
  const [modelo, setModelo] = useState<ModeloVeiculo | null>(null)
  const [manual, setManual] = useState(veiculo !== null && veiculo.modeloId === null)
  const [editando, setEditando] = useState(false)
  const [capacidade, setCapacidade] = useState(veiculo ? String(veiculo.capacidadeBateriaKWh) : '')
  const [conectores, setConectores] = useState<TipoConector[]>(veiculo?.conectores ?? [])
  const [bateria, setBateria] = useState(veiculo?.nivelBateriaPct ?? 60)
  const [erros, setErros] = useState<{ capacidade?: string; conectores?: string; modelo?: string }>({})

  useCenaMapa({ ...CENA_VAZIA, usuario: posicao, esmaecido: true })

  useEffect(() => {
    let ativo = true
    api
      .listarModelos()
      .then((lista) => {
        if (!ativo) return
        setModelos(lista)
        const atual = lista.find((m) => m.id === veiculo?.modeloId) ?? null
        setModelo(atual)
      })
      .catch(() => ativo && setFalhou(true))
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [veiculo?.modeloId])

  const escolherModelo = (m: ModeloVeiculo) => {
    setModelo(m)
    setManual(false)
    setEditando(false)
    setCapacidade(String(m.capacidadeBateriaKWh))
    setConectores(m.conectores)
    setErros({})
  }

  const usarCamposEditaveis = manual || editando

  const comecar = () => {
    const novosErros: typeof erros = {}
    const cap = Number(capacidade.replace(',', '.'))
    if (!manual && !modelo) novosErros.modelo = 'Escolha o modelo ou informe o carro manualmente.'
    if (usarCamposEditaveis && (!Number.isFinite(cap) || cap < 10 || cap > 200)) {
      novosErros.capacidade = 'Informe a capacidade entre 10 e 200 kWh.'
    }
    if (usarCamposEditaveis && conectores.length === 0) novosErros.conectores = 'Escolha pelo menos um conector.'
    setErros(novosErros)
    if (Object.keys(novosErros).length > 0 || !nivelBateriaValido(bateria)) return

    const base = modelo && !manual ? modelo : null
    definir({
      modeloId: base?.id ?? null,
      nome: base ? `${base.fabricante} ${base.nome}` : 'Informado manualmente',
      capacidadeBateriaKWh: usarCamposEditaveis ? cap : base!.capacidadeBateriaKWh,
      consumoKWhPorKm: base?.consumoKWhPorKm ?? PADRAO_MANUAL.consumoKWhPorKm,
      potenciaMaxACkW: base?.potenciaMaxACkW ?? PADRAO_MANUAL.potenciaMaxACkW,
      potenciaMaxDCkW: base?.potenciaMaxDCkW ?? PADRAO_MANUAL.potenciaMaxDCkW,
      conectores: usarCamposEditaveis ? conectores : base!.conectores,
      nivelBateriaPct: bateria,
    })
    navegar('/mapa', { replace: true })
  }

  return (
    <FolhaInferior className={estilosTela.folhaFixa} titulo="Qual é o seu carro?">
      <p className={estilos.subtitulo}>Escolha o modelo. Conector e capacidade da bateria vêm junto.</p>

      {emMovimento && (
        <Aviso titulo="Pare o carro para editar o veículo" anunciar>
          Por segurança, essa edição fica bloqueada com o carro em movimento.
        </Aviso>
      )}
      {falhou && (
        <Aviso tipo="erro" titulo="Não foi possível carregar os modelos">
          Você pode informar o carro manualmente.
        </Aviso>
      )}

      {!manual && (
        <SeletorModelo
          modelos={modelos}
          selecionado={modelo}
          aoEscolher={escolherModelo}
          carregando={carregando}
          desabilitado={emMovimento}
        />
      )}
      {erros.modelo && (
        <p className={estilos.erro} role="alert">
          {erros.modelo}
        </p>
      )}

      {modelo && !manual && !editando && (
        <div className={estilos.preenchido}>
          <div className={estilos.preenchidoTopo}>
            <span>Preenchido pelo modelo</span>
            <button type="button" className={estilos.editar} onClick={() => setEditando(true)} disabled={emMovimento}>
              Editar
            </button>
          </div>
          <dl>
            <div>
              <dt>Conector</dt>
              <dd>{modelo.conectores.map((c) => NOMES_CONECTOR[c]).join(' · ')}</dd>
            </div>
            <div>
              <dt>Capacidade da bateria</dt>
              <dd className="numeros">{numero(modelo.capacidadeBateriaKWh)} kWh</dd>
            </div>
          </dl>
        </div>
      )}

      {usarCamposEditaveis && (
        <div className={estilosTela.pilha}>
          <SelecaoConectores
            rotulo="Conectores do carro"
            opcoes={['TIPO2', 'CCS2', 'CHADEMO', 'GBT']}
            valor={conectores}
            aoMudar={setConectores}
            erro={erros.conectores}
            idErro="erro-conectores"
          />
          <Campo
            rotulo="Capacidade da bateria (kWh)"
            inputMode="decimal"
            value={capacidade}
            onChange={(e) => setCapacidade(e.target.value)}
            erro={erros.capacidade}
            disabled={emMovimento}
          />
        </div>
      )}

      <div className={estilos.bateria}>
        <div className={estilos.bateriaTopo}>
          <label htmlFor="bateria-atual">Bateria atual</label>
          <output htmlFor="bateria-atual" className="numeros">
            {bateria}%
          </output>
        </div>
        <input
          id="bateria-atual"
          type="range"
          min={0}
          max={100}
          step={1}
          value={bateria}
          onChange={(e) => setBateria(Number(e.target.value))}
          disabled={emMovimento}
          className={estilos.slider}
          style={{ '--preenchido': `${bateria}%` } as CSSProperties}
          aria-valuetext={`${bateria}%`}
        />
      </div>

      <Botao onClick={comecar} bloqueado={emMovimento}>
        {emMovimento ? 'Bloqueado em movimento' : veiculo ? 'Salvar' : 'Começar'}
      </Botao>

      <p className={estilos.rodape}>
        {manual ? (
          <>
            Achou o seu modelo?{' '}
            <button type="button" className={estilos.link} onClick={() => setManual(false)}>
              Escolher da lista
            </button>
          </>
        ) : (
          <>
            Meu modelo não está na lista.{' '}
            <button
              type="button"
              className={estilos.link}
              onClick={() => {
                setManual(true)
                setModelo(null)
                setErros({})
              }}
            >
              Informar manualmente
            </button>
          </>
        )}
      </p>
    </FolhaInferior>
  )
}
