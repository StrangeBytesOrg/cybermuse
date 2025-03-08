<script lang="ts" setup>
import {ref, reactive, computed, toRaw} from 'vue'
import {useToastStore} from '@/store'
import {db} from '@/db'
import NumberInput from '@/components/number-input.vue'

const toast = useToastStore()
const presets = reactive(await db.generationPresets.toArray())
const user = reactive(await db.users.get('default-user'))
const selectedPresetId = ref(user.generatePresetId)

const activePreset = computed(() => {
    return presets.find((preset) => preset.id === user.generatePresetId)
})

const setActivePreset = async () => {
    if (await db.generationPresets.get(selectedPresetId.value)) {
        user.generatePresetId = selectedPresetId.value
        await db.users.update('default-user', {generatePresetId: selectedPresetId.value})
    }

    toast.success('Active preset set')
}

const updatePreset = async () => {
    if (activePreset.value) {
        await db.generationPresets.update(activePreset.value.id, toRaw(activePreset.value))
        toast.success('Preset updated')
    }
}

const deletePreset = async () => {
    if (activePreset.value?.id === 'default-generation-preset') {
        throw new Error('Cannot delete the default preset')
    }

    if (activePreset.value) {
        await db.generationPresets.delete(activePreset.value.id)
        await db.users.update('default-user', {generatePresetId: 'default-generation-preset'})
        location.reload() // FIXME Refresh the page as an easy way to reset the state
    }
}
</script>

<template>
    <div class="flex flex-row">
        <div class="flex flex-col">
            <select v-model="selectedPresetId" @change="setActivePreset" class="select min-w-60">
                <option v-for="preset in presets" :key="preset.id" :value="preset.id">
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
                <input v-model="activePreset.name" type="text" class="input" />

                <label class="fieldset-label text-sm">Max Response Tokens</label>
                <NumberInput v-model="activePreset.maxTokens" class="input" />

                <label class="fieldset-label text-sm">Temperature</label>
                <NumberInput v-model="activePreset.temperature" class="input" />

                <label class="fieldset-label text-sm">Seed</label>
                <NumberInput v-model="activePreset.seed" class="input" />

                <label class="fieldset-label text-sm">Min P</label>
                <NumberInput v-model="activePreset.minP" class="input" />

                <label class="fieldset-label text-sm">Top P</label>
                <NumberInput v-model="activePreset.topP" class="input" />

                <label class="fieldset-label text-sm">Top K</label>
                <NumberInput v-model="activePreset.topK" class="input" />
            </fieldset>

            <fieldset class="fieldset ml-5">
                <legend class="fieldset-legend">Penalties</legend>

                <label class="fieldset-label text-sm">Repeat-penalty</label>
                <NumberInput
                    v-model="activePreset.repeatPenalty.penalty"
                    class="input"
                />

                <label class="fieldset-label text-sm">Presence-penalty</label>
                <NumberInput
                    v-model="activePreset.repeatPenalty.presencePenalty"
                    class="input"
                />

                <label class="fieldset-label text-sm">Frequency-penalty</label>
                <NumberInput
                    v-model="activePreset.repeatPenalty.frequencyPenalty"
                    class="input"
                />

                <label class="fieldset-label text-sm">Last Tokens</label>
                <NumberInput
                    v-model="activePreset.repeatPenalty.lastTokens"
                    class="input"
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
