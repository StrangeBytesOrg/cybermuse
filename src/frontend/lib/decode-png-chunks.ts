const pngSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

export const decodeChunks = (arrayBuffer: ArrayBuffer) => {
    const dataView = new DataView(arrayBuffer)
    const metaChunks = []

    // Verify PNG signature
    for (let i = 0; i < pngSignature.length; i++) {
        if (dataView.getUint8(i) !== pngSignature[i]) {
            throw new Error('Not a valid PNG file')
        }
    }

    let offset = 8 // Skip the signature
    while (offset < dataView.byteLength) {
        const length = dataView.getUint32(offset)
        offset += 4

        const type = String.fromCharCode(
            dataView.getUint8(offset),
            dataView.getUint8(offset + 1),
            dataView.getUint8(offset + 2),
            dataView.getUint8(offset + 3),
        )
        offset += 4

        const data = new Uint8Array(arrayBuffer, offset, length)
        offset += length

        offset += 4 // Skip CRC

        if (type === 'tEXt') {
            const textDecoder = new TextDecoder()
            const chunkContent = textDecoder.decode(data)
            const [keyword, value] = chunkContent.split('\0')
            if (keyword && value) {
                metaChunks.push({keyword, value})
            }
        }
    }

    return metaChunks
}
