/**
 * Sampling hashing based on FNV-1a (Fowler-Noll-Vo) hash function.
 * This is a non-cryptographic hash function designed to be fast with low collision rate.
 * @param str The string to hash
 * @returns A string representation of the hash in base-36
 */
export const hash = (str: string) => {
    const FNV_PRIME = 0x01000193
    let hash = 0x811c9dc5
    let stepSize = 1
    if (str.length > 100_000) {
        stepSize = Math.max(1, Math.floor(str.length / 100_000))
    }
    for (let i = 0; i < str.length; i += stepSize) {
        hash ^= str.charCodeAt(i)
        hash = Math.imul(hash, FNV_PRIME)
    }
    return (hash >>> 0).toString(36)
}
