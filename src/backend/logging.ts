import fs from 'node:fs'
import path from 'node:path'
import {Logger} from 'tslog'
import {createStream} from 'rotating-file-stream'
import {paths} from './paths.js'

if (!fs.existsSync(paths.log)) {
    console.log(`Creating log directory at ${paths.log}`)
    fs.mkdirSync(paths.log)
}

console.log(`Logging to ${path.resolve(paths.log, 'out.log')}`)
const logStream = createStream(path.resolve(paths.log, 'out.log'), {
    size: '5M',
})
export const logger = new Logger({
    type: 'pretty',
    prettyLogTemplate: '{{logLevelName}} {{fileNameWithLine}} \t',
})
logger.attachTransport((logObject) => {
    logStream.write(JSON.stringify(logObject) + '\n')
})
