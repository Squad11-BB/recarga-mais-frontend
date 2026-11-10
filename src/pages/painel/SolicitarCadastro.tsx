import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Aviso } from '../../components/Aviso'
import { Botao } from '../../components/Botao'
import { Campo } from '../../components/Campo'
import { Marca } from '../../components/Marca'
import { SelecaoConectores } from '../../components/SelecaoConectores'
import { cnpjValido, emailValido, mascaraCnpj, mascaraTelefone, somenteDigitos } from '../../lib/validacao'
import { api } from '../../services/api'
import type { TipoConector } from '../../services/contratos'
import { FalhaApi } from '../../services/http'
import estilosPainel from './Painel.module.css'
import estilos from './SolicitarCadastro.module.css'

type CampoForm = 'nome' | 'cnpj' | 'telefone' | 'endereco' | 'responsavel' | 'email' | 'pontos' | 'conectores'
type Erros = Partial<Record<CampoForm, string>>

const ROTULOS: Record<CampoForm, string> = {
  nome: 'Nome do estabelecimento',
  cnpj: 'CNPJ',
  telefone: 'Telefone',
  endereco: 'Endereço',
  responsavel: 'Nome do responsável',
  email: 'E-mail do responsável',
  pontos: 'Pontos de recarga',
  conectores: 'Conectores',
}

