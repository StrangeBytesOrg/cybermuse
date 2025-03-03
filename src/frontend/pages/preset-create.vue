<script lang="ts" setup>
import {reactive} from 'vue'
import {useRouter} from 'vue-router'
import {useToastStore} from '@/store'
import {generationPresetCollection, userCollection} from '@/db'
import NumberInput from '@/components/number-input.vue'

const toast = useToastStore()
const router = useRouter()
const preset = reactive({
    name: '',
    maxTokens: 250,
    temperature: 1,
    seed: undefined,
    minP: undefined,
    topP: undefined,
    topK: undefined,
    repeatPenalty: {
        penalty: undefined,
        presencePenalty: undefined,
        frequencyPenalty: undefined,
        lastTokens: undefined,
        penalizeNewLine: undefined,
    },
})

const createTemplate = async () => {
    const {id} = await generationPresetCollection.put(preset)
    const user = await userCollection.findById('default-user')
    user.generatePresetId = id
    await userCollection.update(user)
    toast.success('Created new preset')
    router.push({name: 'presets'})
}
</script>

<template>
    <main class="flex flex-col bg-base-200 rounded-lg p-3">
        <div class="flex flex-row">
            <fieldset class="fieldset">
                <legend class="fieldset-legend">Basic Settings</legend>

                <label class="fieldset-label text-sm">Preset Name</label>
                <input v-model="preset.name" type="text" class="input focus:outline-none" />

                <label class="fieldset-label text-sm">Max Response Tokens</label>
                <NumberInput v-model="preset.maxTokens" class="input focus:outline-none" />

                <label class="fieldset-label text-sm">Temperature</label>
                <NumberInput v-model="preset.temperature" class="input focus:outline-none" />

                <label class="fieldset-label text-sm">Seed</label>
                <NumberInput v-model="preset.seed" class="input focus:outline-none" />

                <label class="fieldset-label text-sm">Min P</label>
                <NumberInput v-model="preset.minP" class="input focus:outline-none" />

                <label class="fieldset-label text-sm">Top P</label>
                <NumberInput v-model="preset.topP" class="input focus:outline-none" />

                <label class="fieldset-label text-sm">Top K</label>
                <NumberInput v-model="preset.topK" class="input focus:outline-none" />
            </fieldset>

            <fieldset class="fieldset ml-5">
                <legend class="fieldset-legend">Penalties</legend>

                <label class="fieldset-label text-sm">Repeat-penalty</label>
                <NumberInput v-model="preset.repeatPenalty.penalty" class="input focus:outline-none" />

                <label class="fieldset-label text-sm">Presence-penalty</label>
                <NumberInput
                    v-model="preset.repeatPenalty.presencePenalty"
                    class="input focus:outline-none"
                />

                <label class="fieldset-label text-sm">Frequency-penalty</label>
                <NumberInput
                    v-model="preset.repeatPenalty.frequencyPenalty"
                    class="input focus:outline-none"
                />

                <label class="fieldset-label text-sm">Last Tokens</label>
                <NumberInput
                    v-model="preset.repeatPenalty.lastTokens"
                    class="input focus:outline-none"
                />

                <label class="fieldset-label text-sm">Penalize-nl</label>
                <select v-model="preset.repeatPenalty.penalizeNewLine" class="select">
                    <option :value="true">true</option>
                    <option :value="false">false</option>
                </select>
            </fieldset>
        </div>

        <button @click="createTemplate" class="btn btn-primary max-w-32 mt-2">Create Preset</button>
    </main>
</template>
