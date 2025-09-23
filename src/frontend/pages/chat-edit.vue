<script lang="ts" setup>
import {useRoute, useRouter} from 'vue-router'
import {ref} from 'vue'
import {TrashIcon} from '@heroicons/vue/24/outline'
import {useToastStore} from '@/store'
import {chatCollection, characterCollection, loreCollection} from '@/db'
import MultiSelectCharacters from '@/components/select-characters.vue'
import MultiSelectLore from '@/components/select-lore.vue'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const chatId = route.params.id
if (!chatId || Array.isArray(chatId)) {
    router.push({name: 'chats'})
    throw new Error('Invalid chat ID')
}

const chat = await chatCollection.get(chatId)
const characters = await characterCollection.toArray()
const lore = await loreCollection.toArray()
if (!chat) {
    router.push({name: 'chats'})
    throw new Error('Chat not found')
}

const selectedCharacters = ref(characters.filter(c => chat.characters.includes(c.id)))
const selectedLore = ref(lore.filter(l => chat.lore.includes(l.id)))

const updateChat = async () => {
    // Update character and lore references
    chat.characters = selectedCharacters.value.map(c => c.id)
    chat.lore = selectedLore.value.map(l => l.id)

    await chatCollection.put(chat)
    toast.success('Updated')
    router.push({name: 'chats'})
}

const archiveChat = async () => {
    chat.archived = true
    await chatCollection.put(chat)
    router.push({name: 'chats'})
}

const deleteChat = async () => {
    await chatCollection.delete(chatId)
    router.push({name: 'chats'})
}

const duplicateChat = async () => {
    await chatCollection.put({
        ...chat,
        id: undefined, // Let the ORM generate a new ID
        lastUpdate: Date.now(),
        createDate: Date.now(),
    })
    toast.success('Chat duplicated')
    router.push({name: 'chats'})
}

const removeCharacter = (characterId: string) => {
    selectedCharacters.value = selectedCharacters.value.filter((c) => c.id !== characterId)
    if (chat.userCharacter === characterId) {
        chat.userCharacter = ''
    }
}

const removeLore = (loreId: string) => {
    selectedLore.value = selectedLore.value.filter((l) => l.id !== loreId)
}
</script>

<template>
    <div class="flex flex-col p-3 bg-base-200 rounded-lg md:max-w-xl">
        <label class="w-full max-w-64">
            <input
                type="text"
                v-model="chat.name"
                placeholder="Chat name (optional)"
                class="input"
            />
        </label>

        <!-- Characters -->
        <div class="mt-3">
            <div class="text-lg font-bold">Characters</div>
            <div class="divider mt-0 mb-1"></div>
            <MultiSelectCharacters :options="characters" v-model="selectedCharacters" placeholder="Search Characters" class="w-full" />
            <div class="flex flex-col gap-2 w-full mt-4">
                <div v-for="character in selectedCharacters" :key="character.id" class="card bg-base-100">
                    <div class="card-body p-2">
                        <div class="flex flex-row gap-2">
                            <div class="avatar w-20 h-20">
                                <img v-if="character.avatar" :src="character.avatar" class="rounded-lg" />
                                <img v-else src="@/assets/img/placeholder-avatar.webp" class="rounded-lg" />
                            </div>
                            <div class="text-lg ml-2">{{ character.name }}</div>

                            <button class="btn btn-sm btn-square btn-error absolute top-2 right-2" @click="removeCharacter(character.id)">
                                <TrashIcon class="size-4" />
                            </button>

                            <div class="flex flex-row gap-2 absolute bottom-2 right-2">
                                <label class="label">User</label>
                                <input type="radio" name="userCharacter" :value="character.id" v-model="chat.userCharacter" class="radio" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Lore -->
        <div class="mt-3">
            <div class="text-lg font-bold">Lore</div>
            <div class="divider mt-0 mb-1"></div>
            <MultiSelectLore :options="lore" v-model="selectedLore" placeholder="Search Lore" class="w-full" />
            <div class="flex flex-col gap-2 w-full mt-4">
                <div v-for="lore in selectedLore" :key="lore.id" class="card bg-base-100">
                    <div class="card-body p-2">
                        <div class="flex flex-row justify-between">
                            <span class="text-lg">{{ lore.name }}</span>
                            <button class="btn btn-sm btn-square btn-error" @click="removeLore(lore.id)">
                                <TrashIcon class="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="divider mb-3"></div>
        <div class="flex flex-row space-x-3">
            <button @click.prevent="updateChat" class="btn btn-primary">Update</button>
            <button @click.prevent="duplicateChat" class="btn btn-primary">Duplicate</button>
            <button @click.prevent="archiveChat" class="btn btn-warning">Archive</button>
            <button onclick="delete_confirm.showModal()" class="btn btn-error">Delete</button>
        </div>
    </div>

    <dialog id="delete_confirm" class="modal">
        <div class="modal-box">
            <h3 class="text-lg font-bold">Are you sure you want to delete this chat?</h3>
            <p class="pt-4">This cannot be undone.</p>
            <div class="modal-action">
                <form method="dialog">
                    <button class="btn">Cancel</button>
                </form>
                <button class="btn btn-error" @click="deleteChat">Delete</button>
            </div>
        </div>
    </dialog>
</template>
