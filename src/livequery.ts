import {liveQuery, type Subscription} from 'dexie'
import {shallowRef, getCurrentScope, onScopeDispose, watch, type ShallowRef, type WatchOptions} from 'vue'

type Value<T, I> = I extends undefined ? T | undefined : T | I

type UseDexieLiveQueryWithDepsOptions<I, Immediate> = {
    onError?: (error: any) => void
    initialValue?: I
} & WatchOptions<Immediate>

type UseDexieLiveQueryOptions<I> = {
    onError?: (error: any) => void
    initialValue?: I
}

function tryOnScopeDispose(fn: () => void) {
    if (getCurrentScope()) onScopeDispose(fn)
}

export function useDexieLiveQueryWithDeps<T, I = undefined, Immediate extends Readonly<boolean> = true>(
    deps: any,
    querier: (...data: any) => T | Promise<T>,
    options: UseDexieLiveQueryWithDepsOptions<I, Immediate> = {},
): ShallowRef<Value<T, I>> {
    const {onError, initialValue, ...rest} = options

    const value = shallowRef<T | I | undefined>(initialValue)

    let subscription: Subscription | undefined = undefined

    function start(...data: any) {
        subscription?.unsubscribe()

        const observable = liveQuery(() => querier(...data))

        subscription = observable.subscribe({
            next: (result) => {
                value.value = result
            },
            error: (error) => {
                onError?.(error)
            },
        })
    }

    function cleanup() {
        subscription?.unsubscribe()

        // Set to undefined to avoid calling unsubscribe multiple times on a same subscription
        subscription = undefined
    }

    watch(deps, start, {immediate: true, ...rest})

    tryOnScopeDispose(() => {
        cleanup()
    })

    return value as ShallowRef<Value<T, I>>
}

export function useDexieLiveQuery<T, I = undefined>(
    querier: () => T | Promise<T>,
    options: UseDexieLiveQueryOptions<I> = {},
): ShallowRef<Value<T, I>> {
    const {onError, initialValue} = options

    const value = shallowRef<T | I | undefined>(initialValue)

    let subscription: Subscription | undefined = undefined

    function start() {
        subscription?.unsubscribe()

        const observable = liveQuery(querier)

        subscription = observable.subscribe({
            next: (result) => {
                value.value = result
            },
            error: (error) => {
                onError?.(error)
            },
        })
    }

    function cleanup() {
        subscription?.unsubscribe()

        // Set to undefined to avoid calling unsubscribe multiple times on a same subscription
        subscription = undefined
    }

    start()

    tryOnScopeDispose(() => {
        cleanup()
    })

    return value as ShallowRef<Value<T, I>>
}

/* License for this code snippet:
MIT License

Copyright (c) 2023 Weiss

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
