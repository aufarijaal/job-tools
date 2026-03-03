import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { update } from './update'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

app.setPath("userData", path.join(process.cwd(), "user-data"));

// ── SQLite – Todo DB ──────────────────────────────────────────────────────────
interface TodoRow {
  id: number
  text: string
  done: number
  created_at: string
  updated_at: string
}

const Database = require('better-sqlite3')
const dbDir = app.getPath('userData')
fs.mkdirSync(dbDir, { recursive: true })
const dbPath = path.join(dbDir, 'app.db')
const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    text       TEXT    NOT NULL,
    done       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL,
    updated_at TEXT    NOT NULL
  )
`)

// ── Todo IPC handlers ─────────────────────────────────────────────────────────
ipcMain.handle('todo:getAll', () => {
  try {
    const rows = db.prepare('SELECT * FROM todos ORDER BY created_at DESC').all() as TodoRow[]
    return { success: true, todos: rows.map(r => ({ ...r, done: Boolean(r.done) })) }
  } catch (err) {
    return { error: (err as Error).message }
  }
})

ipcMain.handle('todo:add', (_, text: string) => {
  try {
    const now = new Date().toISOString()
    const stmt = db.prepare('INSERT INTO todos (text, done, created_at, updated_at) VALUES (?, 0, ?, ?)')
    const info = stmt.run(text.trim(), now, now)
    return { success: true, id: info.lastInsertRowid }
  } catch (err) {
    return { error: (err as Error).message }
  }
})

ipcMain.handle('todo:toggle', (_, id: number) => {
  try {
    const row = db.prepare('SELECT done FROM todos WHERE id = ?').get(id) as TodoRow | undefined
    if (!row) return { error: 'Todo not found' }
    const newDone = row.done ? 0 : 1
    db.prepare('UPDATE todos SET done = ?, updated_at = ? WHERE id = ?').run(newDone, new Date().toISOString(), id)
    return { success: true, done: Boolean(newDone) }
  } catch (err) {
    return { error: (err as Error).message }
  }
})

ipcMain.handle('todo:update', (_, id: number, text: string) => {
  try {
    db.prepare('UPDATE todos SET text = ?, updated_at = ? WHERE id = ?').run(text.trim(), new Date().toISOString(), id)
    return { success: true }
  } catch (err) {
    return { error: (err as Error).message }
  }
})

ipcMain.handle('todo:delete', (_, id: number) => {
  try {
    db.prepare('DELETE FROM todos WHERE id = ?').run(id)
    return { success: true }
  } catch (err) {
    return { error: (err as Error).message }
  }
})

ipcMain.handle('todo:clearDone', () => {
  try {
    const info = db.prepare('DELETE FROM todos WHERE done = 1').run()
    return { success: true, deleted: info.changes }
  } catch (err) {
    return { error: (err as Error).message }
  }
})
// ─────────────────────────────────────────────────────────────────────────────

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    // win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  win.menuBarVisible = false

  // Auto update
  update(win)
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

function getDirectoryEntries(folderPath: string, recursive: boolean) {
  const entries: Array<{ fullPath: string; relativePath: string; stats: fs.Stats }> = []

  if (!recursive) {
    const files = fs.readdirSync(folderPath)
    files.forEach((file) => {
      const fullPath = path.join(folderPath, file)
      const stats = fs.statSync(fullPath)
      entries.push({
        fullPath,
        relativePath: file,
        stats,
      })
    })
    return entries
  }

  const walk = (currentPath: string) => {
    const currentEntries = fs.readdirSync(currentPath)
    currentEntries.forEach((entryName) => {
      const entryPath = path.join(currentPath, entryName)
      const stats = fs.statSync(entryPath)
      const relativePath = path.relative(folderPath, entryPath)

      entries.push({
        fullPath: entryPath,
        relativePath,
        stats,
      })

      if (stats.isDirectory()) {
        walk(entryPath)
      }
    })
  }

  walk(folderPath)
  return entries
}

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

// List files in a folder
ipcMain.handle('list', (_, payload) => {
  try {
    const folderPath = typeof payload === 'string' ? payload : payload?.folderPath
    const recursive = Boolean(typeof payload === 'object' && payload?.recursive)

    if (!folderPath) {
      console.error('No folder path provided')
      return { error: 'No folder path provided' }
    }

    // Check if the path exists and is a directory
    if (!fs.existsSync(folderPath)) {
      console.error(`Path does not exist: ${folderPath}`)
      return { error: 'Path does not exist' }
    }

    const stats = fs.statSync(folderPath)
    if (!stats.isDirectory()) {
      console.error(`Path is not a directory: ${folderPath}`)
      return { error: 'Path is not a directory' }
    }

    const entries = getDirectoryEntries(folderPath, recursive)

    const fileDetails = entries.map(({ fullPath, relativePath, stats }) => {
      return {
        name: relativePath,
        path: fullPath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime
      }
    })
    
    return { success: true, files: fileDetails }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error listing files:', error)
    return { error: errorMessage }
  }
})

// Search for specific files in a directory
ipcMain.handle('search-files', (_, payload) => {
  try {
    const fileNames = payload?.fileNames
    const searchPath = payload?.searchPath
    const recursive = Boolean(payload?.recursive)
    const rawSearchMode = payload?.searchMode
    const searchMode: 'contains' | 'startsWith' | 'endsWith' =
      rawSearchMode === 'startsWith' || rawSearchMode === 'endsWith' || rawSearchMode === 'contains'
        ? rawSearchMode
        : 'contains'

    if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
      return { error: 'No file names provided' }
    }

    if (!searchPath) {
      return { error: 'No search path provided' }
    }

    if (!fs.existsSync(searchPath)) {
      return { error: 'Search path does not exist' }
    }

    const stats = fs.statSync(searchPath)
    if (!stats.isDirectory()) {
      return { error: 'Search path is not a directory' }
    }

    const found: Array<{ name: string; path: string; size: number; type: string; matchedSearch: string }> = []
    const notFound: string[] = []

    const entries = getDirectoryEntries(searchPath, recursive).map(({ fullPath, relativePath, stats }) => ({
      fullPath,
      relativePath,
      name: path.basename(relativePath),
      stats,
    }))

    const matchByMode = (target: string, query: string) => {
      if (searchMode === 'startsWith') {
        return target.startsWith(query)
      }

      if (searchMode === 'endsWith') {
        return target.endsWith(query)
      }

      return target.includes(query)
    }

    // Search for each file
    fileNames.forEach(fileName => {
      const trimmedName = fileName.trim()
      if (!trimmedName) return

      const fullPath = path.join(searchPath, trimmedName)
      let foundMatch = false
      
      // First, try exact match
      if (fs.existsSync(fullPath)) {
        const fileStats = fs.statSync(fullPath)
        found.push({
          name: path.relative(searchPath, fullPath),
          path: fullPath,
          size: fileStats.size,
          type: fileStats.isDirectory() ? 'directory' : 'file',
          matchedSearch: trimmedName
        })
        foundMatch = true
      } else {
        // If no exact match, search for files with the same base name (without extension)
        const searchNameLower = trimmedName.toLowerCase()
        const matches = entries.filter(entry => {
          const fileNameWithoutExt = path.parse(entry.name).name.toLowerCase()
          const fileLower = entry.name.toLowerCase()

          return (
            matchByMode(fileNameWithoutExt, searchNameLower) ||
            matchByMode(fileLower, searchNameLower)
          )
        })

        if (matches.length > 0) {
          matches.forEach(matched => {
            found.push({
              name: matched.relativePath,
              path: matched.fullPath,
              size: matched.stats.size,
              type: matched.stats.isDirectory() ? 'directory' : 'file',
              matchedSearch: trimmedName
            })
          })
          foundMatch = true
        }
      }

      if (!foundMatch) {
        notFound.push(trimmedName)
      }
    })

    return {
      success: true,
      found,
      notFound,
      foundCount: found.length,
      notFoundCount: notFound.length,
      totalSearched: fileNames.filter(n => n.trim()).length
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { error: errorMessage }
  }
})

// Open files with default application
ipcMain.handle('open-files', async (_, payload) => {
  try {
    const filePaths = Array.isArray(payload) ? payload : payload?.filePaths
    const maxOpenCount = typeof payload?.maxOpenCount === 'number' ? payload.maxOpenCount : undefined

    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      return { error: 'No file paths provided' }
    }

    if (maxOpenCount && filePaths.length > maxOpenCount) {
      return {
        error: `You can only open up to ${maxOpenCount} files at once. Opening too many files may slow down or hang your PC.`,
      }
    }

    const results = {
      opened: [] as string[],
      failed: [] as { path: string; reason: string }[]
    }

    for (const filePath of filePaths) {
      try {
        if (!fs.existsSync(filePath)) {
          results.failed.push({ path: filePath, reason: 'File not found' })
          continue
        }

        // Open file with default application
        const openError = await shell.openPath(filePath)
        if (openError) {
          results.failed.push({ path: filePath, reason: openError })
          continue
        }

        results.opened.push(filePath)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        results.failed.push({ path: filePath, reason: errorMessage })
      }
    }

    return {
      success: results.opened.length > 0,
      opened: results.opened,
      failed: results.failed,
      openedCount: results.opened.length,
      failedCount: results.failed.length
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { error: errorMessage }
  }
})

// Copy file to multiple destinations with prefix/suffix
ipcMain.handle('copy-file-multiple', (_, { sourcePath, outputNames, outputPath, prefix = '', suffix = '', createOutputPathIfMissing = false }) => {
  try {
    if (!sourcePath) {
      return { error: 'No source file path provided' }
    }

    if (!fs.existsSync(sourcePath)) {
      return { error: 'Source file does not exist' }
    }

    const sourceStats = fs.statSync(sourcePath)
    if (!sourceStats.isFile()) {
      return { error: 'Source path is not a file' }
    }

    if (!outputPath) {
      return { error: 'No output path provided' }
    }

    if (!fs.existsSync(outputPath)) {
      if (createOutputPathIfMissing) {
        fs.mkdirSync(outputPath, { recursive: true })
      } else {
        return { error: 'Output path does not exist' }
      }
    }

    if (!fs.statSync(outputPath).isDirectory()) {
      return { error: 'Output path is not a directory' }
    }

    if (!outputNames || !Array.isArray(outputNames) || outputNames.length === 0) {
      return { error: 'No output file names provided' }
    }

    const results = {
      copied: [] as { name: string; path: string }[],
      failed: [] as { name: string; reason: string }[]
    }

    // Get file extension
    const sourceExtension = path.extname(sourcePath)
    const sourceBaseName = path.basename(sourcePath, sourceExtension)

    outputNames.forEach(fileName => {
      try {
        const trimmedName = fileName.trim()
        if (!trimmedName) return

        // Build the output file name with prefix and suffix
        let outputFileName = `${prefix}${trimmedName}${suffix}${sourceExtension}`
        
        const destinationPath = path.join(outputPath, outputFileName)

        // Copy the file
        fs.copyFileSync(sourcePath, destinationPath)

        results.copied.push({
          name: outputFileName,
          path: destinationPath
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        results.failed.push({
          name: fileName.trim(),
          reason: errorMessage
        })
      }
    })

    return {
      success: results.copied.length > 0,
      copied: results.copied,
      failed: results.failed,
      copiedCount: results.copied.length,
      failedCount: results.failed.length,
      totalAttempted: outputNames.filter(n => n.trim()).length
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { error: errorMessage }
  }
})

