<script lang="ts" setup>
import {ref} from 'vue'
import {useToast} from 'vue-toastification'
import {useRoute, useRouter} from 'vue-router'
import {client} from '../api-client'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const presetId = Number(route.params.id)

const {data} = await client.GET('/preset/{id}', {
    params: {path: {id: String(presetId)}},
})
const presetName = ref(data?.preset.name || '')
const maxTokens = ref(data?.preset.maxTokens || 0)
const context = ref(data?.preset.context || 0)
const temperature = ref(data?.preset.temperature || 0)
const seed = ref(data?.preset.seed || 0)
const minP = ref(data?.preset.minP || 0)
const topP = ref(data?.preset.topP || 0)
const topK = ref(data?.preset.topK || 0)
const tfsz = ref(data?.preset.tfsz || 0)
const typicalP = ref(data?.preset.typicalP || 0)
const repeatPenalty = ref(data?.preset.repeatPenalty || 0)
const repeatLastN = ref(data?.preset.repeatLastN || 0)
const penalizeNL = ref(data?.preset.penalizeNL || false)
const presencePenalty = ref(data?.preset.presencePenalty || 0)
const frequencyPenalty = ref(data?.preset.frequencyPenalty || 0)
const mirostat = ref(data?.preset.mirostat || 0)
const mirostatTau = ref(data?.preset.mirostatTau || 0)
const mirostatEta = ref(data?.preset.mirostatEta || 0)

const updatePreset = async () => {
    const {error} = await client.POST('/update-preset/{id}', {
        params: {path: {id: String(presetId)}},
        body: {
            name: presetName.value,
            context: context.value,
            maxTokens: maxTokens.value,
            seed: seed.value,
            temperature: temperature.value,
            topK: topK.value,
            topP: topP.value,
            minP: minP.value,
            tfsz: tfsz.value,
            typicalP: typicalP.value,
            repeatPenalty: repeatPenalty.value,
            repeatLastN: repeatLastN.value,
            penalizeNL: penalizeNL.value,
            presencePenalty: presencePenalty.value,
            frequencyPenalty: frequencyPenalty.value,
            mirostat: mirostat.value,
            mirostatTau: mirostatTau.value,
            mirostatEta: mirostatEta.value,
        },
    })
    if (error) {
        toast.error('Error updating preset')
    } else {
        toast.success('Preset updated')
    }
}

const deletePreset = async () => {
    const {error} = await client.POST('/delete-preset/{id}', {
        params: {path: {id: String(presetId)}},
    })
    if (error) {
        toast.error(`Error deleting preset\n${error.detail}`)
    } else {
        toast.success('Preset deleted')
        router.push('/presets')
    }
}
</script>

<template>
    <div class="bg-base-200 rounded-lg p-3 m-2">
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
                        <span class="label-text">Max Response Tokens</span>
                    </div>
                    <input
                        type="number"
                        class="input input-bordered focus:outline-none focus:border-primary"
                        v-model="maxTokens" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">Max Context</span>
                    </div>
                    <input
                        type="number"
                        class="input input-bordered focus:outline-none focus:border-primary"
                        v-model="context" />
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
                        <span class="label-text">Seed</span>
                    </div>
                    <input
                        type="number"
                        v-model="seed"
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
                    <div class="label"><span class="label-text">tfsz</span></div>
                    <input
                        type="text"
                        v-model.number="tfsz"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Typical-p</span></div>
                    <input
                        type="text"
                        v-model.number="typicalP"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
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
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Mirostat</span></div>
                    <select v-model.number="mirostat" class="select">
                        <option :value="0">0 (disabled)</option>
                        <option :value="1">1 (Mirostat 1.0)</option>
                        <option :value="2">2 (Mirostat 2.0)</option>
                    </select>
                </label>
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Mirostat-tau</span></div>
                    <input
                        type="text"
                        v-model.number="mirostatTau"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
                <label class="form-control w-full">
                    <div class="label"><span class="label-text">Mirostat-eta</span></div>
                    <input
                        type="text"
                        v-model.number="mirostatEta"
                        class="input input-bordered focus:outline-none focus:border-primary" />
                </label>
            </div>
        </div>

        <div class="flex flex-row space-x-2 mt-5">
            <button @click="updatePreset" class="btn btn-primary flex-grow">Save</button>
            <button @click="deletePreset" class="btn btn-error flex-grow">Delete</button>
        </div>
    </div>
</template>
