import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BookOpen, Languages } from 'lucide-react'

import fileListEn from '../help/en/file-list.md?raw'
import fileListAdvancedEn from '../help/en/file-list-advanced.md?raw'
import fileCopyEn from '../help/en/file-copy.md?raw'
import multiFileCopyEn from '../help/en/multi-file-copy.md?raw'
import textEditorEn from '../help/en/text-editor.md?raw'
import todoListEn from '../help/en/todo-list.md?raw'

import fileListId from '../help/id/file-list.md?raw'
import fileListAdvancedId from '../help/id/file-list-advanced.md?raw'
import fileCopyId from '../help/id/file-copy.md?raw'
import multiFileCopyId from '../help/id/multi-file-copy.md?raw'
import textEditorId from '../help/id/text-editor.md?raw'
import todoListId from '../help/id/todo-list.md?raw'

type Language = 'en' | 'id'
type Topic = 'file-list' | 'file-list-advanced' | 'file-copy' | 'multi-file-copy' | 'text-editor' | 'todo-list'

const docs = {
  en: {
    'file-list': fileListEn,
    'file-list-advanced': fileListAdvancedEn,
    'file-copy': fileCopyEn,
    'multi-file-copy': multiFileCopyEn,
    'text-editor': textEditorEn,
    'todo-list': todoListEn,
  },
  id: {
    'file-list': fileListId,
    'file-list-advanced': fileListAdvancedId,
    'file-copy': fileCopyId,
    'multi-file-copy': multiFileCopyId,
    'text-editor': textEditorId,
    'todo-list': todoListId,
  },
} as const

const topics: { id: Topic; label: string }[] = [
  { id: 'file-list',          label: 'File Lister' },
  { id: 'file-list-advanced', label: 'Multiple File Opener' },
  { id: 'file-copy',          label: 'Copy File' },
  { id: 'multi-file-copy',    label: 'Copy Files to a Folder' },
  { id: 'text-editor',        label: 'Powerful Text Editor' },
  { id: 'todo-list',          label: 'To-Do List' },
]

function Help() {
  const [language, setLanguage] = useState<Language>('id')
  const [topic, setTopic]       = useState<Topic>('file-list')

  const content = useMemo(() => docs[language][topic], [language, topic])

  return (
    /* Break out of App's p-8 so we own the full column */
    <div className="flex flex-col -m-8" style={{ minHeight: 'calc(100vh - 0px)' }}>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-10 flex items-center justify-between
                         h-14 px-6 border-b border-gray-200 bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-2 text-gray-800 font-semibold text-sm">
          <BookOpen size={17} className="text-indigo-500" />
          <span>Documentation</span>
        </div>

        {/* Language pill toggle */}
        <div className="flex items-center gap-2">
          <Languages size={15} className="text-gray-400" />
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {(['en', 'id'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150
                  ${language === lang
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Body (sidebar + content) ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="px-4 pt-6 pb-8">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Features
            </p>
            <nav className="flex flex-col gap-0.5">
              {topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTopic(t.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150
                    ${topic === t.id
                      ? 'bg-indigo-50 text-indigo-600 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-2xl mx-auto px-10 py-10">
            <article className="
              prose prose-slate max-w-none
              prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-3
              prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-3 prose-h2:text-gray-800
              prose-h3:text-base prose-h3:font-semibold prose-h3:mt-5 prose-h3:mb-2
              prose-p:text-gray-600 prose-p:leading-relaxed prose-p:my-2
              prose-li:text-gray-600 prose-li:my-1
              prose-strong:text-gray-800 prose-strong:font-semibold
              prose-code:bg-gray-100 prose-code:text-indigo-600 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:text-sm
              prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
              prose-ul:pl-5 prose-ol:pl-5
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </article>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Help
