<script lang="ts" setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {Liquid} from 'liquidjs'
import {TrashIcon} from '@heroicons/vue/24/outline'
import {characterCollection, chatCollection, loreCollection, type Message} from '@/db'
import MultiSelectCharacters from '@/components/select-characters.vue'
import MultiSelectLore from '@/components/select-lore.vue'

const router = useRouter()

const characters = await characterCollection.toArray()
type Character = typeof characters[0]
const lore = await loreCollection.toArray()
type Lore = typeof lore[0]

const selectedCharacters = ref<Character[]>([])
const selectedLore = ref<Lore[]>([])
const userCharacter = ref('')
const chatName = ref('')

const createChat = async () => {
    const engine = new Liquid()

    // If characters have a first message, add it to the chat
    const userName = characters.find((c) => c.id === userCharacter.value)?.name
    const messages: Message[] = []
    selectedCharacters.value.forEach(async (character) => {
        if (character?.firstMessage) {
            // Parse firstMessage template
            const content = engine.parseAndRenderSync(character.firstMessage, {
                char: character.name,
                user: userName,
            })
            messages.push({
                id: Math.random().toString(36).slice(2),
                type: 'model',
                content: [content],
                activeIndex: 0,
                characterId: character.id,
            })
        }
    })

    const id = await chatCollection.put({
        id: `chat-${Math.random().toString(36).slice(2)}`,
        lastUpdate: Date.now(),
        name: chatName.value,
        userCharacter: userCharacter.value,
        characters: selectedCharacters.value.map((c) => c.id),
        lore: selectedLore.value.map((l) => l.id),
        createDate: Date.now(),
        messages: messages,
        archived: false,
    })

    router.push({name: 'chat', params: {id}})
}

const removeCharacter = (character: Character) => {
    selectedCharacters.value = selectedCharacters.value.filter((c) => c.id !== character.id)
    if (userCharacter.value === character.id) {
        userCharacter.value = ''
    }
}

const removeLore = (loreId: string) => {
    selectedLore.value = selectedLore.value.filter((l) => l.id !== loreId)
}
</script>

<template>
    <div class="p-2 md:max-w-96 flex flex-col gap-4">
        <!-- Characters -->
        <div>
            <h2 class="text-xl font-bold">Characters</h2>
            <div class="divider mt-0 mb-1"></div>
            <MultiSelectCharacters :options="characters" v-model="selectedCharacters" placeholder="Search Characters" class="w-full" />
            <div class="flex flex-col gap-2 w-full mt-4">
                <div v-for="character in selectedCharacters" :key="character.id" class="card bg-base-200">
                    <div class="card-body p-2">
                        <div class="flex flex-row gap-2">
                            <div class="avatar w-20 h-20">
                                <img v-if="character.avatar" :src="character.avatar" class="rounded-lg" />
                                <img v-else src="../assets/img/placeholder-avatar.webp" class="rounded-lg" />
                            </div>
                            <div class="text-lg ml-2">{{ character.name }}</div>

                            <button class="btn btn-sm btn-square btn-error absolute top-2 right-2" @click="removeCharacter(character)">
                                <TrashIcon class="size-4" />
                            </button>

                            <div class="flex flex-row gap-2 absolute bottom-2 right-2">
                                <label class="label">User</label>
                                <input type="radio" name="userCharacter" :value="character.id" v-model="userCharacter" class="radio" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Lore -->
        <div v-if="lore.length" class="w-full">
            <h2 class="text-xl font-bold">Lore</h2>
            <div class="divider mt-0 mb-1"></div>
            <MultiSelectLore :options="lore" v-model="selectedLore" placeholder="Search Lore" class="w-full" />
            <div class="flex flex-col gap-2 w-full mt-4">
                <div v-for="lore in selectedLore" :key="lore.id" class="card bg-base-200">
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

        <!-- Chat Name -->
        <div>
            <h2 class="text-xl font-bold">Chat Name</h2>
            <div class="divider mt-0 mb-1"></div>
            <input
                type="text"
                placeholder="(optional)"
                v-model="chatName"
                class="input w-full"
            />

            <div class="flex flex-row mt-5">
                <button class="btn btn-primary" @click="createChat" :disabled="selectedCharacters.length < 1">Create Chat</button>
            </div>
        </div>
    </div>
</template>
