import { useState } from 'react'
import { toast } from 'sonner'
import {
  LoaderCircle,
  FolderSearch,
  FolderInput,
  CircleCheck,
  CircleX,
  CheckSquare,
  Square,
  FileText,
  FolderOpen,
  ChevronDown,
  ChevronUp,
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

interface CopyResult {
  success: boolean
  copied: Array<{ name: string; path: string }>
  failed: Array<{ name: string; reason: string }>
  copiedCount: number
  failedCount: number
  totalAttempted: number
  error?: string
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function MultiFileCopy() {
  const [fileNames, setFileNames] = useState('')
  const [searchPath, setSearchPath] = useState('')
  const [destinationPath, setDestinationPath] = useState('')
  const [recursive, setRecursive] = useState(false)
  const [createDestIfMissing, setCreateDestIfMissing] = useState(false)

  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())

  const [copying, setCopying] = useState(false)
  const [copyResult, setCopyResult] = useState<CopyResult | null>(null)
  const [showCopyDetails, setShowCopyDetails] = useState(false)

  const foundFiles = searchResult?.found ?? []
  const notFoundNames = searchResult?.notFound ?? []

  const handleSearch = async () => {
    const names = fileNames.trim()
    if (!names) {
      toast.error('Please enter at least one file name')
      return
    }
    if (!searchPath.trim()) {
      toast.error('Please enter the folder to search in')
      return
    }

    setSearching(true)
    setSearchResult(null)
    setSelectedPaths(new Set())
    setCopyResult(null)

    try {
      const nameList = names.split('\n').map((n) => n.trim()).filter(Boolean)
      const result: SearchResult = await window.ipcRenderer.invoke('search-files', {
        fileNames: nameList,
        searchPath: searchPath.trim(),
        recursive,
        searchMode: 'contains',
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        setSearchResult(result)
        // Pre-select all found files
        setSelectedPaths(new Set(result.found.map((f) => f.path)))
        if (result.foundCount === 0) {
          toast.info('No matching files were found.')
        } else {
          toast.success(`Found ${result.foundCount} file${result.foundCount !== 1 ? 's' : ''}.`)
        }
      }
    } catch {
      toast.error('Something went wrong while searching. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const toggleSelect = (filePath: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(filePath)) next.delete(filePath)
      else next.add(filePath)
      return next
    })
  }

  const selectAll = () => setSelectedPaths(new Set(foundFiles.map((f) => f.path)))
  const deselectAll = () => setSelectedPaths(new Set())

  const handleCopy = async () => {
    if (selectedPaths.size === 0) {
      toast.error('Please select at least one file to copy')
      return
    }
    if (!destinationPath.trim()) {
      toast.error('Please enter a destination folder')
      return
    }

    setCopying(true)
    setCopyResult(null)

    try {
      const result: CopyResult = await window.ipcRenderer.invoke('copy-files-to-destination', {
        filePaths: Array.from(selectedPaths),
        destinationPath: destinationPath.trim(),
        createDestinationIfMissing: createDestIfMissing,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        setCopyResult(result)
        setShowCopyDetails(true)
        if (result.copiedCount > 0) {
          toast.success(`${result.copiedCount} file${result.copiedCount !== 1 ? 's' : ''} copied successfully.`)
        }
        if (result.failedCount > 0) {
          toast.error(`${result.failedCount} file${result.failedCount !== 1 ? 's' : ''} could not be copied.`)
        }
      }
    } catch {
      toast.error('Something went wrong while copying. Please try again.')
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-4xl font-bold mb-4">Copy Files to a Folder</h1>
      <p className="text-lg mb-6 text-gray-600">
        Search for files by name, review what was found, choose which ones to keep, then copy them all to a folder of your choice.
      </p>

      {/* Step 1 – Search */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FolderSearch size={20} className="text-blue-500" />
          Step 1 — Find Files
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              File names to search for <span className="text-gray-400 font-normal">(one per line)</span>
            </label>
            <textarea
              value={fileNames}
              onChange={(e) => setFileNames(e.target.value)}
              rows={4}
              placeholder={"report.pdf\nbudget.xlsx\nphoto"}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Folder to search in</label>
            <input
              type="text"
              value={searchPath}
              onChange={(e) => setSearchPath(e.target.value)}
              placeholder="/home/user/documents"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Destination folder</label>
            <input
              type="text"
              value={destinationPath}
              onChange={(e) => setDestinationPath(e.target.value)}
              placeholder="/home/user/output"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mb-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={recursive}
              onChange={(e) => setRecursive(e.target.checked)}
              className="h-4 w-4"
            />
            Search inside sub-folders too
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={createDestIfMissing}
              onChange={(e) => setCreateDestIfMissing(e.target.checked)}
              className="h-4 w-4"
            />
            Create destination folder if it does not exist
          </label>
        </div>

        <button
          onClick={handleSearch}
          disabled={searching}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {searching ? <LoaderCircle size={16} className="animate-spin" /> : <FolderSearch size={16} />}
          {searching ? 'Searching…' : 'Find Files'}
        </button>
      </div>

      {/* Step 2 – Review & Select */}
      {searchResult && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
            <CheckSquare size={20} className="text-green-500" />
            Step 2 — Review & Choose
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {searchResult.foundCount} file{searchResult.foundCount !== 1 ? 's' : ''} found
            {searchResult.notFoundCount > 0 && `, ${searchResult.notFoundCount} not found`}.
            Select the ones you want to copy.
          </p>

          {foundFiles.length > 0 && (
            <>
              <div className="flex gap-3 mb-3">
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <CheckSquare size={14} /> Select all
                </button>
                <button
                  onClick={deselectAll}
                  className="text-sm text-gray-500 hover:underline flex items-center gap-1"
                >
                  <Square size={14} /> Deselect all
                </button>
                <span className="text-sm text-gray-400 ml-auto">{selectedPaths.size} of {foundFiles.length} chosen</span>
              </div>

              <div className="border rounded divide-y max-h-80 overflow-y-auto">
                {foundFiles.map((file) => {
                  const selected = selectedPaths.has(file.path)
                  return (
                    <label
                      key={file.path}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${selected ? 'bg-blue-50' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelect(file.path)}
                        className="mt-1 h-4 w-4 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {file.type === 'directory'
                            ? <FolderOpen size={15} className="text-yellow-500 flex-shrink-0" />
                            : <FileText size={15} className="text-blue-500 flex-shrink-0" />}
                          <span className="font-medium text-sm truncate">{file.name}</span>
                          <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{formatBytes(file.size)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 break-all">{file.path}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </>
          )}

          {notFoundNames.length > 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded p-3">
              <p className="text-sm font-medium text-amber-800 mb-1 flex items-center gap-1">
                <CircleX size={14} /> Not found ({notFoundNames.length}):
              </p>
              <ul className="text-sm text-amber-700 list-disc list-inside space-y-0.5">
                {notFoundNames.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Step 3 – Copy */}
      {searchResult && foundFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FolderInput size={20} className="text-indigo-500" />
            Step 3 — Copy to Destination
          </h2>

          <p className="text-sm text-gray-500 mb-4">
            {selectedPaths.size} file{selectedPaths.size !== 1 ? 's' : ''} selected will be copied to:{' '}
            <span className="font-mono text-gray-700">{destinationPath || '(no destination set)'}</span>
          </p>

          <button
            onClick={handleCopy}
            disabled={copying || selectedPaths.size === 0 || !destinationPath.trim()}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {copying ? <LoaderCircle size={16} className="animate-spin" /> : <FolderInput size={16} />}
            {copying ? 'Copying…' : `Copy ${selectedPaths.size} File${selectedPaths.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {/* Copy Result */}
      {copyResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={() => setShowCopyDetails((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {copyResult.failedCount === 0
                ? <CircleCheck size={20} className="text-green-500" />
                : <CircleX size={20} className="text-amber-500" />}
              Results
            </h2>
            {showCopyDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <div className="flex gap-6 mt-3 text-sm">
            <span className="flex items-center gap-1 text-green-700 font-medium">
              <CircleCheck size={14} /> {copyResult.copiedCount} copied
            </span>
            {copyResult.failedCount > 0 && (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <CircleX size={14} /> {copyResult.failedCount} failed
              </span>
            )}
          </div>

          {showCopyDetails && (
            <div className="mt-4 space-y-3">
              {copyResult.copied.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Successfully copied:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {copyResult.copied.map((f) => (
                      <li key={f.path} className="flex items-start gap-2">
                        <CircleCheck size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="break-all">{f.path}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {copyResult.failed.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-600 mb-1">Could not copy:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {copyResult.failed.map((f) => (
                      <li key={f.name} className="flex items-start gap-2">
                        <CircleX size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <span><span className="font-medium">{f.name}</span> — {f.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MultiFileCopy
