import estilos from './Marca.module.css'

interface Props {
  tamanho?: number
  comNome?: boolean
  opcao?: 1 | 2
}

/**
 * Logomarca do Recarga+: o símbolo sempre dentro do quadrado amarelo (mínimo 32 px)
 * e o nome ao lado, em texto, fora da imagem.
 */
export function Marca({ tamanho = 36, comNome = true, opcao = 1 }: Props) {
  const lado = Math.max(32, tamanho)
  return (
    <span className={estilos.marca}>
      <span className={estilos.quadrado} style={{ width: lado, height: lado, padding: Math.round(lado * 0.1) }} aria-hidden={comNome || undefined}>
        <img
          src={`/marca/simbolo-opcao-${opcao}.png`}
          alt={comNome ? '' : 'Recarga+'}
          width={lado}
          height={lado}
          decoding="async"
        />
      </span>
      {comNome && (
        <span className={estilos.nome} style={{ fontSize: Math.round(lado * 0.55) }}>
          Recarga<span className={estilos.mais}>+</span>
        </span>
      )}
    </span>
  )
}
