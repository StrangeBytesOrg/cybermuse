/** Creates a random 11-character Base62 ID with 64 bits of entropy */
export function randomId() {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    const base = BigInt(alphabet.length)

    const bytes = crypto.getRandomValues(new Uint8Array(8))
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
    let n = BigInt('0x' + hex)
    let out = ''
    while (n > 0n) {
        out = alphabet[Number(n % base)] + out
        n /= base
    }
    return out.padStart(11, '0')
}
