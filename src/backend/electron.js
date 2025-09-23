import {app, shell, BrowserWindow} from 'electron'

// import sourcemapSupport from 'source-map-support'
// sourcemapSupport.install()

// app.disableHardwareAcceleration()
const lock = app.requestSingleInstanceLock()
if (!lock) {
    console.log('Another instance is already running')
    app.quit()
    process.exit(0)
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
    }

    win.loadFile('./index.html')
})
