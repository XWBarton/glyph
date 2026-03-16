/// <reference types="vite/client" />

import type { TypstEditorAPI } from '../preload/index'

declare global {
  interface Window {
    api: TypstEditorAPI
  }
}

// Allow ?url imports
declare module '*?url' {
  const src: string
  export default src
}
