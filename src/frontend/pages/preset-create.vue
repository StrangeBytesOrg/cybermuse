<script lang="ts" setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {useToast} from 'vue-toastification'
import {client} from '../api-client'
import BackButton from '../components/back-button.vue'

const toast = useToast()
const router = useRouter()
const presetName = ref('')
const context = ref(2048)
const seed = ref(-1)
const temperature = ref(0)
const maxTokens = ref(250)
const minP = ref(0)
const topP = ref(0)
const topK = ref(0)
const repeatPenalty = ref(0)
const repeatLastN = ref(0)
const penalizeNL = ref(false)
const presencePenalty = ref(0)
const frequencyPenalty = ref(0)

const createTemplate = async () => {
    // TODO convert preset into a single reactive so this can all be one object
    await client.generatePresets.create.mutate({
        name: presetName.value,
        context: context.value,
        maxTokens: maxTokens.value,
        seed: seed.value,
        temperature: temperature.value,
        topK: topK.value,
        topP: topP.value,
        minP: minP.value,
        repeatPenalty: repeatPenalty.value,
        repeatLastN: repeatLastN.value,
        penalizeNL: penalizeNL.value,
        presencePenalty: presencePenalty.value,
        frequencyPenalty: frequencyPenalty.value,
    })
    toast.success('Created new preset')
    router.push('/presets')
}
</script>

<template>
    <div class="flex flex-row bg-base-300 p-3">
        <BackButton />
        <h1 class="text-xl ml-5">Create Preset</h1>
    </div>

    <div class="flex flex-col bg-base-200 rounded-lg p-3 m-2">
        <div class="flex flex-row justify-between">
            <div class="flex flex-col flex-grow mr-8">
                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Preset Name</span>
                    </div>
                    <input
                        type="text"
                        v-model="presetName"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Context Length</span>
                    </div>
                    <input
                        type="number"
                        class="input input-bordered focus:outline-none focus:border-primary"
                        v-model="context" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Max Tokens</span>
                    </div>
                    <input
                        type="number"
                        class="input input-bordered focus:outline-none focus:border-primary"
                        v-model="maxTokens" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Seed</span>
                    </div>
                    <input
                        type="number"
                        class="input input-bordered focus:outline-none focus:border-primary"
                        v-model="seed" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Temperature</span>
                    </div>
                    <input
                        type="number"
                        v-model="temperature"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Min P</span>
                    </div>
                    <input
                        type="number"
                        class="input input-bordered focus:outline-none focus:border-primary"
                        v-model="minP" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Top P</span>
                    </div>
                    <input
                        type="number"
                        class="input input-bordered focus:outline-none focus:border-primary"
                        v-model="topP" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Top K</span>
                    </div>
                    <input
                        type="number"
                        class="input input-bordered focus:outline-none focus:border-primary"
                        v-model="topK" />
                </label>
            </div>

            <div class="flex flex-col flex-grow">
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Repeat-penalty</span></div>
                    <input
                        type="text"
                        v-model.number="repeatPenalty"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Repeat-last-n</span></div>
                    <input
                        type="text"
                        v-model.number="repeatLastN"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Penalize-nl</span></div>
                    <select v-model.number="penalizeNL" class="select select-bordered">
                        <option :value="true">true</option>
                        <option :value="false">false</option>
                    </select>
                </label>
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Presence-penalty</span></div>
                    <input
                        type="text"
                        v-model.number="presencePenalty"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Frequency-penalty</span></div>
                    <input
                        type="text"
                        v-model.number="frequencyPenalty"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
            </div>
        </div>

        <button @click="createTemplate" class="btn btn-primary mt-2">Create Preset</button>
    </div>
</template>
