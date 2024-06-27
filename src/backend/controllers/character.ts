import {Elysia, t} from 'elysia'
import {eq} from 'drizzle-orm'
import {Template} from '@huggingface/jinja'
import {db, character, selectCharacterSchema, insertCharacterSchema} from '../db.js'
// import {errModel} from '../api-schemas.js'

export const characterRoutes = new Elysia()
// .use(errModel)

characterRoutes.get(
    '/characters',
    async () => {
        const characters = await db.select().from(character)
        characters.forEach((character) => {
            const descriptionTemplate = new Template(character.description)
            character.description = descriptionTemplate.render({char: character.name})
        })
        return {characters}
    },
    {
        tags: ['characters'],
        detail: {
            operationId: 'GetAllCharacters',
            summary: 'Get all characters',
        },
        response: {
            200: t.Object({
                characters: t.Array(selectCharacterSchema),
            }),
        },
    },
)

characterRoutes.get(
    '/character/:id',
    async ({params, error}) => {
        const resCharacter = await db.query.character.findFirst({
            where: eq(character.id, Number(params.id)),
        })
        if (!resCharacter) {
            return error(400, "Character doesn't exist.")
        }
        return {character: resCharacter}
    },
    {
        tags: ['characters'],
        detail: {
            operationId: 'GetCharacterById',
            summary: 'Get a character by ID',
        },
        params: t.Object({
            id: t.String(),
        }),
        response: {
            200: t.Object({
                character: selectCharacterSchema,
            }),
            400: t.String(),
        },
    },
)

characterRoutes.post(
    '/create-character',
    async ({body, set}) => {
        await db.insert(character).values({
            name: body.name,
            type: body.type,
            description: body.description,
            firstMessage: body.firstMessage,
            image: body.image,
        })
        set.status = 204
    },
    {
        tags: ['characters'],
        detail: {
            operationId: 'CreateCharacter',
            summary: 'Create a character',
        },
        body: insertCharacterSchema,
        response: {
            204: t.Void(),
        },
    },
)

characterRoutes.post(
    '/update-character/:id',
    async ({params, body, set}) => {
        await db
            .update(character)
            .set({
                name: body.name,
                type: body.type,
                description: body.description,
                firstMessage: body.firstMessage,
                image: body.image,
            })
            .where(eq(character.id, Number(params.id)))
        set.status = 204
    },
    {
        tags: ['characters'],
        detail: {
            operationId: 'UpdateCharacter',
            summary: 'Update a character',
        },
        params: t.Object({
            id: t.String(),
        }),
        body: insertCharacterSchema,
        response: {
            204: t.Void(),
            422: t.Object({message: t.String()}),
        },
    },
)

characterRoutes.post(
    '/delete-character/:id',
    async ({params, error}) => {
        if (params.id === '1') {
            return error(400, {message: 'Not allowed to delete the user character.'})
        }
        await db.delete(character).where(eq(character.id, Number(params.id)))
    },
    {
        tags: ['characters'],
        detail: {
            operationId: 'DeleteCharacter',
            summary: 'Delete a character',
        },
        params: t.Object({
            id: t.String(),
        }),
        response: {
            204: t.Void(),
            400: t.Object({message: t.String()}),
        },
    },
)
