import { readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const fgcDir = join(import.meta.dirname, 'public', 'fgc_files')

function fgcManifest(): Plugin {
  const manifestPath = join(fgcDir, 'manifest.json')
  return {
    name: 'fgc-manifest',
    buildStart() {
      const dir = fgcDir
      const files = readdirSync(dir).filter((f) => f.endsWith('.fgc'))
      writeFileSync(manifestPath, JSON.stringify(files))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fgcManifest()],
})
