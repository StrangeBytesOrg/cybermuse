<script lang="ts" setup>
import {ref, onErrorCaptured} from 'vue'
import {RouterLink, RouterView} from 'vue-router'
import {useToast} from 'vue-toastification'
import {ZodError} from 'zod'
import {fromError} from 'zod-validation-error'
import {useThemeStore} from './store'
import './styles/global.css'
import './styles/tailwind.css'
import 'vue-toastification/dist/index.css'
import {Bars4Icon} from '@heroicons/vue/24/outline'

const themeStore = useThemeStore()
const toast = useToast()
const showMenu = ref(false)
const version = import.meta.env.VITE_CLIENT_VERSION ?? 'dev'

onErrorCaptured((error) => {
    if (error instanceof ZodError) {
        const validationError = fromError(error, {issueSeparator: `\n`, prefix: '', prefixSeparator: ''})
        toast.error(validationError.message)
    } else {
        toast.error(error.message)
    }
    console.error(error)
    return false
})

const toggleMenu = () => {
    showMenu.value = !showMenu.value
}
</script>

<template>
    <div :data-theme="themeStore.theme" class="min-h-[100vh]">
        <div class="bg-base-200 h-14 sm:hidden fixed top-0 w-full z-30">
            <button @click="toggleMenu" class="btn btn-sm btn-square w-10 h-10 ml-3 mt-2">
                <Bars4Icon class="size-10" />
            </button>
        </div>

        <!-- Top Bar -->
        <div
            @click="toggleMenu"
            class="menu-overlay z-10 fixed w-full h-full bg-gray-500 opacity-50"
            :class="{hidden: !showMenu}"></div>

        <!-- Sidebar -->
        <div
            class="fixed left-0 top-14 sm:top-0 h-full w-52 bg-base-200 z-20"
            :class="{customShow: showMenu, customHide: !showMenu}">
            <ul class="menu">
                <li>
                    <router-link to="/chats" class="font-bold px-2 mb-1" active-class="active">Chats</router-link>
                </li>
                <li>
                    <router-link to="/characters" class="font-bold px-2 mb-1" active-class="active">
                        Characters
                    </router-link>
                </li>
                <li>
                    <router-link to="/lore" class="font-bold px-2 mb-1" active-class="active">Lore</router-link>
                </li>
                <!-- <li>
                    <router-link to="/instruct" class="font-bold px-2 mb-1" active-class="active">Instruct</router-link>
                </li> -->
                <li>
                    <router-link to="/backend-settings" class="font-bold px-2 mb-1" active-class="active">
                        Models
                    </router-link>
                </li>
                <li>
                    <router-link to="/templates" class="font-bold px-2 mb-1" active-class="active">
                        Prompt Templates
                    </router-link>
                </li>
                <li>
                    <router-link to="/presets" class="font-bold px-2 mb-1" active-class="active">
                        Generation Presets
                    </router-link>
                </li>
                <li>
                    <router-link to="/theme-settings" class="font-bold px-2 mb-1" active-class="active">
                        Theme Settings
                    </router-link>
                </li>
            </ul>

            <div class="absolute bottom-0 w-full text-center">Version: {{ version }}</div>
        </div>

        <!-- Main -->
        <div class="flex min-h-0 ml-0 sm:ml-52 pt-14 sm:pt-0">
            <div class="flex flex-col flex-1">
                <!-- TODO: Add loading indicator -->
                <Suspense>
                    <RouterView />
                </Suspense>
            </div>
        </div>
    </div>
</template>

<style>
@media screen and (max-width: 640px) {
    .customHide {
        transform: translateX(-100%);
        transition: transform 0.3s;
    }
    .customShow {
        transform: translateX(0%);
        transition: transform 0.3s;
    }
}
</style>
