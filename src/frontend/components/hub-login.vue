<script lang="ts" setup>
import {ref} from 'vue'
import client from '@/clients/hub-client'
import {useToastStore, useHubStore, useSettingsStore} from '@/store'

const settings = useSettingsStore()
const hub = useHubStore()
const toast = useToastStore()
const username = ref('')
const password = ref('')

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
        if (settings.generationProvider === '') {
            settings.setGenerationProvider('hub')
        }
        toast.success('Logged in successfully')
    }
}
</script>

<template>
    <form @submit.prevent="login" class="space-y-3">
        <div>
            <label class="label">Username</label>
            <input
                v-model="username"
                type="text"
                required
                class="input"
            />
        </div>
        <div>
            <label class="label">Password</label>
            <input
                v-model="password"
                type="password"
                required
                class="input"
            />
        </div>
        <button type="submit" class="btn btn-primary">Login</button>
    </form>
</template>
