<script lang="ts" setup>
import {useMenuStore} from '@/store'
import pkg from '@/../../package.json'

defineProps({
    showMenu: Boolean,
})

const menuStore = useMenuStore()
</script>

<template>
    <div
        class="fixed left-0 top-12 bottom-0 w-2/3 sm:w-52 bg-base-200 z-20"
        :class="{customShow: showMenu, customHide: !showMenu}">
        <ul class="menu">
            <li>
                <router-link
                    :to="{name: 'chats'}"
                    class="font-bold px-2 mb-1"
                    active-class="bg-primary text-primary-content">
                    Chats
                </router-link>
            </li>
            <li>
                <router-link
                    :to="{name: 'characters'}"
                    class="font-bold px-2 mb-1"
                    active-class="bg-primary text-primary-content">
                    Characters
                </router-link>
            </li>
            <li>
                <router-link
                    :to="{name: 'lore'}"
                    class="font-bold px-2 mb-1"
                    active-class="bg-primary text-primary-content">
                    Lore
                </router-link>
            </li>
            <li>
                <router-link
                    :to="{name: 'templates'}"
                    class="font-bold px-2 mb-1"
                    active-class="bg-primary text-primary-content">
                    Prompt Templates
                </router-link>
            </li>
            <li>
                <router-link
                    :to="{name: 'presets'}"
                    class="font-bold px-2 mb-1"
                    active-class="bg-primary text-primary-content">
                    Generation Presets
                </router-link>
            </li>
            <li>
                <router-link
                    :to="{name: 'hub'}"
                    class="font-bold px-2 mb-1"
                    active-class="bg-primary text-primary-content">
                    Hub
                </router-link>
            </li>
            <li>
                <router-link
                    :to="{name: 'settings'}"
                    class="font-bold px-2 mb-1"
                    active-class="bg-primary text-primary-content">
                    Settings
                </router-link>
            </li>
            <li>
                <router-link
                    :to="{name: 'about'}"
                    class="font-bold px-2 mb-1"
                    active-class="bg-primary text-primary-content">
                    About
                </router-link>
            </li>
        </ul>

        <div class="absolute bottom-0 w-full text-center">Version: {{ pkg.version }}</div>
    </div>

    <!-- Overlay -->
    <div
        @click="menuStore.toggle"
        class="menu-overlay z-10 fixed w-full h-full bg-gray-500 opacity-50"
        :class="{hidden: !menuStore.visible}"></div>
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
