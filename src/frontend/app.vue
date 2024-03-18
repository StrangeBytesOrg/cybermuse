<script lang="ts" setup>
import {RouterLink, RouterView} from 'vue-router'
import Connection from './components/connection.vue'
import './styles/global.css'
import './styles/tailwind.css'
</script>

<template>
    <!-- Content -->
    <div class="flex flex-col" style="height: var(--doc-height)" data-theme="dark">
        <!-- Header -->
        <div class="navbar w-full bg-neutral text-neutral-content fixed z-[50] top-0 flex justify-between">
            <connection />
        </div>

        <!-- Menu -->
        <ul class="menu flex w-60 mt-16 bg-base-300 min-h-full fixed">
            <li>
                <router-link to="/create-character" class="font-bold" active-class="active">
                    Create Character
                </router-link>
            </li>
            <li>
                <router-link to="/characters" class="font-bold mt-1" active-class="active">Characters</router-link>
            </li>
            <li>
                <router-link to="/instruct" class="font-bold mt-1" active-class="active">Instruct</router-link>
            </li>
            <li>
                <router-link to="/connection" class="font-bold mt-1" active-class="active">Connection</router-link>
            </li>
            <li>
                <router-link to="/settings" class="font-bold mt-1" active-class="active">Settings</router-link>
            </li>
        </ul>

        <!-- Main -->
        <div class="flex flex-grow min-h-0 mt-16 ml-60">
            <div class="flex flex-col flex-1 overflow-auto mr-1">
                <RouterView />
            </div>
        </div>
    </div>
</template>
