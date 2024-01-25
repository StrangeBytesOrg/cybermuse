export const jsonFromLocalstorage = (key: string): object => {
    const jsonString = localStorage.getItem(key)
    if (jsonString === null) {
        return {}
    }
    const json = JSON.parse(jsonString)
    return json
}
