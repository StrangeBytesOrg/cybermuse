<script lang="ts" setup>
import {ref} from 'vue'
import {useToastStore, useHubStore} from '@/store'
import client from '@/clients/hub-client'

const toast = useToastStore()
const hub = useHubStore()
const username = ref('')
const password = ref('')

const getTokenPayload = (token: string) => {
    const payload = token.split('.')[1]
    if (!payload) throw new Error('Invalid token')
    return JSON.parse(atob(payload))
}

if (hub.token) {
    const claim = getTokenPayload(hub.token)
    if ((claim.exp * 1000) > Date.now()) {
        hub.authenticated = true
    } else {
        toast.warn('Login expired. Please login again')
        hub.clearToken()
    }
}

const login = async () => {
    const {data, error} = await client.POST('/login', {
        body: {
            username: username.value,
            password: password.value,
        },
    })
    if (error) {
        toast.error(`Error logging in: ${error}`)
    } else {
        hub.setToken(data.token)
        hub.authenticated = true
        toast.success('Logged in successfully')
    }
}

const logout = async () => {
    hub.clearToken()
    hub.authenticated = false
}
</script>

<template>
    <div class="flex flex-1 items-center justify-center">
        <div class="max-w-md w-full p-4">
            <div class="card bg-base-300 shadow-xl">
                <div class="card-body">
                    <template v-if="hub.authenticated">
                        <h1 class="card-title">Connected</h1>
                        <button @click="logout" class="btn btn-primary w-full">Logout</button>
                    </template>
                    <template v-else>
                        <h1 class="card-title text-xl font-bold text-center">Login to Cybermuse Hub</h1>
                        <form @submit.prevent="login" class="space-y-4">
                            <div>
                                <label class="label">Username</label>
                                <input
                                    v-model="username"
                                    type="text"
                                    required
                                    class="input w-full"
                                />
                            </div>
                            <div>
                                <label class="label">Password</label>
                                <input
                                    v-model="password"
                                    type="password"
                                    required
                                    class="input w-full"
                                />
                            </div>
                            <button type="submit" class="btn btn-primary w-full">Login</button>
                        </form>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>
