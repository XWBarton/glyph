import { app, BrowserWindow, shell, nativeImage } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc'
import { buildMenu } from './menu'

let mainWindow: BrowserWindow | null = null
let pendingOpenPath: string | null = null

// macOS fires this before app is ready when launched via "Open With" / double-click
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('file:open-path', filePath)
  } else {
    pendingOpenPath = filePath
  }
})

function createWindow(): void {
  const isMac = process.platform === 'darwin'

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    // macOS: hide titlebar and inset traffic lights into the toolbar area
    // Windows/Linux: hidden titlebar so our custom toolbar is flush to the top
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    // macOS native frosted glass — ignored on other platforms
    ...(isMac && {
      vibrancy: 'under-window',
      visualEffectState: 'active',
      transparent: true,
      backgroundColor: '#00000000'
    }),
    // Windows/Linux: solid light background (glass effect via CSS still works)
    ...(!isMac && {
      backgroundColor: '#f0f4ff'
    }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.webContents.once('did-finish-load', () => {
    if (pendingOpenPath) {
      mainWindow!.webContents.send('file:open-path', pendingOpenPath)
      pendingOpenPath = null
    }
  })
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    // PNG is more reliably loaded by nativeImage than ICNS in dev mode.
    // Try multiple base paths since app.getAppPath() and __dirname may differ
    // depending on how electron-vite launches the process.
    const bases = [
      app.getAppPath(),
      join(__dirname, '..', '..'),
    ]
    const names = ['resources/icon.png', 'resources/icon.icns']
    outer: for (const base of bases) {
      for (const name of names) {
        const icon = nativeImage.createFromPath(join(base, name))
        if (!icon.isEmpty()) { app.dock.setIcon(icon); break outer }
      }
    }
  }

  registerIpcHandlers()
  createWindow()
  buildMenu(mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
      buildMenu(mainWindow)
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}
