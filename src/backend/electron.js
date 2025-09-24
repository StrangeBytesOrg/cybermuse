import {app, shell, BrowserWindow, nativeImage} from 'electron'
import path from 'node:path'

// app.disableHardwareAcceleration() // Fixes an issue on some Linux systems.
const lock = app.requestSingleInstanceLock()
if (!lock) {
    console.error('Another instance is already running')
    app.quit()
    process.exit(0)
}

app.on('ready', () => {
    const iconPath = path.join(app.getAppPath(), 'build', 'icon.png')
    const icon = nativeImage.createFromPath(iconPath)
    const win = new BrowserWindow({
        width: 800,
        height: 800,
        webPreferences: {},
        icon,
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
    }

    win.loadFile('./index.html')
})
