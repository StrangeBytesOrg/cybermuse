import {Elysia, t} from 'elysia'

export const errModel = new Elysia().model({
    err: t.Object(
        {
            name: t.String(),
            message: t.String(),
        },
        {description: 'Default Error Response'},
    ),
})
