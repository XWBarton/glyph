import { app } from 'electron'
import { spawn, ChildProcess, execSync } from 'child_process'
import { join, dirname } from 'path'
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs'
import { randomUUID } from 'crypto'

function findTypstBin(): string {
  // 1. Try PATH lookup (works on all platforms after normal install)
  try {
    const cmd = process.platform === 'win32' ? 'where typst' : 'which typst'
    const found = execSync(cmd, { encoding: 'utf8' }).trim().split('\n')[0]
    if (found && existsSync(found)) return found
  } catch {}

  // 2. Common install locations per platform
  const candidates: string[] =
    process.platform === 'win32'
      ? [
          `${process.env.LOCALAPPDATA}\\Programs\\typst\\typst.exe`,
          `${process.env.USERPROFILE}\\.cargo\\bin\\typst.exe`,
          'C:\\Program Files\\typst\\typst.exe'
        ]
      : process.platform === 'darwin'
        ? [
            '/opt/homebrew/bin/typst',   // Apple Silicon Homebrew
            '/usr/local/bin/typst',      // Intel Homebrew
            `${process.env.HOME}/.cargo/bin/typst`
          ]
        : [
            '/usr/bin/typst',
            '/usr/local/bin/typst',
            `${process.env.HOME}/.cargo/bin/typst`
          ]

  const found = candidates.find(existsSync)
  if (found) return found

  // 3. Last resort — hope it's on PATH at spawn time
  return 'typst'
}

const TYPST_BIN = findTypstBin()

interface CompileSuccess {
  pdfBytes: Uint8Array
}

interface CompileError {
  error: string
}

type CompileResult = CompileSuccess | CompileError

let activeProcess: ChildProcess | null = null
let activeTempFiles: string[] = []

function cleanupTempFiles(files: string[]): void {
  for (const f of files) {
    try {
      if (existsSync(f)) unlinkSync(f)
    } catch {
      // ignore
    }
  }
}

export async function compileTypst(
  content: string,
  filePath: string | null
): Promise<CompileResult> {
  // Abort any in-flight compile
  if (activeProcess) {
    activeProcess.kill()
    activeProcess = null
    cleanupTempFiles(activeTempFiles)
    activeTempFiles = []
  }

  const tmpDir = app.getPath('temp')
  const id = randomUUID()

  // Input must live inside --root so typst can read it.
  // When a real file is open, use its directory as both root and input location.
  const rootDir = filePath ? dirname(filePath) : tmpDir
  const inputPath = join(rootDir, `.glyph-preview-${id}.typ`)
  const outputPath = join(tmpDir, `glyph-${id}.pdf`)
  activeTempFiles = [inputPath, outputPath]

  writeFileSync(inputPath, content, 'utf8')

  return new Promise((resolve) => {
    const args = [
      'compile',
      inputPath,
      outputPath,
      '--root', rootDir,
      '--diagnostic-format', 'short'
    ]

    const child = spawn(TYPST_BIN, args)
    activeProcess = child

    let stderr = ''
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    child.on('close', (code) => {
      if (activeProcess === child) {
        activeProcess = null
        activeTempFiles = []
      }

      if (code === 0 && existsSync(outputPath)) {
        try {
          const buf = readFileSync(outputPath)
          const pdfBytes = new Uint8Array(buf)
          cleanupTempFiles([inputPath, outputPath])
          resolve({ pdfBytes })
        } catch (e) {
          cleanupTempFiles([inputPath, outputPath])
          resolve({ error: String(e) })
        }
      } else {
        cleanupTempFiles([inputPath, outputPath])
        const msg = stderr.trim() || `typst exited with code ${code}`
        resolve({ error: msg })
      }
    })

    child.on('error', (err) => {
      cleanupTempFiles([inputPath, outputPath])
      resolve({ error: `Failed to run typst: ${err.message}` })
    })
  })
}
