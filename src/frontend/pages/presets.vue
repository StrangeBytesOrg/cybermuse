<script lang="ts" setup>
import {ref, reactive, computed} from 'vue'
import {useToastStore} from '@/store'
import {generationPresetCollection, userCollection} from '@/db'
import NumberInput from '@/components/number-input.vue'

const toast = useToastStore()
const presets = reactive(await generationPresetCollection.find())
const user = reactive(await userCollection.findById('default-user'))
const selectedPresetId = ref(user.generatePresetId)

const activePreset = computed(() => {
    return presets.find((preset) => preset._id === user.generatePresetId)
})

const setActivePreset = async () => {
    // Check if the preset exists
    await generationPresetCollection.findById(selectedPresetId.value)

    user.generatePresetId = selectedPresetId.value
    await userCollection.update(user)

    toast.success('Active preset set')
}

const updatePreset = async () => {
    if (activePreset.value) {
        await generationPresetCollection.update(activePreset.value)
        toast.success('Preset updated')
    }
}

const deletePreset = async () => {
    if (activePreset.value?._id === 'default-generation-preset') {
        throw new Error('Cannot delete the default preset')
    }

    await generationPresetCollection.removeById(selectedPresetId.value)
    // Set the default preset as active
    user.generatePresetId = 'default-generation-preset'
    selectedPresetId.value = 'default-generation-preset'
    await userCollection.update(user)
}
</script>

<template>
    <div class="flex flex-row">
        <div class="flex flex-col">
            <select v-model="selectedPresetId" @change="setActivePreset" class="select min-w-60">
                <option v-for="preset in presets" :key="preset._id" :value="preset._id">
                    {{ preset.name }}
                </option>
            </select>
        </div>

        <router-link to="/create-preset" class="btn btn-primary mt-auto ml-3">Create Preset</router-link>
    </div>

    <main v-if="activePreset" class="flex flex-col justify-between bg-base-200 rounded-lg p-3 pt-1 mt-3">
        <div class="flex flex-row">
            <fieldset class="fieldset">
                <legend class="fieldset-legend">Basic Settings</legend>

                <label class="fieldset-label text-sm">Preset Name</label>
                <input v-model="activePreset.name" type="text" class="input focus:outline-none" />

                <label class="fieldset-label text-sm">Max Response Tokens</label>
                <NumberInput v-model="activePreset.maxTokens" class="input focus:outline-none" />

                <label class="fieldset-label text-sm">Temperature</label>
                <NumberInput v-model="activePreset.temperature" class="input focus:outline-none" />

                <label class="fieldset-label text-sm">Seed</label>
                <NumberInput v-model="activePreset.seed" class="input focus:outline-none" />

                <label class="fieldset-label text-sm">Min P</label>
                <NumberInput v-model="activePreset.minP" class="input focus:outline-none" />

                <label class="fieldset-label text-sm">Top P</label>
                <NumberInput v-model="activePreset.topP" class="input focus:outline-none" />

                <label class="fieldset-label text-sm">Top K</label>
                <NumberInput v-model="activePreset.topK" class="input focus:outline-none" />
            </fieldset>

            <fieldset class="fieldset ml-5">
                <legend class="fieldset-legend">Penalties</legend>

                <label class="fieldset-label text-sm">Repeat-penalty</label>
                <NumberInput
                    v-model="activePreset.repeatPenalty.penalty"
                    class="input focus:outline-none"
                />

                <label class="fieldset-label text-sm">Presence-penalty</label>
                <NumberInput
                    v-model="activePreset.repeatPenalty.presencePenalty"
                    class="input focus:outline-none"
                />

                <label class="fieldset-label text-sm">Frequency-penalty</label>
                <NumberInput
                    v-model="activePreset.repeatPenalty.frequencyPenalty"
                    class="input focus:outline-none"
                />

                <label class="fieldset-label text-sm">Last Tokens</label>
                <NumberInput
                    v-model="activePreset.repeatPenalty.lastTokens"
                    class="input focus:outline-none"
                />

                <label class="fieldset-label text-sm">Penalize-nl</label>
                <select v-model="activePreset.repeatPenalty.penalizeNewLine" class="select">
                    <option :value="true">true</option>
                    <option :value="false">false</option>
                </select>
            </fieldset>
        </div>

        <div class="flex flex-row space-x-2 mt-5">
            <button @click="updatePreset" class="btn btn-primary">Save</button>
            <button @click="deletePreset" class="btn btn-error">Delete</button>
        </div>
    </main>
    <div v-else>Preset not found</div>
</template>
