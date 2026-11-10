import { AlertTriangle, Check, Lock, TriangleAlert, Zap } from 'lucide-react'
import type { SituacaoPonto, TipoConector } from '../services/contratos'
import { NOMES_CONECTOR } from '../features/veiculo/veiculo'
import { haQuantoTempo } from '../lib/formato'
import estilos from './Chips.module.css'

/** Selo amarelo "IA": marca o que foi escolhido ou escrito pela IA. */
export function ChipIA({ texto = 'IA', titulo = 'Escolhido pela IA' }: { texto?: string; titulo?: string }) {
  return (
    <span className={`${estilos.chip} ${estilos.ia}`} title={titulo}>
      {texto}
    </span>
  )
}

export function ChipPontos() {
  return <span className={`${estilos.chip} ${estilos.ia}`}>+pontos</span>
}

export function ChipDestaque({ children }: { children: string }) {
  return <span className={`${estilos.chip} ${estilos.destaque}`}>{children}</span>
}

export function ChipCompativel({ conector }: { conector: TipoConector }) {
  return (
    <span className={estilos.compativel}>
      <Check aria-hidden size={16} strokeWidth={3} />
      {NOMES_CONECTOR[conector]} compatível
    </span>
  )
}

export function SeloDesatualizado({ haMin }: { haMin: number | null }) {
  return (
    <span className={`${estilos.chip} ${estilos.desatualizado}`}>
      <AlertTriangle aria-hidden size={14} />
      {haMin === null ? 'Sem data de atualização' : `Desatualizado ${haQuantoTempo(haMin)}`}
    </span>
  )
}

export function ChipParado({ emMovimento }: { emMovimento: boolean }) {
  return (
    <span className={`${estilos.chip} ${estilos.parado}`}>
      <Lock aria-hidden size={13} />
      {emMovimento ? 'Em movimento' : 'Parado'}
    </span>
  )
}

const SITUACOES: Record<SituacaoPonto, { texto: string; classe: string; Icone: typeof Check }> = {
  LIVRE: { texto: 'Disponível', classe: estilos.livre, Icone: Check },
  OCUPADO: { texto: 'Em uso', classe: estilos.emUso, Icone: Zap },
  EM_FILA: { texto: 'Com fila', classe: estilos.emUso, Icone: Zap },
  MANUTENCAO: { texto: 'Manutenção', classe: estilos.manutencao, Icone: TriangleAlert },
}

/** Estado nunca depende só da cor: sempre vem com ícone e texto. */
export function ChipSituacao({ situacao }: { situacao: SituacaoPonto }) {
  const { texto, classe, Icone } = SITUACOES[situacao]
  return (
    <span className={`${estilos.situacao} ${classe}`}>
      <Icone aria-hidden size={16} />
      {texto}
    </span>
  )
}
