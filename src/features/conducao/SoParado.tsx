import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { BotaoLink } from '../../components/Botao'
import { Cabecalho } from '../../components/Cabecalho'
import estilosTela from '../../pages/Tela.module.css'
import { useEmMovimento } from './useEmMovimento'

/** Telas de apoio só abrem com o carro parado (RF25). */
export function SoParado({ children, titulo = 'Disponível com o carro parado' }: { children: ReactNode; titulo?: string }) {
  const emMovimento = useEmMovimento()
  if (!emMovimento) return <>{children}</>
  return (
    <div className={estilosTela.tela}>
      <Cabecalho titulo="" voltarPara="/mapa" focarAoAbrir={false} />
      <div className={`${estilosTela.pilha} ${estilosTela.centro}`} role="status">
        <span className={estilosTela.iconeCirculo}>
          <Lock aria-hidden size={26} />
        </span>
        <h1 className={estilosTela.titulo}>{titulo}</h1>
        <p className={estilosTela.subtitulo}>Por segurança, esta tela fica bloqueada enquanto o carro está em movimento.</p>
      </div>
      <BotaoLink to="/mapa" className={estilosTela.empurrar}>
        Voltar para o mapa
      </BotaoLink>
    </div>
  )
}
