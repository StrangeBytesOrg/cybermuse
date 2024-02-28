<script lang="ts" setup>
import {useConnectionStore} from '../store/connection'

const connectionStore = useConnectionStore()

const saveConnection = () => {
    connectionStore.save()
}
</script>

<template>
    <div class="flex flex-row p-5">
        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">API URL</span>
            </div>
            <input type="text" class="input input-bordered" v-model="connectionStore.apiUrl" />
        </label>
        <button class="btn btn-primary ml-5 mt-9" @click="saveConnection">Save</button>
    </div>
</template>
