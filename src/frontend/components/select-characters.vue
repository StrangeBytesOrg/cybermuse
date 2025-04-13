<script lang="ts" setup>
import {ref, computed} from 'vue'

const textInput = ref<HTMLInputElement | null>(null)
const searchText = ref('')
type Option = {
    id: string
    name: string
    avatar?: string
}
const selected = defineModel<Option[]>({
    default: [],
})
const {
    options = [],
    placeholder = '',
} = defineProps<{
    options: Option[]
    placeholder: string
}>()

const availableOptions = computed(() => {
    const filteredBySelected = options.filter(option => !selected.value.some(selectedValue => selectedValue.id === option.id))

    if (!searchText.value) return filteredBySelected

    return filteredBySelected.filter(option => option.name.toLowerCase().includes(searchText.value.toLowerCase()))
})

const selectOption = (option: Option) => {
    selected.value.push(option)
    searchText.value = ''
    textInput.value?.blur()
}

// Handle input events for better mobile compatibility
const handleSearchInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    searchText.value = target.value
}
</script>

<template>
    <div class="dropdown">
        <input
            ref="textInput"
            tabindex="0"
            v-model="searchText"
            @input="handleSearchInput"
            type="text"
            class="input w-full"
            :placeholder="placeholder"
        />

        <ul tabindex="0" class="dropdown-content w-full bg-base-100 z-1 rounded-lg shadow-md border border-base-300 px-0 mt-2">
            <li
                v-for="option in availableOptions"
                :key="option.id"
                @click="selectOption(option)"
                class="flex flex-row justify-between py-1 px-3 cursor-pointer hover:bg-primary text-neutral-content rounded-lg">
                <span class="mt-auto hover:bg-inherit">{{ option.name }}</span>
                <div class="avatar">
                    <div class="size-12 rounded-lg">
                        <img v-if="option.avatar" :src="option.avatar" />
                        <img v-else src="@/assets/img/placeholder-avatar.webp" />
                    </div>
                </div>
            </li>
            <li v-if="availableOptions.length === 0" class="px-3 py-2 text-neutral-content">
                No results found
            </li>
        </ul>
    </div>
</template>
