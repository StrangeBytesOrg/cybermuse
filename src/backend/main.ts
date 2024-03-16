import path from 'node:path'
import url from 'node:url'
import {app, BrowserWindow} from 'electron'

// import sourceMapSupport from 'source-map-support'

// Works like __dirname
const esmDirname = url.fileURLToPath(new URL('.', import.meta.url))

// sourceMapSupport.install()

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            // nodeIntegration: false,
            // contextIsolation: false,
        },
    })

    win.setMenu(null)

    win.loadFile(path.resolve(esmDirname, '../index.html'))
}

app.on('ready', createWindow)
