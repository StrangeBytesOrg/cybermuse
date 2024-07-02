import path from 'node:path'
import {app, shell, BrowserWindow} from 'electron'
import './logging.js'
import './server.js'

// import sourcemapSupport from 'source-map-support'
// sourcemapSupport.install()

app.disableHardwareAcceleration()
const lock = app.requestSingleInstanceLock()

if (!lock) {
    console.log('Another instance is already running')
}

app.on('ready', () => {
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

    if (process.env.DEV) {
        win.webContents.openDevTools({
            mode: 'bottom',
        })
        win.loadURL('http://localhost:5173')
    } else {
        win.loadFile(path.resolve(import.meta.dirname, '../index.html'))
    }
})
