import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  Copy,
  Folder,
  FileText,
  SearchCheck,
  SearchX,
  LoaderCircle,
  FolderOpen,
  Lightbulb,
} from 'lucide-react'

interface FoundFile {
  name: string
  path: string
  size: number
  type: string
  matchedSearch: string
}

interface SearchResult {
  success: boolean
  found: FoundFile[]
  notFound: string[]
  foundCount: number
  notFoundCount: number
  totalSearched: number
  error?: string
}

function FileListAdvanced() {
  const [fileNames, setFileNames] = useState('')
  const [searchPath, setSearchPath] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [openingFiles, setOpeningFiles] = useState(false)
  const [copySuccess, setCopySuccess] = useState<'found' | 'notfound' | 'all' | null>(null)

  const handleSearch = async () => {
    if (!fileNames.trim()) {
      setError('Please enter file names')
      return
    }

    if (!searchPath.trim()) {
      setError('Please enter a search path')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const fileList = fileNames.split('\n').filter(name => name.trim())
      
      const searchResult = await window.ipcRenderer.invoke('search-files', {
        fileNames: fileList,
        searchPath: searchPath.trim()
      })

      if (searchResult.error) {
        setError(searchResult.error)
      } else {
        setResult(searchResult)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (type: 'found' | 'notfound' | 'all') => {
    if (!result) return

    try {
      let text = ''

      if (type === 'found' || type === 'all') {
        text += `=== FOUND FILES (${result.foundCount}) ===\n`
        result.found.forEach((file, index) => {
          text += `${index + 1}. [${file.type.toUpperCase()}] ${file.name}\n`
        })
      }

      if (type === 'all' && result.notFound.length > 0) {
        text += '\n'
      }

      if (type === 'notfound' || type === 'all') {
        text += `=== NOT FOUND FILES (${result.notFoundCount}) ===\n`
        result.notFound.forEach((file, index) => {
          text += `${index + 1}. ${file}\n`
        })
      }

      await navigator.clipboard.writeText(text)
      setCopySuccess(type)
      setTimeout(() => setCopySuccess(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      setError('Failed to copy to clipboard')
    }
  }

  const handleOpenFiles = async () => {
    if (!result || result.found.length === 0) return

    setOpeningFiles(true)
    try {
      const filePaths = result.found.map(file => file.path)
      const openResult = await window.ipcRenderer.invoke('open-files', filePaths)

      if (openResult.success) {
        setError(`Successfully opened ${openResult.openedCount} file(s)${openResult.failedCount > 0 ? `. Failed to open ${openResult.failedCount}` : ''}`)
      } else if (openResult.error) {
        setError(`Error: ${openResult.error}`)
      } else if (openResult.failedCount > 0) {
        setError(`Failed to open ${openResult.failedCount} file(s): ${openResult.failed.map((f: {path: string; reason: string}) => f.reason).join(', ')}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(`Error opening files: ${errorMessage}`)
    } finally {
      setOpeningFiles(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-4xl font-bold mb-4">File List Advanced</h1>
      <p className="text-lg mb-6">
        Enter file names (one per line) and specify a directory to search for them.
        <br />
        <span className="text-sm text-gray-600 inline-flex items-center gap-1">
          <Lightbulb size={14} />
          Tip: You can search without file extensions (e.g., "document" will find "document.txt", "document.pdf", etc.)
        </span>
      </p>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">File Names (one per line):</label>
          <textarea
            value={fileNames}
            onChange={(e) => setFileNames(e.target.value)}
            placeholder="example (will find example.txt, example.pdf, etc.)&#10;document&#10;image&#10;folder-name"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            rows={8}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Search Directory:</label>
          <input
            type="text"
            value={searchPath}
            onChange={(e) => setSearchPath(e.target.value)}
            placeholder="e.g., C:\\Users\\YourName\\Documents or /home/user/documents"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search Files'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Search Summary</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm text-gray-600">Total Searched</div>
                <div className="text-3xl font-bold text-blue-600">{result.totalSearched}</div>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <div className="text-sm text-gray-600">Found</div>
                <div className="text-3xl font-bold text-green-600">{result.foundCount}</div>
              </div>
              <div className="bg-red-50 p-4 rounded">
                <div className="text-sm text-gray-600">Not Found</div>
                <div className="text-3xl font-bold text-red-600">{result.notFoundCount}</div>
              </div>
            </div>
          </div>

          {/* Found Files */}
          {result.found.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-green-700">
                  <span className="inline-flex items-center gap-2">
                    <SearchCheck size={20} />
                    Found Files ({result.foundCount})
                  </span>
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy('found')}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
                  >
                    {copySuccess === 'found' ? <Check size={16} /> : <Copy size={16} />}
                    {copySuccess === 'found' ? 'Copied!' : 'Copy Found'}
                  </button>
                  <button
                    onClick={handleOpenFiles}
                    disabled={openingFiles}
                    className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {openingFiles ? <LoaderCircle size={16} className="animate-spin" /> : <FolderOpen size={16} />}
                    {openingFiles ? 'Opening...' : 'Open All Files'}
                  </button>
                </div>
              </div>
              <ul className="space-y-2">
                {result.found.map((file, index) => (
                  <li key={index} className="px-3 py-2 bg-green-50 rounded hover:bg-green-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-1 bg-green-200 rounded">
                        <span className="inline-flex items-center gap-1">
                          {file.type === 'directory' ? <Folder size={12} /> : <FileText size={12} />}
                          {file.type === 'directory' ? 'DIR' : 'FILE'}
                        </span>
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium">{file.name}</span>
                        {file.name.toLowerCase() !== file.matchedSearch.toLowerCase() && (
                          <span className="text-xs text-gray-500">
                            matched: "{file.matchedSearch}"
                          </span>
                        )}
                      </div>
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

          {/* Not Found Files */}
          {result.notFound.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-red-700">
                  <span className="inline-flex items-center gap-2">
                    <SearchX size={20} />
                    Not Found Files ({result.notFoundCount})
                  </span>
                </h2>
                <button
                  onClick={() => handleCopy('notfound')}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
                >
                  {copySuccess === 'notfound' ? <Check size={16} /> : <Copy size={16} />}
                  {copySuccess === 'notfound' ? 'Copied!' : 'Copy Not Found'}
                </button>
              </div>
              <ul className="space-y-2">
                {result.notFound.map((file, index) => (
                  <li key={index} className="px-3 py-2 bg-red-50 rounded hover:bg-red-100">
                    <span className="text-gray-700">{file}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Copy All Button */}
          <div className="bg-white rounded-lg shadow p-4">
            <button
              onClick={() => handleCopy('all')}
              className="bg-purple-500 text-white px-6 py-3 rounded hover:bg-purple-600 w-full flex items-center justify-center gap-2"
            >
              {copySuccess === 'all' ? <Check size={16} /> : <Copy size={16} />}
              {copySuccess === 'all' ? 'Copied!' : 'Copy Complete Report'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Link to="/" className="text-blue-500 hover:underline">Back to Home</Link>
      </div>
    </div>
  )
}

export default FileListAdvanced
