import Dexie, {type EntityTable} from 'dexie'
import {hash} from '@/lib/hash'

type Thumbnail = {
    id: string
    data: Blob
}

export const thumbnailDb = new Dexie('cybermuse-thumbnails') as Dexie & {
    thumbs: EntityTable<Thumbnail, 'id'>
}

thumbnailDb.version(1).stores({thumbs: 'id'})

const memCache = new Map<string, string>()

export const createThumbnail = (data: string, maxWidth: number, maxHeight: number) => {
    return new Promise<Blob>((resolve, reject) => {
        const image = new Image()
        image.src = data

        image.addEventListener('load', () => {
            let width = image.width
            let height = image.height

            if (width > maxWidth) {
                if (height > maxHeight) {
                    height = Math.round(height * (maxWidth / width))
                    width = maxWidth
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round(width * (maxHeight / height))
                    height = maxHeight
                }
            }

            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            ctx?.drawImage(image, 0, 0, width, height)

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error('Failed creating thumbnail'))
                    }
                },
                'image/webp',
                0.9,
            )

            image.addEventListener('error', () => {
                reject(new Error('Failed creating thumbnail'))
            })
        })
    })
}

export const getImage = async (image: string, width: number, height: number) => {
    const cacheKey = `${hash(image)}-${width}-${height}`

    // Check the memory cache first
    if (memCache.has(cacheKey)) {
        return memCache.get(cacheKey)
    }

    // See if the thumbnail is already in the database
    const cachedThumb = await thumbnailDb.thumbs.get(cacheKey)
    if (cachedThumb) {
        const url = URL.createObjectURL(cachedThumb.data)
        memCache.set(cacheKey, url)
        return url
    }

    const thumbnail = await createThumbnail(image, width, height)
    await thumbnailDb.thumbs.put({id: cacheKey, data: thumbnail})
    const url = URL.createObjectURL(thumbnail)
    memCache.set(cacheKey, url)

    return url
}
