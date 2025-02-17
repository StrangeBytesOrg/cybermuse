<script lang="ts" setup>
import {onErrorCaptured} from 'vue'
import {RouterView} from 'vue-router'
import {useToast} from 'vue-toastification'
import {ZodError} from 'zod'
import {fromError} from 'zod-validation-error'
import {useMenuStore, useThemeStore} from './store'
import './styles/global.css'
import './styles/tailwind.css'
import 'vue-toastification/dist/index.css'
import TopBar from '@/components/top-bar.vue'
import SideBar from '@/components/sidebar.vue'

const menuStore = useMenuStore()
const themeStore = useThemeStore()
const toast = useToast()

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
    <div :data-theme="themeStore.theme" class="min-h-[100vh]">
        <TopBar />

        <SideBar :showMenu="menuStore.visible" />

        <!-- Main -->
        <div class="flex min-h-0 ml-0 sm:ml-52 pt-12">
            <div class="flex flex-col flex-1 sm:pt-2 sm:px-2">
                <!-- TODO: Add loading indicator -->
                <Suspense>
                    <RouterView />
                </Suspense>
            </div>
        </div>
    </div>
</template>
