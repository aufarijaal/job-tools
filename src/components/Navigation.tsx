import { Link, useLocation } from 'react-router-dom'

interface NavigationProps {
  isOpen: boolean
  onToggle: (open: boolean) => void
}

function Navigation({ isOpen, onToggle }: NavigationProps) {
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/files', label: 'File List', icon: '📂' },
    { path: '/files-advanced', label: 'File List Advanced', icon: '🔍' },
    { path: '/file-copy', label: 'Copy File', icon: '📋' }
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
          {isOpen ? '‹' : '›'}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col">
        {navItems.map((item) => (
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
            <span className="text-lg w-6 flex-shrink-0">{item.icon}</span>
            {isOpen && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default Navigation
