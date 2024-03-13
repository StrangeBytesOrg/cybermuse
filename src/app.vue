<script lang="ts" setup>
import {RouterLink, RouterView} from 'vue-router'
import {useConnectionStore} from './store'

const connectionStore = useConnectionStore()

const checkConnection = async () => {
    let checkUrl = ''
    if (connectionStore.apiType === 'llamacpp') {
        checkUrl = `${connectionStore.apiUrl}/v1/models`
    } else if (connectionStore.apiType === 'koboldcpp') {
        checkUrl = `${connectionStore.apiUrl}/api/v1/model`
    }

    const response = await fetch(checkUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    const responseJson = await response.json()
    if (responseJson.result) {
        connectionStore.connected = true
    }
}
checkConnection()

import './styles/global.css'
import './styles/tailwind.css'
</script>

<template>
    <!-- Content -->
    <div class="flex flex-col flex-grow">
        <!-- Header -->
        <div class="navbar w-full bg-neutral text-neutral-content fixed z-[50] top-0 flex justify-between"></div>

        <div class="flex flex-grow min-h-0 pt-16">
            <!-- Menu -->
            <ul class="menu w-60 bg-base-300 min-h-full fixed">
                <li>
                    <router-link to="/create-character" class="font-bold" active-class="active">
                        Create Character
                    </router-link>
                </li>
                <li>
                    <router-link to="/characters" class="font-bold" active-class="active">Characters</router-link>
                </li>
                <li>
                    <router-link to="/instruct" class="font-bold" active-class="active">Instruct</router-link>
                </li>
                <li>
                    <router-link to="/connection" class="font-bold" active-class="active">Connection</router-link>
                </li>
                <li>
                    <router-link to="/settings" class="font-bold" active-class="active">Settings</router-link>
                </li>
            </ul>

            <!-- Main -->
            <div class="flex flex-col flex-1 overflow-auto md:mr-2 ml-60">
                <RouterView />
            </div>
        </div>
    </div>
</template>
