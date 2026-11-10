import type { Recomendacao } from '../../services/contratos'

export const MENSAGENS_SEM_PONTOS: Record<NonNullable<Recomendacao['motivoSemPontos']>, { titulo: string; texto: string }> = {
  NENHUM_ALCANCAVEL: {
    titulo: 'Nenhum posto alcançável',
    texto: 'Com a bateria atual, nenhum posto compatível está ao seu alcance. Tente aumentar a área de busca.',
  },
  NENHUM_COMPATIVEL: {
    titulo: 'Nenhum posto compatível',
    texto: 'Os postos por perto não têm conector para o seu carro. Tente aumentar a área de busca.',
  },
  NENHUM_PROXIMO: {
    titulo: 'Nenhum posto por perto',
    texto: 'Não encontramos postos nesta região. Tente aumentar a área de busca.',
  },
}
