// import pino from 'pino'

// const transport = pino.transport({
//     targets: [
//         {
//             level: 'trace',
//             target: 'pino/file',
//             options: {
//                 destination: './app.log',
//             },
//         },
//         {
//             level: 'trace',
//             target: 'pino-pretty',
//             options: {},
//         },
//     ],
// })
// export const logger = pino.pino({}, transport)
// process.stdout.write = logger.info.bind(logger)
// process.stderr.write = logger.error.bind(logger)

import fs from 'node:fs'
const outLogFile = fs.createWriteStream('./out.log', {flags: 'a'})
const errLogFile = fs.createWriteStream('./err.log', {flags: 'a'})
process.stdout.write = outLogFile.write.bind(outLogFile)
process.stderr.write = errLogFile.write.bind(errLogFile)
