import path from 'node:path'
import url from 'node:url'
import {app, shell, BrowserWindow} from 'electron'
// import sourcemapSupport from 'source-map-support'
// sourcemapSupport.install()
import {server} from './server.js'
import {loadModel} from './generate.js'
import {getConfig} from './config.js'

const serverPort = 31700
const esmDirname = url.fileURLToPath(new URL('.', import.meta.url)) // Works like __dirname
process.env.CONFIG_PATH = path.resolve(app.getPath('userData'), 'config.json')

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 800,
        webPreferences: {},
    })

    win.setMenu(null)

    win.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url) // Open URL in user's browser.
        return {action: 'deny'} // Prevent the app from opening the URL.
    })

    if (app.isPackaged) {
        win.loadFile(path.resolve(esmDirname, '../index.html'))
    } else {
        win.webContents.openDevTools({
            mode: 'bottom', // 'undocked'
        })
        win.loadURL('http://localhost:5173')
    }
}

app.on('ready', createWindow)
const config = getConfig()
if (config.autoLoad && config.lastModel) {
    console.log('Auto Loading Last Model', config.lastModel)
    loadModel(config.lastModel)
}

server.listen({port: serverPort}, (error) => {
    if (error) {
        console.error(error)
    }
    console.log(`Server running on port ${serverPort}`)
})
