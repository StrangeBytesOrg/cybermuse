import path from 'node:path'
import {Logger} from 'tslog'
import {createStream} from 'rotating-file-stream'
import {paths} from './paths.js'

const logFile = path.resolve(paths.config, 'out.log')
console.log(`Logging to ${logFile}`)

const logStream = createStream(logFile, {
    size: '5M',
})
export const logger = new Logger({
    type: 'pretty',
    prettyLogTemplate: '{{logLevelName}} {{fileNameWithLine}} \t',
})
logger.attachTransport((logObject) => {
    logStream.write(JSON.stringify(logObject) + '\n')
})
