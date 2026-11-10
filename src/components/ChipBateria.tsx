import { Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useVeiculo } from '../features/veiculo/veiculo'
import estilos from './ChipBateria.module.css'

/** Bateria e autonomia do veículo ativo. Toque abre a tela do veículo. */
export function ChipBateria({ expandido = false }: { expandido?: boolean }) {
  const { veiculo, autonomiaKm } = useVeiculo()
  if (!veiculo) return null
  const rotulo = `Bateria em ${veiculo.nivelBateriaPct}%, autonomia de cerca de ${autonomiaKm} km. Alterar veículo`

  if (expandido) {
    return (
      <Link to="/veiculo" className={`${estilos.chip} ${estilos.expandido}`} aria-label={rotulo}>
        <span className={estilos.linha}>
          <Zap aria-hidden size={28} className={estilos.raio} />
          <strong className={`${estilos.pct} numeros`}>{veiculo.nivelBateriaPct}%</strong>
          <span className={estilos.autonomia}>
            <small>Autonomia</small>
            <strong className="numeros">{autonomiaKm} km</strong>
          </span>
        </span>
        <span className={estilos.barra} aria-hidden>
          <span style={{ width: `${veiculo.nivelBateriaPct}%` }} />
        </span>
      </Link>
    )
  }

  return (
    <Link to="/veiculo" className={estilos.chip} aria-label={rotulo}>
      <Zap aria-hidden size={18} className={estilos.raio} />
      <strong className="numeros">{veiculo.nivelBateriaPct}%</strong>
      <span className={`${estilos.km} numeros`}>· {autonomiaKm} km</span>
    </Link>
  )
}
