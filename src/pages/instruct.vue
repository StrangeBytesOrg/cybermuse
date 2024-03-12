<script lang="ts" setup>
import {ref} from 'vue'
import {useConnectionStore} from '../store'

const connectionStore = useConnectionStore()
const pendingMessage = ref(false)
const currentMessage = ref('')

const sendMessage = async () => {
    pendingMessage.value = true
    pendingMessage.value = false
}
</script>

<template>
    <div class="flex flex-col p-5">
        <div class="flex flex-row">
            <textarea
                class="textarea textarea-bordered flex-grow text-base focus:outline-none focus:border-secondary border-2"
                placeholder="Instruct mode"
                :disabled="pendingMessage"
                v-model="currentMessage" />

            <button
                @click="sendMessage"
                :disabled="pendingMessage || connectionStore.connected === false"
                class="btn btn-primary align-middle md:ml-3 ml-[4px] h-20 md:w-32">
                {{ pendingMessage ? '' : 'Send' }}
                <span class="loading loading-spinner loading-md" :class="{hidden: !pendingMessage}" />
            </button>
        </div>
    </div>
</template>
