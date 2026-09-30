// Copies the data files pdf.js loads at run time into public/pdfjs/, so the site serves them itself:
//   standard_fonts  the 14 standard PDF fonts — without them a PDF that does not embed its fonts is drawn
//                   with a substitute of different widths, and the letters come out spaced apart
//   cmaps           character maps for CID fonts (Arabic, CJK, many generated PDFs)
//   wasm, iccs      image decoders and colour profiles
// Runs before `dev` and `build` (package.json) — on Vercel too — and the copy is not committed (.gitignore),
// so it always matches the installed pdfjs-dist.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'node_modules', 'pdfjs-dist')
const target = join(root, 'public', 'pdfjs')

if (!existsSync(source)) {
  console.error('[pdfjs] pdfjs-dist is not installed — run npm install first.')
  process.exit(1)
}

rmSync(target, { recursive: true, force: true })
mkdirSync(target, { recursive: true })

for (const folder of ['standard_fonts', 'cmaps', 'wasm', 'iccs']) {
  cpSync(join(source, folder), join(target, folder), { recursive: true })
}

console.log('[pdfjs] copied fonts, cmaps, wasm and iccs to public/pdfjs')
