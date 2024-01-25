<script lang="ts" setup>
import {ref} from 'vue'

const showMenu = ref(false)

const toggleMenu = () => {
    showMenu.value = !showMenu.value
}
</script>

<template>
    <!-- Content -->
    <div class="flex flex-col flex-grow">
        <!-- Header -->
        <div class="navbar w-full bg-neutral text-neutral-content fixed z-[50] top-0">
            <button class="btn btn-square btn-outline" aria-label="menu">
                <img class="w-8" src="/menu.svg" />
            </button>
        </div>

        <div class="flex flex-grow min-h-0 pt-16">
            <!-- Menu -->
            <div
                @click="toggleMenu"
                class="wat-menu w-80 max-md:min-w-[20rem] max-md:w-1/2 flex flex-col bg-base-300"
                :class="{show: showMenu}">
                <div class="px-5 flex flex-col flex-grow">
                    <router-link to="/">Chat</router-link>
                    <router-link to="/connection">Connection</router-link>
                    <router-link to="/characters">Characters</router-link>
                    <router-link to="/create-character">Create Character</router-link>
                </div>
            </div>

            <!-- Main -->
            <div class="flex flex-col flex-1 overflow-auto md:mr-2">
                <NuxtPage />
            </div>
        </div>
    </div>
</template>
