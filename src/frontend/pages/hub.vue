<script lang="ts" setup>
import {ref} from 'vue'
import {useToastStore} from '@/store'
import client from '@/hub-client'

const toast = useToastStore()
const username = ref('')
const password = ref('')
const authenticated = ref(false)

if (localStorage.getItem('token')) {
    authenticated.value = true
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
        localStorage.setItem('token', data.token)
        authenticated.value = true
        toast.success('Logged in successfully')
    }
}

const logout = async () => {
    localStorage.removeItem('token')
    authenticated.value = false
}
</script>

<template>
    <main class="flex flex-1 items-center justify-center">
        <div class="max-w-md w-full p-4">
            <div class="card bg-base-300 shadow-xl">
                <div class="card-body">
                    <template v-if="authenticated">
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
    </main>
</template>
