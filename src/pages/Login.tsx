import { type FormEvent, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Mail, Monitor } from 'lucide-react'
import { Aviso } from '../components/Aviso'
import { Botao } from '../components/Botao'
import { Cabecalho } from '../components/Cabecalho'
import { Campo } from '../components/Campo'
import { Marca } from '../components/Marca'
import { useSessao } from '../features/sessao/sessao'
import { destinoSeguro } from '../lib/navegacao'
import { emailValido } from '../lib/validacao'
import { FalhaApi } from '../services/http'
import estilosTela from './Tela.module.css'
import estilos from './Login.module.css'

/** Login opcional do app. Sem escolha de perfil: o tipo de acesso vem do login. */
export function Login() {
  const navegar = useNavigate()
  const [params] = useSearchParams()
  const voltar = destinoSeguro(params.get('voltar'))
  const { entrar, sair } = useSessao()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({})
  const [falha, setFalha] = useState<string | null>(null)
  const [acessoDoPainel, setAcessoDoPainel] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const refEmail = useRef<HTMLInputElement>(null)
  const refSenha = useRef<HTMLInputElement>(null)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const novos: typeof erros = {}
    if (!emailValido(email)) novos.email = 'Informe um e-mail válido.'
    if (!senha) novos.senha = 'Digite sua senha.'
    setErros(novos)
    setFalha(null)
    setAcessoDoPainel(false)
    if (novos.email) return refEmail.current?.focus()
    if (novos.senha) return refSenha.current?.focus()

    setEnviando(true)
    try {
      const usuario = await entrar(email, senha)
      if (usuario.papel !== 'MOTORISTA') {
        // Administrador e Operador entram só pelo painel web.
        sair()
        setAcessoDoPainel(true)
        return
      }
      navegar(voltar, { replace: true })
    } catch (erro) {
      setFalha(erro instanceof FalhaApi ? erro.mensagem : 'Não foi possível entrar agora.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={estilosTela.tela}>
      <Cabecalho titulo="" direita={<Marca tamanho={32} />} focarAoAbrir={false} />
      <div>
        <h1 className={estilosTela.titulo}>Entrar</h1>
        <p className={estilosTela.subtitulo}>Para salvar veículos, ver o histórico e reportar fila.</p>
      </div>

      {acessoDoPainel && (
        <Aviso
          titulo="Esse acesso é do painel web"
          icone={<Monitor aria-hidden size={22} />}
          acoes={
            <Link to="/painel/login" className={estilos.linkForte}>
              Abrir o painel de gestão
            </Link>
          }
        >
          Quem gerencia um posto entra pelo painel web, não pelo app.
        </Aviso>
      )}
      {falha && (
        <Aviso tipo="erro" titulo="Não foi possível entrar">
          {falha}
        </Aviso>
      )}

      <form className={estilosTela.pilha} onSubmit={enviar} noValidate>
        <Campo
          ref={refEmail}
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          placeholder="nome@dominio.com"
          icone={<Mail size={20} />}
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
          icone={<Lock size={20} />}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          erro={erros.senha}
        />
        <Botao type="submit" tamanho="parado" carregando={enviando} textoCarregando="Entrando">
          Entrar
        </Botao>
      </form>

      <p className={estilos.cadastro}>
        Ainda não tem conta? <Link to={`/cadastro?voltar=${encodeURIComponent(voltar)}`}>Cadastre-se</Link>
      </p>
      <Botao variante="secundario" tamanho="parado" onClick={() => (voltar === '/mapa' ? navegar('/mapa') : navegar(-1))}>
        Agora não
      </Botao>

      <div className={`${estilos.painel} ${estilosTela.empurrar}`}>
        <Monitor aria-hidden size={22} />
        <p>
          <strong>Gerencia um posto?</strong>
          <br />O acesso é pelo painel web. <Link to="/painel/login">Abrir painel</Link>
        </p>
      </div>
    </div>
  )
}
