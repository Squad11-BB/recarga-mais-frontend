import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@fontsource-variable/manrope'
import './styles/global.css'
import { roteador } from './App'
import { ProvedorLocalizacao } from './features/localizacao/ProvedorLocalizacao'
import { ProvedorRecomendacao } from './features/recomendacao/ProvedorRecomendacao'
import { ProvedorSessao } from './features/sessao/ProvedorSessao'
import { ProvedorVeiculo } from './features/veiculo/ProvedorVeiculo'
import { lerFlagsDaUrl } from './services/mock/flags'
import { usandoServidorSimulado } from './services/api'

if (usandoServidorSimulado) lerFlagsDaUrl()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProvedorSessao>
      <ProvedorLocalizacao>
        <ProvedorVeiculo>
          <ProvedorRecomendacao>
            <RouterProvider router={roteador} />
          </ProvedorRecomendacao>
        </ProvedorVeiculo>
      </ProvedorLocalizacao>
    </ProvedorSessao>
  </StrictMode>,
)
