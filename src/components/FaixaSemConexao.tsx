import { RefreshCw, WifiOff } from 'lucide-react'
import { useOnline } from '../lib/useOnline'
import estilos from './FaixaSemConexao.module.css'

/** Faixa "Sem conexão" com o botão Tentar novamente. */
export function FaixaSemConexao({ aoTentar }: { aoTentar?: () => void }) {
  const online = useOnline()
  if (online) return null
  return (
    <div className={estilos.faixa} role="alert">
      <WifiOff aria-hidden size={20} />
      <span>Sem conexão</span>
      <button type="button" className={estilos.botao} onClick={() => (aoTentar ? aoTentar() : window.location.reload())}>
        <RefreshCw aria-hidden size={16} />
        Tentar novamente
      </button>
    </div>
  )
}
