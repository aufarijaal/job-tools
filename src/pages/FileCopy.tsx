import { useState, useRef } from 'react'
import Editor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

loader.config({ monaco })
import {
  Lightbulb,
  LoaderCircle,
  Play,
  Clock3,
  Settings,
  CircleCheck,
  CircleX,
  Trash2,
} from 'lucide-react'

interface CopyResult {
  success: boolean
  copied: Array<{ name: string; path: string }>
  failed: Array<{ name: string; reason: string }>
  copiedCount: number
  failedCount: number
  totalAttempted: number
  error?: string
}

interface CopyPlan {
  id: string
  sourcePath: string
  outputPath: string
  createOutputPathIfMissing: boolean
  prefix: string
  suffix: string
  outputNames: string[]
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: CopyResult
  error?: string
  createdAt: Date
  startTime?: Date
  endTime?: Date
}

interface ExecutionLog {
  id: string
  planId: string
  message: string
  type: 'info' | 'success' | 'error'
  timestamp: Date
}

function FileCopy() {
  const logEndRef = useRef<HTMLDivElement>(null)
  
  // Form state for creating new plans
  const [sourcePath, setSourcePath] = useState('')
  const [outputPath, setOutputPath] = useState('')
  const [outputNames, setOutputNames] = useState('')
  const [prefix, setPrefix] = useState('')
  const [suffix, setSuffix] = useState('')
  const [createOutputPathIfMissing, setCreateOutputPathIfMissing] = useState(false)
  
  // Queue state
  const [plans, setPlans] = useState<CopyPlan[]>([])
  const [logs, setLogs] = useState<ExecutionLog[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)

  const generateId = () => `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const addLog = (planId: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const log: ExecutionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      planId,
      message,
      type,
      timestamp: new Date()
    }
    setLogs(prev => [...prev, log])
    
    // Auto-scroll to latest log
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0)
  }

  const handleCreatePlan = () => {
    if (!sourcePath.trim()) {
      toast.error('Please enter source file path')
      return
    }
    if (!outputPath.trim()) {
      toast.error('Please enter output directory path')
      return
    }
    if (!outputNames.trim()) {
      toast.error('Please enter output file names')
      return
    }

    const fileList = outputNames.split('\n').filter(name => name.trim())
    const newPlan: CopyPlan = {
      id: generateId(),
      sourcePath: sourcePath.trim(),
      outputPath: outputPath.trim(),
      createOutputPathIfMissing,
      prefix: prefix.trim(),
      suffix: suffix.trim(),
      outputNames: fileList,
      status: 'pending',
      createdAt: new Date()
    }

    setPlans(prev => [...prev, newPlan])
    addLog(newPlan.id, `Plan created: Copy from ${sourcePath} to ${outputPath}`, 'info')
    
    // Reset form
    setSourcePath('')
    setOutputPath('')
    setOutputNames('')
    setPrefix('')
    setSuffix('')
    setCreateOutputPathIfMissing(false)
    toast.success('Copy plan added to queue')
  }

  const handleDeletePlan = (planId: string) => {
    setPlans(prev => prev.filter(p => p.id !== planId))
    setLogs(prev => prev.filter(l => l.planId !== planId))
  }

  const executePlan = async (plan: CopyPlan): Promise<void> => {
    return new Promise(async (resolve) => {
      try {
        setCurrentJobId(plan.id)
        setPlans(prev => prev.map(p => 
          p.id === plan.id ? { ...p, status: 'running', startTime: new Date() } : p
        ))
        addLog(plan.id, `Starting execution...`, 'info')

        const result = await window.ipcRenderer.invoke('copy-file-multiple', {
          sourcePath: plan.sourcePath,
          outputNames: plan.outputNames,
          outputPath: plan.outputPath,
          prefix: plan.prefix,
          suffix: plan.suffix,
          createOutputPathIfMissing: plan.createOutputPathIfMissing
        })

        if (result.error) {
          setPlans(prev => prev.map(p =>
            p.id === plan.id 
              ? { ...p, status: 'failed', error: result.error, endTime: new Date() }
              : p
          ))
          addLog(plan.id, `Error: ${result.error}`, 'error')
        } else {
          setPlans(prev => prev.map(p =>
            p.id === plan.id
              ? { 
                  ...p, 
                  status: 'completed',
                  result,
                  endTime: new Date()
                }
              : p
          ))
          addLog(
            plan.id,
            `Completed: ${result.copiedCount} file(s) copied${result.failedCount > 0 ? `, ${result.failedCount} failed` : ''}`,
            result.failedCount > 0 ? 'error' : 'success'
          )
          
          if (result.copiedCount > 0) {
            result.copied.forEach((file: { name: string; path: string }) => {
              addLog(plan.id, `Copied: ${file.name}`, 'success')
            })
          }
          
          if (result.failedCount > 0) {
            result.failed.forEach((file: { name: string; reason: string }) => {
              addLog(plan.id, `Failed: ${file.name} - ${file.reason}`, 'error')
            })
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setPlans(prev => prev.map(p =>
          p.id === plan.id
            ? { ...p, status: 'failed', error: errorMessage, endTime: new Date() }
            : p
        ))
        addLog(plan.id, `Error: ${errorMessage}`, 'error')
      } finally {
        setCurrentJobId(null)
        resolve()
      }
    })
  }

  const handleRunSinglePlan = async (plan: CopyPlan) => {
    if (isRunning) {
      toast.error('A job is already running. Please wait for it to complete.')
      return
    }
    setIsRunning(true)
    try {
      await executePlan(plan)
    } finally {
      setIsRunning(false)
    }
  }

  const handleRunAllPlans = async () => {
    if (isRunning) {
      toast.error('Jobs are already running.')
      return
    }
    
    const pendingPlans = plans.filter(p => p.status === 'pending')
    if (pendingPlans.length === 0) {
      toast.error('No pending plans to run.')
      return
    }

    setIsRunning(true)
    addLog('batch', `Starting batch execution of ${pendingPlans.length} plan(s)...`, 'info')
    
    try {
      for (const plan of pendingPlans) {
        await executePlan(plan)
      }
      addLog('batch', 'Batch execution completed', 'success')
      toast.success('Batch execution completed')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      addLog('batch', `Batch error: ${errorMessage}`, 'error')
      toast.error(`Batch error: ${errorMessage}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleClearCompleted = () => {
    setPlans(prev => prev.filter(p => p.status === 'pending' || p.status === 'running'))
  }

  const pendingCount = plans.filter(p => p.status === 'pending').length
  const completedCount = plans.filter(p => p.status === 'completed').length
  const failedCount = plans.filter(p => p.status === 'failed').length

  return (
    <div className="p-8 max-w-7xl">
      <h1 className="text-4xl font-bold mb-4">File Copy - Batch Job Queue</h1>
      <p className="text-lg mb-6">
        Create multiple copy plans and execute them sequentially. 
        <br />
        <span className="text-sm text-gray-600 inline-flex items-center gap-1">
          <Lightbulb size={14} />
          Build a queue of copy operations, then run them all at once with error handling
        </span>
      </p>

      {/* Create Plan Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Create New Copy Plan</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Source File Path:</label>
            <input
              type="text"
              value={sourcePath}
              onChange={(e) => setSourcePath(e.target.value)}
              placeholder="e.g., C:\\Documents\\template.xlsx"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Output Directory Path:</label>
            <input
              type="text"
              value={outputPath}
              onChange={(e) => setOutputPath(e.target.value)}
              placeholder="e.g., C:\\Documents\\output"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prefix (optional):</label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g., copy_"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Suffix (optional):</label>
            <input
              type="text"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              placeholder="e.g., _v2"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={createOutputPathIfMissing}
              onChange={(e) => setCreateOutputPathIfMissing(e.target.checked)}
              className="h-4 w-4"
            />
            Create output directory if it does not exist
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Output File Names (one per line):</label>
          <div className="border rounded overflow-hidden" style={{ height: '160px' }}>
            <Editor
              height="160px"
              language="plaintext"
              theme="dark"
              value={outputNames}
              onChange={(val) => setOutputNames(val ?? '')}
              options={{
                minimap: { enabled: false },
                lineNumbers: 'on',
                wordWrap: 'off',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                fontSize: 13,
                padding: { top: 6, bottom: 6 },
                overviewRulerLanes: 0,
                folding: false,
                lineDecorationsWidth: 20,
              }}
            />
          </div>
        </div>

        <button
          onClick={handleCreatePlan}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          + Add Plan to Queue
        </button>
      </div>

      {/* Queue Status */}
      {plans.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Job Queue</h2>
            <div className="flex gap-2">
              <button
                onClick={handleRunAllPlans}
                disabled={isRunning || pendingCount === 0}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 inline-flex items-center gap-2"
              >
                {isRunning ? <LoaderCircle size={16} className="animate-spin" /> : <Play size={16} />}
                {isRunning ? 'Running All...' : 'Run All'}
              </button>
              {completedCount > 0 && (
                <button
                  onClick={handleClearCompleted}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Clear Completed
                </button>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm text-gray-600">Total Plans</div>
              <div className="text-2xl font-bold text-blue-600">{plans.length}</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="text-sm text-gray-600">Completed</div>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="text-sm text-gray-600">Failed</div>
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            </div>
          </div>

          {/* Plans List */}
          <div className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.id} className="border rounded-lg overflow-hidden">
                {/* Plan Header */}
                <div className={`p-4 cursor-pointer ${
                  plan.status === 'pending' ? 'bg-yellow-50' :
                  plan.status === 'running' ? 'bg-blue-50' :
                  plan.status === 'completed' ? 'bg-green-50' :
                  'bg-red-50'
                }`}>
                  <div className="flex justify-between items-center">
                    <div 
                      className="flex-1"
                      onClick={() => setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {plan.status === 'pending' && <Clock3 size={20} />}
                          {plan.status === 'running' && <Settings size={20} className="animate-spin" />}
                          {plan.status === 'completed' && <CircleCheck size={20} />}
                          {plan.status === 'failed' && <CircleX size={20} />}
                        </span>
                        <div>
                          <p className="font-semibold">
                            {plan.outputNames.length} file(s) - {plan.sourcePath}
                          </p>
                          <p className="text-sm text-gray-600">
                            → {plan.outputPath} {plan.prefix && `| prefix: "${plan.prefix}"`} {plan.suffix && `| suffix: "${plan.suffix}"`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {plan.createOutputPathIfMissing
                              ? 'Will create output directory if missing'
                              : 'Will fail if output directory does not exist'}
                          </p>
                          {plan.startTime && (
                            <p className="text-xs text-gray-500">
                              {plan.endTime 
                                ? `Duration: ${((plan.endTime.getTime() - plan.startTime.getTime()) / 1000).toFixed(2)}s`
                                : 'Running...'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {plan.status === 'pending' && (
                        <button
                          onClick={() => handleRunSinglePlan(plan)}
                          disabled={isRunning}
                          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 disabled:bg-gray-400 text-sm inline-flex items-center gap-1"
                        >
                          <Play size={14} />
                          Run
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        disabled={isRunning && currentJobId === plan.id}
                        className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 disabled:bg-gray-400 text-sm inline-flex items-center"
                        aria-label="Delete plan"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Plan Details - Expandable */}
                {expandedPlanId === plan.id && (
                  <div className="p-4 bg-gray-50 border-t">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Source:</p>
                        <p className="font-mono text-sm">{plan.sourcePath}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Output:</p>
                        <p className="font-mono text-sm">{plan.outputPath}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Output Files:</p>
                      <div className="bg-white p-2 rounded border max-h-32 overflow-y-auto">
                        {plan.outputNames.map((name, idx) => (
                          <div key={idx} className="text-sm font-mono">
                            {plan.prefix}{name}{plan.suffix}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Results if completed */}
                    {plan.result && (
                      <div className="mt-4 border-t pt-4">
                        <p className="text-sm font-medium text-gray-600 mb-2">Result:</p>
                        {plan.result.copiedCount > 0 && (
                          <div className="bg-green-50 p-2 rounded mb-2">
                            <p className="text-sm text-green-700 inline-flex items-center gap-1"><CircleCheck size={14} />Successfully copied: {plan.result.copiedCount}</p>
                          </div>
                        )}
                        {plan.result.failedCount > 0 && (
                          <div className="bg-red-50 p-2 rounded">
                            <p className="text-sm text-red-700 inline-flex items-center gap-1"><CircleX size={14} />Failed: {plan.result.failedCount}</p>
                            {plan.result.failed.map((f, idx) => (
                              <p key={idx} className="text-xs text-red-600">{f.name}: {f.reason}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Logs */}
      {logs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Execution Logs</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm max-h-80 overflow-y-auto">
            {logs.map((log) => (
              <div 
                key={log.id}
                className={`py-1 ${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                  'text-gray-300'
                }`}
              >
                <span className="text-gray-500">[{log.timestamp.toLocaleTimeString()}]</span> {log.message}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {plans.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          <p className="text-lg">No copy plans yet. Create one above to get started!</p>
        </div>
      )}

      <div className="mt-6">
        <Link to="/" className="text-blue-500 hover:underline">Back to Home</Link>
      </div>
    </div>
  )
}

export default FileCopy
