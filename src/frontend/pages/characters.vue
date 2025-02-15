<script lang="ts" setup>
import {reactive, ref, computed} from 'vue'
import {RouterLink} from 'vue-router'
import {characterCollection, db} from '@/db'
import TopBar from '@/components/top-bar.vue'

const searchName = ref('')
const characterType = ref<'user' | 'character' | 'both'>('both')
const characters = reactive(await characterCollection.find({limit: 110}))
const avatars: Record<string, string> = {}

// Computed property to filter characters based on search input and character type
const filteredCharacters = computed(() => {
    return characters.filter((character) => {
        const matchesName = character.name.toLowerCase().includes(searchName.value.toLowerCase())
        const matchesType = character.type === characterType.value || characterType.value === 'both'
        return matchesName && matchesType
    })
})

// Get avatar image from attachments
for (const character of characters) {
    if (character._attachments) {
        const avatar = (await db.getAttachment(character._id, 'avatar')) as Blob
        avatars[character._id] = URL.createObjectURL(avatar)
    }
}
</script>

<template>
    <TopBar title="Characters">
        <RouterLink to="/create-character" class="btn btn-sm btn-primary ml-auto">Create Character +</RouterLink>
    </TopBar>

    <div class="flex flex-row p-3">
        <label class="form-control w-full mr-5">
            <input
                type="text"
                v-model="searchName"
                placeholder="Search by name"
                class="input input-bordered focus:outline-none focus:border-primary" />
        </label>

        <label class="form-control w-full">
            <select v-model="characterType" placeholder="Character Type" class="select select-bordered">
                <option value="both" default>Character Type</option>
                <option value="character">Character</option>
                <option value="user">User</option>
            </select>
        </label>
    </div>

    <div class="flex flex-col m-2">
        <template v-if="filteredCharacters.length">
            <div v-for="character in filteredCharacters" :key="character.name">
                <router-link
                    :to="{name: 'character', params: {id: character._id}}"
                    class="flex bg-base-200 rounded-lg p-2 mb-3 hover:outline outline-primary">
                    <div class="avatar">
                        <div class="w-36 max-h-36 rounded-xl">
                            <!-- <img v-if="character.image" :src="character.image" :alt="character.name" /> -->
                            <img v-if="avatars[character._id]" :src="avatars[character._id]" :alt="character.name" />
                            <img v-else src="../assets/img/placeholder-avatar.webp" alt="placeholder avatar" />
                        </div>
                    </div>

                    <div class="inline-flex flex-col h-36 ml-3">
                        <div class="font-bold">
                            {{ character.name }}
                        </div>
                        <div class="text-gray-500 overflow-hidden h-full fadeout">
                            <p class="whitespace-pre-line">
                                {{ character.description }}
                            </p>
                        </div>
                        <!-- <template v-if="character._attachments">
                            Type: {{ character._attachments['avatar.png']?.content_type }}
                            <br />
                            Digest: {{ character._attachments['avatar.png']?.digest }}
                        </template> -->
                        <!-- <img v-if="character.avatar" :src="character.avatar" /> -->
                    </div>
                </router-link>
            </div>
        </template>
        <template v-else>
            <div>no characters</div>
        </template>
    </div>
</template>

<style lang="css">
.fadeout {
    -webkit-mask-image: linear-gradient(to bottom, black 75%, transparent 100%);
    mask-image: linear-gradient(to bottom, black 75%, transparent 100%);
}
</style>
