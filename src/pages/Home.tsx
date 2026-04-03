import { Link } from 'react-router-dom'
import { FolderOpen, Search, Copy, Files, FilePenLine, ListTodo, CircleHelp, Zap, ArrowRight } from 'lucide-react'

const features = [
  {
    path: '/files',
    icon: FolderOpen,
    label: 'File Lister',
    description: 'Browse any folder and get a clean list of its contents. Copy file names in multiple formats — numbered, name only, or full path.',
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/30',
    delay: '0.15s',
  },
  {
    path: '/files-advanced',
    icon: Search,
    label: 'Multiple File Opener',
    description: 'Search files by name using contains, starts-with, or ends-with modes. Open multiple files at once with smart selection controls.',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/30',
    delay: '0.25s',
  },
  {
    path: '/file-copy',
    icon: Copy,
    label: 'Copy File',
    description: 'Build a batch copy queue, pick your destination, and execute all copies in one click. Full progress feedback included.',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/30',
    delay: '0.35s',
  },
  {
    path: '/copy-files',
    icon: Files,
    label: 'Copy Files to a Folder',
    description: 'Search for files by name across a source folder, select the ones you need, and copy them all to a destination folder in one go.',
    gradient: 'from-sky-500 to-blue-500',
    glow: 'shadow-sky-500/30',
    delay: '0.45s',
  },
  {
    path: '/text-editor',
    icon: FilePenLine,
    label: 'Powerful Text Editor',
    description: 'Full-featured Monaco-powered editor. Open, edit, and save any text file with syntax highlighting and formatting tools.',
    gradient: 'from-orange-500 to-amber-500',
    glow: 'shadow-orange-500/30',
    delay: '0.55s',
  },
  {
    path: '/todo',
    icon: ListTodo,
    label: 'To-Do List',
    description: 'Manage tasks with a persistent to-do list. Add, edit, check off, and clear tasks — all stored locally in SQLite.',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/30',
    delay: '0.65s',
  },
  {
    path: '/help',
    icon: CircleHelp,
    label: 'Help / Bantuan',
    description: 'Bilingual documentation (English & Indonesian) for every feature. Quick reference for inputs, options, and usage tips.',
    gradient: 'from-pink-500 to-rose-500',
    glow: 'shadow-pink-500/30',
    delay: '0.75s',
  },
]

function Home() {
  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl mb-10 px-8 py-16 text-center
                      bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900
                      animate-gradient border border-indigo-800/40 shadow-2xl">

        {/* decorative blobs */}
        <div className="pointer-events-none select-none">
          <div className="animate-float absolute -top-16 -left-16 w-64 h-64 rounded-full
                          bg-indigo-600/20 blur-3xl" />
          <div className="animate-float-slow absolute -bottom-12 -right-20 w-72 h-72 rounded-full
                          bg-purple-600/20 blur-3xl" />
          <div className="animate-float absolute top-8 right-24 w-32 h-32 rounded-full
                          bg-cyan-500/10 blur-2xl" style={{ animationDelay: '2s' }} />
        </div>

        {/* floating icon */}
        <div className="animate-float relative inline-flex items-center justify-center
                        w-20 h-20 mb-6 rounded-2xl
                        bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/40">
          <Zap size={36} className="text-white" />
        </div>

        <h1 className="animate-fade-in-up text-5xl font-extrabold tracking-tight mb-3">
          <span className="text-shimmer">Job Tools</span>
        </h1>

        <p className="animate-fade-in-up text-gray-300 text-lg max-w-xl mx-auto leading-relaxed mb-8"
           style={{ animationDelay: '0.1s' }}>
          A personal productivity suite for file management,
          batch operations, and text editing — all in one place.
        </p>

        <div className="animate-fade-in-up flex flex-wrap justify-center gap-3"
             style={{ animationDelay: '0.2s' }}>
          <Link
            to="/files"
            className="inline-flex items-center gap-2 px-5 py-2.5
                       bg-indigo-600 hover:bg-indigo-500 text-white font-semibold
                       rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/30
                       hover:shadow-indigo-500/50 hover:-translate-y-0.5">
            Get Started <ArrowRight size={16} />
          </Link>
          <Link
            to="/help"
            className="inline-flex items-center gap-2 px-5 py-2.5
                       bg-white/10 hover:bg-white/20 text-white font-semibold
                       rounded-xl border border-white/20 transition-all duration-200
                       hover:-translate-y-0.5">
            Documentation
          </Link>
        </div>
      </div>

      {/* ── Feature Cards ── */}
      <div className="animate-fade-in mb-6" style={{ animationDelay: '0.3s' }}>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-5">
          Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <Link
                key={f.path}
                to={f.path}
                className={`group block animate-fade-in-up relative overflow-hidden
                            rounded-2xl border border-white/5
                            bg-gray-800
                            p-6 transition-all duration-300
                            hover:-translate-y-1.5 hover:shadow-2xl ${f.glow}
                            hover:border-white/10`}
                style={{ animationDelay: f.delay }}
              >
                {/* subtle gradient overlay on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10
                                 bg-gradient-to-br ${f.gradient}
                                 transition-opacity duration-300 rounded-2xl`} />

                <div className={`inline-flex items-center justify-center
                                  w-11 h-11 rounded-xl mb-4
                                  bg-gradient-to-br ${f.gradient}
                                  shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={20} className="text-white" />
                </div>

                <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-white">
                  {f.label}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {f.description}
                </p>

                <div className={`mt-4 inline-flex items-center gap-1 text-xs font-semibold
                                  bg-gradient-to-r ${f.gradient}
                                  bg-clip-text text-transparent
                                  opacity-0 group-hover:opacity-100
                                  -translate-x-2 group-hover:translate-x-0
                                  transition-all duration-300`}>
                  Open <ArrowRight size={12} className={`bg-gradient-to-r ${f.gradient} [&>*]:stroke-current`} />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Footer badge ── */}
      <div className="animate-fade-in text-center text-xs text-gray-500 mt-10 pb-4"
           style={{ animationDelay: '0.6s' }}>
        Built with Electron · React · Tailwind CSS
      </div>
    </div>
  )
}

export default Home
