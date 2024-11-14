<script lang="ts" setup>
import {ref, reactive, computed} from 'vue'
import {useToast} from 'vue-toastification'
import {generationPresetCollection, userCollection} from '@/db'
import TopBar from '@/components/top-bar.vue'
import NumberInput from '@/components/number-input.vue'

const toast = useToast()

const presets = reactive(await generationPresetCollection.find())
const user = reactive(await userCollection.findById('default-user'))
const selectedPresetId = ref(user.generatePreset)

const activePreset = computed(() => {
    return presets.find((preset) => preset._id === user.generatePreset)
})

const setActivePreset = async () => {
    // Check if the preset exists
    await generationPresetCollection.findById(selectedPresetId.value)

    user.generatePreset = selectedPresetId.value
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
    if (activePreset.value?._id === 'default-preset') {
        throw new Error('Cannot delete the default preset')
    }

    await generationPresetCollection.removeById(selectedPresetId.value)
    // Set the default preset as active
    user.generatePreset = 'default-generation-preset'
    selectedPresetId.value = 'default-generation-preset'
    await userCollection.update(user)
}
</script>

<template>
    <TopBar title="Generation Presets" />

    <div class="py-3 px-2">
        <div class="flex flex-row">
            <div class="flex flex-col">
                <select v-model="selectedPresetId" @change="setActivePreset" class="select select-bordered min-w-60">
                    <option v-for="preset in presets" :key="preset._id" :value="preset._id">
                        {{ preset.name }}
                    </option>
                </select>
            </div>

            <router-link to="/create-preset" class="btn btn-primary mt-auto ml-3">Create Preset</router-link>
        </div>

        <div v-if="activePreset" class="flex flex-col justify-between bg-base-200 rounded-lg p-3 pt-1 mt-3">
            <div class="flex flex-row">
                <div class="flex flex-col flex-grow mr-8">
                    <label class="form-control w-full">
                        <div class="label">
                            <span class="label-text">Preset Name</span>
                        </div>
                        <input
                            type="text"
                            v-model="activePreset.name"
                            class="input input-bordered focus:outline-none focus:border-primary" />
                    </label>

                    <label class="form-control w-full">
                        <div class="label">
                            <span class="label-text">Max Response Tokens</span>
                        </div>
                        <NumberInput
                            v-model="activePreset.maxTokens"
                            class="input input-bordered focus:outline-none focus:border-primary" />
                    </label>

                    <label class="form-control w-full">
                        <div class="label">
                            <span class="label-text">Max Context</span>
                        </div>
                        <NumberInput
                            v-model="activePreset.context"
                            class="input input-bordered focus:outline-none focus:border-primary" />
                    </label>

                    <label class="form-control w-full">
                        <div class="label">
                            <span class="label-text">Temperature</span>
                        </div>
                        <NumberInput
                            v-model="activePreset.temperature"
                            class="input input-bordered focus:outline-none focus:border-primary" />
                    </label>

                    <label class="form-control w-full">
                        <div class="label">
                            <span class="label-text">Seed</span>
                        </div>
                        <NumberInput
                            v-model="activePreset.seed"
                            class="input input-bordered focus:outline-none focus:border-primary" />
                    </label>

                    <label class="form-control w-full">
                        <div class="label">
                            <span class="label-text">Min P</span>
                        </div>
                        <NumberInput
                            v-model="activePreset.minP"
                            class="input input-bordered focus:outline-none focus:border-primary" />
                    </label>

                    <label class="form-control w-full">
                        <div class="label">
                            <span class="label-text">Top P</span>
                        </div>
                        <NumberInput
                            v-model="activePreset.topP"
                            class="input input-bordered focus:outline-none focus:border-primary" />
                    </label>

                    <label class="form-control w-full">
                        <div class="label">
                            <span class="label-text">Top K</span>
                        </div>
                        <NumberInput
                            v-model="activePreset.topK"
                            class="input input-bordered focus:outline-none focus:border-primary" />
                    </label>
                </div>

                <div class="flex flex-col flex-grow">
                    <label class="form-control w-full">
                        <div class="label"><span class="label-text">Repeat-penalty</span></div>
                        <NumberInput
                            v-model="activePreset.repeatPenalty"
                            class="input input-bordered focus:outline-none focus:border-primary" />
                    </label>
                    <label class="form-control w-full">
                        <div class="label"><span class="label-text">Repeat-last-n</span></div>
                        <NumberInput
                            v-model="activePreset.repeatLastN"
                            class="input input-bordered focus:outline-none focus:border-primary" />
                    </label>
                    <label class="form-control w-full">
                        <div class="label"><span class="label-text">Penalize-nl</span></div>
                        <select v-model="activePreset.penalizeNL" class="select select-bordered">
                            <option :value="true">true</option>
                            <option :value="false">false</option>
                        </select>
                    </label>
                    <label class="form-control w-full">
                        <div class="label"><span class="label-text">Presence-penalty</span></div>
                        <NumberInput
                            v-model="activePreset.presencePenalty"
                            class="input input-bordered focus:outline-none focus:border-primary" />
                    </label>
                    <label class="form-control w-full">
                        <div class="label"><span class="label-text">Frequency-penalty</span></div>
                        <NumberInput
                            v-model="activePreset.frequencyPenalty"
                            class="input input-bordered focus:outline-none focus:border-primary" />
                    </label>
                </div>
            </div>
            <div class="flex flex-row space-x-2 mt-5">
                <button @click="updatePreset" class="btn btn-primary flex-grow">Save</button>
                <button @click="deletePreset" class="btn btn-error flex-grow">Delete</button>
            </div>
        </div>
        <div v-else>Preset not found</div>
    </div>
</template>
