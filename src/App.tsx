import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { FullscreenContext } from './context/fullscreen'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import FileList from './pages/FileList'
import FileListAdvanced from './pages/FileListAdvanced'
import FileCopy from './pages/FileCopy'
import MultiFileCopy from './pages/MultiFileCopy'
import PowerfulTextEditor from './pages/PowerfulTextEditor'
import TodoList from './pages/TodoList'
import Help from './pages/Help'
import NotFound from './pages/NotFound'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false)

  return (
    <FullscreenContext.Provider value={{ isEditorFullscreen, setIsEditorFullscreen }}>
      <div className="min-h-screen bg-gray-100 flex">
        {!isEditorFullscreen && (
          <Navigation isOpen={sidebarOpen} onToggle={setSidebarOpen} />
        )}
        <main
          className={
            isEditorFullscreen
              ? 'flex-1 flex flex-col'
              : `flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`
          }
        >
          <div className={isEditorFullscreen ? 'flex-1 flex flex-col' : 'p-8 max-w-7xl mx-auto'}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/files" element={<FileList />} />
              <Route path="/files-advanced" element={<FileListAdvanced />} />
              <Route path="/file-copy" element={<FileCopy />} />
              <Route path="/copy-files" element={<MultiFileCopy />} />
              <Route path="/text-editor" element={<PowerfulTextEditor />} />
              <Route path="/todo" element={<TodoList />} />
              <Route path="/help" element={<Help />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
    </FullscreenContext.Provider>
  )
}

export default App