import { type FormEvent, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Mail, User } from 'lucide-react'
import { Aviso } from '../components/Aviso'
import { Botao } from '../components/Botao'
import { Cabecalho } from '../components/Cabecalho'
import { Campo } from '../components/Campo'
import { useSessao } from '../features/sessao/sessao'
import { destinoSeguro } from '../lib/navegacao'
import { emailValido } from '../lib/validacao'
import { FalhaApi } from '../services/http'
import estilosTela from './Tela.module.css'

type Erros = Partial<Record<'nome' | 'email' | 'senha', string>>

/** Criar conta de motorista. */
export function Cadastro() {
  const navegar = useNavigate()
  const [params] = useSearchParams()
  const voltar = destinoSeguro(params.get('voltar'))
  const { cadastrar } = useSessao()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<Erros>({})
  const [falha, setFalha] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const refNome = useRef<HTMLInputElement>(null)
  const refEmail = useRef<HTMLInputElement>(null)
  const refSenha = useRef<HTMLInputElement>(null)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const novos: Erros = {}
    if (nome.trim().length < 2) novos.nome = 'Informe seu nome.'
    if (!emailValido(email)) novos.email = 'Informe um e-mail válido.'
    if (senha.length < 8) novos.senha = 'A senha precisa ter pelo menos 8 caracteres.'
    setErros(novos)
    setFalha(null)
    const primeiro = (['nome', 'email', 'senha'] as const).find((c) => novos[c])
    if (primeiro) return { nome: refNome, email: refEmail, senha: refSenha }[primeiro].current?.focus()

    setEnviando(true)
    try {
      await cadastrar(nome.trim(), email, senha)
      navegar(voltar, { replace: true })
    } catch (erro) {
      setFalha(erro instanceof FalhaApi ? erro.mensagem : 'Não foi possível criar a conta agora.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={estilosTela.tela}>
      <Cabecalho titulo="Criar conta" />
      <p className={estilosTela.subtitulo}>Com a conta, você salva veículos, vê o histórico e reporta fila.</p>
      {falha && (
        <Aviso tipo="erro" titulo="Não foi possível criar a conta">
          {falha}
        </Aviso>
      )}
      <form className={estilosTela.pilha} onSubmit={enviar} noValidate>
        <Campo ref={refNome} rotulo="Nome" autoComplete="name" icone={<User size={20} />} value={nome} onChange={(e) => setNome(e.target.value)} erro={erros.nome} />
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
          autoComplete="new-password"
          icone={<Lock size={20} />}
          ajuda="Pelo menos 8 caracteres."
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          erro={erros.senha}
        />
        <Botao type="submit" tamanho="parado" carregando={enviando} textoCarregando="Criando conta">
          Criar conta
        </Botao>
      </form>
      <p className={`${estilosTela.nota} ${estilosTela.centro}`}>
        Ao criar a conta, você concorda com a <Link to="/privacidade">política de privacidade</Link>.
      </p>
      <p className={estilosTela.centro}>
        Já tem conta? <Link to={`/login?voltar=${encodeURIComponent(voltar)}`}>Entrar</Link>
      </p>
    </div>
  )
}
