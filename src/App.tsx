import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import FileList from './pages/FileList'
import FileListAdvanced from './pages/FileListAdvanced'
import FileCopy from './pages/FileCopy'
import NotFound from './pages/NotFound'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Navigation isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <main className={`flex-1 transition-all duration-300 ${
        sidebarOpen ? 'ml-64' : 'ml-20'
      }`}>
        <div className="p-8 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/files" element={<FileList />} />
            <Route path="/files-advanced" element={<FileListAdvanced />} />
            <Route path="/file-copy" element={<FileCopy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App