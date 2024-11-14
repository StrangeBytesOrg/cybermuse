<script lang="ts" setup>
import {reactive} from 'vue'
import {useRouter} from 'vue-router'
import {useToast} from 'vue-toastification'
import {generationPresetCollection} from '@/db'
import TopBar from '@/components/top-bar.vue'

const toast = useToast()
const router = useRouter()
const preset = reactive({
    name: '',
    context: 2048,
    seed: -1,
    temperature: 0,
    maxTokens: 250,
    minP: 0,
    topP: 0,
    topK: 0,
    repeatPenalty: 0,
    repeatLastN: 0,
    penalizeNL: false,
    presencePenalty: 0,
    frequencyPenalty: 0,
})

const createTemplate = async () => {
    await generationPresetCollection.put(preset)
    toast.success('Created new preset')
    router.push({name: 'presets'})
}
</script>

<template>
    <TopBar title="Create Preset" back />

    <div class="flex flex-col bg-base-200 rounded-lg p-3 m-2">
        <div class="flex flex-row justify-between">
            <div class="flex flex-col flex-grow mr-8">
                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Preset Name</span>
                    </div>
                    <input
                        type="text"
                        v-model="preset.name"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Context Length</span>
                    </div>
                    <input
                        type="number"
                        class="input input-bordered focus:outline-none focus:border-primary"
                        v-model="preset.context" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Max Tokens</span>
                    </div>
                    <input
                        type="number"
                        class="input input-bordered focus:outline-none focus:border-primary"
                        v-model="preset.maxTokens" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Seed</span>
                    </div>
                    <input
                        type="number"
                        class="input input-bordered focus:outline-none focus:border-primary"
                        v-model="preset.seed" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Temperature</span>
                    </div>
                    <input
                        type="number"
                        v-model="preset.temperature"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Min P</span>
                    </div>
                    <input
                        type="number"
                        class="input input-bordered focus:outline-none focus:border-primary"
                        v-model="preset.minP" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Top P</span>
                    </div>
                    <input
                        type="number"
                        class="input input-bordered focus:outline-none focus:border-primary"
                        v-model="preset.topP" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Top K</span>
                    </div>
                    <input
                        type="number"
                        class="input input-bordered focus:outline-none focus:border-primary"
                        v-model="preset.topK" />
                </label>
            </div>

            <div class="flex flex-col flex-grow">
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Repeat-penalty</span></div>
                    <input
                        type="text"
                        v-model.number="preset.repeatPenalty"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Repeat-last-n</span></div>
                    <input
                        type="text"
                        v-model.number="preset.repeatLastN"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Penalize-nl</span></div>
                    <select v-model.number="preset.penalizeNL" class="select select-bordered">
                        <option :value="true">true</option>
                        <option :value="false">false</option>
                    </select>
                </label>
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Presence-penalty</span></div>
                    <input
                        type="text"
                        v-model.number="preset.presencePenalty"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Frequency-penalty</span></div>
                    <input
                        type="text"
                        v-model.number="preset.frequencyPenalty"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
            </div>
        </div>

        <button @click="createTemplate" class="btn btn-primary mt-2">Create Preset</button>
    </div>
</template>
