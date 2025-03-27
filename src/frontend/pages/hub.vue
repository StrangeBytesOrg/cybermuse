<script lang="ts" setup>
import {useHubStore} from '@/store'

const hub = useHubStore()
</script>

<template>
    <div class="flex flex-col flex-1 items-center justify-center">
        <div class="max-w-md w-full p-4">
            <div class="card bg-base-300 shadow-xl">
                <div class="card-body">
                    <template v-if="hub.authenticated">
                        <h1 class="card-title">Connected</h1>
                        <div class="alert alert-info">
                            Coming Soon: Hub stuff
                        </div>
                    </template>
                    <div v-else>
                        <div class="text-lg">Not logged in.</div>
                        <span class="text-sm">Login from <router-link :to="{name: 'settings'}">settings</router-link></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
