import './logging.js'
import path from 'node:path'
import url from 'node:url'
import {app, shell, BrowserWindow, utilityProcess} from 'electron'
import './server.js'
// import sourcemapSupport from 'source-map-support'
// sourcemapSupport.install()

const esmDirname = url.fileURLToPath(new URL('.', import.meta.url)) // Works like __dirname

app.disableHardwareAcceleration()
const lock = app.requestSingleInstanceLock()

if (!lock) {
    console.log('Another instance is already running')
}

app.on('ready', () => {
    const server = utilityProcess.fork(path.resolve(esmDirname, './server.js'), [], {})
    server.on('exit', (code) => {
        console.log(`Server exited with code ${code}`)
    })
    server.on('spawn', () => {
        console.log('Server spawned')
    })

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
})
