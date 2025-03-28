/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
    '/signup': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        post: operations['postSignup']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/login': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        post: operations['postLogin']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/logout': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        post: operations['postLogout']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/verify': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get: operations['getVerify']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/characters': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get: operations['getCharacters']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/character': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put: operations['putCharacter']
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
}
export type webhooks = Record<string, never>
export interface components {
    schemas: never
    responses: never
    parameters: never
    requestBodies: never
    headers: never
    pathItems: never
}
export type $defs = Record<string, never>
export interface operations {
    postSignup: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': {
                    /** Format: email */
                    email: string
                    username: string
                    password: string
                }
                'multipart/form-data': {
                    /** Format: email */
                    email: string
                    username: string
                    password: string
                }
                'text/plain': {
                    /** Format: email */
                    email: string
                    username: string
                    password: string
                }
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': {
                        token: string
                    }
                    'multipart/form-data': {
                        token: string
                    }
                    'text/plain': {
                        token: string
                    }
                }
            }
        }
    }
    postLogin: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': {
                    username: string
                    password: string
                }
                'multipart/form-data': {
                    username: string
                    password: string
                }
                'text/plain': {
                    username: string
                    password: string
                }
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': {
                        token: string
                    }
                    'multipart/form-data': {
                        token: string
                    }
                    'text/plain': {
                        token: string
                    }
                }
            }
        }
    }
    postLogout: {
        parameters: {
            query?: never
            header: {
                authorization: string
            }
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content?: never
            }
        }
    }
    getVerify: {
        parameters: {
            query?: never
            header: {
                authorization: string
            }
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content?: never
            }
        }
    }
    getCharacters: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content?: never
            }
        }
    }
    putCharacter: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': {
                    name: string
                }
                'multipart/form-data': {
                    name: string
                }
                'text/plain': {
                    name: string
                }
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content?: never
            }
        }
    }
}
