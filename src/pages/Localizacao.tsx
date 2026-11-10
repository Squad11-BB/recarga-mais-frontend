import { Link, useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Botao } from '../components/Botao'
import { FolhaInferior } from '../components/FolhaInferior'
import { CENA_VAZIA, useCenaMapa } from '../components/mapa/cena'
import { useLocalizacao } from '../features/localizacao/localizacao'
import { useVeiculo } from '../features/veiculo/veiculo'
import estilosTela from './Tela.module.css'

/** Consentimento explícito antes de acessar a localização (LGPD, RF22). */
export function Localizacao() {
  const navegar = useNavigate()
  const { conceder, recusar } = useLocalizacao()
  const { veiculo } = useVeiculo()
  const proxima = veiculo ? '/mapa' : '/veiculo'

  useCenaMapa({ ...CENA_VAZIA, esmaecido: true })

  return (
    <FolhaInferior
      className={estilosTela.folhaFixa}
      titulo="Usar a sua localização?"
      icone={<MapPin size={26} />}
    >
      <p className={`${estilosTela.subtitulo} ${estilosTela.centro}`}>
        Usamos a sua localização só para achar carregadores perto de você e calcular o tempo até eles. Você pode desativar
        quando quiser.
      </p>
      <div className={estilosTela.pilha}>
        <Botao
          onClick={() => {
            conceder()
            navegar(proxima, { replace: true })
          }}
        >
          Permitir
        </Botao>
        <Botao
          variante="secundario"
          onClick={() => {
            recusar()
            navegar(proxima, { replace: true })
          }}
        >
          Agora não
        </Botao>
        <Link to="/privacidade" className={estilosTela.centro} style={{ fontWeight: 700, padding: 12 }}>
          Política de privacidade
        </Link>
      </div>
    </FolhaInferior>
  )
}
