import {defineStore} from 'pinia'

export interface SyncProgress {
    phase: 'idle' | 'fetching' | 'downloading' | 'processing-deletions' | 'uploading' | 'complete'
    current: number
    total: number
    message: string
}

export const useSyncStore = defineStore('sync', {
    state: () => {
        return {
            isRunning: false,
            progress: {
                phase: 'idle',
                current: 0,
                total: 0,
                message: '',
            } as SyncProgress,
        }
    },
    getters: {
        progressPercentage: (state) => {
            if (state.progress.total === 0) return 0
            return Math.round((state.progress.current / state.progress.total) * 100)
        },
    },
    actions: {
        startSync() {
            this.isRunning = true
            this.progress = {
                phase: 'fetching',
                current: 0,
                total: 0,
                message: 'Connecting to sync server...',
            }
        },
        updateProgress(updates: Partial<SyncProgress>) {
            this.progress = {...this.progress, ...updates}
            if (import.meta.env.DEV) {
                console.log(`[Sync] ${updates.message}`)
            }
        },
        finishSync() {
            this.progress = {
                phase: 'complete',
                current: this.progress.total,
                total: this.progress.total,
                message: 'Sync completed successfully!',
            }
            // Reset to idle after a short delay
            setTimeout(() => {
                this.isRunning = false
                this.progress = {
                    phase: 'idle',
                    current: 0,
                    total: 0,
                    message: '',
                }
            }, 1500)
        },
        errorSync(message: string) {
            this.progress = {
                phase: 'idle',
                current: 0,
                total: 0,
                message: `Error: ${message}`,
            }
            this.isRunning = false
        },
    },
})