/** Pedido de cadastro do estabelecimento. O que a pessoa digitou não se perde. */
export function SolicitarCadastro() {
  const [dados, setDados] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
    endereco: '',
    responsavel: '',
    email: '',
    pontos: '',
  })
  const [conectores, setConectores] = useState<TipoConector[]>(['TIPO2'])
  const [erros, setErros] = useState<Erros>({})
  const [falha, setFalha] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const refResumo = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.dataset.contexto = 'painel'
  }, [])

  const mudar = (campo: keyof typeof dados, valor: string) => setDados((d) => ({ ...d, [campo]: valor }))

  const validar = (): Erros => {
    const e: Erros = {}
    if (dados.nome.trim().length < 2) e.nome = 'Informe o nome do estabelecimento.'
    if (!cnpjValido(dados.cnpj)) e.cnpj = 'Informe um CNPJ válido.'
    if (somenteDigitos(dados.telefone).length < 10) e.telefone = 'Informe o telefone com DDD.'
    if (dados.endereco.trim().length < 5) e.endereco = 'Informe o endereço.'
    if (dados.responsavel.trim().length < 2) e.responsavel = 'Informe o nome do responsável.'
    if (!emailValido(dados.email)) e.email = 'Informe um e-mail válido.'
    const pontos = Number(dados.pontos)
    if (!Number.isInteger(pontos) || pontos < 1 || pontos > 200) e.pontos = 'Informe quantos pontos (1 a 200).'
    if (conectores.length === 0) e.conectores = 'Escolha pelo menos um conector.'
    return e
  }

  const enviar = async (ev: FormEvent) => {
    ev.preventDefault()
    const novos = validar()
    setErros(novos)
    setFalha(null)
    if (Object.keys(novos).length > 0) {
      // Resumo no topo e mensagem em cada campo.
      requestAnimationFrame(() => refResumo.current?.focus())
      return
    }
    setEnviando(true)
    try {
      await api.solicitarCadastro({
        nomeEstabelecimento: dados.nome.trim(),
        cnpj: somenteDigitos(dados.cnpj),
        telefone: somenteDigitos(dados.telefone),
        endereco: dados.endereco.trim(),
        nomeResponsavel: dados.responsavel.trim(),
        emailResponsavel: dados.email.trim(),
        quantidadePontos: Number(dados.pontos),
        conectores,
      })
      setEnviado(true)
    } catch (erro) {
      setFalha(erro instanceof FalhaApi ? `${erro.mensagem} Código ${erro.codigo}.` : 'Não foi possível enviar agora.')
    } finally {
      setEnviando(false)
    }
  }

  const listaErros = (Object.keys(erros) as CampoForm[]).filter((c) => erros[c])

  return (
    <div className={estilos.pagina}>
      <main className={estilos.formulario}>
        <Marca tamanho={34} />
        {enviado ? (
          <div className={estilosPainel.pilha} role="status">
            <CheckCircle2 aria-hidden size={40} className={estilos.ok} />
            <h1 className={estilosPainel.titulo}>Solicitação enviada</h1>
            <p className={estilosPainel.subtitulo}>
              A equipe do Recarga+ vai analisar o pedido e entrar em contato pelo e-mail {dados.email}.
            </p>
            <Link to="/painel/login">Voltar ao login</Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className={estilosPainel.titulo}>Solicitar cadastro do estabelecimento</h1>
              <p className={estilosPainel.subtitulo}>
                Preencha os dados. A equipe do Recarga+ entra em contato para liberar o acesso.
              </p>
            </div>

            {listaErros.length > 0 && (
              <div ref={refResumo} tabIndex={-1} className={estilos.resumo} role="alert">
                <strong>Confira {listaErros.length === 1 ? 'o campo' : `os ${listaErros.length} campos`}:</strong>
                <ul>
                  {listaErros.map((c) => (
                    <li key={c}>
                      <a href={`#campo-${c}`}>{ROTULOS[c]}</a>: {erros[c]}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {falha && (
              <Aviso tipo="erro" titulo="Não foi possível enviar">
                {falha}
              </Aviso>
            )}

            <form className={estilos.grade} onSubmit={enviar} noValidate>
              <Campo id="campo-nome" className={estilos.inteiro} rotulo={ROTULOS.nome} value={dados.nome} onChange={(e) => mudar('nome', e.target.value)} erro={erros.nome} autoComplete="organization" />
              <Campo id="campo-cnpj" rotulo={ROTULOS.cnpj} placeholder="00.000.000/0000-00" inputMode="numeric" value={dados.cnpj} onChange={(e) => mudar('cnpj', mascaraCnpj(e.target.value))} erro={erros.cnpj} />
              <Campo id="campo-telefone" rotulo={ROTULOS.telefone} placeholder="(00) 00000-0000" inputMode="tel" autoComplete="tel" value={dados.telefone} onChange={(e) => mudar('telefone', mascaraTelefone(e.target.value))} erro={erros.telefone} />
              <Campo id="campo-endereco" className={estilos.inteiro} rotulo={ROTULOS.endereco} autoComplete="street-address" value={dados.endereco} onChange={(e) => mudar('endereco', e.target.value)} erro={erros.endereco} />
              <Campo id="campo-responsavel" rotulo={ROTULOS.responsavel} autoComplete="name" value={dados.responsavel} onChange={(e) => mudar('responsavel', e.target.value)} erro={erros.responsavel} />
              <Campo id="campo-email" rotulo={ROTULOS.email} type="email" placeholder="nome@estabelecimento.com" autoComplete="email" value={dados.email} onChange={(e) => mudar('email', e.target.value)} erro={erros.email} />
              <Campo id="campo-pontos" rotulo={ROTULOS.pontos} inputMode="numeric" value={dados.pontos} onChange={(e) => mudar('pontos', somenteDigitos(e.target.value).slice(0, 3))} erro={erros.pontos} />
              <div id="campo-conectores">
                <SelecaoConectores rotulo={ROTULOS.conectores} valor={conectores} aoMudar={setConectores} erro={erros.conectores} idErro="erro-conectores-cadastro" />
              </div>
              <div className={`${estilos.inteiro} ${estilos.acoes}`}>
                <Botao type="submit" tamanho="compacto" larguraTotal={false} carregando={enviando} textoCarregando="Enviando">
                  Enviar solicitação
                </Botao>
                <Link to="/painel/login">Voltar ao login</Link>
              </div>
            </form>
          </>
        )}
      </main>

      <aside className={estilos.comoFunciona} aria-labelledby="como-funciona">
        <h2 id="como-funciona">Como funciona</h2>
        <ol>
          <li>Você envia a solicitação com os dados do estabelecimento.</li>
          <li>A equipe do Recarga+ analisa o pedido e entra em contato.</li>
          <li>Você recebe o login e acessa o painel de gestão.</li>
        </ol>
        <p className={estilosPainel.subtitulo}>Dúvidas? Fale com a equipe do Recarga+.</p>
      </aside>
    </div>
  )
}
