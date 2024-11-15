<script lang="ts" setup>
import {reactive} from 'vue'
import {useRouter} from 'vue-router'
import {useToast} from 'vue-toastification'
import {generationPresetCollection, userCollection} from '@/db'
import TopBar from '@/components/top-bar.vue'
import NumberInput from '@/components/number-input.vue'

const toast = useToast()
const router = useRouter()
const preset = reactive({
    name: '',
    context: 2048,
    maxTokens: 250,
    temperature: 0,
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
                    <NumberInput
                        v-model="preset.context"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Max Tokens</span>
                    </div>
                    <NumberInput
                        v-model="preset.maxTokens"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Seed</span>
                    </div>
                    <NumberInput
                        v-model="preset.seed"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Temperature</span>
                    </div>
                    <NumberInput
                        v-model="preset.temperature"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Min P</span>
                    </div>
                    <NumberInput
                        v-model="preset.minP"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Top P</span>
                    </div>
                    <NumberInput
                        v-model="preset.topP"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Top K</span>
                    </div>
                    <NumberInput
                        v-model="preset.topK"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
            </div>

            <div class="flex flex-col flex-grow">
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Repeat-penalty</span></div>
                    <NumberInput
                        v-model="preset.repeatPenalty.penalty"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Presence-penalty</span></div>
                    <NumberInput
                        v-model="preset.repeatPenalty.presencePenalty"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Frequency-penalty</span></div>
                    <NumberInput
                        v-model="preset.repeatPenalty.frequencyPenalty"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Last Tokens</span></div>
                    <NumberInput
                        v-model="preset.repeatPenalty.lastTokens"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Penalize-nl</span></div>
                    <select v-model="preset.repeatPenalty.penalizeNewLine" class="select select-bordered">
                        <option :value="true">true</option>
                        <option :value="false">false</option>
                    </select>
                </label>
            </div>
        </div>

        <button @click="createTemplate" class="btn btn-primary mt-2">Create Preset</button>
    </div>
</template>
