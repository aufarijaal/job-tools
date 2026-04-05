import { Routes, Route, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FullscreenContext } from './context/fullscreen'
import Home from './pages/Home'
import FileList from './pages/FileList'
import FileListAdvanced from './pages/FileListAdvanced'
import FileCopy from './pages/FileCopy'
import MultiFileCopy from './pages/MultiFileCopy'
import PowerfulTextEditor from './pages/PowerfulTextEditor'
import TodoList from './pages/TodoList'
import SizeLabelCardMaker from './pages/SizeLabelCardMaker'
import Help from './pages/Help'
import NotFound from './pages/NotFound'

function App() {
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (_: Electron.IpcRendererEvent, path: string) => navigate(path)
    window.ipcRenderer.on('navigate', handler)
    return () => { window.ipcRenderer.off('navigate', handler) }
  }, [navigate])

  return (
    <FullscreenContext.Provider value={{ isEditorFullscreen, setIsEditorFullscreen }}>
      <div className={isEditorFullscreen ? 'flex-1 flex flex-col' : 'min-h-screen bg-gray-100'}>
        <div className={isEditorFullscreen ? 'flex-1 flex flex-col' : 'p-8 max-w-7xl mx-auto'}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/files" element={<FileList />} />
            <Route path="/files-advanced" element={<FileListAdvanced />} />
            <Route path="/file-copy" element={<FileCopy />} />
            <Route path="/copy-files" element={<MultiFileCopy />} />
            <Route path="/text-editor" element={<PowerfulTextEditor />} />
            <Route path="/todo" element={<TodoList />} />
            <Route path="/size-label" element={<SizeLabelCardMaker />} />
            <Route path="/help" element={<Help />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </FullscreenContext.Provider>
  )
}

export default App