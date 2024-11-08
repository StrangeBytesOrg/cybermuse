import path from 'node:path'
import {z} from 'zod'
import sharp from 'sharp'
import {logger} from '../logging.js'
import {avatarsPath} from '../paths.js'
import {t} from '../trpc.js'

export const avatarRouter = t.router({
    uploadAvatar: t.procedure.input(z.string()).mutation(async ({input}) => {
        const filename = `${Date.now()}.webp`
        const imagePath = path.resolve(avatarsPath, filename)
        const imageBuffer = Buffer.from(input.replace(/^data:image\/\w+;base64,/, ''), 'base64')
        await sharp(imageBuffer).webp().toFile(imagePath)
        logger.info(`Saved character image to ${imagePath}`)
        return filename
    }),
    // TODO: Implement deleteAvatar
})
