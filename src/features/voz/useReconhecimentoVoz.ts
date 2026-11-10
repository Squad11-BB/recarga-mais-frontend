import { useCallback, useEffect, useRef, useState } from 'react'

// Tipos mínimos da Web Speech API (ainda fora do lib.dom padrão).
interface ResultadoFala {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}
interface ErroFala {
  error: string
}
interface Reconhecedor {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: ResultadoFala) => void) | null
  onerror: ((e: ErroFala) => void) | null
  onend: (() => void) | null
  start(): void
  abort(): void
}
type ConstrutorReconhecedor = new () => Reconhecedor

function construtor(): ConstrutorReconhecedor | null {
  const w = window as unknown as {
    SpeechRecognition?: ConstrutorReconhecedor
    webkitSpeechRecognition?: ConstrutorReconhecedor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export type EstadoVoz = 'parado' | 'ouvindo' | 'nao-entendi' | 'sem-permissao' | 'nao-suportado'

/** Reconhecimento de voz do próprio navegador, em português do Brasil. */
export function useReconhecimentoVoz(aoOuvir: (texto: string) => void) {
  const [estado, setEstado] = useState<EstadoVoz>('parado')
  const reconhecedor = useRef<Reconhecedor | null>(null)
  const callback = useRef(aoOuvir)

  useEffect(() => {
    callback.current = aoOuvir
  }, [aoOuvir])

  useEffect(() => () => reconhecedor.current?.abort(), [])

  const ouvir = useCallback(() => {
    const Construtor = construtor()
    if (!Construtor) {
      setEstado('nao-suportado')
      return
    }
    if (reconhecedor.current) reconhecedor.current.onend = null
    reconhecedor.current?.abort()
    const r = new Construtor()
    r.lang = 'pt-BR'
    r.interimResults = false
    r.maxAlternatives = 1
    let ouviuAlgo = false
    r.onresult = (e) => {
      const texto = e.results[0]?.[0]?.transcript?.trim() ?? ''
      ouviuAlgo = texto.length > 0
      setEstado(ouviuAlgo ? 'parado' : 'nao-entendi')
      if (ouviuAlgo) callback.current(texto)
    }
    r.onerror = (e) => {
      ouviuAlgo = true
      setEstado(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'sem-permissao' : 'nao-entendi')
    }
    r.onend = () => {
      if (!ouviuAlgo) setEstado('nao-entendi')
    }
    reconhecedor.current = r
    setEstado('ouvindo')
    r.start()
  }, [])

  const parar = useCallback(() => {
    if (reconhecedor.current) reconhecedor.current.onend = null
    reconhecedor.current?.abort()
    setEstado('parado')
  }, [])

  return { estado, ouvir, parar, definirEstado: setEstado }
}
