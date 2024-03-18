import {useConnectionStore} from '../store'

export const checkConnection = async () => {
    const connectionStore = useConnectionStore()

    let checkUrl = ''
    if (connectionStore.apiType === 'llamacpp') {
        checkUrl = `${connectionStore.apiUrl}/v1/models`
    } else if (connectionStore.apiType === 'koboldcpp') {
        checkUrl = `${connectionStore.apiUrl}/api/v1/model`
    }

    try {
        const response = await fetch(checkUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (response.ok) {
            connectionStore.connected = true
            return true
        } else {
            connectionStore.connected = false
            return false
        }
    } catch (err) {
        connectionStore.connected = false
        return false
    }
}
