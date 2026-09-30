// pdf.js, loaded on demand: only the book reader needs it, so it (and its worker) stay out of every other
// page's bundle. The "legacy" build is used on purpose — the modern one needs very recent browsers, and the
// reader must open on older phones too.

let loading = null

async function pdfjs() {
  loading ??= Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
  ]).then(([lib, worker]) => {
    lib.GlobalWorkerOptions.workerSrc = worker.default
    return lib
  })
  return loading
}

// Run-time data pdf.js fetches while drawing (copied into public/pdfjs by scripts/copy-pdfjs-assets.mjs).
// Without the standard fonts and cmaps, text in fonts the PDF does not embed is drawn in a substitute with
// other widths: the letters come out spaced apart and misplaced.
const ASSETS = `${import.meta.env.BASE_URL ?? '/'}pdfjs/`

/**
 * Opens the PDF at `url` (the API's /books/{slug}/file, served with CORS) and resolves the pdf.js document:
 * `{ numPages, getPage(n) }`. Range requests are off — the file is fetched whole, which every host supports.
 */
export async function openPdf(url) {
  const lib = await pdfjs()
  return lib.getDocument({
    url,
    disableRange: true,
    disableStream: true,
    isEvalSupported: false,
    cMapUrl: `${ASSETS}cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${ASSETS}standard_fonts/`,
    wasmUrl: `${ASSETS}wasm/`,
    iccUrl: `${ASSETS}iccs/`,
  }).promise
}
