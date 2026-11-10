import type { Coordenada } from '../services/contratos'

const RAIO_TERRA_KM = 6371

/** Distância em linha reta entre dois pontos (fórmula de Haversine). */
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const rad = (g: number) => (g * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(h))
}

/**
 * Pontos de uma curva suave entre origem e destino, para desenhar a rota
 * quando não há serviço de rotas. É só uma ilustração do trajeto.
 */
export function curvaEntre(a: Coordenada, b: Coordenada, passos = 24): [number, number][] {
  const meio = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 }
  const dLat = b.lat - a.lat
  const dLng = b.lng - a.lng
  const controle = { lat: meio.lat - dLng * 0.25, lng: meio.lng + dLat * 0.25 }
  const pontos: [number, number][] = []
  for (let i = 0; i <= passos; i++) {
    const t = i / passos
    const u = 1 - t
    pontos.push([
      u * u * a.lat + 2 * u * t * controle.lat + t * t * b.lat,
      u * u * a.lng + 2 * u * t * controle.lng + t * t * b.lng,
    ])
  }
  return pontos
}
