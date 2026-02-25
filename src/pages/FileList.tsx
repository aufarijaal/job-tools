import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, Copy, Folder, FileText } from 'lucide-react'

interface FileDetail {
  name: string
  path: string
  type: 'file' | 'directory'
  size: number
  modified: string
}

type CopyFormat = 'numbered' | 'nameOnly' | 'fullPath'

function FileList() {
  const [folderPath, setFolderPath] = useState('')
  const [files, setFiles] = useState<FileDetail[]>([])
  const [recursiveSearch, setRecursiveSearch] = useState(false)
  const [copyFormat, setCopyFormat] = useState<CopyFormat>('numbered')
  const [loading, setLoading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const formatFilesForCopy = (list: FileDetail[]) => {
    if (copyFormat === 'nameOnly') {
      return list.map((file) => file.name).join('\n')
    }

    if (copyFormat === 'fullPath') {
      return list.map((file) => file.path).join('\n')
    }

    return list
      .map((file, index) => `${index + 1}. [${file.type.toUpperCase()}] ${file.name}`)
      .join('\n')
  }

  const handleListFiles = async () => {
    if (!folderPath.trim()) {
      toast.error('Please enter a folder path')
      return
    }

    setLoading(true)
    setFiles([])

    try {
      const result = await window.ipcRenderer.invoke('list', {
        folderPath: folderPath.trim(),
        recursive: recursiveSearch,
      })
      
      if (result.error) {
        toast.error(result.error)
      } else if (result.success && result.files) {
        setFiles(result.files)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyList = async () => {
    try {
      const fileListText = formatFilesForCopy(files)
      
      await navigator.clipboard.writeText(fileListText)
      toast.success('File list copied to clipboard')
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">File Lister</h1>
      <p className="text-lg mb-6">
        Enter a folder path to list its contents. You can copy the list to your clipboard.
      </p>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Folder Path:</label>
          <input
            type="text"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            placeholder="e.g., C:\\Users\\YourName\\Documents or /home/user/documents"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <label className="flex items-center gap-2 mb-4 text-xs">
          <input
            type="checkbox"
            checked={recursiveSearch}
            onChange={(e) => setRecursiveSearch(e.target.checked)}
            className="h-4 w-4"
          />
          <div>Search deeper into subfolders (recursive)</div>
        </label>

        <button
          onClick={handleListFiles}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'List Files'}
        </button>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Files Found ({files.length})</h2>
            <button
              onClick={handleCopyList}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
            >
              {copySuccess ? <Check size={16} /> : <Copy size={16} />}
              {copySuccess ? 'Copied!' : 'Copy List'}
            </button>
          </div>
          <div className="mb-3">
            <div className="text-sm font-medium mb-2">Copy Format:</div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="file-lister-copy-format"
                  value="numbered"
                  checked={copyFormat === 'numbered'}
                  onChange={(e) => setCopyFormat(e.target.value as CopyFormat)}
                  className="h-4 w-4"
                />
                Numbered + type + name
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="file-lister-copy-format"
                  value="nameOnly"
                  checked={copyFormat === 'nameOnly'}
                  onChange={(e) => setCopyFormat(e.target.value as CopyFormat)}
                  className="h-4 w-4"
                />
                Name only
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="file-lister-copy-format"
                  value="fullPath"
                  checked={copyFormat === 'fullPath'}
                  onChange={(e) => setCopyFormat(e.target.value as CopyFormat)}
                  className="h-4 w-4"
                />
                Full path
              </label>
            </div>
          </div>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="px-3 py-2 bg-gray-50 rounded hover:bg-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-1 bg-gray-200 rounded">
                    <span className="inline-flex items-center gap-1">
                      {file.type === 'directory' ? <Folder size={12} /> : <FileText size={12} />}
                      {file.type === 'directory' ? 'DIR' : 'FILE'}
                    </span>
                  </span>
                  <span>{file.name}</span>
                </div>
                {file.type === 'file' && (
                  <span className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <Link to="/" className="text-blue-500 hover:underline">Back to Home</Link>
      </div>
    </div>
  )
}

export default FileList
