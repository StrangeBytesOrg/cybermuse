<script lang="ts" setup>
defineProps({
    showMenu: Boolean,
})
const version = import.meta.env.VITE_CLIENT_VERSION ?? 'dev'
</script>

<template>
    <div
        class="fixed left-0 top-12 h-full w-2/3 sm:w-52 bg-base-200 z-20"
        :class="{customShow: showMenu, customHide: !showMenu}">
        <ul class="menu">
            <li>
                <router-link to="/chats" class="font-bold px-2 mb-1" active-class="active">Chats</router-link>
            </li>
            <li>
                <router-link to="/characters" class="font-bold px-2 mb-1" active-class="active">Characters</router-link>
            </li>
            <li>
                <router-link to="/lore" class="font-bold px-2 mb-1" active-class="active">Lore</router-link>
            </li>
            <!-- <li>
                    <router-link to="/instruct" class="font-bold px-2 mb-1" active-class="active">Instruct</router-link>
                </li> -->
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
            <li>
                <router-link to="/connection" class="font-bold px-2 mb-1" active-class="active">Connection</router-link>
            </li>
        </ul>

        <div class="absolute bottom-0 w-full text-center">Version: {{ version }}</div>
    </div>
</template>
