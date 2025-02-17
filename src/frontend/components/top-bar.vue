<script lang="ts" setup>
import {useRouter, useRoute} from 'vue-router'
import {Bars4Icon, ArrowUturnLeftIcon} from '@heroicons/vue/24/outline'
import {useMenuStore} from '@/store'

const router = useRouter()
const route = useRoute()
const menuStore = useMenuStore()

const goBack = () => router.back()
</script>

<template>
    <div id="topbar" class="fixed h-12 z-20 w-full flex flex-row items-center p-1 sm:p-3 bg-base-300">
        <button v-if="route.meta.back" @click="goBack" class="btn btn-sm btn-square btn-neutral absolute top-2 left-2">
            <ArrowUturnLeftIcon class="size-6" />
        </button>

        <div class="flex-grow text-center">
            <h1 class="text-xl">{{ route.meta.title }}</h1>
        </div>

        <button @click="menuStore.toggle" class="btn btn-sm btn-square btn-neutral absolute top-2 right-2 sm:hidden">
            <Bars4Icon class="size-10" />
        </button>

        <slot />
    </div>
</template>
