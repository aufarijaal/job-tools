import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ListTodo,
  Eraser,
} from 'lucide-react'

interface Todo {
  id: number
  text: string
  done: boolean
  created_at: string
  updated_at: string
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')
  const addInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const ipc = (window as any).ipcRenderer

  async function loadTodos() {
    const result = await ipc.invoke('todo:getAll')
    if (result.error) {
      toast.error(`Failed to load todos: ${result.error}`)
    } else {
      setTodos(result.todos)
    }
    setLoading(false)
  }

  useEffect(() => { loadTodos() }, [])
  useEffect(() => { if (editingId !== null) editInputRef.current?.focus() }, [editingId])

  async function handleAdd() {
    const text = newText.trim()
    if (!text) return
    const result = await ipc.invoke('todo:add', text)
    if (result.error) {
      toast.error(`Failed to add: ${result.error}`)
    } else {
      setNewText('')
      await loadTodos()
      addInputRef.current?.focus()
    }
  }

  async function handleToggle(id: number) {
    const result = await ipc.invoke('todo:toggle', id)
    if (result.error) {
      toast.error(`Failed to toggle: ${result.error}`)
    } else {
      setTodos(prev => prev.map(t => (t.id === id ? { ...t, done: result.done } : t)))
    }
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id)
    setEditingText(todo.text)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingText('')
  }

  async function commitEdit(id: number) {
    const text = editingText.trim()
    if (!text) return
    const result = await ipc.invoke('todo:update', id, text)
    if (result.error) {
      toast.error(`Failed to update: ${result.error}`)
    } else {
      setTodos(prev => prev.map(t => (t.id === id ? { ...t, text } : t)))
      setEditingId(null)
    }
  }

  async function handleDelete(id: number) {
    const result = await ipc.invoke('todo:delete', id)
    if (result.error) {
      toast.error(`Failed to delete: ${result.error}`)
    } else {
      setTodos(prev => prev.filter(t => t.id !== id))
    }
  }

  async function handleClearDone() {
    const doneCount = todos.filter(t => t.done).length
    if (doneCount === 0) { toast.info('No completed todos to clear.'); return }
    const result = await ipc.invoke('todo:clearDone')
    if (result.error) {
      toast.error(`Failed to clear: ${result.error}`)
    } else {
      toast.success(`Cleared ${result.deleted} completed ${result.deleted === 1 ? 'todo' : 'todos'}.`)
      setTodos(prev => prev.filter(t => !t.done))
    }
  }

  const total = todos.length
  const doneCount = todos.filter(t => t.done).length
  const pendingCount = total - doneCount
  const progress = total === 0 ? 0 : Math.round((doneCount / total) * 100)

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-violet-600">
          <ListTodo size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">To-Do List</h1>
          <p className="text-gray-500 text-sm">Keep track of your tasks</p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total', value: total, cls: 'text-gray-800' },
          { label: 'Pending', value: pendingCount, cls: 'text-amber-600' },
          { label: 'Done', value: doneCount, cls: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg shadow p-4 text-center">
            <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
            <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Progress bar ── */}
      {total > 0 && (
        <div className="mb-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Add todo ── */}
      <div className="bg-white rounded-lg shadow p-4 mb-5 flex gap-2">
        <input
          ref={addInputRef}
          type="text"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add a new task…"
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none
                     focus:ring-2 focus:ring-violet-500 text-gray-900 placeholder-gray-400"
        />
        <button
          onClick={handleAdd}
          disabled={!newText.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded bg-violet-600 text-white
                     text-sm font-medium hover:bg-violet-700 disabled:opacity-40
                     disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={15} />
          Add
        </button>
      </div>

      {/* ── List ── */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading…</div>
        ) : todos.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No tasks yet. Add one above!</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {todos.map(todo => (
              <li
                key={todo.id}
                className="flex items-center gap-3 px-4 py-3 group hover:bg-gray-50 transition-colors"
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(todo.id)}
                  className="flex-shrink-0 transition-colors"
                  title={todo.done ? 'Mark as pending' : 'Mark as done'}
                >
                  {todo.done
                    ? <CheckSquare size={20} className="text-emerald-500" />
                    : <Square size={20} className="text-gray-400 hover:text-violet-500" />}
                </button>

                {/* Text / Edit */}
                {editingId === todo.id ? (
                  <input
                    ref={editInputRef}
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitEdit(todo.id)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="flex-1 px-3 py-1 border border-violet-400 rounded text-sm
                               text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                ) : (
                  <span
                    className={`flex-1 text-sm ${
                      todo.done ? 'line-through text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    {todo.text}
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingId === todo.id ? (
                    <>
                      <button
                        onClick={() => commitEdit(todo.id)}
                        className="p-1.5 rounded hover:bg-emerald-100 text-emerald-600 transition-colors"
                        title="Save"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors"
                        title="Cancel"
                      >
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(todo)}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Footer ── */}
      {doneCount > 0 && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleClearDone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gray-500
                       hover:text-red-600 hover:bg-red-50 border border-gray-200
                       hover:border-red-200 transition-all"
          >
            <Eraser size={14} />
            Clear {doneCount} completed
          </button>
        </div>
      )}
    </div>
  )
}
