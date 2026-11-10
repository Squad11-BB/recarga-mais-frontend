/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** URL do backend (sem /api/v1). Sem valor, o app usa o servidor simulado. */
  readonly VITE_API_URL?: string
  /** URL dos blocos do mapa. Padrão: OpenStreetMap (só para desenvolvimento e piloto). */
  readonly VITE_MAPA_TILES?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
