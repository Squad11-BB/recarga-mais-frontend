import { BotaoLink } from '../components/Botao'
import { Marca } from '../components/Marca'
import estilosTela from './Tela.module.css'

export function NaoEncontrada() {
  return (
    <main className={estilosTela.tela}>
      <Marca tamanho={36} />
      <h1 className={estilosTela.titulo}>Página não encontrada</h1>
      <p className={estilosTela.subtitulo}>O endereço pode ter mudado. Volte para o mapa para continuar.</p>
      <BotaoLink to="/mapa" tamanho="parado">
        Ir para o mapa
      </BotaoLink>
    </main>
  )
}
