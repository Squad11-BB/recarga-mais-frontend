import { type ReactNode, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

/** Espera enquanto uma parte do app (como o painel web) é baixada. */
export function Carregando({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <p role="status" style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 24 }}>
          <Loader2 aria-hidden size={20} style={{ animation: 'girar 1s linear infinite' }} />
          Carregando…
        </p>
      }
    >
      {children}
    </Suspense>
  )
}
