import fs from 'node:fs'
import path from 'node:path'
import envPaths from 'env-paths'
import {Logger} from 'tslog'
import {createStream} from 'rotating-file-stream'

const paths = envPaths('cybermuse-desktop', {suffix: ''})
if (!fs.existsSync(paths.log)) {
    console.log(`Creating log directory at ${paths.log}`)
    fs.mkdirSync(paths.log)
}

const logStream = createStream(path.resolve(paths.log, 'out.log'), {
    size: '5M',
})
export const logger = new Logger({
    type: process.env.DEV ? 'pretty' : 'json',
})
logger.attachTransport((logObject) => {
    logStream.write(JSON.stringify(logObject) + '\n')
})
