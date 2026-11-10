import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Papel } from '../../services/contratos'
import { useSessao } from './sessao'

/**
 * Protege as telas do painel web. O papel vem do login; o servidor confere
 * de novo em cada pedido, então isto é só para a navegação.
 * Sem `papel`, aceita qualquer papel de gestão (Administrador ou Operador).
 */
export function RequerPapel({ papel, children }: { papel?: Exclude<Papel, 'MOTORISTA'>; children: ReactNode }) {
  const { usuario } = useSessao()
  const { pathname } = useLocation()
  if (!usuario || usuario.papel === 'MOTORISTA') {
    return <Navigate to={`/painel/login?voltar=${encodeURIComponent(pathname)}`} replace />
  }
  if (papel && usuario.papel !== papel) {
    return <Navigate to={usuario.papel === 'ADMINISTRADOR' ? '/painel/fila' : '/painel/metricas'} replace />
  }
  return <>{children}</>
}
