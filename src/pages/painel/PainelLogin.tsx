import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Aviso } from '../../components/Aviso'
import { Botao } from '../../components/Botao'
import { Campo } from '../../components/Campo'
import { Marca } from '../../components/Marca'
import { useSessao } from '../../features/sessao/sessao'
import { emailValido } from '../../lib/validacao'
import { FalhaApi } from '../../services/http'
import estilos from './Painel.module.css'

function destinoDoPainel(valor: string | null, padrao: string) {
  return valor && valor.startsWith('/painel/') && !valor.startsWith('//') ? valor : padrao
}

/** Login do painel. O nível de acesso (Administrador ou Operador) vem do login. */
export function PainelLogin() {
  const navegar = useNavigate()
  const [params] = useSearchParams()
  const { entrar, sair, usuario } = useSessao()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({})
  const [falha, setFalha] = useState<string | null>(null)
  const [esqueci, setEsqueci] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const refEmail = useRef<HTMLInputElement>(null)
  const refSenha = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.documentElement.dataset.contexto = 'painel'
  }, [])

  // Já entrou: vai direto para a área do papel.
  useEffect(() => {
    if (usuario?.papel === 'ADMINISTRADOR') navegar('/painel/fila', { replace: true })
    if (usuario?.papel === 'OPERADOR') navegar('/painel/metricas', { replace: true })
  }, [usuario, navegar])

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const novos: typeof erros = {}
    if (!emailValido(email)) novos.email = 'Informe um e-mail válido.'
    if (!senha) novos.senha = 'Digite sua senha.'
    setErros(novos)
    setFalha(null)
    if (novos.email) return refEmail.current?.focus()
    if (novos.senha) return refSenha.current?.focus()

    setEnviando(true)
    try {
      const u = await entrar(email, senha)
      if (u.papel === 'MOTORISTA') {
        sair()
        setFalha('Esse acesso é do app. O painel é só para estabelecimentos cadastrados.')
        return
      }
      const padrao = u.papel === 'ADMINISTRADOR' ? '/painel/fila' : '/painel/metricas'
      navegar(destinoDoPainel(params.get('voltar'), padrao), { replace: true })
    } catch (erro) {
      setFalha(erro instanceof FalhaApi ? erro.mensagem : 'Não foi possível entrar agora.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={estilos.publico}>
      <main className={estilos.cartaoLogin}>
        <Marca tamanho={36} />
        <div>
          <h1 className={estilos.titulo}>Painel de gestão</h1>
          <p className={estilos.subtitulo}>Acesso para estabelecimentos cadastrados.</p>
        </div>
        {falha && (
          <Aviso tipo="erro" titulo="Não foi possível entrar">
            {falha}
          </Aviso>
        )}
        <form className={estilos.pilha} onSubmit={enviar} noValidate>
          <Campo
            ref={refEmail}
            rotulo="E-mail"
            type="email"
            autoComplete="email"
            placeholder="nome@estabelecimento.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            erro={erros.email}
          />
          <Campo
            ref={refSenha}
            rotulo="Senha"
            type="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            erro={erros.senha}
          />
          <Botao type="submit" tamanho="compacto" carregando={enviando} textoCarregando="Entrando">
            Entrar
          </Botao>
        </form>
        <button type="button" className={estilos.linkCentro} onClick={() => setEsqueci(true)}>
          Esqueci minha senha
        </button>
        {esqueci && (
          <p className={estilos.nota} role="status">
            Fale com a equipe do Recarga+ para redefinir a senha.
          </p>
        )}
        <p className={estilos.nota}>Seu nível de acesso (Administrador ou Operador) é identificado pelo login.</p>
        <hr className={estilos.separador} />
        <strong>Ainda não tem acesso?</strong>
        <Botao variante="secundario" tamanho="compacto" onClick={() => navegar('/painel/solicitar-cadastro')}>
          Solicitar cadastro do estabelecimento
        </Botao>
        <p className={estilos.nota} style={{ textAlign: 'left' }}>
          A equipe do Recarga+ analisa o pedido e entra em contato.
        </p>
      </main>
    </div>
  )
}
