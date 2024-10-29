import path from 'node:path'
import {z} from 'zod'
import {eq} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import sharp from 'sharp'
import {TRPCError} from '@trpc/server'
import {db, Character, insertCharacterSchema} from '../db/index.js'
import {logger} from '../logging.js'
import {avatarsPath} from '../paths.js'
import {t} from '../trpc.js'

export const characterRouter = t.router({
    getAll: t.procedure.query(async () => {
        const characters = await db.select().from(Character)
        characters.forEach((character) => {
            const descriptionTemplate = new Template(character.description)
            character.description = descriptionTemplate.render({char: character.name})
        })
        return characters
    }),
    getById: t.procedure.input(z.number()).query(async ({input}) => {
        const character = await db.query.Character.findFirst({
            where: eq(Character.id, input),
        })
        if (!character) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Character not found',
            })
        }
        return character
    }),
    create: t.procedure.input(insertCharacterSchema).mutation(async ({input}) => {
        await db.insert(Character).values({
            name: input.name,
            type: input.type,
            description: input.description,
            firstMessage: input.firstMessage,
            image: input.image || null,
        })
    }),
    update: t.procedure.input(insertCharacterSchema).mutation(async ({input}) => {
        if (!input.id) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'ID is required',
            })
        }
        await db
            .update(Character)
            .set({
                name: input.name,
                type: input.type,
                description: input.description,
                firstMessage: input.firstMessage,
                image: input.image || null,
            })
            .where(eq(Character.id, input.id))
    }),
    delete: t.procedure.input(z.number()).mutation(async ({input}) => {
        if (input === 1) {
            throw new Error('Not allowed to delete the user character.')
        }
        await db.delete(Character).where(eq(Character.id, input))
    }),
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
