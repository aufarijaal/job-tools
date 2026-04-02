import { createContext, useContext } from 'react'

interface FullscreenContextValue {
  isEditorFullscreen: boolean
  setIsEditorFullscreen: (value: boolean) => void
}

export const FullscreenContext = createContext<FullscreenContextValue>({
  isEditorFullscreen: false,
  setIsEditorFullscreen: () => {},
})

export const useEditorFullscreen = () => useContext(FullscreenContext)
