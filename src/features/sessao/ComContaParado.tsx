import { Outlet } from 'react-router-dom'
import { SoParado } from '../conducao/SoParado'
import { RequerConta } from './RequerConta'

/** Telas de apoio: só com conta e com o carro parado. */
export function ComContaParado() {
  return (
    <SoParado>
      <RequerConta>
        <Outlet />
      </RequerConta>
    </SoParado>
  )
}
