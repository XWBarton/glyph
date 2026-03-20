import { useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// @ts-ignore
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export function usePdfRenderer(
  containerRef: React.RefObject<HTMLDivElement | null>,
  pdfBytes: Uint8Array | null,
  zoom: number = 1
) {
  const versionRef = useRef(0)

  useEffect(() => {
    if (!pdfBytes || !containerRef.current) return

    const version = ++versionRef.current
    const container = containerRef.current

    const run = async () => {
      try {
        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes) }).promise
        if (version !== versionRef.current) return

        const dpr = window.devicePixelRatio || 1
        const availableWidth = container.clientWidth - 48

        // Build all canvases off-DOM first, then swap in atomically
        const fragment = document.createDocumentFragment()

        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
          if (version !== versionRef.current) return

          const page = await doc.getPage(pageNum)
          const baseViewport = page.getViewport({ scale: 1 })
          const fitScale = availableWidth / baseViewport.width
          const scale = fitScale * zoom * dpr
          const viewport = page.getViewport({ scale })

          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.cssText = `
            display: block;
            width: ${viewport.width / dpr}px;
            height: ${viewport.height / dpr}px;
            margin: 0 auto;
            border-radius: 4px;
            box-shadow: 0 2px 16px rgba(0,0,0,0.10);
          `

          await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
          if (version !== versionRef.current) return

          const wrapper = document.createElement('div')
          wrapper.style.cssText = 'padding: 12px 24px;'
          wrapper.appendChild(canvas)
          fragment.appendChild(wrapper)
        }

        if (version !== versionRef.current) return
        container.innerHTML = ''
        container.appendChild(fragment)
      } catch (e) {
        console.error('PDF render error:', e)
      }
    }

    run()
  }, [pdfBytes, containerRef, zoom])
}
