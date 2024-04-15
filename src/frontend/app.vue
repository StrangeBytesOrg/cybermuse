<script lang="ts" setup>
import {ref, onErrorCaptured} from 'vue'
import {RouterLink, RouterView} from 'vue-router'
// import Connection from './components/connection.vue'
import {useThemeStore} from './store/'
import './styles/global.css'
import './styles/tailwind.css'
import 'vue-toastification/dist/index.css'
import {useToast} from 'vue-toastification'

const themeStore = useThemeStore()
const toast = useToast()
const showMenu = ref(false)

onErrorCaptured((error) => {
    toast.error(`An error occurred: ${error.message}`)
    return false
})

const toggleMenu = () => {
    showMenu.value = !showMenu.value
}
</script>

<template>
    <div class="bg-base-200 sm:hidden">
        <button @click="toggleMenu" class="btn btn-sm btn-square w-10 h-10 ml-3 mt-2">
            <!-- prettier-ignore -->
            <svg class="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
            </svg>
        </button>
    </div>
    <div class="flex flex-row" style="height: var(--doc-height)" :data-theme="themeStore.theme">
        <!-- <connection /> -->
        <!-- Menu -->
        <div
            @click="toggleMenu"
            class="menu-overlay z-10 fixed w-full h-full bg-gray-500 opacity-50"
            :class="{hidden: !showMenu}"></div>
        <ul
            class="menu w-60 min-w-60 sm:w-48 sm:min-w-48 bg-base-200 min-h-full fixed sm:relative z-20 wat"
            :class="{customShow: showMenu, customHide: !showMenu}">
            <li>
                <router-link to="/characters" class="font-bold px-2" active-class="active">Characters</router-link>
            </li>
            <li>
                <router-link to="/chats" class="font-bold px-2" active-class="active">Chats</router-link>
            </li>
            <li>
                <router-link to="/instruct" class="font-bold px-2" active-class="active">Instruct</router-link>
            </li>
            <li>
                <router-link to="/connection" class="font-bold px-2" active-class="active">Connection</router-link>
            </li>

            <li>
                <router-link to="/theme-settings" class="font-bold px-2" active-class="active">
                    Theme Settings
                </router-link>
            </li>
            <li>
                <router-link to="/prompt-settings" class="font-bold px-2" active-class="active">
                    Prompt Settings
                </router-link>
            </li>
            <li>
                <router-link to="/generation-settings" class="font-bold px-2" active-class="active">
                    Generation Settings
                </router-link>
            </li>
            <li>
                <router-link to="/backend-settings" class="font-bold px-2" active-class="active">Models</router-link>
            </li>
            <li>
                <router-link to="/download-models" class="font-bold px-2" active-class="active">
                    Download Models
                </router-link>
            </li>
        </ul>

        <!-- Main -->
        <div class="flex flex-grow min-h-0">
            <div class="flex flex-col flex-1 overflow-auto mr-1 ml-1">
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
