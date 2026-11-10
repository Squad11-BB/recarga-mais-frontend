# Recarga+ · Frontend

App web (PWA) que recomenda o carregador para o carro elétrico.

- **Regras primeiro:** só entram postos compatíveis, alcançáveis com a bateria atual e disponíveis.
- **Tempo total = deslocamento + espera na fila + recarga.** A espera é a fila informada pela
  estação × tempo médio de recarga.
- **IA escolhe o posto mais adequado ao veículo** entre os que passaram nas regras: potência que o
  carro aceita × potência do carregador, DC ou AC conforme a carga necessária, bateria na chegada,
  tempo total e dado recente. Se a IA falhar, a ordem é pelo menor tempo total.
- A explicação "Por que este posto?" é escrita por IA, só com os números do cálculo.

> Mudança em relação à Entrega Parcial v1.1: a IA não prevê mais a fila.

Squad 11 · Residência em Software & IA RiseUp (Porto Digital) · parceria com o Banco do Brasil.
As telas seguem a Entrega Parcial v1.1 (seção 3: wireframes, fluxos, rotas e design system).

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
```

Sem `VITE_API_URL`, o app usa um **servidor simulado** com postos fictícios em Recife,
então dá para usar tudo antes de o backend existir.

| Comando             | O que faz                                           |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento                         |
| `npm run build`     | Confere os tipos e gera a versão de produção        |
| `npm test`          | Testes (motor, adequação por IA e validações)       |
| `npm run lint`      | Linter (oxlint)                                     |
| `npm run icones`    | Regera os ícones a partir de `marca/opcao-*.svg`    |

## Contas de teste (servidor simulado)

Senha de todas: `recarga123`

| Papel         | E-mail                       | Onde entra                |
| ------------- | ---------------------------- | ------------------------- |
| Motorista     | `motorista@recarga.app`      | App (`/login`)            |
| Administrador | `admin@estabelecimento.com`  | Painel web (`/painel/login`) |
| Operador      | `operador@rede.com`          | Painel web (`/painel/login`) |

## Simular falhas e situações

Adicione na URL (vale para a aba até desligar com `=0`):

| Parâmetro           | Efeito                                                         |
| ------------------- | -------------------------------------------------------------- |
| `?falhaIA=1`        | IA de adequação indisponível: ordena pelo menor tempo total e avisa |
| `?falhaMaps=1`      | Rotas passam de 1,2 s: usa distância aproximada e avisa        |
| `?falhaExplicacao=1`| Explicação por IA falha: aparece o texto padrão                |
| `?movimento=1`      | Carro em movimento: digitar, reportar fila e editar veículo bloqueados |
| `?semPostos=1`      | Nenhum posto encontrado                                        |

## Telas e rotas

| Rota                                           | Tela                                | Quem acessa                 |
| ---------------------------------------------- | ----------------------------------- | --------------------------- |
| `/mapa`                                        | Mapa com a melhor opção             | Todos                       |
| `/localizacao`                                 | Consentimento de localização        | Todos                       |
| `/veiculo`                                     | Veículo e bateria                   | Todos                       |
| `/destino`                                     | Para onde? (voz, atalhos, recentes) | Todos                       |
| `/recomendacoes`                               | Carregando e Melhor opção           | Todos                       |
| `/posto/:id` · `/posto/:id?ver=por-que`        | Detalhe e Por que este posto?       | Todos, com o carro parado   |
| `/navegacao/:id`                               | Navegação                           | Todos                       |
| `/posto/:id/fila`                              | Reportar fila                       | Com conta, carro parado     |
| `/login` · `/cadastro`                         | Login e cadastro                    | Todos                       |
| `/garagem` · `/historico` · `/perfil`          | Apoio                               | Com conta, carro parado     |
| `/painel/login` · `/painel/solicitar-cadastro` | Login e pedido de cadastro          | Público                     |
| `/painel/fila` · `/painel/pontos`              | Controle de fila e pontos           | Administrador               |
| `/painel/metricas` · `/painel/postos`          | Métricas                            | Operador                    |

Celular (até 600 px), painel do carro (paisagem a partir de 1000 px, coluna de ações de 440 px
e mapa ao lado) e painel web (barra lateral de 240 px).

## Estrutura

```
src/
├── pages/        telas do app e painel/ (web de gestão)
├── components/   Botao, BotaoVoz, Campo, CardRecomendacao, ChipIA, Aviso, FolhaInferior, mapa/…
├── features/     recomendacao, veiculo, localizacao, voz, destino, conducao, sessao, painel
├── services/     único contato com o servidor (tempo limite e cancelamento)
│   ├── contratos.ts   formatos da API /api/v1 (guia para o backend)
│   └── mock/          servidor simulado, motor (regras) e adequacao.ts (IA de referência)
├── layouts/      app (mapa + telas) e painel web
├── lib/          formatos, geo, validação
└── styles/       design system (cores, tipografia, tamanhos)
```

## Integração com o backend

Defina `VITE_API_URL` (veja `.env.example`). O frontend chama `VITE_API_URL/api/v1/...` com os
formatos de `src/services/contratos.ts`. Erros devem vir como `{ codigo, mensagem }`.
Limites de tempo: recomendação 2,5 s no cliente (2 s no servidor), explicação por IA 3 s.

## Observações

- **Mapa:** Leaflet com OpenStreetMap, sem chave. A política de uso do OpenStreetMap não permite
  tráfego alto; para produção, trocar por um provedor com chave via `VITE_MAPA_TILES` ou pelo Google Maps.
- **Navegação:** sem serviço de rotas, a tela mostra a distância restante até o posto e uma linha
  ilustrativa do trajeto. A navegação curva a curva depende da integração com rotas.
- **Dados dos carros** no servidor simulado são aproximados, só para demonstração.
