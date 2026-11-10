import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed } from 'lucide-react'
import { CENTRO_RECIFE } from '../../services/mock/dados'
import { curvaEntre } from '../../lib/geo'
import type { CenaMapa } from './cena'
import estilos from './MapaBase.module.css'

const URL_TILES =
  (import.meta.env.VITE_MAPA_TILES as string | undefined) ??
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATRIBUICAO = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

function escapar(texto: string) {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

function iconePosto(destaque: boolean, etiqueta?: string) {
  const tamanho = destaque ? 40 : 30
  const pin = `<svg width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" fill="#FCDF30" stroke="#0F1B2D" stroke-width="1.6"/>
    <circle cx="12" cy="9" r="2.6" fill="#0F1B2D"/></svg>`
  const rotulo = etiqueta ? `<span class="${estilos.etiqueta}">${escapar(etiqueta)}</span>` : ''
  return L.divIcon({
    className: estilos.marcador,
    html: `${rotulo}${pin}`,
    iconSize: [tamanho, tamanho],
    iconAnchor: [tamanho / 2, tamanho],
  })
}

const ICONE_USUARIO = L.divIcon({
  className: estilos.marcador,
  html: `<span class="${estilos.usuario}"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

const ICONE_ORIGEM = L.divIcon({
  className: estilos.marcador,
  html: `<span class="${estilos.origem}"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

/** Ajusta o enquadramento quando a cena muda. */
function Enquadrar({ cena, folgaInferior }: { cena: CenaMapa; folgaInferior: number }) {
  const mapa = useMap()
  const chave = JSON.stringify([cena.usuario, cena.rota, cena.marcadores.map((m) => m.posicao)])

  useEffect(() => {
    const pontos: L.LatLngExpression[] = []
    if (cena.rota) pontos.push(cena.rota.de, cena.rota.para)
    else {
      cena.marcadores.forEach((m) => pontos.push(m.posicao))
      if (cena.usuario) pontos.push(cena.usuario)
    }
    if (pontos.length === 0) {
      mapa.setView(CENTRO_RECIFE, 13)
    } else if (pontos.length === 1) {
      mapa.setView(pontos[0], 15)
    } else {
      mapa.fitBounds(L.latLngBounds(pontos), {
        paddingTopLeft: [40, 60],
        paddingBottomRight: [40, folgaInferior],
        maxZoom: 15,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa, chave, folgaInferior])

  // O tamanho do mapa muda quando o layout muda (celular ↔ painel do carro).
  useEffect(() => {
    const observador = new ResizeObserver(() => mapa.invalidateSize())
    observador.observe(mapa.getContainer())
    return () => observador.disconnect()
  }, [mapa])

  return null
}

interface Props {
  cena: CenaMapa
  /** Espaço reservado embaixo para a folha "Para onde?" (celular). */
  folgaInferior?: number
  mostrarCentralizar?: boolean
}

export function MapaBase({ cena, folgaInferior = 40, mostrarCentralizar = true }: Props) {
  const rota = useMemo(() => (cena.rota ? curvaEntre(cena.rota.de, cena.rota.para) : null), [cena.rota])
  const [mapa, setMapa] = useState<L.Map | null>(null)

  return (
    <div className={`${estilos.mapa} ${cena.esmaecido ? estilos.esmaecido : ''}`}>
      <div role="img" aria-label={cena.descricao} className={estilos.area}>
        <MapContainer
          center={CENTRO_RECIFE}
          zoom={13}
          zoomControl={false}
          keyboard={false}
          attributionControl
          ref={setMapa}
          className={estilos.leaflet}
        >
          <TileLayer url={URL_TILES} attribution={ATRIBUICAO} maxZoom={19} />
          {rota && (
            <>
              <Polyline positions={rota} pathOptions={{ color: '#ffffff', weight: 12, opacity: 0.9 }} />
              <Polyline positions={rota} pathOptions={{ color: '#505EFC', weight: 7, lineCap: 'round' }} />
              <Marker position={rota[0]} icon={ICONE_ORIGEM} keyboard={false} interactive={false} />
            </>
          )}
          {cena.marcadores.map((m) => (
            <Marker
              key={m.id}
              position={m.posicao}
              icon={iconePosto(!!m.destaque, m.etiqueta)}
              keyboard={false}
              zIndexOffset={m.destaque ? 1000 : 0}
              eventHandlers={m.aoTocar ? { click: m.aoTocar } : undefined}
            />
          ))}
          {cena.usuario && !cena.rota && (
            <Marker position={cena.usuario} icon={ICONE_USUARIO} keyboard={false} interactive={false} />
          )}
          <Enquadrar cena={cena} folgaInferior={folgaInferior} />
        </MapContainer>
      </div>
      {cena.rotulo && !cena.esmaecido && <span className={estilos.rotulo}>{cena.rotulo}</span>}
      {mostrarCentralizar && !cena.esmaecido && (
        <button
          type="button"
          className={estilos.centralizar}
          style={{ bottom: folgaInferior - 24 }}
          aria-label="Centralizar no meu local"
          disabled={!cena.usuario}
          onClick={() => cena.usuario && mapa?.flyTo(cena.usuario, 15, { duration: 0.6 })}
        >
          <LocateFixed aria-hidden size={24} />
        </button>
      )}
    </div>
  )
}
