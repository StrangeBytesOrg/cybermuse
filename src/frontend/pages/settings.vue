<script lang="ts" setup>
import {useSettingsStore, usePromptStore} from '../store'

const settingsStore = useSettingsStore()
const promptStore = usePromptStore()

const saveSettings = () => {
    settingsStore.update()
    promptStore.update()
}
</script>

<template>
    <div class="p-3">
        <div class="flex flex-row">
            <!-- Generation Settings -->
            <div class="flex flex-col w-[25%]">
                <label class="form-control w-full max-w-xs">
                    <div class="label">
                        <span class="label-text">Temperature</span>
                    </div>
                    <input
                        type="number"
                        class="input input-bordered"
                        v-model="settingsStore.generationSettings.temperature" />
                </label>

                <label class="form-control w-full max-w-xs">
                    <div class="label">
                        <span class="label-text">Min P</span>
                    </div>
                    <input type="number" class="input input-bordered" v-model="settingsStore.generationSettings.minP" />
                </label>

                <label class="form-control w-full max-w-xs">
                    <div class="label">
                        <span class="label-text">Top P</span>
                    </div>
                    <input type="number" class="input input-bordered" v-model="settingsStore.generationSettings.topP" />
                </label>

                <label class="form-control w-full max-w-xs">
                    <div class="label">
                        <span class="label-text">Top K</span>
                    </div>
                    <input type="number" class="input input-bordered" v-model="settingsStore.generationSettings.topK" />
                </label>

                <label class="form-control w-full max-w-xs">
                    <div class="label">
                        <span class="label-text">Max Tokens</span>
                    </div>
                    <input
                        type="number"
                        class="input input-bordered"
                        v-model="settingsStore.generationSettings.maxTokens" />
                </label>
            </div>

            <!-- Prompt Settings -->
            <div class="flex flex-col pl-3 flex-grow">
                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">System Prompt</span>
                    </div>
                    <textarea
                        class="textarea textarea-bordered leading-normal w-full min-h-24"
                        v-model="promptStore.promptSettings.systemPrompt" />
                </label>

                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text">User Name</span>
                    </div>
                    <input type="text" class="input input-bordered" v-model="promptStore.promptSettings.userName" />
                </label>
            </div>
        </div>

        <!-- <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">Prompt Syntax Template</span>
            </div>
            <select class="select select-bordered" v-model="promptStore.promptSettings.promptSyntax">
                <option selected value="default">Empty</option>
                <option value="custom">ChatML</option>
            </select>
        </label> -->

        <!-- <label class="form-control w-full">
            <div class="label">
                <span class="label-text">Prompt Syntax</span>
            </div>
            <textarea
                class="textarea textarea-bordered leading-normal"
                v-model="promptStore.promptSettings.promptSyntax" />
        </label> -->

        <button class="btn btn-primary mt-9" @click="saveSettings">Save</button>
    </div>
</template>
