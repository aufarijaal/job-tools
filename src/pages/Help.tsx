import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import homeEn from '../help/en/home.md?raw'
import fileListEn from '../help/en/file-list.md?raw'
import fileListAdvancedEn from '../help/en/file-list-advanced.md?raw'
import fileCopyEn from '../help/en/file-copy.md?raw'
import textEditorEn from '../help/en/text-editor.md?raw'

import homeId from '../help/id/home.md?raw'
import fileListId from '../help/id/file-list.md?raw'
import fileListAdvancedId from '../help/id/file-list-advanced.md?raw'
import fileCopyId from '../help/id/file-copy.md?raw'
import textEditorId from '../help/id/text-editor.md?raw'

type Language = 'en' | 'id'
type Topic = 'home' | 'file-list' | 'file-list-advanced' | 'file-copy' | 'text-editor'

const docs = {
  en: {
    home: homeEn,
    'file-list': fileListEn,
    'file-list-advanced': fileListAdvancedEn,
    'file-copy': fileCopyEn,
    'text-editor': textEditorEn,
  },
  id: {
    home: homeId,
    'file-list': fileListId,
    'file-list-advanced': fileListAdvancedId,
    'file-copy': fileCopyId,
    'text-editor': textEditorId,
  },
} as const

function Help() {
  const [language, setLanguage] = useState<Language>('id')
  const [topic, setTopic] = useState<Topic>('home')

  const content = useMemo(() => docs[language][topic], [language, topic])

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-4xl font-bold mb-4">Help / Bantuan</h1>
      <p className="text-lg mb-6 text-gray-700">
        Read guidance for each page in English or Indonesian.
      </p>

      <div className="bg-white rounded-lg shadow p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Language / Bahasa</label>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Page / Halaman</label>
          <select
            value={topic}
            onChange={(event) => setTopic(event.target.value as Topic)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="home">Home</option>
            <option value="file-list">File List</option>
            <option value="file-list-advanced">File List Advanced</option>
            <option value="file-copy">Copy File</option>
            <option value="text-editor">Powerful Text Editor</option>
          </select>
        </div>
      </div>

      <article className="bg-white rounded-lg shadow p-6 prose max-w-none prose-headings:mb-3 prose-p:my-2 prose-li:my-1">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  )
}

export default Help
