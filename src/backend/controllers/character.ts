import path from 'node:path'
import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox'
import type {FastifyPluginAsync} from 'fastify'
import {Type as t} from '@sinclair/typebox'
import {eq} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import sharp from 'sharp'
import {db, Character, selectCharacterSchema, insertCharacterSchema} from '../db.js'
import {logger} from '../logging.js'
import {paths} from '../paths.js'

const avatarsPath = path.resolve(paths.data, 'avatars')

export const characterRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/characters',
        method: 'GET',
        schema: {
            operationId: 'GetAllCharacters',
            tags: ['characters'],
            summary: 'Get all characters',
            response: {
                200: t.Object({
                    characters: t.Array(selectCharacterSchema),
                }),
            },
        },
        handler: async () => {
            const characters = await db.select().from(Character)
            characters.forEach((character) => {
                const descriptionTemplate = new Template(character.description)
                character.description = descriptionTemplate.render({char: character.name})
            })
            return {characters}
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/character/:id',
        method: 'GET',
        schema: {
            operationId: 'GetCharacterById',
            tags: ['characters'],
            summary: 'Get a character by ID',
            params: t.Object({
                id: t.String(),
            }),
            response: {
                200: t.Object({
                    character: selectCharacterSchema,
                }),
            },
        },
        handler: async (req) => {
            const character = await db.query.Character.findFirst({
                where: eq(Character.id, Number(req.params.id)),
            })
            if (!character) {
                throw new Error('Character not found')
            }
            return {character: character}
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/create-character',
        method: 'POST',
        schema: {
            operationId: 'CreateCharacter',
            tags: ['characters'],
            summary: 'Create a character',
            body: insertCharacterSchema,
        },
        handler: async (req) => {
            await db.insert(Character).values({
                name: req.body.name,
                type: req.body.type,
                description: req.body.description,
                firstMessage: req.body.firstMessage,
                image: req.body.image || null,
            })
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/update-character/:id',
        method: 'POST',
        schema: {
            operationId: 'UpdateCharacter',
            tags: ['characters'],
            summary: 'Update a character',
            params: t.Object({
                id: t.String(),
            }),
            body: insertCharacterSchema,
        },
        handler: async (req) => {
            await db
                .update(Character)
                .set({
                    name: req.body.name,
                    type: req.body.type,
                    description: req.body.description,
                    firstMessage: req.body.firstMessage,
                    image: req.body.image || null,
                })
                .where(eq(Character.id, Number(req.params.id)))
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/delete-character/:id',
        method: 'POST',
        schema: {
            operationId: 'DeleteCharacter',
            tags: ['characters'],
            summary: 'Delete a character',
            params: t.Object({
                id: t.String(),
            }),
            response: {
                204: {type: 'null', description: 'No Content'},
            },
        },
        handler: async (req) => {
            if (req.params.id === '1') {
                throw new Error('Not allowed to delete the user character.')
            }
            await db.delete(Character).where(eq(Character.id, Number(req.params.id)))
        },
    })

    fastify.withTypeProvider<TypeBoxTypeProvider>().route({
        url: '/upload-avatar',
        method: 'POST',
        schema: {
            operationId: 'UploadAvatar',
            tags: ['characters'],
            summary: 'Upload an avatar',
            body: t.Object({
                image: t.String({
                    pattern: '^data:image/(png|jpeg|webp);base64,',
                }),
            }),
            response: {
                200: t.Object({
                    filename: t.String(),
                }),
            },
        },
        handler: async (req) => {
            const filename = `${Date.now()}.webp`
            const imagePath = path.resolve(avatarsPath, filename)
            const imageBuffer = Buffer.from(req.body.image.replace(/^data:image\/\w+;base64,/, ''), 'base64')
            await sharp(imageBuffer).webp().toFile(imagePath)
            logger.info(`Saved character image to ${imagePath}`)
            return {filename}
        },
    })

    // fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    //     url: '/delete-avatar/:filename',
    //     method: 'POST',
    //     schema: {
    //         operationId: 'DeleteAvatar',
    //         tags: ['characters'],
    //         summary: 'Delete an avatar',
    //         params: t.Object({
    //             filename: t.String(),
    //         }),
    //         response: {
    //             204: {type: 'null', description: 'No Content'},
    //         },
    //     },
    //     handler: async (req) => {
    //         const imagePath = path.resolve(avatarsPath, req.params.filename)
    //         if (!fs.existsSync(imagePath)) {
    //             throw new Error('Image not found')
    //         }
    //         fs.rmSync(imagePath)
    //     },
    // })
}
