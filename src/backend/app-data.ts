import fs from 'node:fs'

let appDataPath: string
if (process.env.DATA_PATH) {
    appDataPath = process.env.DATA_PATH
} else if (process.platform === 'win32') {
    appDataPath = process.env.APPDATA + '/chat-frontend/'
} else if (process.platform === 'darwin') {
    appDataPath = process.env.HOME + '/Library/Preferences/chat-frontend/'
} else if (process.platform === 'linux') {
    appDataPath = process.env.HOME + '/.config/chat-frontend/'
} else {
    throw new Error('Unsupported platform')
}

// Create the app data directory if it doesn't exist
if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath, {recursive: true})
}

export default appDataPath
