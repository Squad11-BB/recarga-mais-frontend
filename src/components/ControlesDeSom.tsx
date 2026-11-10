import { useState } from 'react'
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react'
import { gravar, ler } from '../lib/armazenamento'
import estilos from './ControlesDeSom.module.css'

const CHAVE = 'recarga:som'

/**
 * Som e notificações do painel do carro, no canto superior direito do mapa.
 * Silenciar não esconde avisos: bateria muito baixa e falhas continuam na tela.
 */
export function ControlesDeSom() {
  const [estado, setEstado] = useState(() => ler(CHAVE, { som: true, notificacoes: true }))

  const alternar = (chave: 'som' | 'notificacoes') => {
    const novo = { ...estado, [chave]: !estado[chave] }
    setEstado(novo)
    gravar(CHAVE, novo)
  }

  return (
    <div className={estilos.grupo} role="group" aria-label="Som e notificações">
      <button
        type="button"
        className={`${estilos.botao} ${estado.som ? '' : estilos.desligado}`}
        aria-pressed={!estado.som}
        aria-label={estado.som ? 'Silenciar som' : 'Ligar som'}
        onClick={() => alternar('som')}
      >
        {estado.som ? <Volume2 aria-hidden size={28} /> : <VolumeX aria-hidden size={28} />}
      </button>
      <button
        type="button"
        className={`${estilos.botao} ${estado.notificacoes ? '' : estilos.desligado}`}
        aria-pressed={!estado.notificacoes}
        aria-label={estado.notificacoes ? 'Silenciar notificações' : 'Ligar notificações'}
        onClick={() => alternar('notificacoes')}
      >
        {estado.notificacoes ? <Bell aria-hidden size={28} /> : <BellOff aria-hidden size={28} />}
      </button>
    </div>
  )
}
