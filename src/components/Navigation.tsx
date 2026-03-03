import { Link, useLocation } from 'react-router-dom'
import {
  House,
  FolderOpen,
  Search,
  Copy,
  FilePenLine,
  ListTodo,
  CircleHelp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface NavigationProps {
  isOpen: boolean
  onToggle: (open: boolean) => void
}

function Navigation({ isOpen, onToggle }: NavigationProps) {
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: 'Home', icon: House },
    { path: '/files', label: 'File Lister', icon: FolderOpen },
    { path: '/files-advanced', label: 'Multiple File Opener', icon: Search },
    { path: '/file-copy', label: 'Copy File', icon: Copy },
    { path: '/text-editor', label: 'Powerful Text Editor', icon: FilePenLine },
    { path: '/todo', label: 'To-Do List', icon: ListTodo },
  ]

  const infoItems = [
    { path: '/help', label: 'Help / Bantuan', icon: CircleHelp }
  ]
  
  return (
    <aside className={`fixed left-0 top-0 h-screen bg-gray-800 text-white transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-20'
    } shadow-lg overflow-hidden z-50`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {isOpen && <h1 className="text-xl font-bold">Menu</h1>}
        <button
          onClick={() => onToggle(!isOpen)}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title={isOpen ? 'Collapse' : 'Expand'}
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Feature Navigation */}
      <div className="px-4 pt-3 pb-1 text-xs uppercase tracking-wide text-gray-400">
        {isOpen ? 'Features' : ''}
      </div>
      <nav className="flex flex-col">
        {navItems.map((item) => (
          (() => {
            const Icon = item.icon
            return (
          <Link
            key={item.path}
            to={item.path}
            className={`px-4 py-3 transition-colors flex items-center gap-3 ${
              location.pathname === item.path
                ? 'bg-gray-700 border-l-4 border-blue-500 font-semibold'
                : 'hover:bg-gray-700'
            }`}
            title={!isOpen ? item.label : ''}
          >
            <span className="w-6 flex-shrink-0">
              <Icon size={18} />
            </span>
            {isOpen && <span>{item.label}</span>}
          </Link>
            )
          })()
        ))}
      </nav>

      {/* Help Section */}
      <div className="border-t border-gray-700 mt-3 pt-3">
        <div className="px-4 pb-1 text-xs uppercase tracking-wide text-gray-400">
          {isOpen ? 'Help' : ''}
        </div>
        <nav className="flex flex-col">
          {infoItems.map((item) => (
            (() => {
              const Icon = item.icon
              return (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-3 transition-colors flex items-center gap-3 ${
                location.pathname === item.path
                  ? 'bg-gray-700 border-l-4 border-amber-400 font-semibold'
                  : 'hover:bg-gray-700'
              }`}
              title={!isOpen ? item.label : ''}
            >
              <span className="w-6 flex-shrink-0">
                <Icon size={18} />
              </span>
              {isOpen && <span>{item.label}</span>}
            </Link>
              )
            })()
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default Navigation
