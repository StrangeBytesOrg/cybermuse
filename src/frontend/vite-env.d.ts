/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_HUB_URL: string
    readonly VITE_SYNC_URL: string
    readonly VITE_GEN_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
