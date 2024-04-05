<script lang="ts" setup>
import {onErrorCaptured} from 'vue'
import {RouterLink, RouterView} from 'vue-router'
import Connection from './components/connection.vue'
import './styles/global.css'
import './styles/tailwind.css'
import 'vue-toastification/dist/index.css'
import {useToast} from 'vue-toastification'

const toast = useToast()
onErrorCaptured((error) => {
    toast.error(`An error occurred: ${error.message}`)
    return false
})
</script>

<template>
    <!-- Content -->
    <div class="flex flex-col" style="height: var(--doc-height)" data-theme="dark">
        <!-- Header -->
        <div class="navbar w-full bg-neutral text-neutral-content fixed z-[50] top-0 flex justify-between">
            <connection />
        </div>

        <!-- Menu -->
        <ul class="menu flex w-60 mt-16 bg-base-200 min-h-full fixed">
            <li>
                <router-link to="/create-character" class="font-bold" active-class="active">
                    Create Character
                </router-link>
            </li>
            <li>
                <router-link to="/characters" class="font-bold mt-1" active-class="active">Characters</router-link>
            </li>
            <li>
                <router-link to="/chats" class="font-bold mt-1" active-class="active">Chats</router-link>
            </li>
            <li>
                <router-link to="/instruct" class="font-bold mt-1" active-class="active">Instruct</router-link>
            </li>
            <li>
                <router-link to="/settings" class="font-bold mt-1" active-class="active">Settings</router-link>
            </li>
            <li>
                <router-link to="/connection" class="font-bold mt-1" active-class="active">Connection</router-link>
            </li>
            <li>
                <a class="font-bold">Server Settings</a>
                <ul>
                    <li>
                        <router-link to="/backend-settings" class="font-bold mt-1" active-class="active">
                            Models
                        </router-link>
                    </li>
                    <li>
                        <router-link to="/download-models" class="font-bold mt-1" active-class="active">
                            Download Models
                        </router-link>
                    </li>
                </ul>
            </li>
        </ul>

        <!-- Main -->
        <div class="flex flex-grow min-h-0 mt-16 ml-60">
            <div class="flex flex-col flex-1 overflow-auto mr-1">
                <!-- TODO: Add loading indicator -->
                <Suspense>
                    <RouterView />
                </Suspense>
            </div>
        </div>
    </div>
</template>
