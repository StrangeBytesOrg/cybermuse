import fs from 'node:fs'
import path from 'node:path'
import envPaths from 'env-paths'
import {Logger} from 'tslog'
import {createStream} from 'rotating-file-stream'
import {env} from './env.js'

const paths = envPaths('cybermuse-desktop', {suffix: ''})
if (!fs.existsSync(paths.log)) {
    console.log(`Creating log directory at ${paths.log}`)
    fs.mkdirSync(paths.log)
}

const logStream = createStream(path.resolve(paths.log, 'out.log'), {
    size: '5M',
})
export const logger = new Logger({
    type: env.DEV ? 'pretty' : 'json',
    prettyLogTemplate: '{{logLevelName}} {{fileNameWithLine}} \t',
})
logger.attachTransport((logObject) => {
    logStream.write(JSON.stringify(logObject) + '\n')
})
