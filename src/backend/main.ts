import path from 'node:path'
import url from 'node:url'
import {app, shell, BrowserWindow} from 'electron'
import sourcemapSupport from 'source-map-support'
import {server} from './server.js'

sourcemapSupport.install()

const serverPort = 31700
const esmDirname = url.fileURLToPath(new URL('.', import.meta.url)) // Works like __dirname

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

server.listen({port: serverPort}, (error) => {
    if (error) {
        console.error(error)
    }
    console.log(`Server running on port ${serverPort}`)
})
