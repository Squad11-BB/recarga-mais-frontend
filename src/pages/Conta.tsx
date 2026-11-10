import { Link, useNavigate } from 'react-router-dom'
import { Car, ChevronRight, History, LogOut, MapPin } from 'lucide-react'
import { Botao, BotaoLink } from '../components/Botao'
import { Cabecalho } from '../components/Cabecalho'
import { useLocalizacao } from '../features/localizacao/localizacao'
import { useSessao } from '../features/sessao/sessao'
import { NOMES_CONECTOR, useVeiculo } from '../features/veiculo/veiculo'
import { numero } from '../lib/formato'
import estilosTela from './Tela.module.css'
import estilos from './Conta.module.css'

/** Perfil: conta e preferências (com conta e carro parado). */
export function Perfil() {
  const navegar = useNavigate()
  const { usuario, sair } = useSessao()
  const { consentimento, conceder, revogar } = useLocalizacao()

  return (
    <div className={estilosTela.tela}>
      <Cabecalho titulo="Perfil" voltarPara="/mapa" />
      <section className={estilosTela.cartao}>
        <strong className={estilos.nome}>{usuario?.nome}</strong>
        <span className={estilosTela.subtitulo}>{usuario?.email}</span>
      </section>

      <nav className={estilos.menu} aria-label="Conta">
        <Link to="/garagem" className={estilos.item}>
          <Car aria-hidden size={22} />
          Garagem
          <ChevronRight aria-hidden size={20} />
        </Link>
        <Link to="/historico" className={estilos.item}>
          <History aria-hidden size={22} />
          Histórico
          <ChevronRight aria-hidden size={20} />
        </Link>
      </nav>

      <section className={estilosTela.cartao} aria-labelledby="titulo-privacidade">
        <h2 id="titulo-privacidade" className={estilos.secao}>
          <MapPin aria-hidden size={20} /> Localização
        </h2>
        <p className={estilosTela.subtitulo}>
          {consentimento === 'concedido'
            ? 'O Recarga+ usa a sua localização para achar carregadores perto de você.'
            : 'A localização está desativada. Você pode informar onde está manualmente.'}
        </p>
        {consentimento === 'concedido' ? (
          <Botao variante="secundario" tamanho="parado" onClick={revogar}>
            Desativar localização
          </Botao>
        ) : (
          <Botao variante="secundario" tamanho="parado" onClick={conceder}>
            Ativar localização
          </Botao>
        )}
        <Link to="/privacidade">Política de privacidade</Link>
      </section>

      <Botao
        variante="secundario"
        tamanho="parado"
        icone={<LogOut aria-hidden size={20} />}
        className={estilosTela.empurrar}
        onClick={() => {
          sair()
          navegar('/mapa', { replace: true })
        }}
      >
        Sair da conta
      </Botao>
    </div>
  )
}

/** Garagem: veículo salvo. */
export function Garagem() {
  const { veiculo, autonomiaKm } = useVeiculo()
  return (
    <div className={estilosTela.tela}>
      <Cabecalho titulo="Garagem" voltarPara="/perfil" />
      {veiculo ? (
        <section className={estilosTela.cartao} aria-label="Veículo ativo">
          <span className={estilosTela.secaoTitulo}>Veículo ativo</span>
          <strong className={estilos.nome}>{veiculo.nome}</strong>
          <dl className={estilos.dados}>
            <div className={estilosTela.linhaInfo}>
              <dt>Conectores</dt>
              <dd>{veiculo.conectores.map((c) => NOMES_CONECTOR[c]).join(' · ')}</dd>
            </div>
            <div className={estilosTela.linhaInfo}>
              <dt>Bateria</dt>
              <dd className="numeros">{numero(veiculo.capacidadeBateriaKWh)} kWh</dd>
            </div>
            <div className={estilosTela.linhaInfo}>
              <dt>Carga atual</dt>
              <dd className="numeros">
                {veiculo.nivelBateriaPct}% · {autonomiaKm} km
              </dd>
            </div>
          </dl>
        </section>
      ) : (
        <p>Nenhum veículo salvo.</p>
      )}
      <BotaoLink to="/veiculo" tamanho="parado" variante="secundario">
        {veiculo ? 'Trocar veículo' : 'Escolher veículo'}
      </BotaoLink>
      <p className={estilosTela.nota}>Cadastro de vários veículos chega numa próxima versão.</p>
    </div>
  )
}

/** Histórico de recargas. */
export function Historico() {
  return (
    <div className={estilosTela.tela}>
      <Cabecalho titulo="Histórico" voltarPara="/perfil" />
      <div className={`${estilosTela.pilha} ${estilosTela.centro}`}>
        <span className={estilosTela.iconeCirculo}>
          <History aria-hidden size={26} />
        </span>
        <p className={estilos.nome}>Nenhuma recarga ainda</p>
        <p className={estilosTela.subtitulo}>As recomendações que você seguir vão aparecer aqui.</p>
      </div>
    </div>
  )
}

export function Privacidade() {
  return (
    <div className={estilosTela.tela}>
      <Cabecalho titulo="Política de privacidade" />
      <div className={`${estilosTela.pilha} ${estilos.texto}`}>
        <p>
          O Recarga+ usa a sua localização só para achar carregadores perto de você e calcular o tempo até eles. A
          localização só é usada depois do seu consentimento, e você pode desativar quando quiser no Perfil.
        </p>
        <p>
          Nenhum dado pessoal (localização, e-mail ou nome) é enviado para serviços de inteligência artificial. A
          explicação “Por que este posto?” usa só os números do cálculo e os nomes dos postos.
        </p>
        <p>As senhas são guardadas com criptografia e a comunicação com o servidor usa HTTPS.</p>
        <p className={estilosTela.nota}>Texto provisório para o MVP. A versão final será revisada pela equipe.</p>
      </div>
    </div>
  )
}
