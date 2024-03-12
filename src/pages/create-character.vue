<script lang="ts" setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {db} from '../db'

const router = useRouter()
const characterName = ref('')
const characterDescription = ref('')

const createCharacter = async () => {
    await db.characters.add({
        name: characterName.value,
        description: characterDescription.value,
    })
    await router.push('/characters')
}
</script>

<template>
    <div class="flex flex-col p-3">
        <div class="card bg-base-200 p-3">
            <input type="text" class="input input-bordered" v-model="characterName" placeholder="Character Name" />
            <textarea
                class="textarea textarea-bordered mt-5"
                v-model="characterDescription"
                placeholder="Description"></textarea>
            <button @click="createCharacter" class="btn btn-primary mt-5">Create</button>
        </div>
    </div>
</template>
