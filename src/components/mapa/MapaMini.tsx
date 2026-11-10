import { useEffect } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Coordenada } from '../../services/contratos'
import { curvaEntre } from '../../lib/geo'
import estilos from './MapaBase.module.css'

const URL_TILES =
  (import.meta.env.VITE_MAPA_TILES as string | undefined) ??
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

const PIN = L.divIcon({
  className: estilos.marcador,
  html: `<svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" fill="#FCDF30" stroke="#0F1B2D" stroke-width="1.6"/><circle cx="12" cy="9" r="2.6" fill="#0F1B2D"/></svg>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
})

const ORIGEM = L.divIcon({
  className: estilos.marcador,
  html: `<span class="${estilos.usuario}" style="width:16px;height:16px;border-width:3px"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

/** Enquadra origem e destino depois que o mapa ganha tamanho. */
function Enquadrar({ de, para }: { de: Coordenada | null; para: Coordenada }) {
  const mapa = useMap()
  useEffect(() => {
    const ajustar = () => {
      mapa.invalidateSize()
      if (de) mapa.fitBounds(L.latLngBounds([de, para]), { padding: [20, 20], maxZoom: 16 })
      else mapa.setView(para, 15)
    }
    ajustar()
    const observador = new ResizeObserver(ajustar)
    observador.observe(mapa.getContainer())
    return () => observador.disconnect()
  }, [mapa, de, para])
  return null
}

/** Mapa pequeno e estático com o trajeto até o posto (tela de detalhe). */
export function MapaMini({ de, para, descricao }: { de: Coordenada | null; para: Coordenada; descricao: string }) {
  return (
    <div role="img" aria-label={descricao} style={{ height: 120, borderRadius: 16, overflow: 'hidden' }}>
      <MapContainer
        center={para}
        zoom={14}
        className={estilos.leaflet}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url={URL_TILES} />
        {de && (
          <>
            <Polyline positions={curvaEntre(de, para)} pathOptions={{ color: '#505EFC', weight: 5 }} />
            <Marker position={de} icon={ORIGEM} interactive={false} keyboard={false} />
          </>
        )}
        <Marker position={para} icon={PIN} interactive={false} keyboard={false} />
        <Enquadrar de={de} para={para} />
      </MapContainer>
    </div>
  )
}
