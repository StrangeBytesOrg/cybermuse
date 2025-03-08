<script lang="ts" setup>
import {onErrorCaptured} from 'vue'
import {RouterView} from 'vue-router'
import {ZodError} from 'zod'
import {fromError} from 'zod-validation-error'
import {db} from '@/db'
import {useMenuStore, useThemeStore, useToastStore} from './store'
import './styles/global.css'
import TopBar from '@/components/top-bar.vue'
import SideBar from '@/components/sidebar.vue'
import Toast from '@/components/toast.vue'

const menuStore = useMenuStore()
const themeStore = useThemeStore()
const toast = useToastStore()

onErrorCaptured((error) => {
    if (error instanceof ZodError) {
        const validationError = fromError(error, {
            issueSeparator: `\n`,
            prefix: '',
            prefixSeparator: '',
            includePath: false,
        })
        toast.error(validationError.message)
    } else {
        toast.error(error.message)
    }
    console.error(error)
    return false
})
</script>

<template>
    <div :data-theme="themeStore.theme" class="h-dvh">
        <TopBar />

        <SideBar :showMenu="menuStore.visible" />

        <!-- Main -->
        <div class="flex flex-col min-h-0 absolute top-12 bottom-0 left-0 right-0 sm:left-52 overflow-y-auto px-1 py-2 sm:px-2">
            <Suspense>
                <RouterView />

                <template #fallback>
                    <span class="loading loading-spinner loading-xl"></span>
                </template>
            </Suspense>
        </div>

        <Toast />
    </div>
</template>
